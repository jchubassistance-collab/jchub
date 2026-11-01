import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { requireWriter } from '@/lib/admin-auth';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { enforceRateLimit } from '@/lib/rate-limit';
import { toWriterSummary, uniqueSlug, viewsBySlug, writerError } from '@/lib/writer-articles';
import { parseKeywords, readTime, slugify, WRITER_LIMITS } from '@/lib/writer-rules';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const createSchema = z.object({
  title: z.string().trim().min(1).max(WRITER_LIMITS.title),
  description: z.string().trim().max(WRITER_LIMITS.description).default(''),
  content: z.string().max(WRITER_LIMITS.content).default(''),
  category: z.string().trim().min(1).max(WRITER_LIMITS.category).default('Technologie'),
  keywords: z.array(z.string().max(WRITER_LIMITS.keyword)).max(WRITER_LIMITS.keywords).default([]),
  plannedFor: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().default(null),
}).strict();

export async function GET(request: NextRequest) {
  try {
    const writer = await requireWriter(request);
    if (!hasFirebaseAdminConfig()) return NextResponse.json({ error: 'Firebase indisponible.' }, { status: 503 });
    const snapshot = await getAdminDb().collection('articles').where('authorUid', '==', writer.uid).get();
    // An article withdrawn after publication keeps the views it had.
    const views = await viewsBySlug(snapshot.docs.filter((document) => document.data().publishedAt).map((document) => String(document.data().slug || document.id)));
    const articles = snapshot.docs
      .map((document) => toWriterSummary(document.id, document.data(), views.get(String(document.data().slug || document.id)) || 0))
      .sort((a, b) => (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || ''));
    return NextResponse.json({ articles }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return writerError(error, request); }
}

/** New draft, from the editor or from an idea of the editorial calendar. */
export async function POST(request: NextRequest) {
  try {
    const writer = await requireWriter(request);
    if (!hasFirebaseAdminConfig()) return NextResponse.json({ error: 'Firebase indisponible.' }, { status: 503 });
    const limited = await enforceRateLimit(request, `writer-create:${writer.uid}`, 60, 60 * 60 * 1000);
    if (limited) return limited;
    const parsed = createSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Vérifiez les champs de l’article.' }, { status: 400 });
    const input = parsed.data;
    const reference = getAdminDb().collection('articles').doc(`article-${Date.now()}`);
    const slug = await uniqueSlug(slugify(input.title), reference.id);
    await reference.create({
      slug,
      title: input.title,
      description: input.description,
      excerpt: input.description,
      content: input.content,
      category: input.category,
      keywords: parseKeywords(input.keywords.join(',')),
      plannedFor: input.plannedFor,
      readTime: readTime(input.content),
      author: writer.name,
      authorUid: writer.uid,
      status: 'draft',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ id: reference.id, slug }, { status: 201 });
  } catch (error) { return writerError(error, request); }
}
