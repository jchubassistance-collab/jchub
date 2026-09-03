'use client';

import { useState, useEffect, useRef } from 'react';
import { Download, Copy, Check, QrCode as QrIcon } from 'lucide-react';
import QRCode from 'qrcode';

export function QrCodeGenerator() {
  const [text, setText] = useState('https://jchub.dev');
  const [size, setSize] = useState(256);
  const [fgColor, setFgColor] = useState('#0a0a0a');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [dataUrl, setDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!text || !canvasRef.current) {
      setDataUrl('');
      return;
    }
    setError('');
    QRCode.toCanvas(canvasRef.current, text, {
      width: size,
      margin: 2,
      color: { dark: fgColor, light: bgColor },
      errorCorrectionLevel: 'M',
    }).then(() => {
      // Get data URL for download
      const url = canvasRef.current!.toDataURL('image/png');
      setDataUrl(url);
    }).catch(() => {
      setDataUrl('');
      setError('Impossible de générer ce QR code. Vérifie le contenu saisi.');
    });
  }, [text, size, fgColor, bgColor]);

  const download = () => {
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.download = `qrcode-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  const copy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const presets = [
    { label: 'URL', icon: '🔗', value: 'https://jchub.dev' },
    { label: 'Email', icon: '📧', value: 'mailto:hello@jchub.dev' },
    { label: 'WhatsApp', icon: '💬', value: 'https://wa.me/242069550625' },
    { label: 'WiFi', icon: '📶', value: 'WIFI:S:JcHub-Guest;T:WPA;P:dev2026;;' },
  ];

  return (
    <div className="space-y-4 text-slate-100">
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-200">Texte ou URL à encoder</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="https://jchub.io ou un texte..."
          className="w-full resize-y rounded-xl border border-[#9ccbff]/20 bg-[#071526] px-4 py-3 text-sm text-white focus:outline-none focus:border-[#9ccbff]/60"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-slate-400">{text.length} caractères</span>
          <button onClick={copy} className="flex items-center gap-1 text-xs font-semibold text-[#9ccbff] hover:text-white transition">
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copié !' : 'Copier le texte'}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-300" role="alert">{error}</p>}

      {/* Presets */}
      <div>
        <div className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Préréglages</div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => setText(p.value)}
              className="rounded-xl border border-[#9ccbff]/20 bg-[#0b1830]/80 p-2.5 transition hover:border-[#9ccbff]/50 hover:bg-[#0f2140]"
            >
              <div className="mb-1 text-2xl">{p.icon}</div>
              <div className="text-xs font-semibold text-slate-100">{p.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Options */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Taille</label>
          <select
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-full rounded-lg border border-[#9ccbff]/20 bg-[#071526] px-2 py-2 text-sm text-white focus:outline-none focus:border-[#9ccbff]/60"
          >
            <option value={128}>128px</option>
            <option value={256}>256px</option>
            <option value={512}>512px</option>
            <option value={1024}>1024px</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">QR</label>
          <input
            type="color"
            value={fgColor}
            onChange={(e) => setFgColor(e.target.value)}
            className="h-10 w-full cursor-pointer rounded-lg border border-[#9ccbff]/20 bg-[#071526]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Fond</label>
          <input
            type="color"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            className="h-10 w-full cursor-pointer rounded-lg border border-[#9ccbff]/20 bg-[#071526]"
          />
        </div>
      </div>

      {/* Preview */}
      <div className="flex flex-col items-center rounded-2xl border border-[#9ccbff]/20 bg-[#0b1830]/80 p-4 shadow-[0_12px_28px_rgba(7,19,40,0.28)]">
        <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
          <QrIcon className="h-4 w-4 text-[#9ccbff]" />
          Aperçu
        </div>
        <div className="rounded-xl bg-white p-2 shadow-inner">
          <canvas ref={canvasRef} className="h-auto max-w-full" />
        </div>
      </div>

      {dataUrl && (
        <button onClick={download} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-purple-600 py-3 font-semibold text-white transition hover:shadow-lg">
          <Download className="w-4 h-4" />
          Télécharger en PNG
        </button>
      )}
    </div>
  );
}
