import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { completedWeeks } from '@/lib/cm-metrics';
import { getFacebookInsights, getFacebookPostInsights } from '@/lib/facebook-insights';
import { getInstagramPostInsights, getInstagramWeeklyInsights } from '@/lib/instagram-insights';
import { isCronBearerAuthorized } from '@/lib/social-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

type WeeklyMetrics = { followersStart: number | null; followersEnd: number | null; views: number | null; reach: number | null; interactions: number | null };

// Chaque lundi : la semaine précédente. ?weeks=N (1 à 12) remplit aussi l'historique, de la plus ancienne semaine à la plus récente.
export async function GET(request: NextRequest) {
  if (!isCronBearerAuthorized(request.headers.get('authorization'), process.env.CRON_SECRET)) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  const db = getAdminDb();
  const weeks = completedWeeks(new Date(), Number(request.nextUrl.searchParams.get('weeks') || 1));
  const results: Record<string, string> = {};
  // Abonnés en fin de semaine, pour enchaîner les semaines traitées dans ce même passage.
  const lastFollowers: Record<string, number | null> = {};

  for (let index = 0; index < weeks.length; index += 1) {
    const { start, end } = weeks[index];
    const latest = index === weeks.length - 1;
    const nextMonday = new Date(`${end}T00:00:00.000Z`); nextMonday.setUTCDate(nextMonday.getUTCDate() + 1);
    for (const platform of ['facebook', 'instagram'] as const) {
      const id = `${platform}_${start}`;
      try {
        // Facebook conserve l'historique des abonnés (page_follows); Instagram ne donne que le total actuel.
        const metrics: WeeklyMetrics = platform === 'facebook'
          ? await getFacebookInsights(process.env, { now: nextMonday }, 7).then((r) => ({
            followersStart: r.followersAtStart, followersEnd: r.followersAtEnd ?? (latest ? r.followers : null),
            views: r.views, reach: r.reach, interactions: r.engagements,
          }))
          : await getInstagramWeeklyInsights(process.env, fetch, nextMonday).then((r) => ({
            followersStart: null, followersEnd: latest ? r.followers : null,
            views: r.views, reach: r.reach, interactions: r.interactions,
          }));

        let previousFollowers = lastFollowers[platform];
        if (previousFollowers === undefined) {
          const previousStart = new Date(`${start}T00:00:00.000Z`); previousStart.setUTCDate(previousStart.getUTCDate() - 7);
          const previous = await db.collection('cmReports').doc(`${platform}_${previousStart.toISOString().slice(0, 10)}`).get();
          const value = previous.data()?.followersEnd;
          previousFollowers = typeof value === 'number' ? value : null;
        }

        const ref = db.collection('cmReports').doc(id);
        const existing = await ref.get();
        const priorData = existing.data() || {};
        await ref.set({
          weekStart: start, weekEnd: end, platform,
          followersStart: previousFollowers ?? metrics.followersStart ?? metrics.followersEnd,
          followersEnd: metrics.followersEnd,
          planned: Number(priorData.planned || 0), published: Number(priorData.published || 0),
          views: metrics.views, reach: metrics.reach, reactions: metrics.interactions,
          // Ces chiffres ne sont pas collectés : on garde ceux que le CM a saisis.
          comments: priorData.comments ?? null, shares: priorData.shares ?? null, saves: priorData.saves ?? null,
          clicks: priorData.clicks ?? null, bestPost: priorData.bestPost || '', bestPostUrl: priorData.bestPostUrl || '',
          observations: priorData.observations || '', source: 'meta', fetchedAt: new Date().toISOString(),
          ...(existing.exists ? {} : { createdAt: FieldValue.serverTimestamp() }), updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
        lastFollowers[platform] = metrics.followersEnd;
        results[id] = 'ok';
      } catch (error) {
        results[id] = error instanceof Error ? error.message : 'Collecte impossible.';
      }
    }
  }

  const publications = await db.collection('social_publications').where('status', '==', 'PUBLISHED').limit(30).get();
  const eligible = publications.docs.filter((doc) => { const post = doc.data(); return post.kitId && post.externalId && !post.dryRun && ['facebook', 'instagram'].includes(String(post.platform)); });
  for (let offset = 0; offset < eligible.length; offset += 5) {
    await Promise.all(eligible.slice(offset, offset + 5).map(async (doc) => {
      const post = doc.data();
      try {
        const metrics = post.platform === 'instagram'
          ? await getInstagramPostInsights(String(post.externalId))
          : await getFacebookPostInsights(String(post.externalId));
        await doc.ref.set({ insights: metrics, insightsFetchedAt: new Date().toISOString() }, { merge: true });
      } catch { /* A single post must not stop the weekly account report. */ }
    }));
  }
  return NextResponse.json({ weeks: weeks.map((week) => week.start), results, postsChecked: eligible.length }, { headers: { 'Cache-Control': 'no-store' } });
}

export const POST = GET;
