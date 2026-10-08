import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAdmin } from '@/lib/admin-auth';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { tools as registeredTools } from '@/lib/tools';
import { getGa4ToolViews } from '@/lib/ga4';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const merged = new Map(registeredTools.map((tool) => [tool.slug, { ...tool, id: tool.slug, status: tool.status || 'published', views: 0 }]));
    if (hasFirebaseAdminConfig()) {
      const snapshot = await getAdminDb().collection('tools').get();
      for (const document of snapshot.docs) {
        const data = document.data();
        const slug = String(data.slug || document.id);
        if (!slug) continue;
        const base = merged.get(slug);
        merged.set(slug, {
          ...(base || { slug, tags: [], seo: { title: '', description: '', keywords: [] }, views: 0 }),
          ...data,
          slug,
          id: document.id,
          path: typeof data.path === 'string' ? data.path : base?.path,
          name: String(data.name || base?.name || 'Outil sans nom'),
          description: String(data.description ?? base?.description ?? ''),
          category: String(data.category || base?.category || 'Autre'),
          icon: String(data.icon || base?.icon || '🛠️'),
          tags: Array.isArray(data.tags) ? data.tags.map(String) : (base?.tags || []),
          component: String(data.component || base?.component || ''),
          status: ['draft', 'archived'].includes(String(data.status)) ? data.status : 'published',
          views: Number(data.views || base?.views || 0),
          seo: { title: String(data.seo?.title || base?.seo.title || data.name || ''), description: String(data.seo?.description || base?.seo.description || data.description || ''), keywords: Array.isArray(data.seo?.keywords) ? data.seo.keywords.map(String) : (base?.seo.keywords || []) },
        });
      }
    }
    const allTools = Array.from(merged.values());
    const paths = allTools.flatMap((tool) => [tool.path, `/outils/${tool.slug}`].filter((path): path is string => Boolean(path))).filter((path, index, all) => all.indexOf(path) === index);
    const analytics = await getGa4ToolViews(paths).catch(() => ({ configured: false, views: {} as Record<string, number> }));
    const result = allTools.map((tool) => ({ ...tool, views: analytics.views[tool.path || ''] ?? analytics.views[`/outils/${tool.slug}`] ?? Number(tool.views || 0) })).sort((a, b) => a.name.localeCompare(b.name));
    const components = registeredTools.map((tool) => tool.component).filter((component, index, all) => all.indexOf(component) === index);
    return NextResponse.json({ tools: result, viewsConfigured: analytics.configured, components });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'INTERNAL_ERROR';
    const status = code === 'FORBIDDEN' ? 403 : code === 'UNAUTHORIZED' || code === 'INVALID_TOKEN' ? 401 : 500;
    return NextResponse.json({ error: code === 'FORBIDDEN' ? 'Accès refusé.' : 'Accès administrateur requis.' }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    if (!hasFirebaseAdminConfig()) return NextResponse.json({ error: 'Firebase indisponible.' }, { status: 503 });
    const body = await request.json().catch(() => ({})) as { name?: string };
    const slug = `nouvel-outil-${Date.now()}`;
    const name = String(body.name || 'Nouvel outil').trim().slice(0, 100);
    const component = registeredTools[0]?.component || 'PasswordGenerator';
    await getAdminDb().collection('tools').doc(slug).set({ slug, name, description: '', category: 'Développement', icon: '🛠️', tags: [], component, status: 'draft', seo: { title: name, description: '', keywords: [] }, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    return NextResponse.json({ slug }, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'INTERNAL_ERROR';
    const status = code === 'FORBIDDEN' ? 403 : code === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ error: status === 401 ? 'Accès administrateur requis.' : 'Impossible de créer l’outil.' }, { status });
  }
}
