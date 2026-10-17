import { NextRequest, NextResponse } from 'next/server';
import { FieldValue, type DocumentReference } from 'firebase-admin/firestore';
import { requireAdmin } from '@/lib/admin-auth';
import { requireSameOrigin } from '@/lib/cm-server';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import {
  closePullRequest,
  commitFilesOnBranch,
  deleteBranch,
  getBaseSha,
  getGithubConfig,
  getPreviewDeployment,
  getPullRequest,
  mergePullRequest,
  openPullRequest,
  readRepoFile,
  type GithubConfig,
} from '@/lib/github';
import { isToolComponentName } from '@/lib/tool-components';
import {
  componentNameFromTitle,
  extractRegisteredComponents,
  GENERATED_TOOLS_DIR,
  registerGeneratedTool,
  STYLE_REFERENCE_PATH,
  TOOL_COMPONENTS_PATH,
  TOOL_RENDERER_PATH,
} from '@/lib/tool-generation-rules';
import { generateToolSource, missingToolGeneratorSettings, type ToolBrief } from '@/lib/tool-generator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Gemini can take a couple of minutes to write a component (two attempts at most).
export const maxDuration = 300;

type GenerationStatus = 'generating' | 'pr_open' | 'merged' | 'rejected' | 'failed';
type Generation = { status: GenerationStatus; component?: string; branch?: string; prNumber?: number; prUrl?: string; author?: string; error?: string; startedAt?: unknown; mergedAt?: unknown };

class HttpError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function toIso(value: unknown): string | undefined {
  const date = (value as { toDate?: () => Date } | undefined)?.toDate?.();
  return date instanceof Date ? date.toISOString() : undefined;
}

function serializeGeneration(value: Record<string, unknown> | undefined) {
  if (!value) return null;
  return { ...value, startedAt: toIso(value.startedAt), mergedAt: toIso(value.mergedAt), updatedAt: toIso(value.updatedAt) };
}

function failure(error: unknown) {
  if (error instanceof HttpError) return NextResponse.json({ error: error.message }, { status: error.status });
  const code = error instanceof Error ? error.message : '';
  if (code === 'UNAUTHORIZED') return NextResponse.json({ error: 'Accès administrateur requis.' }, { status: 401 });
  if (code === 'FORBIDDEN' || code === 'CSRF') return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
  console.error('[tool-generation]', code.slice(0, 300));
  return NextResponse.json({ error: code ? `Opération impossible : ${code.slice(0, 400)}` : 'Opération impossible.' }, { status: 502 });
}

function requireGithub(): GithubConfig {
  const config = getGithubConfig();
  if (!config) throw new HttpError(503, 'GITHUB_TOKEN n’est pas configuré sur Vercel.');
  return config;
}

async function loadTool(id: string) {
  if (!hasFirebaseAdminConfig()) throw new HttpError(503, 'Firebase indisponible.');
  const reference = getAdminDb().collection('tools').doc(id);
  const snapshot = await reference.get();
  if (!snapshot.exists) throw new HttpError(404, 'Outil introuvable.');
  return { reference, data: snapshot.data() as Record<string, any> };
}

function setGeneration(reference: DocumentReference, generation: Generation, extra: Record<string, unknown> = {}) {
  return reference.update({ generation: { ...generation, updatedAt: FieldValue.serverTimestamp() }, updatedAt: FieldValue.serverTimestamp(), ...extra });
}

/** Commits the component and the two registry entries on `branch`, on top of the latest base branch. */
async function commitTool(config: GithubConfig, branch: string, componentName: string, source: string, toolName: string) {
  const baseSha = await getBaseSha(config);
  const [componentsSource, rendererSource] = await Promise.all([
    readRepoFile(config, TOOL_COMPONENTS_PATH, baseSha),
    readRepoFile(config, TOOL_RENDERER_PATH, baseSha),
  ]);
  const registry = registerGeneratedTool(componentsSource, rendererSource, componentName);
  return commitFilesOnBranch(config, branch, baseSha, [
    { path: `${GENERATED_TOOLS_DIR}/${componentName}.tsx`, content: source },
    { path: TOOL_COMPONENTS_PATH, content: registry.components },
    { path: TOOL_RENDERER_PATH, content: registry.renderer },
  ], `Ajoute l’outil « ${toolName} » généré par IA`);
}

function pullRequestBody(toolName: string, description: string, componentName: string, brief: ToolBrief, author: string) {
  return [
    `## Nouvel outil généré par IA : ${toolName}`,
    '',
    description,
    '',
    `Composant : \`${GENERATED_TOOLS_DIR}/${componentName}.tsx\``,
    `Écrit par : ${author}`,
    author.startsWith('OpenRouter') ? '> ⚠️ Gemini était indisponible : ce code vient d’un modèle de secours. Relis-le et teste-le avec une attention particulière.' : '',
    '',
    '### Demande',
    brief.problem ? `- Problème : ${brief.problem}` : '',
    brief.targetUser ? `- Public : ${brief.targetUser}` : '',
    ...brief.features.map((feature) => `- ${feature}`),
    '',
    '### Contrôles automatiques passés',
    '- Fonctionne uniquement dans le navigateur : aucune requête réseau, aucun stockage',
    '- Imports limités à `react` et `lucide-react`',
    '- Ni exécution de code dynamique, ni injection de HTML, ni ressource externe',
    '',
    '### À vérifier avant d’approuver',
    `1. Ouvre l’aperçu Vercel sur \`/outils/apercu/${componentName}\` et teste l’outil avec de vrais cas et des cas limites.`,
    '2. Parcours le code dans l’onglet « Files changed ».',
    '',
    '_Créée depuis l’administration JcHub. La fusion et la date de mise en ligne se gèrent depuis Admin > Outils._',
  ].filter((line, index, lines) => line !== '' || lines[index - 1] !== '').join('\n');
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await requireAdmin(request);
    const { slug: id } = await params;
    const { reference, data } = await loadTool(id);
    const missing = missingToolGeneratorSettings();
    const generation = data.generation as Generation | undefined;
    if (!generation?.prNumber || generation.status !== 'pr_open' || missing.length) {
      return NextResponse.json({ missing, generation: serializeGeneration(data.generation) }, { headers: { 'Cache-Control': 'no-store' } });
    }

    const config = requireGithub();
    const pr = await getPullRequest(config, generation.prNumber);
    if (pr.merged) {
      // Merged directly on GitHub: record it so the tool can be scheduled.
      await setGeneration(reference, { ...generation, status: 'merged', mergedAt: FieldValue.serverTimestamp() }, { component: generation.component });
      return NextResponse.json({ missing, generation: serializeGeneration({ ...generation, status: 'merged' }) }, { headers: { 'Cache-Control': 'no-store' } });
    }
    if (pr.state === 'closed') {
      await setGeneration(reference, { ...generation, status: 'rejected' });
      return NextResponse.json({ missing, generation: serializeGeneration({ ...generation, status: 'rejected' }) }, { headers: { 'Cache-Control': 'no-store' } });
    }
    const preview = await getPreviewDeployment(config, pr.head.sha);
    return NextResponse.json({
      missing,
      generation: serializeGeneration(data.generation),
      pr: { url: pr.html_url, filesUrl: `${pr.html_url}/files`, mergeableState: pr.mergeable_state },
      preview: { ...preview, toolUrl: preview.url ? `${preview.url.replace(/\/$/, '')}/outils/apercu/${generation.component}` : undefined },
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await requireAdmin(request);
    requireSameOrigin(request);
    const { slug: id } = await params;
    const body = await request.json().catch(() => null) as { action?: unknown } | null;
    const action = body?.action;
    if (action === 'generate') return await generate(id);
    if (action === 'merge') return await merge(id);
    if (action === 'reject') return await reject(id);
    return NextResponse.json({ error: 'Action inconnue.' }, { status: 400 });
  } catch (error) {
    return failure(error);
  }
}

async function generate(id: string) {
  const missing = missingToolGeneratorSettings();
  if (missing.length) throw new HttpError(503, `Configuration manquante sur Vercel : ${missing.join(', ')}.`);
  const config = requireGithub();
  const { reference } = await loadTool(id);

  // Lock the tool so a double click cannot open two Pull Requests.
  const data = await getAdminDb().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    const current = snapshot.data() as Record<string, any>;
    const status = current.generation?.status as GenerationStatus | undefined;
    const startedAt = current.generation?.startedAt?.toMillis?.() ?? 0;
    if (isToolComponentName(String(current.component || ''))) throw new HttpError(409, 'Cet outil a déjà un composant fonctionnel.');
    if (status === 'pr_open' || status === 'merged') throw new HttpError(409, 'Une Pull Request existe déjà pour cet outil.');
    if (status === 'generating' && Date.now() - startedAt < 10 * 60_000) throw new HttpError(409, 'Une génération est déjà en cours pour cet outil.');
    if (!String(current.description || '').trim()) throw new HttpError(400, 'Décris ce que doit faire l’outil avant de le générer.');
    transaction.update(reference, { generation: { status: 'generating', startedAt: FieldValue.serverTimestamp() } });
    return current;
  });

  const toolName = String(data.name || 'Nouvel outil');
  const brief: ToolBrief = {
    name: toolName,
    description: String(data.description || ''),
    problem: data.userProblem ? String(data.userProblem) : undefined,
    targetUser: data.targetUser ? String(data.targetUser) : undefined,
    reason: data.proposalReason ? String(data.proposalReason) : undefined,
    features: Array.isArray(data.proposedFeatures) ? data.proposedFeatures.map(String).slice(0, 6) : [],
  };

  try {
    const baseSha = await getBaseSha(config);
    const [componentsSource, styleReference] = await Promise.all([
      readRepoFile(config, TOOL_COMPONENTS_PATH, baseSha),
      readRepoFile(config, STYLE_REFERENCE_PATH, baseSha),
    ]);
    const componentName = componentNameFromTitle(toolName, extractRegisteredComponents(componentsSource));
    const generated = await generateToolSource(brief, componentName, styleReference);
    const branch = `outil-ia/${String(data.slug || id).replace(/[^a-z0-9-]/g, '-').slice(0, 60)}`;
    await commitTool(config, branch, componentName, generated.code, toolName);
    const pr = await openPullRequest(config, branch, `Nouvel outil : ${toolName}`, pullRequestBody(toolName, generated.description || brief.description, componentName, brief, generated.author));
    await setGeneration(reference, { status: 'pr_open', component: componentName, branch, prNumber: pr.number, prUrl: pr.html_url, author: generated.author }, {
      // Suggested catalog details; the admin can still edit them before publishing.
      ...(generated.description ? { description: generated.description } : {}),
      category: generated.category,
      icon: generated.icon,
      tags: generated.tags,
      seo: { title: generated.seoTitle || `${toolName} — JcHub`, description: generated.seoDescription || generated.description, keywords: generated.tags },
    });
    return NextResponse.json({ prNumber: pr.number, prUrl: pr.html_url, component: componentName, author: generated.author }, { status: 201 });
  } catch (error) {
    await setGeneration(reference, { status: 'failed', error: (error instanceof Error ? error.message : 'Erreur inconnue').slice(0, 600) }).catch(() => undefined);
    throw error;
  }
}

async function merge(id: string) {
  const config = requireGithub();
  const { reference, data } = await loadTool(id);
  const generation = data.generation as Generation | undefined;
  if (generation?.status !== 'pr_open' || !generation.prNumber || !generation.component || !generation.branch) throw new HttpError(409, 'Aucune Pull Request ouverte pour cet outil.');

  const pr = await getPullRequest(config, generation.prNumber);
  if (!pr.merged) {
    if (pr.state === 'closed') {
      await setGeneration(reference, { ...generation, status: 'rejected' });
      throw new HttpError(409, 'La Pull Request a été fermée sur GitHub.');
    }
    const preview = await getPreviewDeployment(config, pr.head.sha);
    if (preview.state === 'failed') throw new HttpError(409, 'La construction de l’aperçu Vercel a échoué : corrige ou rejette la Pull Request.');
    if (preview.state !== 'ready') throw new HttpError(409, 'L’aperçu Vercel n’est pas encore prêt. Teste l’outil dessus avant d’approuver.');
    if (pr.mergeable_state === 'dirty' || pr.mergeable_state === 'behind') {
      const source = await readRepoFile(config, `${GENERATED_TOOLS_DIR}/${generation.component}.tsx`, pr.head.sha);
      await commitTool(config, generation.branch, generation.component, source, String(data.name || generation.component));
      throw new HttpError(409, 'Le site a changé depuis la génération : la branche vient d’être remise à jour. Attends le nouvel aperçu Vercel, puis approuve à nouveau.');
    }
    if (pr.mergeable_state === 'unknown') throw new HttpError(409, 'GitHub vérifie encore la Pull Request. Réessaie dans quelques secondes.');
    if (pr.mergeable_state === 'unstable') throw new HttpError(409, 'Des vérifications automatiques sont en cours ou ont échoué. Consulte la Pull Request.');
    if (pr.mergeable_state !== 'clean') throw new HttpError(409, `Fusion impossible pour le moment (état GitHub : ${pr.mergeable_state}).`);
    await mergePullRequest(config, pr.number, pr.head.sha, `Ajoute l’outil « ${String(data.name || generation.component)} » (#${pr.number})`);
  }
  await deleteBranch(config, generation.branch).catch(() => undefined);
  await setGeneration(reference, { ...generation, status: 'merged', mergedAt: FieldValue.serverTimestamp() }, { component: generation.component });
  return NextResponse.json({ merged: true, component: generation.component });
}

async function reject(id: string) {
  const config = requireGithub();
  const { reference, data } = await loadTool(id);
  const generation = data.generation as Generation | undefined;
  if (generation?.status !== 'pr_open' || !generation.prNumber) throw new HttpError(409, 'Aucune Pull Request ouverte pour cet outil.');
  await closePullRequest(config, generation.prNumber);
  if (generation.branch) await deleteBranch(config, generation.branch).catch(() => undefined);
  await setGeneration(reference, { ...generation, status: 'rejected' });
  return NextResponse.json({ rejected: true });
}
