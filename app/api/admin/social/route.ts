import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { getPublishedArticles } from '@/lib/blog';
import { defaultSocialSettings, getSocialSettings, listPublications, saveSocialSettings } from '@/lib/social-publications-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const settingsSchema = z.object({
  linkedinEnabled: z.boolean(), facebookEnabled: z.boolean(), githubEnabled: z.boolean(),
  autoPublish: z.boolean(), dryRun: z.boolean(), timezone: z.string().trim().min(1).max(80),
}).strict();

function credentialReadiness() {
  return {
    linkedin: Boolean(process.env.LINKEDIN_ACCESS_TOKEN?.trim() && process.env.LINKEDIN_AUTHOR_URN?.trim()),
    facebook: Boolean(process.env.FACEBOOK_ACCESS_TOKEN?.trim() && process.env.FACEBOOK_PAGE_ID?.trim()),
    github: Boolean(process.env.GITHUB_TOKEN?.trim()),
  };
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const [settings, publications, articles] = await Promise.all([getSocialSettings(), listPublications(), getPublishedArticles()]);
    return NextResponse.json({
      settings: settings || defaultSocialSettings(),
      credentialReadiness: credentialReadiness(),
      linkedinOAuthAvailable: process.env.NODE_ENV !== 'production' && Boolean(process.env.LINKEDIN_CLIENT_ID?.trim() && process.env.LINKEDIN_REDIRECT_URI?.trim()),
      facebookOAuthAvailable: process.env.NODE_ENV !== 'production' && Boolean(process.env.FACEBOOK_APP_ID?.trim() && process.env.FACEBOOK_REDIRECT_URI?.trim() && process.env.FACEBOOK_GRAPH_API_VERSION?.trim()),
      publications,
      articles: articles.map((article) => ({ id: article.slug, title: article.title, url: `/blog/${encodeURIComponent(article.slug)}` })),
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    return NextResponse.json({ error: code === 'FORBIDDEN' ? 'Accès refusé.' : 'Authentification administrateur requise.' }, { status: code === 'FORBIDDEN' ? 403 : code === 'UNAUTHORIZED' ? 401 : 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin(request);
    const parsed = settingsSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Paramètres invalides.' }, { status: 400 });
    try { new Intl.DateTimeFormat('fr-FR', { timeZone: parsed.data.timezone }); }
    catch { return NextResponse.json({ error: 'Fuseau horaire invalide.' }, { status: 400 }); }
    await saveSocialSettings(parsed.data);
    return NextResponse.json({ settings: parsed.data });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    return NextResponse.json({ error: code === 'FORBIDDEN' ? 'Accès refusé.' : 'Impossible d’enregistrer les paramètres.' }, { status: code === 'FORBIDDEN' ? 403 : code === 'UNAUTHORIZED' ? 401 : 500 });
  }
}
