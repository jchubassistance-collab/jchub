import { after, NextRequest, NextResponse } from 'next/server';
import { FieldValue, type DocumentData } from 'firebase-admin/firestore';
import { z } from 'zod';
import { notifyAdminOfWriterPublication } from '@/lib/agent-email';
import { requireWriter } from '@/lib/admin-auth';
import { articleCoverPath } from '@/lib/article-cover';
import { addCoverPhoto } from '@/lib/article-photo';
import { refreshArticle } from '@/lib/article-repository';
import { hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { revalidateBlog } from '@/lib/live-articles';
import { reviewWriterArticle } from '@/lib/writer-review';
import { enforceRateLimit } from '@/lib/rate-limit';
import { ownedArticle, slugTaken, toWriterArticle, uniqueSlug, viewsBySlug, writerError } from '@/lib/writer-articles';
import { parseKeywords, publicationChecks, readTime, slugify, WRITER_EDITABLE_STATUSES, WRITER_LIMITS } from '@/lib/writer-rules';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  title: z.string().trim().min(1).max(WRITER_LIMITS.title).optional(),
  description: z.string().trim().max(WRITER_LIMITS.description).optional(),
  content: z.string().max(WRITER_LIMITS.content).optional(),
  category: z.string().trim().min(1).max(WRITER_LIMITS.category).optional(),
  keywords: z.array(z.string().max(WRITER_LIMITS.keyword)).max(WRITER_LIMITS.keywords).optional(),
  slug: z.string().trim().min(1).max(WRITER_LIMITS.slug).optional(),
  plannedFor: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  publish: z.literal(true).optional(),
}).strict();

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const writer = await requireWriter(request);
    if (!hasFirebaseAdminConfig()) return NextResponse.json({ error: 'Firebase indisponible.' }, { status: 503 });
    const { id } = await params;
    const { data } = await ownedArticle(writer.uid, id);
    const slug = String(data.slug || id);
    const views = data.publishedAt ? (await viewsBySlug([slug])).get(slug) || 0 : 0;
    return NextResponse.json({ article: toWriterArticle(id, data, views) }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return writerError(error, request); }
}

/**
 * Saves the writer's changes; with publish, also puts the draft online. A published article is
 * checked again at each save and its files rewritten, as from the admin editor.
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const writer = await requireWriter(request);
    if (!hasFirebaseAdminConfig()) return NextResponse.json({ error: 'Firebase indisponible.' }, { status: 503 });
    const { id } = await params;
    const parsed = updateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Vérifiez les champs de l’article.' }, { status: 400 });
    const input = parsed.data;
    const { reference, data } = await ownedArticle(writer.uid, id);
    const status = String(data.status || 'draft');
    if (!(WRITER_EDITABLE_STATUSES as readonly string[]).includes(status)) {
      return NextResponse.json({ error: 'Cet article est archivé ou programmé : seul l’administrateur peut le modifier.' }, { status: 409 });
    }
    const wasPublished = status === 'published';
    const publishing = input.publish === true && !wasPublished;
    // Each save of a published article means a translation check and a deploy.
    if (wasPublished || publishing) {
      const limited = await enforceRateLimit(request, `writer-publish:${writer.uid}`, 30, 60 * 60 * 1000);
      if (limited) return limited;
    }

    // After the review at publication, the editor still holds what the writer typed: a save that
    // sends those same values back keeps the reviewed title, subtitles and keywords.
    const reviewed = (data.aiReview as { original?: { title?: string; content?: string; keywords?: string[] } } | undefined)?.original;
    if (reviewed) {
      if (input.title !== undefined && input.title === reviewed.title) delete input.title;
      if (input.content !== undefined && input.content.trim() === String(reviewed.content || '').trim()) delete input.content;
      if (input.keywords !== undefined && parseKeywords(input.keywords.join(',')).join(',') === (reviewed.keywords || []).join(',')) delete input.keywords;
    }

    const update: Record<string, unknown> = { author: writer.name, updatedAt: FieldValue.serverTimestamp() };
    if (input.title !== undefined) update.title = input.title;
    if (input.description !== undefined) { update.description = input.description; update.excerpt = input.description; }
    if (input.content !== undefined) { update.content = input.content; update.readTime = readTime(input.content); }
    if (input.category !== undefined) update.category = input.category;
    if (input.keywords !== undefined) update.keywords = parseKeywords(input.keywords.join(','));
    if (input.plannedFor !== undefined) update.plannedFor = input.plannedFor;

    // Until its first publication, the address follows the title unless the writer typed one.
    // Afterwards it stays: links already shared or indexed must keep working.
    if (!data.publishedAt) {
      if (input.slug !== undefined) {
        const slug = slugify(input.slug);
        if (!slug) return NextResponse.json({ error: 'Cette adresse n’est pas valide.' }, { status: 400 });
        if (slug !== data.slug && await slugTaken(slug, id)) return NextResponse.json({ error: 'Cette adresse est déjà utilisée par un autre article.' }, { status: 409 });
        update.slug = slug;
        update.customSlug = true;
      } else if (input.title !== undefined && data.customSlug !== true && slugify(input.title) !== slugify(String(data.title || ''))) {
        update.slug = await uniqueSlug(slugify(input.title), id);
      }
    } else if (input.slug !== undefined && slugify(input.slug) !== data.slug) {
      return NextResponse.json({ error: 'L’adresse d’un article déjà publié ne peut plus changer.' }, { status: 409 });
    }

    const next: DocumentData = { ...data, ...update };
    const title = String(next.title || '');
    const description = String(next.description || '');
    const slug = String(next.slug || id);
    if (wasPublished || publishing) {
      const missing = publicationChecks({ title, description, content: String(next.content || ''), category: String(next.category || '') }).filter((check) => !check.ok).map((check) => check.label);
      if (missing.length) {
        return NextResponse.json({ error: `${wasPublished ? 'Un article publié doit rester complet' : 'L’article n’est pas encore prêt'}. Il manque : ${missing.join(' ; ')}.`, missing }, { status: 400 });
      }
      const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://jchub.dev').replace(/\/$/, '');
      update.image = `${siteUrl}${articleCoverPath({ title, category: String(next.category || '') })}`;
    }
    if (publishing) {
      if (await slugTaken(slug, id)) return NextResponse.json({ error: 'Cette adresse est déjà utilisée par un autre article : modifiez-la avant de publier.' }, { status: 409 });
      update.status = 'published';
      update.readTime = readTime(String(next.content || ''));
      if (!data.publishedAt) update.publishedAt = FieldValue.serverTimestamp();
      // Off the blog until the review of its title, subtitles and keywords ends (lib/writer-review.ts).
      update.aiReview = { status: 'pending', startedAt: new Date().toISOString() };
    }
    await reference.update(update);

    if (wasPublished || publishing) {
      // An update is online at once; a first publication once reviewed. The cover photo and the
      // English version follow, from the reviewed text, and refresh it again.
      revalidateBlog();
      after(async () => {
        if (publishing) {
          await reviewWriterArticle(reference);
          revalidateBlog();
          await addCoverPhoto(reference);
        }
        await refreshArticle(id, { translate: true });
        if (publishing) await notifyAdminOfWriterPublication({ title: String((await reference.get()).data()?.title || title), description, slug, author: writer.name });
      });
    }
    return NextResponse.json({ id, slug, status: publishing ? 'published' : status, savedAt: new Date().toISOString() });
  } catch (error) { return writerError(error, request); }
}

/** Only a draft that never went online can be deleted; a published article is withdrawn by the admin. */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const writer = await requireWriter(request);
    if (!hasFirebaseAdminConfig()) return NextResponse.json({ error: 'Firebase indisponible.' }, { status: 503 });
    const { id } = await params;
    const { reference, data } = await ownedArticle(writer.uid, id);
    if (data.status !== 'draft' || data.publishedAt) {
      return NextResponse.json({ error: 'Seul un brouillon jamais publié peut être supprimé. Pour retirer un article publié, contactez l’administrateur.' }, { status: 409 });
    }
    await reference.delete();
    return NextResponse.json({ deleted: true });
  } catch (error) { return writerError(error, request); }
}
