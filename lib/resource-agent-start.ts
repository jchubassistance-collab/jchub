import 'server-only';

import { start } from 'workflow/api';
import { getAdminDb } from '@/lib/firebase-admin';
import { RESOURCE_AGENT_RUNS } from '@/lib/resource-research';
import { runResourceAgent } from '@/workflows/resource-agent';
import { isoWeekKey } from '@/lib/resource-schema';

/** A run still marked as running after this long is considered stopped. */
const STALE_RUN_MS = 30 * 60_000;

export type AgentStart = { started: true; runKey: string; runId: string } | { started: false; reason: 'already_done' | 'running' };

/**
 * Starts the weekly research. The cron uses the week as key, so a second call the same week
 * does nothing; the admin button uses its own key but waits for a run in progress to end.
 */
export async function startResourceAgent(trigger: 'cron' | 'admin'): Promise<AgentStart> {
  const db = getAdminDb();
  const runKey = trigger === 'cron' ? isoWeekKey() : `manuel-${new Date().toISOString().replace(/[:.]/g, '-')}`;
  const reference = db.collection(RESOURCE_AGENT_RUNS).doc(runKey);
  const recent = await db.collection(RESOURCE_AGENT_RUNS).where('createdAt', '>=', new Date(Date.now() - STALE_RUN_MS)).get();
  if (recent.docs.some((run) => ['started', 'writing'].includes(String(run.data().status)))) return { started: false, reason: 'running' };

  const created = await db.runTransaction(async (transaction) => {
    if ((await transaction.get(reference)).exists) return false;
    transaction.create(reference, { trigger, status: 'started', createdAt: new Date() });
    return true;
  });
  if (!created) return { started: false, reason: 'already_done' };

  try {
    const run = await start(runResourceAgent, [runKey]);
    await reference.update({ runId: run.runId, updatedAt: new Date() });
    return { started: true, runKey, runId: run.runId };
  } catch (error) {
    await reference.update({ status: 'failed', failures: [error instanceof Error ? error.message : 'Démarrage impossible'], updatedAt: new Date() });
    throw error;
  }
}

export type AgentRunSummary = { id: string; trigger: string; status: string; drafts: number; failures: string[]; createdAt: string | null; finishedAt: string | null };

export async function latestResourceAgentRuns(limit = 5): Promise<AgentRunSummary[]> {
  const snapshot = await getAdminDb().collection(RESOURCE_AGENT_RUNS).orderBy('createdAt', 'desc').limit(limit).get();
  const iso = (value: unknown) => (value as { toDate?: () => Date } | undefined)?.toDate?.().toISOString() ?? null;
  return snapshot.docs.map((run) => {
    const data = run.data();
    return {
      id: run.id,
      trigger: String(data.trigger ?? ''),
      status: String(data.status ?? ''),
      drafts: Array.isArray(data.drafts) ? data.drafts.length : 0,
      failures: Array.isArray(data.failures) ? data.failures.map(String) : [],
      createdAt: iso(data.createdAt),
      finishedAt: iso(data.finishedAt),
    };
  });
}
