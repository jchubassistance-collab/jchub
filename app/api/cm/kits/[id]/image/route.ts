import path from 'node:path';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { NextRequest, NextResponse } from 'next/server';
import { requireCm } from '@/lib/admin-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { cmError } from '@/lib/cm-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function wrap(ctx: ReturnType<ReturnType<typeof createCanvas>['getContext']>, value: string, maxWidth: number, maxLines: number) {
  const words = value.trim().split(/\s+/).slice(0, 50);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(candidate).width > maxWidth) { lines.push(line); line = word; }
    else line = candidate;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] = `${lines[maxLines - 1].slice(0, 32).trimEnd()}…`; }
  return lines;
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireCm(request);
    const { id } = await context.params;
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) return NextResponse.json({ error: 'Kit invalide.' }, { status: 400 });
    const doc = await getAdminDb().collection('cmKits').doc(id).get();
    if (!doc.exists) return NextResponse.json({ error: 'Kit introuvable.' }, { status: 404 });
    const kit = doc.data()!;
    const story = request.nextUrl.searchParams.get('format') === 'story';
    const width = 1080, height = story ? 1920 : 1350;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#07142b'); gradient.addColorStop(.58, '#123c70'); gradient.addColorStop(1, '#087b73');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(52, 126, 255, .23)'; ctx.beginPath(); ctx.arc(width * .92, height * .12, width * .52, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(46, 221, 176, .16)'; ctx.beginPath(); ctx.arc(width * .05, height * .86, width * .48, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 2; ctx.strokeRect(42, 42, width - 84, height - 84);

    const logo = await loadImage(path.join(process.cwd(), 'public', 'jchub-icon-192.png'));
    ctx.drawImage(logo, 94, 106, 96, 96);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.font = '700 38px Arial'; ctx.fillText('JcHub', 212, 168);
    ctx.fillStyle = '#d5e6ff'; ctx.font = '700 19px Arial'; ctx.letterSpacing = '3px';
    ctx.fillText(kit.kind === 'tool' ? 'OUTIL À DÉCOUVRIR' : 'À LIRE SUR JCHUB', 96, 295);

    const title = String(kit.imageTitle || kit.title || 'Une nouveauté JcHub').slice(0, 100);
    ctx.fillStyle = '#fff'; ctx.font = story ? '700 76px Arial' : '700 68px Arial'; ctx.letterSpacing = '0px';
    const titleLines = wrap(ctx, title, width - 192, story ? 5 : 4);
    const titleY = story ? 730 : 610;
    titleLines.forEach((line, i) => ctx.fillText(line, 96, titleY + i * (story ? 94 : 84)));

    const subtitle = String(kit.imageSubtitle || kit.description || '').slice(0, 220);
    ctx.fillStyle = '#dce8f8'; ctx.font = story ? '400 34px Arial' : '400 30px Arial';
    const subtitleLines = wrap(ctx, subtitle, width - 192, 4);
    const subY = titleY + titleLines.length * (story ? 94 : 84) + 36;
    subtitleLines.forEach((line, i) => ctx.fillText(line, 96, subY + i * (story ? 48 : 44)));

    const pillY = height - (story ? 310 : 250);
    ctx.fillStyle = '#b7f5df'; ctx.beginPath(); ctx.roundRect(96, pillY, story ? 500 : 420, 72, 36); ctx.fill();
    ctx.fillStyle = '#07352f'; ctx.font = '700 25px Arial'; ctx.fillText('À découvrir sur JcHub  →', 126, pillY + 46);
    ctx.fillStyle = 'rgba(255,255,255,.72)'; ctx.font = '400 19px Arial'; ctx.fillText('jchub.dev', 96, height - 105);
    const png = await canvas.encode('png');
    const safeSlug = String(kit.slug || 'publication').replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 60);
    return new NextResponse(new Uint8Array(png), { headers: { 'Content-Type': 'image/png', 'Content-Disposition': `attachment; filename="jchub-${safeSlug}-${story ? 'story' : 'post'}.png"`, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
  } catch (error) { return cmError(error); }
}
