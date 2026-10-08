import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAdmin } from '@/lib/admin-auth';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { tools as registeredTools } from '@/lib/tools';

export const runtime = 'nodejs';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await requireAdmin(request);
    if (!hasFirebaseAdminConfig()) return NextResponse.json({ error: 'Firebase indisponible.' }, { status: 503 });
    const { slug: id } = await params;
    const db = getAdminDb();
    const reference = db.collection('tools').doc(id);
    const snapshot = await reference.get();
    const existingData = snapshot.data() || {};
    const current = registeredTools.find((tool) => tool.slug === id) || existingData;
    if (!current?.slug) return NextResponse.json({ error: 'Outil introuvable.' }, { status: 404 });
    const body = await request.json() as { slug?: string; name?: string; description?: string; category?: string; icon?: string; component?: string; status?: string; tags?: string[]; seoTitle?: string; seoDescription?: string; seoKeywords?: string };
    const nextSlug = body.slug === undefined ? String(existingData.slug || id) : String(body.slug).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '').slice(0, 90);
    if (!nextSlug) return NextResponse.json({ error: 'Le slug est invalide.' }, { status: 400 });
    if (registeredTools.some((tool) => tool.slug === id) && nextSlug !== id) return NextResponse.json({ error: 'Le slug des outils intégrés ne peut pas être changé.' }, { status: 400 });
    const component = String(body.component || existingData.component || current.component || '');
    if (body.status === 'published' && !registeredTools.some((tool) => tool.component === component)) return NextResponse.json({ error: 'Associe cet outil à un composant fonctionnel avant de le publier.' }, { status: 400 });
    if (body.status !== undefined && !['draft', 'published', 'archived'].includes(body.status)) return NextResponse.json({ error: 'Statut invalide.' }, { status: 400 });
    const duplicate = await db.collection('tools').where('slug', '==', nextSlug).get();
    if (duplicate.docs.some((doc) => doc.id !== id)) return NextResponse.json({ error: 'Ce slug est déjà utilisé.' }, { status: 409 });
    const name = String(body.name ?? existingData.name ?? current.name).trim().slice(0, 100);
    const description = String(body.description ?? existingData.description ?? current.description).trim().slice(0, 500);
    const category = String(body.category ?? existingData.category ?? current.category).trim().slice(0, 80);
    const seoTitle = String(body.seoTitle ?? existingData.seo?.title ?? current.seo?.title ?? name).trim().slice(0, 160);
    const seoDescription = String(body.seoDescription ?? existingData.seo?.description ?? current.seo?.description ?? description).trim().slice(0, 300);
    const seoKeywords = body.seoKeywords === undefined ? (existingData.seo?.keywords || current.seo?.keywords || []) : String(body.seoKeywords).split(',').map((item) => item.trim()).filter(Boolean).slice(0, 20);
    const status = body.status || existingData.status || current.status || 'published';
    const path = String(existingData.path || current.path || '');
    await reference.set({
      slug: nextSlug,
      name,
      description,
      category,
      icon: String(body.icon ?? existingData.icon ?? current.icon ?? '🛠️').slice(0, 12),
      component,
      tags: body.tags ? body.tags.map((tag) => String(tag).trim()).filter(Boolean) : (existingData.tags || current.tags || []),
      status,
      ...(path && path.startsWith('/outils/') ? { path: `/outils/${nextSlug}` } : path ? { path } : {}),
      seo: { title: seoTitle, description: seoDescription, keywords: seoKeywords },
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    return NextResponse.json({ id, slug: nextSlug, status });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'INTERNAL_ERROR';
    const status = code === 'FORBIDDEN' ? 403 : code === 'UNAUTHORIZED' || code === 'INVALID_TOKEN' ? 401 : 500;
    return NextResponse.json({ error: status === 401 ? 'Accès administrateur requis.' : 'Impossible de modifier cet outil.' }, { status });
  }
}
