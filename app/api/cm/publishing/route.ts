import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin, requireCmActor } from '@/lib/admin-auth';
import { cmError, requireSameOrigin } from '@/lib/cm-server';
import { getFacebookAppId, getFacebookAppSecret, getFacebookRedirectUri } from '@/lib/facebook-oauth';
import { getSocialSettings, saveSocialSettings } from '@/lib/social-publications-store';
import { getSocialPlatformReadiness } from '@/lib/social-readiness';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const settingsSchema = z.object({
  linkedinEnabled: z.boolean(), facebookEnabled: z.boolean(), instagramEnabled: z.boolean(), githubEnabled: z.boolean(),
  autoPublish: z.boolean(), dryRun: z.boolean(), timezone: z.string().trim().min(1).max(80),
}).strict();

function facebookOAuthMissing(): string[] {
  if (process.env.NODE_ENV === 'production') return ['Connexion OAuth Meta disponible uniquement en local.'];
  const appId = getFacebookAppId(process.env);
  const appSecret = getFacebookAppSecret(process.env);
  const missing = [
    ...(!appId || appId.toLowerCase().includes('demo') ? ['FACEBOOK_APP_ID ou META_APP_ID'] : []),
    ...(!appSecret || appSecret.toLowerCase().includes('demo') ? ['FACEBOOK_APP_SECRET ou META_APP_SECRET'] : []),
    ...(!process.env.FACEBOOK_REDIRECT_URI?.trim() && !process.env.META_REDIRECT_URI?.trim() ? ['FACEBOOK_REDIRECT_URI'] : []),
  ];
  if (missing.length === 0) {
    try { getFacebookRedirectUri(process.env); } catch { missing.push('FACEBOOK_REDIRECT_URI invalide'); }
  }
  return missing;
}

// État de publication des kits (Facebook, Instagram) pour le CM; connexion Meta en plus pour les administrateurs.
export async function GET(request: NextRequest) {
  try {
    const { isAdmin } = await requireCmActor(request);
    const settings = await getSocialSettings();
    const missing = isAdmin ? facebookOAuthMissing() : [];
    return NextResponse.json({
      isAdmin,
      settings,
      readiness: { facebook: getSocialPlatformReadiness('facebook', settings), instagram: getSocialPlatformReadiness('instagram', settings) },
      ...(isAdmin ? { facebookOAuthAvailable: missing.length === 0, facebookOAuthMissing: missing } : {}),
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return cmError(error); }
}

// Réglages sensibles (réseaux actifs, mode test, publication automatique) : administrateurs seulement.
export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin(request); requireSameOrigin(request);
    const parsed = settingsSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Paramètres invalides.' }, { status: 400 });
    try { new Intl.DateTimeFormat('fr-FR', { timeZone: parsed.data.timezone }); }
    catch { return NextResponse.json({ error: 'Fuseau horaire invalide.' }, { status: 400 }); }
    await saveSocialSettings(parsed.data);
    return NextResponse.json({ settings: parsed.data });
  } catch (error) { return cmError(error); }
}
