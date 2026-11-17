'use client';

import { useState, useEffect, useRef } from 'react';
import { Download, Copy, Check, QrCode as QrIcon, Smartphone } from 'lucide-react';
import QRCode from 'qrcode';
import { useLocale } from 'next-intl';
import { bilingual } from '@/i18n/copy';
import { downloadName } from '@/lib/download-name';

const strings = bilingual({
  failed: 'Impossible de générer ce QR code. Vérifie le contenu saisi.',
  input: 'Texte ou URL à encoder',
  placeholder: 'https://jchub.dev ou un texte...',
  characters: (count: number) => `${count} caractères`,
  copied: 'Copié !',
  copyText: 'Copier le texte',
  presets: 'Préréglages',
  size: 'Taille',
  background: 'Fond',
  preview: 'Aperçu',
  download: 'Télécharger en PNG',
  momo: 'Paiement Mobile Money',
  momoIntro: 'Le QR affiche ton numéro et le montant à ton client, et lui propose d’appeler ou de copier le numéro. Imprime l’affiche pour ton comptoir.',
  operator: 'Opérateur',
  momoNumber: 'Numéro Mobile Money',
  momoName: 'Nom affiché du bénéficiaire',
  momoAmount: 'Montant (facultatif)',
  momoReason: 'Motif ou référence (facultatif)',
  payWith: (operator: string) => `Payez par ${operator}`,
  payTo: 'Bénéficiaire',
  amountLabel: 'Montant',
  scan: 'Scannez pour voir le numéro',
  poster: 'Télécharger l’affiche à imprimer',
  backToText: 'Revenir au texte libre',
}, {
  failed: 'Could not generate this QR code. Check the content you entered.',
  input: 'Text or URL to encode',
  placeholder: 'https://jchub.dev or some text...',
  characters: (count: number) => `${count} characters`,
  copied: 'Copied!',
  copyText: 'Copy the text',
  presets: 'Presets',
  size: 'Size',
  background: 'Background',
  preview: 'Preview',
  download: 'Download as PNG',
  momo: 'Mobile money payment',
  momoIntro: 'The QR shows your number and the amount to your customer, and offers to call or copy the number. Print the poster for your counter.',
  operator: 'Operator',
  momoNumber: 'Mobile money number',
  momoName: 'Payee name shown',
  momoAmount: 'Amount (optional)',
  momoReason: 'Reason or reference (optional)',
  payWith: (operator: string) => `Pay with ${operator}`,
  payTo: 'Payee',
  amountLabel: 'Amount',
  scan: 'Scan to see the number',
  poster: 'Download the poster to print',
  backToText: 'Back to free text',
});

const OPERATORS = ['MTN MoMo', 'Airtel Money', 'Orange Money', 'Moov Money', 'Wave', 'M-Pesa'];

type MomoDetails = { operator: string; number: string; name: string; amount: string; reason: string };

/**
 * Plain text any phone camera shows, followed by a tel: link so the number can be dialled or
 * copied. No operator publishes an open QR standard for person-to-person payments, so the QR
 * carries the details rather than pretending to start the payment.
 */
function momoPayload(details: MomoDetails, payWith: (operator: string) => string, labels: { payTo: string; amountLabel: string }): string {
  const number = details.number.replace(/[^\d+]/g, '');
  return [
    payWith(details.operator),
    details.name.trim() && `${labels.payTo} : ${details.name.trim()}`,
    `${details.operator} : ${details.number.trim()}`,
    details.amount.trim() && `${labels.amountLabel} : ${details.amount.trim()}`,
    details.reason.trim(),
    number && `tel:${number}`,
  ].filter(Boolean).join('\n');
}

export function QrCodeGenerator() {
  const t = strings[useLocale()];
  const [text, setText] = useState('https://jchub.dev');
  const [size, setSize] = useState(256);
  const [fgColor, setFgColor] = useState('#0a0a0a');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [dataUrl, setDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [momo, setMomo] = useState<MomoDetails | null>(null);
  const updateMomo = (key: keyof MomoDetails, value: string) => {
    if (!momo) return;
    const next = { ...momo, [key]: value };
    setMomo(next);
    setText(momoPayload(next, t.payWith, t));
  };
  const startMomo = () => {
    const details: MomoDetails = { operator: 'MTN MoMo', number: '+242 06 000 00 00', name: 'Boutique Kimpa', amount: '', reason: '' };
    setMomo(details);
    setText(momoPayload(details, t.payWith, t));
  };

  /** A4-ratio poster: title, QR, number in large type, payee and amount. */
  const downloadPoster = () => {
    if (!momo || !canvasRef.current) return;
    const width = 1240;
    const height = 1754;
    const poster = document.createElement('canvas');
    poster.width = width;
    poster.height = height;
    const context = poster.getContext('2d');
    if (!context) return;
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.fillStyle = fgColor;
    context.fillRect(0, 0, width, 220);
    context.fillStyle = '#ffffff';
    context.textAlign = 'center';
    context.font = 'bold 84px Arial, sans-serif';
    context.fillText(t.payWith(momo.operator), width / 2, 145, width - 120);
    const qrSize = 760;
    context.drawImage(canvasRef.current, (width - qrSize) / 2, 300, qrSize, qrSize);
    context.fillStyle = '#0f172a';
    context.font = 'bold 96px Arial, sans-serif';
    context.fillText(momo.number.trim(), width / 2, 1200, width - 120);
    context.font = '56px Arial, sans-serif';
    if (momo.name.trim()) context.fillText(momo.name.trim(), width / 2, 1300, width - 120);
    if (momo.amount.trim()) {
      context.font = 'bold 72px Arial, sans-serif';
      context.fillText(`${t.amountLabel} : ${momo.amount.trim()}`, width / 2, 1420, width - 120);
    }
    if (momo.reason.trim()) {
      context.font = '44px Arial, sans-serif';
      context.fillText(momo.reason.trim(), width / 2, 1510, width - 120);
    }
    context.fillStyle = '#64748b';
    context.font = '36px Arial, sans-serif';
    context.fillText(t.scan, width / 2, 1660, width - 120);
    const link = document.createElement('a');
    link.download = downloadName('affiche-mobile-money', 'png');
    link.href = poster.toDataURL('image/png');
    link.click();
  };

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
      setError(t.failed);
    });
  }, [text, size, fgColor, bgColor, t]);

  const download = () => {
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.download = downloadName('qrcode', 'png');
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
    { label: 'WhatsApp', icon: '💬', value: 'https://wa.me/242044793800' },
    { label: 'WiFi', icon: '📶', value: 'WIFI:S:JcHub-Guest;T:WPA;P:dev2026;;' },
  ];

  return (
    <div className="space-y-4 text-slate-100">
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-200">{t.input}</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder={t.placeholder}
          className="w-full resize-y rounded-xl border border-[#9ccbff]/20 bg-[#071526] px-4 py-3 text-sm text-white focus:outline-none focus:border-[#9ccbff]/60"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-slate-400">{t.characters(text.length)}</span>
          <button onClick={copy} className="flex items-center gap-1 text-xs font-semibold text-[#9ccbff] hover:text-white transition">
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? t.copied : t.copyText}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-300" role="alert">{error}</p>}

      {momo ? (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-700">
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-bold text-slate-900"><Smartphone className="h-4 w-4" aria-hidden="true" />{t.momo}</p>
            <button type="button" onClick={() => setMomo(null)} className="text-xs font-semibold text-slate-600 underline hover:text-slate-900">{t.backToText}</button>
          </div>
          <p className="text-xs text-slate-500">{t.momoIntro}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-slate-600">{t.operator}
              <select value={momo.operator} onChange={(e) => updateMomo('operator', e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900">
                {OPERATORS.map((operator) => <option key={operator} value={operator}>{operator}</option>)}
              </select>
            </label>
            <label className="block text-xs font-semibold text-slate-600">{t.momoNumber}
              <input type="tel" value={momo.number} onChange={(e) => updateMomo('number', e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900" />
            </label>
            <label className="block text-xs font-semibold text-slate-600">{t.momoName}
              <input value={momo.name} onChange={(e) => updateMomo('name', e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900" />
            </label>
            <label className="block text-xs font-semibold text-slate-600">{t.momoAmount}
              <input value={momo.amount} placeholder="15 000 FCFA" onChange={(e) => updateMomo('amount', e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900" />
            </label>
          </div>
          <label className="block text-xs font-semibold text-slate-600">{t.momoReason}
            <input value={momo.reason} onChange={(e) => updateMomo('reason', e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900" />
          </label>
        </div>
      ) : (
        <button type="button" onClick={startMomo} className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:border-slate-500">
          <Smartphone className="h-4 w-4" aria-hidden="true" />{t.momo}
        </button>
      )}

      {/* Presets */}
      <div>
        <div className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{t.presets}</div>
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
          <label className="mb-1 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{t.size}</label>
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
          <label className="mb-1 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{t.background}</label>
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
          {t.preview}
        </div>
        <div className="rounded-xl bg-white p-2 shadow-inner">
          <canvas ref={canvasRef} className="h-auto max-w-full" />
        </div>
      </div>

      {dataUrl && (
        <button onClick={download} className="btn-download flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3">
          <Download className="h-5 w-5" />
          {t.download}
        </button>
      )}
      {dataUrl && momo && (
        <button type="button" onClick={downloadPoster} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-700">
          <Download className="h-5 w-5" aria-hidden="true" />
          {t.poster}
        </button>
      )}
    </div>
  );
}
