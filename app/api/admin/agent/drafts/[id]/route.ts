import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAdmin } from '@/lib/admin-auth';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { publishToNetwork, publishToSocialNetworks, type SocialNetwork } from '@/lib/social-publishing';
import { reportUserError } from '@/lib/user-error';

export const runtime = 'nodejs';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin(request);
    if (!hasFirebaseAdminConfig()) return NextResponse.json({ error: 'Firebase indisponible.' }, { status: 503 });
    const body = await request.json() as { status?: string; action?: string };
    if (body.action === 'publish-network') {
      const network = (body as { network?: string }).network;
      if (network !== 'x' && network !== 'linkedin' && network !== 'devto') return NextResponse.json({ error: 'Réseau invalide.' }, { status: 400 });
      const reference = getAdminDb().collection('agent_drafts').doc(params.id);
      const document = await reference.get();
      if (!document.exists) return NextResponse.json({ error: 'Brouillon introuvable.' }, { status: 404 });
      const draft = document.data() || {};
      if (draft.status !== 'published' || !draft.publishedSlug) return NextResponse.json({ error: 'Publie d’abord l’article sur JcHub.' }, { status: 409 });
      const result = await publishToNetwork(network as SocialNetwork, { title: String(draft.title || 'Article JcHub'), description: String(draft.description || ''), article: String(draft.article || ''), xText: String(draft.posts?.x || draft.description || ''), linkedinText: String(draft.posts?.linkedin || draft.description || ''), devtoText: String(draft.posts?.devto || draft.description || ''), slug: String(draft.publishedSlug), keywords: Array.isArray(draft.keywords) ? draft.keywords.map(String) : ['development', 'technology'] });
      const currentResults = Array.isArray(draft.socialResults) ? draft.socialResults.filter((item: { network?: string }) => item.network !== network) : [];
      await reference.update({ socialResults: [...currentResults, result], updatedAt: FieldValue.serverTimestamp() });
      return NextResponse.json({ id: params.id, socialResult: result });
    }
    if (body.action === 'publish') {
      const reference = getAdminDb().collection('agent_drafts').doc(params.id);
      const document = await reference.get();
      if (!document.exists) return NextResponse.json({ error: 'Brouillon introuvable.' }, { status: 404 });
      const draft = document.data() || {};
      if (draft.status !== 'approved') return NextResponse.json({ error: 'Le brouillon doit être approuvé avant publication.' }, { status: 409 });
      const slug = String(draft.slug || params.id).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '').slice(0, 90) || params.id;
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
        sourceDraftId: params.id,
      }, { merge: true });
      const socialResults = await publishToSocialNetworks({
        title: String(draft.title || 'Article JcHub'),
        description: String(draft.description || ''),
        article: String(draft.article || ''),
        xText: String(draft.posts?.x || draft.description || ''),
        linkedinText: String(draft.posts?.linkedin || draft.description || ''),
        devtoText: String(draft.posts?.devto || draft.description || ''),
        slug,
        keywords: Array.isArray(draft.keywords) ? draft.keywords.map(String) : ['development', 'technology'],
      });
      await reference.update({ status: 'published', publishedSlug: slug, socialResults, publishedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
      return NextResponse.json({ id: params.id, status: 'published', slug, socialResults });
    }
    if (body.status !== 'approved' && body.status !== 'rejected') {
      return NextResponse.json({ error: 'Statut invalide.' }, { status: 400 });
    }
    const reference = getAdminDb().collection('agent_drafts').doc(params.id);
    const document = await reference.get();
    if (!document.exists) return NextResponse.json({ error: 'Brouillon introuvable.' }, { status: 404 });
    await reference.update({ status: body.status, updatedAt: FieldValue.serverTimestamp() });
    return NextResponse.json({ id: params.id, status: body.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur interne.';
    if (message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
    if (message === 'FORBIDDEN') return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
    reportUserError();
    return NextResponse.json({ error: 'Impossible de mettre à jour le brouillon.' }, { status: 500 });
  }
}