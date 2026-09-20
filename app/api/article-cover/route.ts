import { NextRequest } from 'next/server';

export const runtime = 'edge';

function escapeXml(value: string) {
  return value.replace(/[<>&'\"]/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[character] || character));
}

function wrapTitle(title: string) {
  const words = title.trim().split(/\s+/).slice(0, 18);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    if ((line + ' ' + word).trim().length > 28) { if (line) lines.push(line); line = word; } else line = `${line} ${word}`.trim();
  }
  if (line) lines.push(line);
  return lines.slice(0, 4);
}

export async function GET(request: NextRequest) {
  const title = request.nextUrl.searchParams.get('title') || 'Outils et idées pour développeurs';
  const category = request.nextUrl.searchParams.get('category') || 'JcHub / Journal';
  const lines = wrapTitle(title).map(escapeXml);
  const titleMarkup = lines.map((line, index) => `<text x="100" y="${285 + index * 58}" fill="#fff" font-family="Arial,sans-serif" font-size="46" font-weight="700">${line}</text>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#07142b"/><circle cx="1050" cy="80" r="280" fill="#2d67f6" opacity=".25"/><circle cx="90" cy="600" r="250" fill="#11a873" opacity=".18"/><path d="M0 510C220 420 410 620 670 490s370-60 530 10v130H0Z" fill="#2d67f6" opacity=".2"/><rect x="100" y="82" width="88" height="88" rx="20" fill="#2d67f6"/><text x="144" y="145" text-anchor="middle" fill="#fff" font-family="Arial,sans-serif" font-size="52" font-weight="700">J</text><text x="220" y="140" fill="#b9c9e8" font-family="Arial,sans-serif" font-size="24" font-weight="700">${escapeXml(category).toUpperCase()}</text>${titleMarkup}<text x="100" y="535" fill="#b9c9e8" font-family="Arial,sans-serif" font-size="24">jchub.dev · outils, ressources et workflows utiles</text></svg>`;
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } });
}
