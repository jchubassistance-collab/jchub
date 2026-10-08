import { FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { getPublishedTools } from '@/lib/tools';
import { reportUserError } from '@/lib/user-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type AuditFinding = { type: 'stale' | 'duplicate' | 'broken-link'; title: string; detail: string };

function normalizeTitle(value: string) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    if (!hasFirebaseAdminConfig()) return NextResponse.json({ error: 'Firebase indisponible.' }, { status: 503 });

    const db = getAdminDb();
    const [articlesSnapshot, publishedTools] = await Promise.all([
      db.collection('articles').get(),
      getPublishedTools(),
    ]);
    const articles = articlesSnapshot.docs.map((document) => ({ id: document.id, data: document.data() }));
    const publishedArticles = articles.filter((article) => article.data.status === 'published');
    const knownBlogSlugs = new Set(publishedArticles.map((article) => String(article.data.slug || article.id)));
    const knownToolSlugs = new Set(publishedTools.map((tool) => tool.slug));
    const findings: AuditFinding[] = [];
    const titles = new Map<string, string>();
    const staleBefore = Date.now() - 365 * 24 * 60 * 60 * 1000;

    for (const article of publishedArticles) {
      const title = String(article.data.title || 'Article sans titre');
      const normalized = normalizeTitle(title);
      const previous = titles.get(normalized);
      if (normalized && previous) findings.push({ type: 'duplicate', title, detail: `Titre très proche d’un contenu existant : « ${previous} ».` });
      else if (normalized) titles.set(normalized, title);

      const updated = article.data.updatedAt?.toDate?.() || article.data.publishedAt?.toDate?.();
      if (updated instanceof Date && updated.getTime() < staleBefore) {
        findings.push({ type: 'stale', title, detail: `Dernière mise à jour il y a plus d’un an (${updated.toLocaleDateString('fr-FR')}). À relire pour vérifier que les informations sont encore actuelles.` });
      }

      const content = String(article.data.content || '');
      const linkPattern = /\]\((\/(?:blog|outils)\/[^)?#\s]+)(?:#[^)\s]*)?\)/g;
      let match: RegExpExecArray | null;
      while ((match = linkPattern.exec(content)) !== null) {
        const path = match[1];
        const parts = path.split('/').filter(Boolean);
        let slug = parts[parts.length - 1] || '';
        try { slug = decodeURIComponent(slug); } catch { /* Keep malformed slugs visible as broken links. */ }
        const known = path.startsWith('/blog/') ? knownBlogSlugs.has(slug) : knownToolSlugs.has(slug);
        if (!known) findings.push({ type: 'broken-link', title, detail: `Lien interne à vérifier : ${path}` });
      }
    }

    const report = {
      checkedArticles: publishedArticles.length,
      checkedTools: knownToolSlugs.size,
      findings,
      createdAt: FieldValue.serverTimestamp(),
    };
    const saved = await db.collection('agent_audits').add(report);
    return NextResponse.json({ id: saved.id, checkedArticles: report.checkedArticles, checkedTools: report.checkedTools, findings });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    if (code === 'UNAUTHORIZED') return NextResponse.json({ error: 'Authentification administrateur requise.' }, { status: 401 });
    if (code === 'FORBIDDEN') return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
    reportUserError();
    return NextResponse.json({ error: 'L’audit du contenu a échoué.' }, { status: 500 });
  }
}
