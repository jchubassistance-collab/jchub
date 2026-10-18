import 'server-only';

import { readFile } from 'node:fs/promises';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import type { CSSProperties, ReactNode } from 'react';
import type { SocialVisual, VisualTone } from '@/lib/social-copy';

// Polices et logo lus une seule fois, à la première image (voir la doc Next « Using Node.js runtime with local assets »).
const asset = (path: string) => readFile(join(process.cwd(), path));
type CardFont = { name: string; data: Buffer; weight: 400 | 600 | 800; style: 'normal' };
let assets: Promise<{ fonts: CardFont[]; logoSrc: string }> | null = null;
function loadAssets() {
  assets ??= Promise.all([
    asset('assets/fonts/inter-latin-400-normal.woff'),
    asset('assets/fonts/inter-latin-600-normal.woff'),
    asset('assets/fonts/inter-latin-800-normal.woff'),
    asset('assets/fonts/jetbrains-mono-latin-400-normal.woff'),
    asset('assets/fonts/jetbrains-mono-latin-600-normal.woff'),
    asset('public/jchub-icon-192.png'),
  ]).then(([interRegular, interSemiBold, interExtraBold, monoRegular, monoSemiBold, logo]) => ({
    logoSrc: `data:image/png;base64,${logo.toString('base64')}`,
    fonts: [
      { name: 'Inter', data: interRegular, weight: 400, style: 'normal' },
      { name: 'Inter', data: interSemiBold, weight: 600, style: 'normal' },
      { name: 'Inter', data: interExtraBold, weight: 800, style: 'normal' },
      { name: 'JetBrains Mono', data: monoRegular, weight: 400, style: 'normal' },
      { name: 'JetBrains Mono', data: monoSemiBold, weight: 600, style: 'normal' },
    ],
  }));
  return assets;
}

export type SocialCardFormat = 'landscape' | 'portrait';
// footer : pastilles du bas, la première sur fond foncé (ex. temps de lecture, puis l'adresse du site).
export type SocialCardInput = { title: string; subtitle: string; badge: string; footer: string[]; diagram: SocialVisual['diagram'] | null };
type FlowBlocks = Extract<SocialVisual['diagram'], { kind: 'flow' }>['blocks'];
type StepItems = Extract<SocialVisual['diagram'], { kind: 'steps' }>['items'];

const INK = '#0b1f44';
const MUTED = '#475569';
const MONO = 'JetBrains Mono';
const TONES: Record<VisualTone, { solid: string; glow: string }> = {
  blue: { solid: '#2563eb', glow: 'rgba(37, 99, 235, 0.32)' },
  green: { solid: '#16a34a', glow: 'rgba(22, 163, 74, 0.32)' },
  red: { solid: '#dc2626', glow: 'rgba(220, 38, 38, 0.32)' },
  violet: { solid: '#7c3aed', glow: 'rgba(124, 58, 237, 0.32)' },
  amber: { solid: '#d97706', glow: 'rgba(217, 119, 6, 0.32)' },
  slate: { solid: '#334155', glow: 'rgba(51, 65, 85, 0.32)' },
};
// Paysage : schéma en ligne comme une couverture d'article. Portrait (Instagram) : schéma empilé, lisible sur téléphone.
const FORMATS = {
  landscape: { width: 1200, height: 630, padX: 80, padY: 34, logo: 54, brand: 27, badge: 15, titles: [50, 42, 34], subtitle: 22, gap: 22, pill: 15 },
  portrait: { width: 1080, height: 1350, padX: 60, padY: 64, logo: 78, brand: 38, badge: 21, titles: [72, 62, 52], subtitle: 32, gap: 40, pill: 23 },
};

// Les polices embarquées couvrent le latin : on remplace les flèches courantes et on retire emojis et symboles exotiques.
export function cardText(value: string, max = 400): string {
  const text = value.replace(/\u2192|\u27F6/g, '->').replace(/\u2190/g, '<-').replace(/\u21D2/g, '=>')
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')
    .replace(/[^\u0000-\u024F\u2000-\u206F\u20AC\u2122\u2212]/g, '')
    .replace(/[ \t]+$/g, '');
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

const row = (style: CSSProperties = {}): CSSProperties => ({ display: 'flex', ...style });
const column = (style: CSSProperties = {}): CSSProperties => ({ display: 'flex', flexDirection: 'column', ...style });
const dot = (color: string, size: number) => <div style={{ width: size, height: size, borderRadius: 99, background: color }} />;
const codeLine = (line: string, max: number, style: CSSProperties) => <div style={{ fontFamily: MONO, lineHeight: 1.42, whiteSpace: 'pre', ...style }}>{cardText(line, max) || ' '}</div>;
const panel: CSSProperties = { background: 'rgba(255, 255, 255, 0.16)', border: '1px solid rgba(255, 255, 255, 0.28)' };

function FlowRow({ blocks, width }: { blocks: FlowBlocks; width: number }) {
  const connector = 44;
  const cap = blocks.length === 2 ? 420 : blocks.length === 3 ? 320 : 240;
  const blockWidth = Math.min(cap, (width - connector * (blocks.length - 1)) / blocks.length);
  const items: ReactNode[] = [];
  blocks.forEach((block, index) => {
    const tone = TONES[block.tone];
    if (index > 0) {
      items.push(<div key={`c${index}`} style={row({ width: connector, alignItems: 'center', justifyContent: 'center', gap: 5 })}>{dot(TONES[blocks[index - 1].tone].solid, 7)}{dot(tone.solid, 7)}</div>);
    }
    items.push(
      <div key={`b${index}`} style={column({ width: blockWidth, background: tone.solid, borderRadius: 16, padding: 9, boxShadow: `0 12px 28px ${tone.glow}` })}>
        <div style={row({ justifyContent: 'center', color: '#ffffff', fontSize: 18, fontWeight: 600, padding: '3px 0 9px' })}>{cardText(block.label, 18)}</div>
        <div style={column({ ...panel, flexGrow: 1, minHeight: 132, borderRadius: 10, padding: 12 })}>
          {block.lines.map((line, lineIndex) => <div key={lineIndex} style={row()}>{codeLine(line, 44, { fontSize: 14, color: '#ffffff' })}</div>)}
        </div>
      </div>,
    );
  });
  return <div style={row({ alignItems: 'stretch', justifyContent: 'center' })}>{items}</div>;
}

function FlowStack({ blocks, width }: { blocks: FlowBlocks; width: number }) {
  const fontSize = blocks.length === 2 ? 24 : blocks.length === 3 ? 22 : 18;
  const items: ReactNode[] = [];
  blocks.forEach((block, index) => {
    const tone = TONES[block.tone];
    if (index > 0) {
      items.push(<div key={`c${index}`} style={row({ height: 26, alignItems: 'center', justifyContent: 'center', gap: 7 })}>{dot(TONES[blocks[index - 1].tone].solid, 9)}{dot(tone.solid, 9)}</div>);
    }
    items.push(
      <div key={`b${index}`} style={row({ width, background: tone.solid, borderRadius: 20, padding: 12, gap: 12, boxShadow: `0 14px 30px ${tone.glow}` })}>
        <div style={row({ width: 210, alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: 28, fontWeight: 600, textAlign: 'center' })}>{cardText(block.label, 18)}</div>
        <div style={column({ ...panel, flexGrow: 1, minHeight: 76, justifyContent: 'center', borderRadius: 12, padding: '14px 18px' })}>
          {block.lines.map((line, lineIndex) => <div key={lineIndex} style={row()}>{codeLine(line, 44, { fontSize, color: '#ffffff' })}</div>)}
        </div>
      </div>,
    );
  });
  return <div style={column({ alignItems: 'center' })}>{items}</div>;
}

function Code({ language, lines, width, s }: { language: string; lines: string[]; width: number; s: number }) {
  return (
    <div style={column({ width: Math.min(780 * s, width), background: '#0f1b33', borderRadius: 16 * s, boxShadow: `0 ${14 * s}px ${30 * s}px rgba(15, 27, 51, 0.28)`, overflow: 'hidden' })}>
      <div style={row({ alignItems: 'center', gap: 8 * s, padding: `${11 * s}px ${16 * s}px`, background: '#16264a' })}>
        {dot('#ff5f57', 11 * s)}{dot('#febc2e', 11 * s)}{dot('#28c840', 11 * s)}
        <div style={{ marginLeft: 10 * s, fontFamily: MONO, fontSize: 14 * s, color: '#94a3b8' }}>{cardText(language, 16)}</div>
      </div>
      <div style={column({ padding: `${14 * s}px ${20 * s}px ${16 * s}px` })}>
        {lines.map((line, index) => (
          <div key={index} style={row()}>{codeLine(line, 56, { fontSize: 15 * s, color: /^\s*(\/\/|#|--)/.test(line) ? '#64748b' : '#e2e8f0' })}</div>
        ))}
      </div>
    </div>
  );
}

function StepsRow({ items, width }: { items: StepItems; width: number }) {
  const gap = 18;
  const cardWidth = Math.min(300, (width - gap * (items.length - 1)) / items.length);
  return (
    <div style={row({ gap, justifyContent: 'center', alignItems: 'stretch' })}>
      {items.map((item, index) => (
        <div key={index} style={column({ width: cardWidth, gap: 10, background: '#ffffff', border: '1px solid #dbe4f3', borderRadius: 16, padding: 18, boxShadow: '0 10px 24px rgba(11, 31, 68, 0.08)' })}>
          <div style={row({ width: 34, height: 34, borderRadius: 99, background: TONES[item.tone].solid, color: '#ffffff', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 800 })}>{index + 1}</div>
          <div style={{ fontSize: 19, fontWeight: 800, color: INK, lineHeight: 1.2 }}>{cardText(item.title, 26)}</div>
          <div style={{ fontSize: 15, color: MUTED, lineHeight: 1.4 }}>{cardText(item.text, 70)}</div>
        </div>
      ))}
    </div>
  );
}

function StepsStack({ items, width }: { items: StepItems; width: number }) {
  return (
    <div style={column({ width, gap: 16 })}>
      {items.map((item, index) => (
        <div key={index} style={row({ alignItems: 'center', gap: 24, background: '#ffffff', border: '1px solid #dbe4f3', borderRadius: 20, padding: '22px 28px', boxShadow: '0 12px 28px rgba(11, 31, 68, 0.08)' })}>
          <div style={row({ width: 56, height: 56, flexShrink: 0, borderRadius: 99, background: TONES[item.tone].solid, color: '#ffffff', alignItems: 'center', justifyContent: 'center', fontSize: 27, fontWeight: 800 })}>{index + 1}</div>
          <div style={column({ gap: 6, flexGrow: 1, minWidth: 0 })}>
            <div style={{ fontSize: 30, fontWeight: 800, color: INK, lineHeight: 1.2 }}>{cardText(item.title, 26)}</div>
            <div style={{ fontSize: 23, color: MUTED, lineHeight: 1.35 }}>{cardText(item.text, 70)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Diagram({ diagram, format, width }: { diagram: SocialVisual['diagram']; format: SocialCardFormat; width: number }) {
  const portrait = format === 'portrait';
  if (diagram.kind === 'flow') return portrait ? <FlowStack blocks={diagram.blocks} width={width} /> : <FlowRow blocks={diagram.blocks} width={width} />;
  if (diagram.kind === 'steps') return portrait ? <StepsStack items={diagram.items} width={width} /> : <StepsRow items={diagram.items} width={width} />;
  return <Code language={diagram.language} lines={diagram.lines} width={width} s={portrait ? 1.45 : 1} />;
}

function Card({ input, format, logoSrc }: { input: SocialCardInput; format: SocialCardFormat; logoSrc: string }) {
  const f = FORMATS[format];
  const width = f.width - 2 * f.padX;
  const title = cardText(input.title, 110);
  const titleSize = title.length <= 45 ? f.titles[0] : title.length <= 75 ? f.titles[1] : f.titles[2];
  const subtitle = cardText(input.subtitle, 150);
  const badge = cardText(input.badge, 18).toUpperCase();
  const pill: CSSProperties = { display: 'flex', alignItems: 'center', padding: `${8 * f.pill / 15}px ${14 * f.pill / 15}px`, borderRadius: 10 * f.pill / 15, fontSize: f.pill, fontWeight: 600 };

  return (
    <div style={column({ width: '100%', height: '100%', padding: `${f.padY}px ${f.padX}px`, fontFamily: 'Inter', color: INK, backgroundImage: 'linear-gradient(135deg, #f8fbff 0%, #e8f0ff 100%)' })}>
      <div style={row({ alignItems: 'center', justifyContent: 'space-between' })}>
        <div style={row({ alignItems: 'center', gap: f.logo * 0.3 })}>
          {/* eslint-disable-next-line @next/next/no-img-element -- next/og n'accepte que <img> */}
          <img src={logoSrc} width={f.logo} height={f.logo} alt="" style={{ borderRadius: f.logo * 0.24, boxShadow: '0 6px 16px rgba(37, 99, 235, 0.18)' }} />
          <div style={{ fontSize: f.brand, fontWeight: 800, color: '#1d4ed8' }}>JcHub</div>
        </div>
        <div style={row({ padding: `${f.badge * 0.5}px ${f.badge}px`, borderRadius: f.badge * 0.6, background: '#dbeafe', border: '1px solid #bfdbfe', color: '#1e3a8a', fontSize: f.badge, fontWeight: 800, letterSpacing: 1 })}>{badge}</div>
      </div>

      {/* minHeight 0 + overflow hidden : un contenu trop haut est rogné au lieu de pousser le pied hors de l'image. */}
      <div style={column({ flexGrow: 1, minHeight: 0, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', gap: f.gap })}>
        <div style={column({ alignItems: 'center', gap: f.subtitle * 0.4 })}>
          <div style={{ fontSize: titleSize, fontWeight: 800, lineHeight: 1.12, letterSpacing: -1, textAlign: 'center', maxWidth: width }}>{title}</div>
          {subtitle ? <div style={{ fontSize: f.subtitle, color: MUTED, lineHeight: 1.35, textAlign: 'center', maxWidth: width * 0.92 }}>{subtitle}</div> : null}
        </div>
        {input.diagram ? <Diagram diagram={input.diagram} format={format} width={width} /> : null}
      </div>

      <div style={row({ justifyContent: 'center', gap: 12 })}>
        {input.footer.map((label, index) => (
          <div key={label} style={index === 0 ? { ...pill, background: INK, color: '#ffffff' } : { ...pill, background: '#ffffff', color: INK, border: `1.5px solid ${INK}` }}>{cardText(label, 40)}</div>
        ))}
      </div>
    </div>
  );
}

// PNG rendu par next/og; la route le convertit en JPEG pour Instagram et Facebook.
export async function renderSocialCard(input: SocialCardInput, format: SocialCardFormat): Promise<ImageResponse> {
  const { width, height } = FORMATS[format];
  const { fonts, logoSrc } = await loadAssets();
  return new ImageResponse(<Card input={input} format={format} logoSrc={logoSrc} />, { width, height, fonts });
}

// JPEG, seul format d'image accepté par l'API de publication Instagram.
export async function renderSocialCardJpeg(input: SocialCardInput, format: SocialCardFormat): Promise<Uint8Array<ArrayBuffer>> {
  const png = await (await renderSocialCard(input, format)).arrayBuffer();
  const image = await loadImage(Buffer.from(png));
  const canvas = createCanvas(image.width, image.height);
  canvas.getContext('2d').drawImage(image, 0, 0);
  return new Uint8Array(await canvas.encode('jpeg', 90));
}
