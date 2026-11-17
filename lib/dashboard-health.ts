/**
 * Health score of the site on the admin dashboard, out of 100. Each deduction is listed with its
 * reason, so the gauge is never a black box. Only relative imports: tested with plain Node.
 */

export type HealthInput = {
  /** Distinct errors (by fingerprint) seen during the period. */
  distinctErrors: number;
  /** Weekly agents whose last run failed or never finished. */
  failedAgents: string[];
  /** Drafts written by the agents and waiting more than 7 days for the admin. */
  staleDrafts: number;
  /** Contact messages not handled yet. */
  pendingMessages: number;
  /** Bounce rate of the period in %, or null without Google Analytics. */
  bounceRate: number | null;
  /** Average server response of the site's pages in ms over the period, or null. */
  averageResponseMs: number | null;
};

export type HealthItem = { label: string; penalty: number; detail: string };

export function computeHealth(input: HealthInput): { score: number; items: HealthItem[] } {
  const items: HealthItem[] = [];
  if (input.distinctErrors > 0) {
    items.push({ label: 'Erreurs du site', penalty: Math.min(30, input.distinctErrors * 3), detail: `${input.distinctErrors} erreur(s) différente(s) sur la période (3 points chacune, 30 au plus)` });
  }
  if (input.failedAgents.length) {
    items.push({ label: 'Agents IA', penalty: input.failedAgents.length * 15, detail: `En échec : ${input.failedAgents.join(', ')}` });
  }
  if (input.staleDrafts > 0) {
    items.push({ label: 'Brouillons en attente', penalty: Math.min(10, input.staleDrafts * 2), detail: `${input.staleDrafts} brouillon(s) IA attendent depuis plus de 7 jours` });
  }
  if (input.pendingMessages > 0) {
    items.push({ label: 'Messages non traités', penalty: Math.min(10, input.pendingMessages), detail: `${input.pendingMessages} message(s) de contact à traiter` });
  }
  if (input.bounceRate !== null && input.bounceRate > 70) {
    items.push({ label: 'Taux de rebond', penalty: 10, detail: `${input.bounceRate} % des visites ne vont pas plus loin que la première page (seuil : 70 %)` });
  }
  if (input.averageResponseMs !== null && input.averageResponseMs > 1500) {
    items.push({ label: 'Lenteur du serveur', penalty: 10, detail: `Réponse moyenne des pages : ${Math.round(input.averageResponseMs)} ms (seuil : 1 500 ms)` });
  }
  const score = Math.max(0, 100 - items.reduce((total, item) => total + item.penalty, 0));
  return { score, items };
}

/** Change between two periods in %, or null when there is nothing to compare with. */
export function percentChange(current: number, previous: number): number | null {
  if (!previous) return current ? null : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}
