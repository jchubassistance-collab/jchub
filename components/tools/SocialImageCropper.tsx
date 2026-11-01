'use client';

import { useRef, useState, type ChangeEvent, type PointerEvent } from 'react';
import { Download, ImagePlus, Move, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { useLocale } from 'next-intl';
import { bilingual } from '@/i18n/copy';
import { downloadName } from '@/lib/download-name';

type Preset = { id: string; fr: string; en: string; width: number; height: number; ratio: number };
const presets: Preset[] = [
  { id: 'square', fr: 'Publication carrée - Instagram / Facebook / LinkedIn', en: 'Square post - Instagram / Facebook / LinkedIn', width: 1080, height: 1080, ratio: 1 },
  { id: 'portrait', fr: 'Portrait - Instagram / Facebook', en: 'Portrait - Instagram / Facebook', width: 1080, height: 1350, ratio: 4 / 5 },
  { id: 'story', fr: 'Story / Reel / TikTok / Shorts', en: 'Story / Reel / TikTok / Shorts', width: 1080, height: 1920, ratio: 9 / 16 },
  { id: 'instagram-landscape', fr: 'Publication paysage - Instagram', en: 'Landscape post - Instagram', width: 1080, height: 566, ratio: 1080 / 566 },
  { id: 'facebook-cover', fr: 'Photo de couverture - Facebook', en: 'Cover photo - Facebook', width: 1640, height: 624, ratio: 1640 / 624 },
  { id: 'facebook-event', fr: 'Couverture événement - Facebook', en: 'Event cover - Facebook', width: 1920, height: 1005, ratio: 1920 / 1005 },
  { id: 'linkedin', fr: 'Publication paysage - LinkedIn', en: 'Landscape post - LinkedIn', width: 1200, height: 627, ratio: 1200 / 627 },
  { id: 'linkedin-cover', fr: 'Bannière de profil - LinkedIn', en: 'Profile banner - LinkedIn', width: 1584, height: 396, ratio: 4 },
  { id: 'youtube-thumbnail', fr: 'Miniature - YouTube', en: 'Thumbnail - YouTube', width: 1280, height: 720, ratio: 16 / 9 },
  { id: 'youtube-banner', fr: 'Bannière de chaîne - YouTube', en: 'Channel banner - YouTube', width: 2560, height: 1440, ratio: 16 / 9 },
  { id: 'pinterest', fr: 'Épingle standard - Pinterest', en: 'Standard pin - Pinterest', width: 1000, height: 1500, ratio: 2 / 3 },
  { id: 'x-post', fr: 'Publication paysage - X', en: 'Landscape post - X', width: 1600, height: 900, ratio: 16 / 9 },
  { id: 'x-header', fr: 'Bannière de profil - X', en: 'Profile banner - X', width: 1500, height: 500, ratio: 3 },
  { id: 'banner', fr: 'Bannière Web', en: 'Web banner', width: 1920, height: 1080, ratio: 16 / 9 },
  { id: 'custom', fr: 'Dimensions personnalisées', en: 'Custom dimensions', width: 1200, height: 800, ratio: 1.5 },
];
const t = bilingual({
  title: 'Prépare ton visuel', add: 'Choisir une image', hint: 'JPG, PNG ou WebP · 20 Mo maximum. Ton image reste sur ton appareil.',
  preset: 'Format de destination', custom: 'Dimensions en pixels', width: 'Largeur', height: 'Hauteur',
  quality: (v: number) => `Qualité JPEG : ${v} %`, png: 'PNG', jpeg: 'JPEG', drag: 'Fais glisser l’image pour ajuster le cadrage',
  export: 'Télécharger le visuel', empty: 'Choisis une image pour commencer', failed: 'Impossible de lire cette image. Essaie un autre fichier.', reset: 'Recentrer l’image', zoom: 'Zoom', zoomOut: 'Dézoomer', zoomIn: 'Zoomer',
}, {
  title: 'Prepare your image', add: 'Choose an image', hint: 'JPG, PNG or WebP · 20 MB maximum. Your image stays on your device.',
  preset: 'Destination format', custom: 'Dimensions in pixels', width: 'Width', height: 'Height',
  quality: (v: number) => `JPEG quality: ${v}%`, png: 'PNG', jpeg: 'JPEG', drag: 'Drag the image to adjust the crop',
  export: 'Download image', empty: 'Choose an image to get started', failed: 'Could not read this image. Try another file.', reset: 'Center image', zoom: 'Zoom', zoomOut: 'Zoom out', zoomIn: 'Zoom in',
});

export function SocialImageCropper() {
  const locale = useLocale();
  const copy = t[locale];
  const input = useRef<HTMLInputElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const image = useRef<HTMLImageElement>(null);
  const drag = useRef<{ x: number; y: number; fx: number; fy: number } | null>(null);
  const [src, setSrc] = useState('');
  const [name, setName] = useState('visuel');
  const [presetId, setPresetId] = useState('square');
  const [custom, setCustom] = useState({ width: 1200, height: 800 });
  const [focus, setFocus] = useState({ x: 0.5, y: 0.5 });
  const [zoom, setZoom] = useState(1);
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [quality, setQuality] = useState(90);
  const [error, setError] = useState('');
  /** Read from the loaded image: the render cannot read it from the ref. */
  const [natural, setNatural] = useState<{ width: number; height: number } | null>(null);
  const preset =presets.find((item) => item.id === presetId) ?? presets[0];
  const width = presetId === 'custom' ? Math.max(1, Math.min(4096, custom.width || 1)) : preset.width;
  const height = presetId === 'custom' ? Math.max(1, Math.min(4096, custom.height || 1)) : preset.height;
  const ratio = width / height;
  const stageRatio = Math.max(0.46, Math.min(2.1, ratio));

  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 20 * 1024 * 1024) { setError(copy.failed); return; }
    const url = URL.createObjectURL(file);
    setSrc((previous) => { if (previous) URL.revokeObjectURL(previous); return url; });
    setName(file.name); setNatural(null); setFocus({ x: 0.5, y: 0.5 }); setZoom(1); setError('');
  };
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!src) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, fx: focus.x, fy: focus.y };
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || !image.current || !stage.current) return;
    const box = stage.current.getBoundingClientRect();
    const iw = image.current.naturalWidth, ih = image.current.naturalHeight;
    const scale = Math.max(box.width / iw, box.height / ih) * zoom;
    const dx = (event.clientX - drag.current.x) / scale / iw;
    const dy = (event.clientY - drag.current.y) / scale / ih;
    const cropW = Math.min(1, ratio * ih / iw / zoom), cropH = Math.min(1, iw / ratio / ih / zoom);
    setFocus({ x: Math.max(cropW / 2, Math.min(1 - cropW / 2, drag.current.fx - dx)), y: Math.max(cropH / 2, Math.min(1 - cropH / 2, drag.current.fy - dy)) });
  };
  const exportImage = () => {
    const img = image.current;
    if (!img) return;
    const cropW = Math.min(img.naturalWidth, img.naturalHeight * ratio) / zoom;
    const cropH = Math.min(img.naturalHeight, img.naturalWidth / ratio) / zoom;
    const sx = Math.max(0, Math.min(img.naturalWidth - cropW, focus.x * img.naturalWidth - cropW / 2));
    const sy = Math.max(0, Math.min(img.naturalHeight - cropH, focus.y * img.naturalHeight - cropH / 2));
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    const context = canvas.getContext('2d'); if (!context) return;
    if (format === 'jpeg') { context.fillStyle = '#fff'; context.fillRect(0, 0, width, height); }
    context.drawImage(img, sx, sy, cropW, cropH, 0, 0, width, height);
    canvas.toBlob((blob) => { if (!blob) return; const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = downloadName(name, format, presetId === 'custom' ? `${width}x${height}` : preset.id, 'visuel'); a.click(); URL.revokeObjectURL(url); }, `image/${format}`, format === 'jpeg' ? quality / 100 : undefined);
  };

  return <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,.8fr)]">
    <section className="space-y-4" aria-label={copy.title}>
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-white">{copy.title}</h2><p className="mt-1 text-xs text-slate-400">{copy.hint}</p></div><input ref={input} type="file" accept="image/*" className="hidden" onChange={chooseFile}/><button onClick={() => input.current?.click()} className="btn-upload inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm"><ImagePlus className="h-4 w-4"/>{copy.add}</button></div>
      <div className="flex min-h-[310px] items-center justify-center overflow-hidden rounded-2xl border border-[#9ccbff]/20 bg-[linear-gradient(45deg,#e2e8f0_25%,transparent_25%),linear-gradient(-45deg,#e2e8f0_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e2e8f0_75%),linear-gradient(-45deg,transparent_75%,#e2e8f0_75%)] bg-[length:24px_24px] bg-[position:0_0,0_12px,12px_-12px,-12px_0] p-5">
        {src ? <div ref={stage} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={() => { drag.current = null; }} style={{ aspectRatio: `${stageRatio}`, width: `min(100%, ${Math.min(stageRatio * 420, 700)}px)` }} className="relative max-h-[440px] touch-none cursor-move overflow-hidden rounded-lg shadow-2xl ring-1 ring-white/30">
          <img ref={image} src={src} alt="" draggable={false} onLoad={(event) => { setError(''); setNatural({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight }); }} onError={() => setError(copy.failed)} className="pointer-events-none absolute max-w-none" style={(() => { const imageRatio = natural?.width && natural.height ? natural.width / natural.height : stageRatio; const w = Math.max(100, imageRatio / stageRatio * 100) * zoom; const h = Math.max(100, stageRatio / imageRatio * 100) * zoom; return { width: `${w}%`, height: `${h}%`, maxWidth: 'none', left: `${50 - focus.x * w}%`, top: `${50 - focus.y * h}%` }; })()} />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3"><i className="border-b border-r border-white/50"/><i className="border-b border-r border-white/50"/><i className="border-b border-white/50"/><i className="border-b border-r border-white/50"/><i className="border-b border-r border-white/50"/><i className="border-b border-white/50"/><i className="border-r border-white/50"/><i className="border-r border-white/50"/><i/></div>
          <span className="absolute bottom-2 left-2 rounded-full bg-black/55 px-2.5 py-1 text-[11px] text-slate-50"><Move className="mr-1 inline h-3 w-3"/>{copy.drag}</span>
        </div> : <button onClick={() => input.current?.click()} className="flex flex-col items-center gap-3 p-10 text-slate-600"><ImagePlus className="h-10 w-10 text-blue-600"/><span>{copy.empty}</span></button>}
      </div>
      {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
      {src && <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400"><span>{natural?.width ?? '?'} × {natural?.height ?? '?'} px</span><div className="flex flex-wrap items-center gap-3"><div className="inline-flex items-center gap-2"><span>{copy.zoom}</span><button type="button" aria-label={copy.zoomOut} title={copy.zoomOut} disabled={zoom <= 1} onClick={() => setZoom((value) => Math.max(1, Math.round((value - .1) * 10) / 10))} className="rounded-lg border border-slate-300 p-1.5 text-slate-700 hover:border-slate-400 disabled:opacity-40"><ZoomOut className="h-4 w-4"/></button><input aria-label={copy.zoom} type="range" min="1" max="3" step="0.1" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="w-24 accent-blue-400"/><button type="button" aria-label={copy.zoomIn} title={copy.zoomIn} disabled={zoom >= 3} onClick={() => setZoom((value) => Math.min(3, Math.round((value + .1) * 10) / 10))} className="rounded-lg border border-slate-300 p-1.5 text-slate-700 hover:border-slate-400 disabled:opacity-40"><ZoomIn className="h-4 w-4"/></button><span className="w-10 text-right">{Math.round(zoom * 100)}%</span></div><button onClick={() => { setFocus({ x: .5, y: .5 }); setZoom(1); }} className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900"><RotateCcw className="h-3.5 w-3.5"/>{copy.reset}</button></div></div>}
    </section>
    <section className="space-y-4 rounded-2xl border border-[#9ccbff]/20 bg-[#071526] p-4 sm:p-5">
      <label className="block text-sm font-medium text-slate-300">{copy.preset}<select value={presetId} onChange={(e) => setPresetId(e.target.value)} className="mt-1.5 w-full rounded-xl border border-[#9ccbff]/20 bg-[#0c1d31] px-3 py-3 text-white">{presets.map((item) => <option key={item.id} value={item.id}>{locale === 'fr' ? item.fr : item.en} · {item.width} × {item.height}</option>)}</select></label>
      {presetId === 'custom' && <div><p className="mb-2 text-sm font-medium text-slate-300">{copy.custom} (1–4096 px)</p><div className="grid grid-cols-2 gap-3">{(['width', 'height'] as const).map((key) => <label key={key} className="text-xs text-slate-400">{copy[key]}<input type="number" min="1" max="4096" value={custom[key]} onChange={(e) => setCustom((current) => ({ ...current, [key]: Math.max(1, Math.min(4096, Number(e.target.value) || 1)) }))} className="mt-1 w-full rounded-xl border border-[#9ccbff]/20 bg-[#0c1d31] px-3 py-2.5 text-sm text-white"/></label>)}</div></div>}
      <div className="rounded-xl border border-[#9ccbff]/15 bg-[#0c1d31] p-3"><div className="text-xs text-slate-400">{locale === 'fr' ? 'Taille exportée' : 'Export size'}</div><div className="mt-1 text-lg font-bold text-white">{width} × {height} <span className="text-sm font-normal text-slate-400">px</span></div></div>
      <div><p className="mb-2 text-sm font-medium text-slate-300">{locale === 'fr' ? 'Format de fichier' : 'File format'}</p><div className="grid grid-cols-2 gap-2">{(['png', 'jpeg'] as const).map((item) => <button key={item} onClick={() => setFormat(item)} className={`rounded-xl border px-3 py-2.5 text-sm font-semibold uppercase ${format === item ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'}`}>{item === 'png' ? copy.png : copy.jpeg}</button>)}</div></div>
      {format === 'jpeg' && <label className="block text-sm text-slate-300">{copy.quality(quality)}<input type="range" min="50" max="100" value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="mt-2 w-full accent-blue-400"/></label>}
      <button disabled={!src} onClick={exportImage} className="btn-download flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3"><Download className="h-5 w-5"/>{copy.export}</button>
    </section>
  </div>;
}
