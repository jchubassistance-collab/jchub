import 'server-only';

import { getPublishedArticlesByLocale } from '@/lib/blog';
import { getPublishedTools, localizeTool, toolPath } from '@/lib/tools';
import { listErrors } from '@/lib/reports/read';
import { searchConsole, searchConsoleAccount } from '@/lib/insights/search-console';
import { auditPage, auditSummary, wordCount, type AuditedPage } from '@/lib/insights/seo-audit';
import { ALERT_RULES } from '@/lib/alerts/rules';
import { recentAlerts, ruleSettings } from '@/lib/alerts/server';
import { channelStatus } from '@/lib/alerts/channels';
import { query } from '@/lib/insights/db';
import { num } from '@/lib/insights/queries';

/** Data of the Control Center pages of batch 3: SEO and Alertes & logs. */

export async function seoSection(days: number, fresh = false) {
  const [google, articles, tools] = await Promise.all([
    searchConsole(days, { fresh }).catch((error) => ({ configured: false as const, reason: error instanceof Error ? error.message : 'Search Console indisponible.', account: searchConsoleAccount() ?? undefined })),
    getPublishedArticlesByLocale(),
    getPublishedTools(),
  ]);
  const pages: AuditedPage[] = [];
  for (const locale of ['fr', 'en'] as const) {
    for (const article of articles[locale]) {
      pages.push(auditPage({
        // The article <title> goes through the '%s | JcHub' template of app/[locale]/layout.tsx.
        kind: 'article', locale, title: article.title, titleSuffix: ' | JcHub', description: article.description, path: `/${locale}/blog/${article.slug}`,
        image: article.image, words: wordCount(article.content), keywords: article.keywords.length, translated: locale === 'en' ? article.translated : undefined,
      }));
    }
    for (const tool of tools) {
      const local = localizeTool(tool, locale);
      pages.push(auditPage({ kind: 'outil', locale, title: local.seo.title || local.name, description: local.seo.description || local.description, path: toolPath(tool, locale) }));
    }
  }
  return { google, audit: auditSummary(pages) };
}

export async function alertsSection() {
  const [settings, alerts, errorList, serverErrors] = await Promise.all([
    ruleSettings(),
    recentAlerts(100),
    listErrors({ period: '7d', page: 1, pageSize: 50, filters: {} }).catch(() => null),
    query<{ ts: number; path: string; status: string; value: number }>(
      "SELECT ts, path, name AS status, value FROM events WHERE type IN ('api_call', 'tool_api') AND origin = 'server' AND CAST(name AS INTEGER) >= 500 ORDER BY ts DESC LIMIT 30",
    ).catch(() => []),
  ]);
  const byId = new Map(settings.map((setting) => [setting.id, setting]));
  return {
    channels: channelStatus(),
    rules: ALERT_RULES.map((rule) => ({ ...rule, settings: byId.get(rule.id)! })),
    alerts,
    // Production only: errors raised while developing locally are not the site's.
    errors: (errorList?.items ?? []).filter((item) => !item.env).map((item) => ({ id: item.id, at: item.at, message: item.message, path: item.path || item.route, status: item.status, occurrence: item.occurrence, country: item.country })),
    serverErrors: serverErrors.map((row) => ({ ts: num(row.ts), path: String(row.path), status: Number(row.status), durationMs: num(row.value) })),
  };
}
