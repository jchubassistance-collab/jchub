import { collectCatalog, collectTrends, generateEditorialDraft, saveEditorialDraft } from '@/lib/content-agent';
import { prepareSocialPublications } from '@/lib/publishing-agent';

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
  const saved = await saveEditorialDraft(draft);
  if (saved.status === 'published' && saved.publishedSlug) {
    try { await prepareSocialPublications(saved.publishedSlug); }
    catch { /* A social failure must not roll back the JcHub article. */ }
  }
  return saved;
}

export async function runEditorialAgent() {
  'use workflow';
  const candidates = await collectTrendsStep();
  const draft = await generateDraftStep(candidates);
  const saved = await saveDraftStep(draft);
  return { ...saved, provider: process.env.AI_PROVIDER || 'gemini', candidates: candidates.length };
}
