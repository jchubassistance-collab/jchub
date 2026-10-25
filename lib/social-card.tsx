import 'server-only';

import { readFile } from 'node:fs/promises';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import type { CSSProperties } from 'react';
import { photoDataUri } from '@/lib/photos';

// Polices et logo lus une seule fois, à la première image (voir la doc Next « Using Node.js runtime with local assets »).
const asset = (path: string) => readFile(join(process.cwd(), path));
type CardFont = { name: string; data: Buffer; weight: 400 | 600 | 800; style: 'normal' };
let assets: Promise<{ fonts: CardFont[]; logoSrc: string }> | null = null;
function loadAssets() {
  assets ??= Promise.all([
    asset('assets/fonts/inter-latin-400-normal.woff'),
    asset('assets/fonts/inter-latin-600-normal.woff'),
    asset('assets/fonts/inter-latin-800-normal.woff'),
    asset('public/jchub-icon-192.png'),
  ]).then(([interRegular, interSemiBold, interExtraBold, logo]) => ({
    logoSrc: `data:image/png;base64,${logo.toString('base64')}`,
    fonts: [
      { name: 'Inter', data: interRegular, weight: 400, style: 'normal' },
      { name: 'Inter', data: interSemiBold, weight: 600, style: 'normal' },
      { name: 'Inter', data: interExtraBold, weight: 800, style: 'normal' },
    ],
  }));
  return assets;
}

export type SocialCardFormat = 'landscape' | 'portrait';
// footer : pastilles du bas, la première en bleu (ex. temps de lecture, puis l'adresse du site).
// photo : image Unsplash (images.unsplash.com) ; sans photo, le visuel garde le fond de marque.
export type SocialCardInput = { title: string; subtitle: string; badge: string; footer: string[]; photo: string | null };

const NAVY = '#07142b';
const BLUE = '#2563eb';
const SOFT = '#c7d5ee';
// Paysage : texte à gauche, photo à droite (Facebook, couvertures d'articles). Portrait : photo en haut (Instagram).
const FORMATS = {
  landscape: { width: 1200, height: 630, photo: { left: 440, top: 0, width: 760, height: 630 }, pad: '46px 56px 42px', text: 500, logo: 50, brand: 27, badge: 15, titles: [58, 50, 42, 35], subtitle: 21, pill: 15 },
  portrait: { width: 1080, height: 1350, photo: { left: 0, top: 0, width: 1080, height: 830 }, pad: '56px 64px 60px', text: 952, logo: 72, brand: 38, badge: 22, titles: [80, 70, 60, 50], subtitle: 31, pill: 23 },
};

// Les polices embarquées couvrent le latin : on remplace les flèches courantes et on retire emojis et symboles exotiques.
export function cardText(value: string, max = 400): string {
  const text = value.replace(/→|⟶/g, '->').replace(/←/g, '<-').replace(/⇒/g, '=>')
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')
    .replace(/[^\u0000-ɏ -⁯€™−]/g, '')
    .replace(/[ \t]+$/g, '');
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

const row = (style: CSSProperties = {}): CSSProperties => ({ display: 'flex', ...style });
const column = (style: CSSProperties = {}): CSSProperties => ({ display: 'flex', flexDirection: 'column', ...style });
const fill = (style: CSSProperties): CSSProperties => ({ position: 'absolute', display: 'flex', ...style });

function titleSize(title: string, sizes: number[]): number {
  if (title.length <= 28) return sizes[0];
  if (title.length <= 48) return sizes[1];
  if (title.length <= 72) return sizes[2];
  return sizes[3];
}

// Fond de marque quand aucune photo n'est disponible.
function BrandBackdrop({ width, height }: { width: number; height: number }) {
  return (
    <>
      <div style={fill({ left: width * 0.62, top: -height * 0.3, width: width * 0.5, height: width * 0.5, borderRadius: 9999, background: 'rgba(37, 99, 235, 0.28)' })} />
      <div style={fill({ left: -width * 0.14, top: height * 0.62, width: width * 0.42, height: width * 0.42, borderRadius: 9999, background: 'rgba(16, 185, 129, 0.16)' })} />
    </>
  );
}

function Card({ input, format, logoSrc, photoSrc }: { input: SocialCardInput; format: SocialCardFormat; logoSrc: string; photoSrc: string | null }) {
  const f = FORMATS[format];
  const portrait = format === 'portrait';
  const title = cardText(input.title, 90);
  const subtitle = cardText(input.subtitle, portrait ? 140 : 110);
  const badge = cardText(input.badge, 22).toUpperCase();
  const pill: CSSProperties = { display: 'flex', alignItems: 'center', padding: `${f.pill * 0.55}px ${f.pill}px`, borderRadius: 999, fontSize: f.pill, fontWeight: 600 };
  const p = f.photo;
  // Le texte occupe le panneau gauche en paysage, le bas de l'image en portrait; sans photo, il est centré.
  const textArea: CSSProperties = portrait && photoSrc
    ? { position: 'absolute', left: 0, top: p.height - 150, width: f.width, height: f.height - p.height + 150, justifyContent: 'flex-end' }
    : { position: 'absolute', left: 0, top: 0, width: photoSrc ? p.left + 160 : f.width, height: f.height, justifyContent: 'center' };

  return (
    <div style={row({ position: 'relative', width: '100%', height: '100%', background: NAVY, fontFamily: 'Inter', color: '#ffffff' })}>
      {photoSrc ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- next/og n'accepte que <img> */}
          <img src={photoSrc} width={p.width} height={p.height} alt="" style={{ position: 'absolute', left: p.left, top: p.top, width: p.width, height: p.height, objectFit: 'cover' }} />
          {portrait ? (
            <>
              <div style={fill({ left: 0, top: 0, width: f.width, height: 260, backgroundImage: 'linear-gradient(180deg, rgba(7, 20, 43, 0.72) 0%, rgba(7, 20, 43, 0) 100%)' })} />
              <div style={fill({ left: 0, top: p.height - 420, width: f.width, height: 420, backgroundImage: `linear-gradient(180deg, rgba(7, 20, 43, 0) 0%, rgba(7, 20, 43, 0.82) 62%, ${NAVY} 100%)` })} />
            </>
          ) : (
            <div style={fill({ left: p.left, top: 0, width: 340, height: f.height, backgroundImage: `linear-gradient(90deg, ${NAVY} 0%, rgba(7, 20, 43, 0.82) 38%, rgba(7, 20, 43, 0) 100%)` })} />
          )}
        </>
      ) : <BrandBackdrop width={f.width} height={f.height} />}

      <div style={fill({ left: 0, top: 0, width: f.width, padding: f.pad })}>
        <div style={row({ alignItems: 'center', gap: f.logo * 0.3 })}>
          {/* eslint-disable-next-line @next/next/no-img-element -- next/og n'accepte que <img> */}
          <img src={logoSrc} width={f.logo} height={f.logo} alt="" style={{ borderRadius: f.logo * 0.24, boxShadow: '0 6px 18px rgba(0, 0, 0, 0.28)' }} />
          <div style={{ fontSize: f.brand, fontWeight: 800, letterSpacing: -0.5 }}>JcHub</div>
        </div>
      </div>

      <div style={column({ ...textArea, padding: f.pad })}>
        <div style={column({ width: f.text, gap: f.subtitle * 0.75, marginTop: portrait && photoSrc ? 0 : f.logo * 0.6 })}>
          <div style={row()}>
            <div style={row({ padding: `${f.badge * 0.45}px ${f.badge * 0.95}px`, borderRadius: 999, background: BLUE, fontSize: f.badge, fontWeight: 800, letterSpacing: 1.4 })}>{badge}</div>
          </div>
          <div style={{ fontSize: titleSize(title, f.titles), fontWeight: 800, lineHeight: 1.08, letterSpacing: -1.5 }}>{title}</div>
          {subtitle ? <div style={{ fontSize: f.subtitle, color: SOFT, lineHeight: 1.4 }}>{subtitle}</div> : null}
          <div style={row({ gap: 12, marginTop: f.subtitle * 0.5 })}>
            {input.footer.map((label, index) => (
              <div key={label} style={index === 0 ? { ...pill, background: '#ffffff', color: NAVY } : { ...pill, border: '1.5px solid rgba(255, 255, 255, 0.45)', color: '#ffffff' }}>{cardText(label, 40)}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export async function renderSocialCard(input: SocialCardInput, format: SocialCardFormat, headers?: Record<string, string>): Promise<ImageResponse> {
  const { width, height, photo } = FORMATS[format];
  const [{ fonts, logoSrc }, photoSrc] = await Promise.all([loadAssets(), input.photo ? photoDataUri(input.photo, photo.width, photo.height) : null]);
  return new ImageResponse(<Card input={input} format={format} logoSrc={logoSrc} photoSrc={photoSrc} />, { width, height, fonts, headers });
}

// JPEG, seul format d'image accepté par l'API de publication Instagram.
export async function renderSocialCardJpeg(input: SocialCardInput, format: SocialCardFormat): Promise<Uint8Array<ArrayBuffer>> {
  const png = await (await renderSocialCard(input, format)).arrayBuffer();
  const image = await loadImage(Buffer.from(png));
  const canvas = createCanvas(image.width, image.height);
  canvas.getContext('2d').drawImage(image, 0, 0);
  return new Uint8Array(await canvas.encode('jpeg', 90));
}
