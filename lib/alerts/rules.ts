/**
 * The alert rules of Control Center › Alertes: what each one watches, its default threshold and
 * how a measure becomes an alert. Pure functions (no database, no network), checked by
 * tests/insights-batch3.test.js. lib/alerts/server.ts stores the settings and sends the alerts.
 */

export type AlertChannel = 'email';
export type AlertLevel = 'critique' | 'attention' | 'info';
export type AlertRuleId = 'error_spike' | 'cron_failed' | 'availability' | 'slow_api' | 'traffic_drop' | 'seo_drop';

export type AlertRuleDefinition = {
  id: AlertRuleId;
  label: string;
  description: string;
  threshold: number | null;
  unit: string;
  level: AlertLevel;
  /** When it is checked: as soon as it happens, or by the daily check at 7:00. */
  timing: 'immédiat' | 'quotidien';
  /** Minimum time between two alerts of this rule. */
  cooldownMs: number;
  channels: AlertChannel[];
};

const HOUR = 3600_000;

export const ALERT_RULES: AlertRuleDefinition[] = [
  { id: 'error_spike', label: 'Rafale d’erreurs serveur', description: 'Nombre de réponses 5xx de l’API sur la dernière heure.', threshold: 10, unit: 'erreurs / h', level: 'critique', timing: 'immédiat', cooldownMs: HOUR, channels: ['email'] },
  { id: 'cron_failed', label: 'Tâche planifiée en échec', description: 'Un cron (publication, traduction, sauvegarde, agents…) répond par une erreur serveur.', threshold: null, unit: '', level: 'critique', timing: 'immédiat', cooldownMs: 6 * HOUR, channels: ['email'] },
  { id: 'availability', label: 'Disponibilité en baisse', description: 'Part des appels d’API sans erreur serveur sur les dernières 24 h.', threshold: 99, unit: '%', level: 'critique', timing: 'quotidien', cooldownMs: 20 * HOUR, channels: ['email'] },
  { id: 'slow_api', label: 'API lente', description: '95ᵉ centile du temps de réponse de l’API sur les dernières 24 h.', threshold: 3000, unit: 'ms', level: 'attention', timing: 'quotidien', cooldownMs: 20 * HOUR, channels: ['email'] },
  { id: 'traffic_drop', label: 'Chute du trafic', description: 'Baisse des visiteurs d’hier par rapport à la moyenne des 7 jours d’avant.', threshold: 50, unit: '% de baisse', level: 'attention', timing: 'quotidien', cooldownMs: 20 * HOUR, channels: ['email'] },
  { id: 'seo_drop', label: 'Chute des clics Google', description: 'Baisse des clics Search Console sur 7 jours par rapport aux 7 jours d’avant.', threshold: 40, unit: '% de baisse', level: 'attention', timing: 'quotidien', cooldownMs: 20 * HOUR, channels: ['email'] },
];

export const ALERT_RULE_IDS = ALERT_RULES.map((rule) => rule.id);
export function ruleDefinition(id: string): AlertRuleDefinition | undefined {
  return ALERT_RULES.find((rule) => rule.id === id);
}

export type RuleSettings = { id: AlertRuleId; enabled: boolean; threshold: number | null; channels: AlertChannel[] };
export type Triggered = { title: string; message: string };

const nf = (value: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(value);

/** 5xx answers of the last hour. */
export function checkErrorSpike(serverErrors: number, threshold: number): Triggered | null {
  if (serverErrors < threshold) return null;
  return { title: `${serverErrors} erreurs serveur en 1 h`, message: `${serverErrors} réponses 5xx de l’API sur la dernière heure (seuil : ${threshold}). Vérifie les rapports d’erreurs.` };
}

/** A cron answered with a server error; its name comes from the path (/api/cron/backup → backup). */
export function checkCronFailure(path: string, status: number, summary?: string): Triggered | null {
  const name = path.match(/^\/api\/cron\/([^/?]+)/)?.[1];
  if (!name || status < 500) return null;
  return { title: `Le cron « ${name} » a échoué`, message: `La tâche planifiée ${path} a répondu ${status}${summary ? ` : ${summary}` : ''}. Elle ne sera pas relancée avant sa prochaine exécution prévue.` };
}

/** Share of API calls without server error over 24 h; below 20 calls the share says nothing. */
export function checkAvailability(calls: number, serverErrors: number, threshold: number): Triggered | null {
  if (calls < 20) return null;
  const availability = ((calls - serverErrors) / calls) * 100;
  if (availability >= threshold) return null;
  return { title: `Disponibilité à ${nf(availability)} %`, message: `${serverErrors} erreur(s) serveur sur ${calls} appels d’API ces dernières 24 h : disponibilité de ${nf(availability)} % (seuil : ${threshold} %).` };
}

export function checkSlowApi(p95: number | null, calls: number, threshold: number): Triggered | null {
  if (p95 === null || calls < 20 || p95 <= threshold) return null;
  return { title: `API lente : ${nf(p95)} ms`, message: `95 % des appels d’API répondent en moins de ${nf(p95)} ms sur les dernières 24 h (seuil : ${nf(threshold)} ms). Regarde les routes les plus lentes dans Performance.` };
}

/** Yesterday's visitors against the average of the 7 days before; ignored below 20 visitors a day. */
export function checkTrafficDrop(yesterday: number, previousDays: number[], threshold: number): Triggered | null {
  if (!previousDays.length) return null;
  const average = previousDays.reduce((sum, value) => sum + value, 0) / previousDays.length;
  if (average < 20) return null;
  const drop = ((average - yesterday) / average) * 100;
  if (drop < threshold) return null;
  return { title: `Trafic en baisse de ${nf(drop)} %`, message: `${yesterday} visiteurs hier contre ${nf(average)} en moyenne les 7 jours d’avant (baisse de ${nf(drop)} %, seuil : ${threshold} %).` };
}

/** Clicks from Google over 7 days against the 7 days before; ignored below 20 clicks. */
export function checkSeoDrop(clicks: number, previousClicks: number, threshold: number): Triggered | null {
  if (previousClicks < 20) return null;
  const drop = ((previousClicks - clicks) / previousClicks) * 100;
  if (drop < threshold) return null;
  return { title: `Clics Google en baisse de ${nf(drop)} %`, message: `${clicks} clics depuis Google sur 7 jours contre ${previousClicks} les 7 jours d’avant (baisse de ${nf(drop)} %, seuil : ${threshold} %). Regarde les requêtes et les pages dans SEO.` };
}
