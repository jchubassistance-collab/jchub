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
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold mb-2">Texte ou URL à encoder</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="https://jchub.io ou un texte..."
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-500 resize-y"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-500">{text.length} caractères</span>
          <button onClick={copy} className="text-xs text-brand-600 font-semibold flex items-center gap-1">
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copié !' : 'Copier le texte'}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

      {/* Presets */}
      <div>
        <div className="text-xs font-bold text-gray-500 uppercase mb-2">Préréglages</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => setText(p.value)}
              className="p-2.5 border-2 border-gray-200 rounded-xl hover:border-brand-300 hover:bg-brand-50 transition"
            >
              <div className="text-2xl mb-1">{p.icon}</div>
              <div className="text-xs font-semibold">{p.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Options */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Taille</label>
          <select
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-full px-2 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-500"
          >
            <option value={128}>128px</option>
            <option value={256}>256px</option>
            <option value={512}>512px</option>
            <option value={1024}>1024px</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">QR</label>
          <input
            type="color"
            value={fgColor}
            onChange={(e) => setFgColor(e.target.value)}
            className="w-full h-10 border-2 border-gray-200 rounded-lg cursor-pointer"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Fond</label>
          <input
            type="color"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            className="w-full h-10 border-2 border-gray-200 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 flex flex-col items-center">
        <div className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
          <QrIcon className="w-4 h-4" />
          Aperçu
        </div>
        <div className="p-2 bg-white rounded-xl shadow-inner">
          <canvas ref={canvasRef} className="max-w-full h-auto" />
        </div>
      </div>

      {dataUrl && (
        <button onClick={download} className="w-full py-3 bg-gradient-to-r from-brand-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center gap-2">
          <Download className="w-4 h-4" />
          Télécharger en PNG
        </button>
      )}
    </div>
  );
}
