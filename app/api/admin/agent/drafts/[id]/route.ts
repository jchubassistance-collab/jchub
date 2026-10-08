import { NextRequest, NextResponse } from 'next/server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { requireAdmin } from '@/lib/admin-auth';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { publishDevToArticle } from '@/lib/social-publishing';
import { reportUserError } from '@/lib/user-error';
import { start } from 'workflow/api';
import { runSocialPreparation } from '@/workflows/social-publishing';

export const runtime = 'nodejs';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await requireAdmin(request);
    if (!hasFirebaseAdminConfig()) return NextResponse.json({ error: 'Firebase indisponible.' }, { status: 503 });
    const body = await request.json() as { status?: string; action?: string; network?: string; scheduledFor?: string; title?: string; description?: string; article?: string };
    if (body.action === 'edit') {
      const reference = getAdminDb().collection('agent_drafts').doc(id);
      const document = await reference.get();
      if (!document.exists) return NextResponse.json({ error: 'Brouillon introuvable.' }, { status: 404 });
      const current = document.data() || {};
      if (!['draft', 'approved'].includes(String(current.status))) return NextResponse.json({ error: 'Seuls les brouillons modifiables peuvent être révisés.' }, { status: 409 });
      const title = String(body.title || '').trim();
      const description = String(body.description || '').trim();
      const article = String(body.article || '').trim();
      if (!title || !description || !article) return NextResponse.json({ error: 'Le titre, le résumé et le contenu sont obligatoires.' }, { status: 400 });
      await reference.update({ title: title.slice(0, 180), description: description.slice(0, 500), article, updatedAt: FieldValue.serverTimestamp() });
      return NextResponse.json({ id, title, description, article });
    }
    if (body.action === 'schedule') {
      const reference = getAdminDb().collection('agent_drafts').doc(id);
      const document = await reference.get();
      if (!document.exists) return NextResponse.json({ error: 'Brouillon introuvable.' }, { status: 404 });
      const draft = document.data() || {};
      if (draft.status !== 'approved') return NextResponse.json({ error: 'Le brouillon doit être approuvé avant programmation.' }, { status: 409 });

      const requestedDate = new Date(String(body.scheduledFor || ''));
      if (!Number.isFinite(requestedDate.getTime()) || requestedDate.getTime() <= Date.now()) {
        return NextResponse.json({ error: 'Choisis une date future pour la publication.' }, { status: 400 });
      }

      const slug = String(draft.slug || id).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '').slice(0, 90) || id;
      const articleReference = getAdminDb().collection('articles').doc(slug);
      const existingArticle = await articleReference.get();
      if (existingArticle.exists && existingArticle.data()?.sourceDraftId !== id) {
        return NextResponse.json({ error: 'Un article utilise déjà ce slug. Modifie le slug du brouillon avant de le programmer.' }, { status: 409 });
      }

      const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://jchub.dev').replace(/\/$/, '');
      const articleImage = `${siteUrl}/api/article-cover?title=${encodeURIComponent(String(draft.title || 'Article JcHub'))}&category=${encodeURIComponent(String(draft.promotion?.name || 'JcHub / Journal'))}`;
      const scheduledFor = Timestamp.fromDate(requestedDate);
      await articleReference.set({
        slug,
        title: String(draft.title || 'Article JcHub'),
        description: String(draft.description || ''),
        excerpt: String(draft.description || ''),
        content: String(draft.article || ''),
        category: 'Développement',
        keywords: ['développement', 'technologie'],
        tags: ['Développement', 'technologie'],
        author: 'JcHub',
        image: articleImage,
        readTime: '5 min',
        status: 'scheduled',
        scheduledFor,
        updatedAt: FieldValue.serverTimestamp(),
        sourceDraftId: id,
      }, { merge: true });
      await reference.update({ status: 'scheduled', publishedSlug: slug, scheduledFor, updatedAt: FieldValue.serverTimestamp() });
      return NextResponse.json({ id: id, status: 'scheduled', slug, scheduledFor: requestedDate.toISOString() });
    }
    if (body.action === 'publish-network') {
      const network = body.network;
      if (network !== 'devto') return NextResponse.json({ error: 'Seul Dev.to est disponible.' }, { status: 400 });
      const reference = getAdminDb().collection('agent_drafts').doc(id);
      const document = await reference.get();
      if (!document.exists) return NextResponse.json({ error: 'Brouillon introuvable.' }, { status: 404 });
      const draft = document.data() || {};
      if (draft.status !== 'published' || !draft.publishedSlug) return NextResponse.json({ error: 'Publie d’abord l’article sur JcHub.' }, { status: 409 });
      const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://jchub.dev').replace(/\/$/, '');
      const result = await publishDevToArticle({ title: String(draft.title || 'Article JcHub'), description: String(draft.description || ''), body: `${String(draft.posts?.devto || draft.description || '')}\n\n${String(draft.article || '')}`, canonicalUrl: `${siteUrl}/blog/${encodeURIComponent(String(draft.publishedSlug))}`, tags: Array.isArray(draft.keywords) ? draft.keywords.map(String) : ['development', 'technology'] });
      const currentResults = Array.isArray(draft.socialResults) ? draft.socialResults.filter((item: { network?: string }) => item.network !== network) : [];
      await reference.update({ socialResults: [...currentResults, result], updatedAt: FieldValue.serverTimestamp() });
      return NextResponse.json({ id: id, socialResult: result });
    }
    if (body.action === 'publish') {
      const reference = getAdminDb().collection('agent_drafts').doc(id);
      const document = await reference.get();
      if (!document.exists) return NextResponse.json({ error: 'Brouillon introuvable.' }, { status: 404 });
      const draft = document.data() || {};
      if (draft.status !== 'approved') return NextResponse.json({ error: 'Le brouillon doit être approuvé avant publication.' }, { status: 409 });
      const slug = String(draft.slug || id).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '').slice(0, 90) || id;
      const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://jchub.dev').replace(/\/$/, '');
      const articleImage = `${siteUrl}/api/article-cover?title=${encodeURIComponent(String(draft.title || 'Article JcHub'))}&category=${encodeURIComponent(String(draft.promotion?.name || 'JcHub / Journal'))}`;
      const articleReference = getAdminDb().collection('articles').doc(slug);
      await articleReference.set({
        slug,
        title: String(draft.title || 'Article JcHub'),
        description: String(draft.description || ''),
        excerpt: String(draft.description || ''),
        content: String(draft.article || ''),
        category: 'Développement',
        keywords: ['développement', 'technologie'],
        tags: ['Développement', 'technologie'],
        author: 'JcHub',
        image: articleImage,
        readTime: '5 min',
        status: 'published',
        publishedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        sourceDraftId: id,
      }, { merge: true });
      const socialResults = [await publishDevToArticle({
        title: String(draft.title || 'Article JcHub'),
        description: String(draft.description || ''),
        body: `${String(draft.posts?.devto || draft.description || '')}\n\n${String(draft.article || '')}`,
        canonicalUrl: `${siteUrl}/blog/${encodeURIComponent(slug)}`,
        tags: Array.isArray(draft.keywords) ? draft.keywords.map(String) : ['development', 'technology'],
      })];
      await reference.update({ status: 'published', publishedSlug: slug, socialResults, publishedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
      try { await start(runSocialPreparation, [slug]); }
      catch { reportUserError(); }
      return NextResponse.json({ id: id, status: 'published', slug, socialResults });
    }
    if (body.status !== 'approved' && body.status !== 'rejected') {
      return NextResponse.json({ error: 'Statut invalide.' }, { status: 400 });
    }
    const reference = getAdminDb().collection('agent_drafts').doc(id);
    const document = await reference.get();
    if (!document.exists) return NextResponse.json({ error: 'Brouillon introuvable.' }, { status: 404 });
    await reference.update({ status: body.status, updatedAt: FieldValue.serverTimestamp() });
    return NextResponse.json({ id: id, status: body.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur interne.';
    if (message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
    if (message === 'FORBIDDEN') return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
    reportUserError();
    return NextResponse.json({ error: 'Impossible de mettre à jour le brouillon.' }, { status: 500 });
  }
}
