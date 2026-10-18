import { NextRequest } from 'next/server';
import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function truncate(value: string, maxLength: number) {
  const clean = value.trim().replace(/\s+/g, ' ');
  return clean.length > maxLength ? `${clean.slice(0, maxLength - 1).trimEnd()}…` : clean;
}

/**
 * Shared 1200×630 social card. Without parameters it is the site-wide default image.
 * Uses next/og's bundled font: system fonts such as Arial do not exist on Vercel,
 * which previously produced cards with no text at all.
 */
export async function GET(request: NextRequest) {
  const english = request.nextUrl.searchParams.get('lang') === 'en';
  const title = truncate(request.nextUrl.searchParams.get('title') || (english ? 'Free, practical tools for developers' : 'Outils pratiques et gratuits pour développeurs'), 110);
  const category = truncate(request.nextUrl.searchParams.get('category') || 'JcHub', 45).toUpperCase();
  const titleSize = title.length > 70 ? 52 : title.length > 40 ? 62 : 72;

  return new ImageResponse(
    (
      <div style={{ position: 'relative', display: 'flex', width: '100%', height: '100%', background: '#07142b' }}>
        <div style={{ position: 'absolute', left: 770, top: -200, width: 560, height: 560, borderRadius: 9999, background: 'rgba(45, 103, 246, 0.25)' }} />
        <div style={{ position: 'absolute', left: -160, top: 350, width: 500, height: 500, borderRadius: 9999, background: 'rgba(17, 168, 115, 0.18)' }} />
        <svg style={{ position: 'absolute', left: 0, bottom: 0 }} width="1200" height="210" viewBox="0 420 1200 210">
          <path d="M0 510 C220 420 410 620 670 490 C900 430 1040 460 1200 500 L1200 630 L0 630 Z" fill="rgba(45, 103, 246, 0.20)" />
        </svg>

        <div style={{ display: 'flex', flexDirection: 'column', padding: '82px 100px 0', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 88, height: 88, borderRadius: 20, background: '#2d67f6', color: '#ffffff', fontSize: 52 }}>J</div>
            <div style={{ display: 'flex', color: '#b9c9e8', fontSize: 26, letterSpacing: 2 }}>{category}</div>
          </div>
          <div style={{ display: 'flex', marginTop: 70, color: '#ffffff', fontSize: titleSize, lineHeight: 1.15, letterSpacing: -1, maxWidth: 1000 }}>{title}</div>
          <div style={{ display: 'flex', position: 'absolute', left: 100, top: 505, color: '#b9c9e8', fontSize: 26 }}>{english ? 'jchub.dev · useful tools, resources and workflows' : 'jchub.dev · outils, ressources et workflows utiles'}</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        'CDN-Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
        'X-Content-Type-Options': 'nosniff',
      },
    },
  );
}
