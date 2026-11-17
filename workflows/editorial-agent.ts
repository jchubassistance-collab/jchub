import { getAdminDb } from '@/lib/firebase-admin';
import { collectCatalog, collectTrends, generateEditorialDraft, saveEditorialDraft } from '@/lib/content-agent';
import { notifyAdminOfAgentFailure } from '@/lib/agent-email';

async function collectTrendsStep() {
  'use step';
  return collectTrends();
}

async function generateDraftStep(candidates: Awaited<ReturnType<typeof collectTrends>>) {
  'use step';
  const catalog = await collectCatalog();
  return generateEditorialDraft(candidates, catalog);
}

async function saveDraftStep(draft: Awaited<ReturnType<typeof generateEditorialDraft>>) {
  'use step';
  return saveEditorialDraft(draft);
}

/** Records the outcome on the run started by the cron (agent_runs/{date}); a manual run has none. */
async function finishRunStep(runKey: string | undefined, outcome: { status: 'done' | 'failed'; draftId?: string; error?: string }) {
  'use step';
  if (runKey) {
    await getAdminDb().collection('agent_runs').doc(runKey).set({ ...outcome, finishedAt: new Date(), updatedAt: new Date() }, { merge: true });
  }
  if (outcome.status === 'failed') await notifyAdminOfAgentFailure('L’agent éditorial', outcome.error ?? 'erreur inconnue', '/admin/agent');
}

export async function runEditorialAgent(runKey?: string) {
  'use workflow';
  try {
    const candidates = await collectTrendsStep();
    const draft = await generateDraftStep(candidates);
    const saved = await saveDraftStep(draft);
    await finishRunStep(runKey, { status: 'done', draftId: saved.draftId });
    return { ...saved, provider: draft.provider, candidates: candidates.length };
  } catch (error) {
    // A run that fails no longer stays "running" for ever: it is marked and the admin is told why.
    await finishRunStep(runKey, { status: 'failed', error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}
