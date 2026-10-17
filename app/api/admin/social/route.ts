import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { getPublishedArticles } from '@/lib/blog';
import { defaultSocialSettings, getSocialSettings, listPublications, saveSocialSettings } from '@/lib/social-publications-store';
import { getSocialPlatformReadiness } from '@/lib/social-readiness';
import { SOCIAL_PLATFORMS, type SocialPlatform } from '@/lib/social-types';
import { getFacebookAppId, getFacebookAppSecret, getFacebookRedirectUri } from '@/lib/facebook-oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const settingsSchema = z.object({
  linkedinEnabled: z.boolean(), facebookEnabled: z.boolean(), githubEnabled: z.boolean(),
  autoPublish: z.boolean(), dryRun: z.boolean(), timezone: z.string().trim().min(1).max(80),
}).strict();

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const [settings, publications, articles] = await Promise.all([getSocialSettings(), listPublications(), getPublishedArticles()]);
    const activeSettings = settings || defaultSocialSettings();
    const credentialReadiness = Object.fromEntries(SOCIAL_PLATFORMS.map((platform) => [
      platform,
      getSocialPlatformReadiness(platform, activeSettings),
    ])) as Record<SocialPlatform, ReturnType<typeof getSocialPlatformReadiness>>;
    const facebookOAuthMissing = process.env.NODE_ENV === 'production'
      ? ['Connexion OAuth Meta disponible uniquement en local.']
      : [
        ...(!getFacebookAppId(process.env) || getFacebookAppId(process.env).toLowerCase().includes('demo') ? ['FACEBOOK_APP_ID ou META_APP_ID'] : []),
        ...(!getFacebookAppSecret(process.env) || getFacebookAppSecret(process.env).toLowerCase().includes('demo') ? ['FACEBOOK_APP_SECRET ou META_APP_SECRET'] : []),
        ...(!process.env.FACEBOOK_REDIRECT_URI?.trim() && !process.env.META_REDIRECT_URI?.trim() ? ['FACEBOOK_REDIRECT_URI'] : []),
      ];
    if (facebookOAuthMissing.length === 0) {
      try { getFacebookRedirectUri(process.env); }
      catch { facebookOAuthMissing.push('FACEBOOK_REDIRECT_URI invalide'); }
    }
    return NextResponse.json({
      settings: activeSettings,
      credentialReadiness,
      linkedinOAuthAvailable: process.env.NODE_ENV !== 'production' && Boolean(process.env.LINKEDIN_CLIENT_ID?.trim() && process.env.LINKEDIN_CLIENT_SECRET?.trim() && process.env.LINKEDIN_REDIRECT_URI?.trim()),
      facebookOAuthAvailable: facebookOAuthMissing.length === 0,
      facebookOAuthMissing,
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
