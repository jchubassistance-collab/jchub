'use client';

import { useState } from 'react';
import { Copy, Check, AlertCircle, Shield, Clock, Key } from 'lucide-react';

export function JwtDecoder() {
  const [token, setToken] = useState('');
  const [decoded, setDecoded] = useState<{ header: Record<string, unknown> | null; payload: Record<string, unknown> | null; signature: string; valid: boolean; error?: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const decode = () => {
    try {
      const parts = token.trim().split('.');
      if (parts.length !== 3) {
        setDecoded({ header: null, payload: null, signature: '', valid: false, error: 'JWT invalide : doit avoir 3 parties séparées par des points' });
        return;
      }
      if (!parts[0] || !parts[1]) throw new Error('JWT invalide : header et payload requis');
      const decodeBase64Url = (str: string) => {
        const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
        const bytes = Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
        return new TextDecoder().decode(bytes);
      };
      const header = JSON.parse(decodeBase64Url(parts[0])) as Record<string, unknown>;
      const payload = JSON.parse(decodeBase64Url(parts[1])) as Record<string, unknown>;
      setDecoded({ header, payload, signature: parts[2], valid: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'JWT invalide';
      setDecoded({ header: null, payload: null, signature: '', valid: false, error: message });
    }
  };

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const expiry = typeof decoded?.payload?.exp === 'number' ? decoded.payload.exp * 1000 : null;
  const isExpired = expiry !== null ? expiry < Date.now() : null;
  const expiresIn = expiry !== null ? Math.ceil(Math.abs(expiry - Date.now()) / 1000 / 60 / 60 / 24) : null;

  return (
    <div className="space-y-4 text-slate-100">
      <div>
        <label className="block text-sm font-semibold mb-2 text-slate-200">Coller ton JWT</label>
        <textarea
          value={token}
          onChange={(e) => setToken(e.target.value)}
          rows={4}
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
          className="w-full px-4 py-3 rounded-xl border border-[#9ccbff]/20 bg-[#071526] font-mono text-xs text-white focus:outline-none focus:border-[#9ccbff]/60 resize-y break-all"
        />
      </div>

      <button onClick={decode} className="w-full py-3 bg-gradient-to-r from-brand-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition">
        Décoder le JWT
      </button>

      {decoded?.error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          {decoded.error}
        </div>
      )}

      {decoded?.valid && (
        <div className="space-y-3">
          {isExpired !== null && (
            <div className={`flex items-center gap-2 rounded-xl p-3 text-sm font-semibold ${isExpired ? 'border border-red-400/30 bg-red-500/10 text-red-200' : 'border border-emerald-400/30 bg-emerald-500/10 text-emerald-200'}`}>
              {isExpired ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
              {isExpired ? `Token expiré depuis ${Math.abs(expiresIn!)} jour(s)` : `Token valide — expire dans ${expiresIn} jour(s)`}
            </div>
          )}

          {/* Header */}
          <div className="overflow-hidden rounded-xl border border-[#9ccbff]/20 bg-[#0b1830]/80 shadow-[0_12px_28px_rgba(7,19,40,0.28)]">
            <div className="flex items-center justify-between border-b border-[#9ccbff]/15 bg-[#071526]/90 p-3">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-[#9ccbff]" />
                <span className="text-sm font-bold text-white">Header</span>
              </div>
              <button onClick={() => copy(JSON.stringify(decoded.header, null, 2), 'h')} className="text-xs text-[#9ccbff] font-semibold flex items-center gap-1 hover:text-white transition">
                {copied === 'h' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied === 'h' ? 'Copié' : 'Copier'}
              </button>
            </div>
            <pre className="overflow-x-auto p-3 text-xs font-mono text-slate-100">{JSON.stringify(decoded.header, null, 2)}</pre>
          </div>

          {/* Payload */}
          <div className="overflow-hidden rounded-xl border border-[#9ccbff]/20 bg-[#0b1830]/80 shadow-[0_12px_28px_rgba(7,19,40,0.28)]">
            <div className="flex items-center justify-between border-b border-[#9ccbff]/15 bg-[#071526]/90 p-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#9ccbff]" />
                <span className="text-sm font-bold text-white">Payload</span>
              </div>
              <button onClick={() => copy(JSON.stringify(decoded.payload, null, 2), 'p')} className="text-xs text-[#9ccbff] font-semibold flex items-center gap-1 hover:text-white transition">
                {copied === 'p' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied === 'p' ? 'Copié' : 'Copier'}
              </button>
            </div>
            <pre className="overflow-x-auto p-3 text-xs font-mono text-slate-100">{JSON.stringify(decoded.payload, null, 2)}</pre>
          </div>

          {/* Signature */}
          <div className="overflow-hidden rounded-xl border border-[#9ccbff]/20 bg-[#0b1830]/80 shadow-[0_12px_28px_rgba(7,19,40,0.28)]">
            <div className="flex items-center justify-between border-b border-[#9ccbff]/15 bg-[#071526]/90 p-3">
              <span className="text-sm font-bold text-white">Signature</span>
              <button onClick={() => copy(decoded.signature, 's')} className="text-xs text-[#9ccbff] font-semibold flex items-center gap-1 hover:text-white transition">
                {copied === 's' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied === 's' ? 'Copié' : 'Copier'}
              </button>
            </div>
            <pre className="overflow-x-auto break-all p-3 text-xs font-mono text-slate-100">{decoded.signature}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
