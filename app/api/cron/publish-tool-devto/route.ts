import { NextRequest, NextResponse } from 'next/server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { getPublishedTools } from '@/lib/tools';
import { publishDevToArticle } from '@/lib/social-publishing';
import { reportUserError } from '@/lib/user-error';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const authorization = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  if (!hasFirebaseAdminConfig()) return NextResponse.json({ error: 'Firebase is unavailable.' }, { status: 503 });

  const db = getAdminDb();
  const dateKey = new Date().toISOString().slice(0, 10);
  const runRef = db.collection('tool_devto_runs').doc(dateKey);
  const now = Timestamp.now();
  const shouldRun = await db.runTransaction(async (transaction) => {
    const run = await transaction.get(runRef);
    const data = run.data();
    if (data?.status === 'published') return false;
    const startedAt = data?.startedAt;
    if (data?.status === 'started' && startedAt?.toMillis && now.toMillis() - startedAt.toMillis() < 15 * 60 * 1000) return false;
    transaction.set(runRef, { date: dateKey, status: 'started', startedAt: now, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return true;
  });
  if (!shouldRun) return NextResponse.json({ skipped: true, date: dateKey, reason: 'already_published_or_running' });

  try {
    const tools = (await getPublishedTools()).filter((tool) => tool.status !== 'draft').sort((a, b) => a.slug.localeCompare(b.slug));
    if (!tools.length) throw new Error('No published JcHub tools are available.');

    const history = await db.collection('tool_devto_publications').orderBy('createdAt', 'desc').limit(tools.length).get();
    const recentSlugs = new Set(history.docs.map((document) => String(document.data().toolSlug || '')));
    const tool = tools.find((candidate) => !recentSlugs.has(candidate.slug)) || tools[0];
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://jchub.dev').replace(/\/$/, '');
    const toolUrl = `${siteUrl}/outils/${encodeURIComponent(tool.slug)}`;
    const title = `${tool.name} : un outil en ligne pour ${tool.category.toLowerCase()}`;
    const description = `${tool.description} Découvrez l’outil JcHub et son cas d’utilisation.`;
    const body = `# ${tool.name}\n\n${tool.description}\n\n## Quand cet outil peut vous aider\n\nQuand vous devez effectuer cette tâche dans le cadre de ${tool.category.toLowerCase()}, cet outil JcHub vous propose un point de départ simple. Il est utile pour les développeurs, les créateurs de projets et toute personne qui rencontre ce besoin.\n\n## Comment l’essayer\n\n1. Ouvrez l’outil JcHub.\n2. Suivez les champs et les options affichés sur la page.\n3. Vérifiez le résultat avant de l’utiliser dans votre projet.\n\n## Essayer l’outil\n\n[Ouvrir ${tool.name} sur JcHub](${toolUrl})\n\nConsultez aussi [les autres outils JcHub](${siteUrl}/outils).`;
    const result = await publishDevToArticle({
      title,
      body,
      description,
      tags: [...tool.tags, 'jchub', 'tools'],
    });
    if (result.status !== 'published') throw new Error(result.message || 'Dev.to did not publish the article.');

    await db.collection('tool_devto_publications').add({
      date: dateKey,
      toolSlug: tool.slug,
      toolName: tool.name,
      canonicalUrl: toolUrl,
      devtoId: result.id,
      devtoUrl: result.url || null,
      createdAt: FieldValue.serverTimestamp(),
    });
    await runRef.set({ status: 'published', toolSlug: tool.slug, devtoId: result.id, devtoUrl: result.url || null, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return NextResponse.json({ published: true, date: dateKey, tool: tool.slug, devtoUrl: result.url || null });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Dev.to publication failed.';
    await runRef.set({ status: 'failed', error: message, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    reportUserError();
    return NextResponse.json({ error: 'Could not publish the daily tool on Dev.to.', detail: message }, { status: 502 });
  }
}

export const POST = GET;
