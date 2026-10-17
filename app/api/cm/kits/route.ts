import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { getPublishedArticleBySlug } from '@/lib/blog';
import { getPublishedTools } from '@/lib/tools';
import { requireCm } from '@/lib/admin-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { cmError, requireSameOrigin, writeCmActivity } from '@/lib/cm-server';
import { reportUserError } from '@/lib/user-error';
import { generateCmCopy, type CmSource } from '@/lib/cm-publication-kit';
import { getPublicBaseUrl } from '@/lib/site-url';

export const runtime = 'nodejs';
export const maxDuration = 60;

const requestSchema = z.object({ kind: z.enum(['article', 'tool']), slug: z.string().trim().min(1).max(180) }).strict();

export async function GET(request: NextRequest) {
  try {
    await requireCm(request);
    const snapshot = await getAdminDb().collection('cmKits').orderBy('createdAt', 'desc').limit(100).get();
    const kits = snapshot.docs.map((doc) => {
      const data = doc.data();
      return { id: doc.id, ...data, createdAt: data.createdAt?.toDate?.()?.toISOString() || null, updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null };
    });
    return NextResponse.json({ kits }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return cmError(error); }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireCm(request); requireSameOrigin(request);
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Choisis un article ou un outil disponible.' }, { status: 400 });
    const { kind, slug } = parsed.data;
    const base = getPublicBaseUrl();
    let source: CmSource | null = null;
    if (kind === 'article') {
      const article = await getPublishedArticleBySlug(slug);
      if (article?.status === 'published') source = { kind, slug, title: article.title, description: article.excerpt || article.description, category: article.category, url: `${base}/blog/${encodeURIComponent(slug)}`, tags: article.tags || [] };
    } else {
      const tool = (await getPublishedTools({ includeScheduled: true })).find((item) => item.slug === slug);
      if (tool) source = { kind, slug, title: tool.name, description: tool.description, category: tool.category, url: `${base}${tool.path || `/outils/${encodeURIComponent(slug)}`}`, tags: tool.tags || [] };
    }
    if (!source) return NextResponse.json({ error: 'Ce contenu n’est plus publié ou disponible.' }, { status: 404 });
    let copy;
    try {
      copy = await generateCmCopy(source);
    } catch (error) {
      reportUserError();
      const diagnostic = error instanceof Error ? error.message : '';
      // Keep provider diagnostics out of the response: some upstream errors may
      // contain request details. The server log is enough to troubleshoot.
      const safeDiagnostic = diagnostic
        .replaceAll(process.env.OPENROUTER_API_KEY || '\u0000', '[redacted]')
        .replace(/Bearer\s+\S+/gi, 'Bearer [redacted]');
      console.error('[cm/kits] OpenRouter generation failed:', safeDiagnostic.slice(0, 400));
      const message = diagnostic.includes('OPENROUTER_API_KEY')
        ? 'La clé OPENROUTER_API_KEY est absente du serveur. Ajoutez-la dans .env ou .env.local, puis redémarrez Next.js.'
        : /requires more credits|more credits|can only afford/i.test(diagnostic)
          ? 'Le budget OpenRouter disponible ne permet pas cette génération. La requête est limitée à 3 000 tokens; vérifiez le modèle configuré ou réduisez la longueur de sa réponse.'
          : diagnostic.includes('OUTPUT_TRUNCATED')
            ? 'La réponse IA a été tronquée avant de terminer le kit. Réessayez; aucune nouvelle requête automatique n’a été lancée.'
        : error instanceof SyntaxError || error instanceof z.ZodError || diagnostic.includes('JSON') || diagnostic.includes('Zod') || diagnostic.includes('INCOMPLETE_RESPONSE')
          ? 'OpenRouter a répondu, mais le kit reçu est incomplet ou invalide. Réessayez.'
          : 'OpenRouter n’a pas pu générer le kit. Consultez le terminal du serveur pour connaître la cause.';
      return NextResponse.json({ error: message }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
    }
    const ref = getAdminDb().collection('cmKits').doc();
    try {
      await ref.set({ ...source, ...copy, status: 'draft', createdBy: actor.uid, updatedBy: actor.uid, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
      await writeCmActivity(actor.uid, 'kit.generated', ref.id);
    } catch (error) {
      reportUserError();
      console.error('[cm/kits] Kit persistence failed:', error instanceof Error ? error.message.slice(0, 400) : 'unknown error');
      return NextResponse.json({ error: 'Le kit a été généré, mais son enregistrement a échoué. Vérifiez la connexion à Firestore, puis réessayez.' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
    }
    return NextResponse.json({ kit: { id: ref.id, ...source, ...copy, status: 'draft' } }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof Error && (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN' || error.message === 'CSRF')) return cmError(error);
    reportUserError();
    console.error('[cm/kits] Request failed:', error instanceof Error ? error.message.slice(0, 400) : 'unknown error');
    return NextResponse.json({ error: 'La demande du kit a échoué. Consultez le terminal du serveur pour connaître la cause.' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
