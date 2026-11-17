import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { resources as builtInResources } from '@/lib/resources';
import { createResourceDraft, readStoredResources } from '@/lib/resource-store';
import { generateResource } from '@/lib/resource-generator';
import { chooseResourceTopics, collectDemandSignals, RESOURCE_AGENT_RUNS, weeklyResourceCount, type ResourceTopic } from '@/lib/resource-research';
import { getPublishedTools } from '@/lib/tools';
import { notifyAdminOfAgentFailure, notifyAdminOfResourceDrafts } from '@/lib/agent-email';
import { reportUserError } from '@/lib/user-error';

/**
 * Weekly resource agent: finds what people look for, picks the most wanted topics and writes
 * at least two resources as drafts. Nothing is published: the admin rereads them in
 * Admin > Ressources. Each step is retried on its own by the workflow if the server stops.
 */

const RECENT_TOPICS_DAYS = 120;

type DraftResult = { id: string; title: string; reason: string } | { error: string };

async function researchStep(runKey: string) {
  'use step';
  const count = weeklyResourceCount();
  const [{ signals, failures }, stored, tools, runs] = await Promise.all([
    collectDemandSignals(),
    readStoredResources(),
    getPublishedTools(),
    getAdminDb().collection(RESOURCE_AGENT_RUNS).where('createdAt', '>=', new Date(Date.now() - RECENT_TOPICS_DAYS * 86400_000)).get(),
  ]);
  // Topics proposed lately, even when the draft was deleted since: the agent does not insist.
  const recentTopics = runs.docs.flatMap((run) => Array.isArray(run.data().topics) ? run.data().topics.map(String) : []);
  const topics = await chooseResourceTopics({
    signals,
    existing: [...builtInResources, ...stored].flatMap((resource) => [resource.fr.title, resource.en.title]),
    recentTopics,
    tools: tools.map((tool) => tool.name),
    count,
  });
  await getAdminDb().collection(RESOURCE_AGENT_RUNS).doc(runKey).set({
    status: 'writing',
    signals: signals.length,
    candidates: topics.map((topic) => topic.topic),
    sourceFailures: failures,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  return { topics, failures, count };
}

async function draftStep(topic: ResourceTopic, runKey: string): Promise<DraftResult> {
  'use step';
  let lastError = 'erreur inconnue';
  // The AI sometimes answers an incomplete content: one more try before moving to the next topic.
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const [stored, tools] = await Promise.all([readStoredResources(), getPublishedTools()]);
      const { resource, provider } = await generateResource({
        topic: topic.topic,
        kind: topic.kind,
        notes: `Sujet choisi parce que : ${topic.reason}`,
        existing: [...builtInResources, ...stored],
        tools: tools.map((tool) => tool.name),
      });
      const saved = await createResourceDraft(resource, {
        topic: topic.topic,
        provider,
        origin: 'agent',
        research: { reason: topic.reason, signals: topic.signals, runId: runKey },
      });
      return { id: saved.id, title: saved.fr.title, reason: topic.reason };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }
  return { error: `« ${topic.topic} » : ${lastError}` };
}

async function finishStep(runKey: string, drafts: { id: string; title: string; reason: string }[], failures: string[], proposed: string[]) {
  'use step';
  await getAdminDb().collection(RESOURCE_AGENT_RUNS).doc(runKey).set({
    status: drafts.length ? 'done' : 'failed',
    drafts: drafts.map((draft) => draft.id),
    topics: proposed,
    failures,
    finishedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  const email = await notifyAdminOfResourceDrafts(drafts, failures);
  if (!email.ok) reportUserError(new Error(`Notification des ressources non envoyée : ${email.reason ?? 'raison inconnue'}`));
  return { drafts: drafts.length };
}

async function failRunStep(runKey: string, reason: string) {
  'use step';
  await getAdminDb().collection(RESOURCE_AGENT_RUNS).doc(runKey).set({ status: 'failed', failures: [reason], finishedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  await notifyAdminOfAgentFailure('La recherche de ressources', reason, '/admin/resources');
}

export async function runResourceAgent(runKey: string) {
  'use workflow';
  let research;
  try {
    research = await researchStep(runKey);
  } catch (error) {
    // No source or no AI answered: the run is marked failed and the admin is told why.
    await failRunStep(runKey, error instanceof Error ? error.message : String(error));
    throw error;
  }
  const { topics, failures: sourceFailures, count } = research;
  const drafts: { id: string; title: string; reason: string }[] = [];
  const failures = sourceFailures.map((failure) => `Source indisponible, ${failure}`);
  const proposed: string[] = [];
  // Topics are ranked: the next one replaces a draft that failed, until the weekly count is reached.
  for (const topic of topics) {
    if (drafts.length >= count) break;
    proposed.push(topic.topic);
    const result = await draftStep(topic, runKey);
    if ('error' in result) failures.push(`Rédaction impossible pour ${result.error}`);
    else drafts.push(result);
  }
  if (drafts.length < count) failures.push(`${drafts.length} brouillon(s) sur les ${count} prévus.`);
  return finishStep(runKey, drafts, failures, proposed);
}
