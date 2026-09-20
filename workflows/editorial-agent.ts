import { collectCatalog, collectTrends, generateEditorialDraft, saveEditorialDraft } from '@/lib/content-agent';

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

export async function runEditorialAgent() {
  'use workflow';
  const candidates = await collectTrendsStep();
  const draft = await generateDraftStep(candidates);
  const draftId = await saveDraftStep(draft);
  return { draftId, provider: process.env.AI_PROVIDER || 'gemini', candidates: candidates.length };
}