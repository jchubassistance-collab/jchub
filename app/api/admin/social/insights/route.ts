import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { FacebookInsightsError, getFacebookInsights } from '@/lib/facebook-insights';
import { getGitHubInsights, GitHubInsightsError } from '@/lib/github-insights';
import { getSocialSettings } from '@/lib/social-publications-store';
import { getSocialPlatformReadiness } from '@/lib/social-readiness';
import { reportUserError } from '@/lib/user-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getFacebookResult(configured: boolean, missing: string[]) {
  if (!configured) return { error: `Configuration manquante : ${missing.join(', ')}.` };
  try {
    return { report: await getFacebookInsights() };
  } catch (error) {
    if (error instanceof FacebookInsightsError) return { error: error.message };
    reportUserError();
    return { error: 'Lecture des statistiques Meta impossible.' };
  }
}

async function getGitHubResult(configured: boolean, missing: string[]) {
  if (!configured) return { error: `Configuration manquante : ${missing.join(', ')}.` };
  try {
    return { report: await getGitHubInsights() };
  } catch (error) {
    if (error instanceof GitHubInsightsError) return { error: error.message };
    reportUserError();
    return { error: 'Lecture des statistiques GitHub impossible.' };
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const settings = await getSocialSettings();
    const facebookReadiness = getSocialPlatformReadiness('facebook', settings);
    const githubReadiness = getSocialPlatformReadiness('github', settings);
    const [facebook, github] = await Promise.all([
      getFacebookResult(facebookReadiness.configured, facebookReadiness.missing),
      getGitHubResult(githubReadiness.configured, githubReadiness.missing),
    ]);
    return NextResponse.json({ facebook, github }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const status = code === 'UNAUTHORIZED' ? 401 : code === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({
      error: code === 'UNAUTHORIZED' ? 'Authentification administrateur requise.' : code === 'FORBIDDEN' ? 'Accès refusé.' : 'Lecture des statistiques sociales impossible.',
    }, { status, headers: { 'Cache-Control': 'no-store' } });
  }
}
