import 'server-only';

import { insightsDb, query, takeLock } from '@/lib/insights/db';
import { dailyAudience, num, percentile } from '@/lib/insights/queries';
import { sendEmail } from '@/lib/alerts/channels';
import {
  ALERT_RULES, checkAvailability, checkCronFailure, checkErrorSpike, checkSeoDrop, checkSlowApi, checkTrafficDrop, ruleDefinition,
  type AlertRuleId, type RuleSettings, type Triggered,
} from '@/lib/alerts/rules';

/**
 * Settings and sending of the alerts (Control Center › Alertes). Settings and history live in
 * Turso (tables alert_rules and alerts). Each rule waits its cooldown between two alerts, shared
 * by every server through the locks table, so a burst of errors sends one message, not fifty.
 */

const HOUR = 3600_000;
const DAY = 24 * HOUR;
const isProduction = () => process.env.VERCEL_ENV === 'production';
const adminUrl = (path: string) => `https://${(process.env.ADMIN_HOST || 'admin.jchub.dev').trim()}${path}`;

export async function ruleSettings(): Promise<RuleSettings[]> {
  const rows = await query<{ id: string; enabled: number; threshold: number | null; channels: string }>('SELECT id, enabled, threshold, channels FROM alert_rules').catch(() => []);
  const saved = new Map(rows.map((row) => [String(row.id), row]));
  return ALERT_RULES.map((rule) => {
    const row = saved.get(rule.id);
    if (!row) return { id: rule.id, enabled: true, threshold: rule.threshold, channels: rule.channels };
    return { id: rule.id, enabled: Boolean(num(row.enabled)), threshold: rule.threshold === null ? null : row.threshold === null ? rule.threshold : num(row.threshold), channels: rule.channels };
  });
}

export async function saveRuleSettings(settings: RuleSettings[]): Promise<void> {
  const db = await insightsDb();
  if (!db) throw new Error('Base du Control Center non configurée.');
  const now = Date.now();
  await db.batch(settings.filter((setting) => ruleDefinition(setting.id)).map((setting) => ({
    sql: 'INSERT INTO alert_rules (id, enabled, threshold, channels, updated) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET enabled = excluded.enabled, threshold = excluded.threshold, channels = excluded.channels, updated = excluded.updated',
    args: [setting.id, setting.enabled ? 1 : 0, ruleDefinition(setting.id)?.threshold === null ? null : setting.threshold, JSON.stringify(setting.channels), now],
  })), 'write');
}

export type RaiseOptions = {
  link?: string;
  /** A test from the Alertes page: sent even when the rule is off, without cooldown. */
  test?: boolean;
  /** Cooldown key when one rule covers several sources (one per cron), instead of alert:<rule>. */
  lockKey?: string;
};

/** E-mails an alert if its rule is on and out of its cooldown, and logs it. */
export async function raiseAlert(ruleId: AlertRuleId, alert: Triggered, options: RaiseOptions = {}): Promise<{ sent: Record<string, string> } | null> {
  const rule = ruleDefinition(ruleId);
  if (!rule) return null;
  if (!options.test && !(await ruleSettings()).find((item) => item.id === ruleId)?.enabled) return null;
  if (!options.test && !(await takeLock(options.lockKey ?? `alert:${ruleId}`, rule.cooldownMs))) return null;
  const link = options.link ?? adminUrl('/admin/insights/alertes');
  const result = await sendEmail(
    `[${rule.level === 'critique' ? 'Critique' : 'Attention'}] JcHub — ${alert.title}`,
    `${alert.message}\n\nDétail : ${link}\n\nRègle : ${rule.label}. Modifier les alertes : ${adminUrl('/admin/insights/alertes')}`,
  );
  const sent: Record<string, string> = { email: result.ok ? 'envoyé' : result.detail || 'échec' };
  const db = await insightsDb().catch(() => null);
  await db?.execute({
    sql: 'INSERT INTO alerts (ts, rule, level, title, message, link, sent) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [Date.now(), ruleId, options.test ? 'info' : rule.level, options.test ? `Test — ${alert.title}` : alert.title, alert.message, link, JSON.stringify(sent)],
  }).catch((error) => console.error('[alerts] Alerte non enregistrée :', error instanceof Error ? error.message : error));
  return { sent };
}

export async function recentAlerts(limit = 100) {
  const rows = await query<{ id: number; ts: number; rule: string; level: string; title: string; message: string; link: string | null; sent: string }>(
    'SELECT id, ts, rule, level, title, message, link, sent FROM alerts ORDER BY ts DESC LIMIT ?', [limit],
  ).catch(() => []);
  return rows.map((row) => {
    let sent: Record<string, string> = {};
    try { sent = JSON.parse(String(row.sent)); } catch { /* empty */ }
    return { id: num(row.id), ts: num(row.ts), rule: String(row.rule), level: String(row.level), title: String(row.title), message: String(row.message), link: row.link ? String(row.link) : null, sent };
  });
}

// ---------------------------------------------------------------------------------------------
// Checks

/** After a 5xx answer of the API: alert when the last hour holds too many. At most one count a minute. */
export async function onServerError(): Promise<void> {
  if (!isProduction()) return;
  if (!(await takeLock('alert-check:error_spike', 60_000))) return;
  const setting = (await ruleSettings()).find((item) => item.id === 'error_spike');
  if (!setting?.enabled || setting.threshold === null) return;
  const [row] = await query<{ n: number }>("SELECT COUNT(*) AS n FROM events WHERE type IN ('api_call', 'tool_api') AND origin = 'server' AND CAST(name AS INTEGER) >= 500 AND ts >= ?", [Date.now() - HOUR]);
  const triggered = checkErrorSpike(num(row?.n), setting.threshold);
  if (triggered) await raiseAlert('error_spike', triggered, { link: adminUrl('/admin/reports?tab=errors') });
}

/** After a cron answered 5xx: one e-mail per cron and per cooldown, not one per failure. */
export async function onCronFailure(path: string, status: number, summary?: string): Promise<void> {
  if (!isProduction()) return;
  const triggered = checkCronFailure(path, status, summary);
  if (!triggered) return;
  const name = path.split('/')[3];
  await raiseAlert('cron_failed', triggered, { link: adminUrl('/admin/reports?tab=errors'), lockKey: `alert:cron_failed:${name}` });
}

/** The daily checks (cron at 7:00): availability, latency, traffic and Google clicks. */
export async function runDailyChecks(now = Date.now()) {
  const settings = new Map((await ruleSettings()).map((setting) => [setting.id, setting]));
  const results: Record<string, string> = {};
  const active = (id: AlertRuleId) => {
    const setting = settings.get(id);
    return setting?.enabled && setting.threshold !== null ? setting.threshold : null;
  };

  const calls = await query<{ status: string; value: number }>("SELECT name AS status, value FROM events WHERE type IN ('api_call', 'tool_api') AND origin = 'server' AND value IS NOT NULL AND ts >= ? LIMIT 50000", [now - DAY]);
  const serverErrors = calls.filter((call) => Number(call.status) >= 500).length;
  const availability = active('availability');
  if (availability !== null) {
    const triggered = checkAvailability(calls.length, serverErrors, availability);
    results.availability = triggered ? JSON.stringify(await raiseAlert('availability', triggered, { link: adminUrl('/admin/insights/performance') })) : 'ok';
  }
  const slow = active('slow_api');
  if (slow !== null) {
    const triggered = checkSlowApi(percentile(calls.map((call) => num(call.value)), 0.95), calls.length, slow);
    results.slow_api = triggered ? JSON.stringify(await raiseAlert('slow_api', triggered, { link: adminUrl('/admin/insights/performance') })) : 'ok';
  }
  const traffic = active('traffic_drop');
  if (traffic !== null) {
    const days = await dailyAudience({ from: now - 9 * DAY, to: now });
    const local = (time: number) => new Date(time + HOUR).toISOString().slice(0, 10);
    const yesterday = local(now - DAY);
    const before = Array.from({ length: 7 }, (_, index) => local(now - (index + 2) * DAY));
    const visitors = new Map(days.map((day) => [day.day, day.visitors]));
    const triggered = checkTrafficDrop(visitors.get(yesterday) ?? 0, before.map((day) => visitors.get(day) ?? 0), traffic);
    results.traffic_drop = triggered ? JSON.stringify(await raiseAlert('traffic_drop', triggered, { link: adminUrl('/admin/insights/trafic') })) : 'ok';
  }
  const seo = active('seo_drop');
  if (seo !== null) {
    const { searchConsole } = await import('@/lib/insights/search-console');
    const data = await searchConsole(7).catch(() => null);
    if (data?.configured) {
      const triggered = checkSeoDrop(data.totals.clicks, data.previous.clicks, seo);
      results.seo_drop = triggered ? JSON.stringify(await raiseAlert('seo_drop', triggered, { link: adminUrl('/admin/insights/seo') })) : 'ok';
    } else {
      results.seo_drop = 'Search Console indisponible';
    }
  }
  return results;
}
