'use client';

import { useState } from 'react';
import { Copy, Check, Hash } from 'lucide-react';

// MD5 implementation (pure JS, public domain algorithm)
function md5(str: string): string {
  function rh(n: number) {
    let s = '';
    for (let j = 0; j <= 3; j++) s += ((n >> (j * 8 + 4)) & 0x0F).toString(16) + ((n >> (j * 8)) & 0x0F).toString(16);
    return s;
  }
  function ad(x: number, y: number) {
    const l = (x & 0xFFFF) + (y & 0xFFFF);
    const m = (x >> 16) + (y >> 16) + (l >> 16);
    return (m << 16) | (l & 0xFFFF);
  }
  function rl(n: number, c: number) { return (n << c) | (n >>> (32 - c)); }
  function cm(q: number, a: number, b: number, x: number, s: number, t: number) { return ad(rl(ad(ad(a, q), ad(x, t)), s), b); }
  function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return cm((b & c) | (~b & d), a, b, x, s, t); }
  function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return cm((b & d) | (c & ~d), a, b, x, s, t); }
  function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return cm(b ^ c ^ d, a, b, x, s, t); }
  function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return cm(c ^ (b | ~d), a, b, x, s, t); }
  function sb(s: string) {
    const bytes = new TextEncoder().encode(s);
    const nblk = ((bytes.length + 8) >> 6) + 1;
    const bl = new Array<number>(nblk * 16);
    let i: number;
    for (i = 0; i < nblk * 16; i++) bl[i] = 0;
    for (i = 0; i < bytes.length; i++) bl[i >> 2] |= bytes[i] << ((i % 4) * 8);
    bl[i >> 2] |= 0x80 << ((i % 4) * 8);
    bl[nblk * 16 - 2] = bytes.length * 8;
    return bl;
  }
  const x = sb(str);
  let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
  for (let i = 0; i < x.length; i += 16) {
    const oa = a, ob = b, oc = c, od = d;
    a = ff(a, b, c, d, x[i + 0], 7, -680876936); d = ff(d, a, b, c, x[i + 1], 12, -389564586);
    c = ff(c, d, a, b, x[i + 2], 17, 606105819); b = ff(b, c, d, a, x[i + 3], 22, -1044525330);
    a = ff(a, b, c, d, x[i + 4], 7, -176418897); d = ff(d, a, b, c, x[i + 5], 12, 1200080426);
    c = ff(c, d, a, b, x[i + 6], 17, -1473231341); b = ff(b, c, d, a, x[i + 7], 22, -45705983);
    a = ff(a, b, c, d, x[i + 8], 7, 1770035416); d = ff(d, a, b, c, x[i + 9], 12, -1958414417);
    c = ff(c, d, a, b, x[i + 10], 17, -42063); b = ff(b, c, d, a, x[i + 11], 22, -1990404162);
    a = ff(a, b, c, d, x[i + 12], 7, 1804603682); d = ff(d, a, b, c, x[i + 13], 12, -40341101);
    c = ff(c, d, a, b, x[i + 14], 17, -1502002290); b = ff(b, c, d, a, x[i + 15], 22, 1236535329);
    a = gg(a, b, c, d, x[i + 1], 5, -165796510); d = gg(d, a, b, c, x[i + 6], 9, -1069501632);
    c = gg(c, d, a, b, x[i + 11], 14, 643717713); b = gg(b, c, d, a, x[i + 0], 20, -373897302);
    a = gg(a, b, c, d, x[i + 5], 5, -701558691); d = gg(d, a, b, c, x[i + 10], 9, 38016083);
    c = gg(c, d, a, b, x[i + 15], 14, -660478335); b = gg(b, c, d, a, x[i + 4], 20, -405537848);
    a = gg(a, b, c, d, x[i + 9], 5, 568446438); d = gg(d, a, b, c, x[i + 14], 9, -1019803690);
    c = gg(c, d, a, b, x[i + 3], 14, -187363961); b = gg(b, c, d, a, x[i + 8], 20, 1163531501);
    a = gg(a, b, c, d, x[i + 13], 5, -1444681467); d = gg(d, a, b, c, x[i + 2], 9, -51403784);
    c = gg(c, d, a, b, x[i + 7], 14, 1735328473); b = gg(b, c, d, a, x[i + 12], 20, -1926607734);
    a = hh(a, b, c, d, x[i + 5], 4, -378558); d = hh(d, a, b, c, x[i + 8], 11, -2022574463);
    c = hh(c, d, a, b, x[i + 11], 16, 1839030562); b = hh(b, c, d, a, x[i + 14], 23, -35309556);
    a = hh(a, b, c, d, x[i + 1], 4, -1530992060); d = hh(d, a, b, c, x[i + 4], 11, 1272893353);
    c = hh(c, d, a, b, x[i + 7], 16, -155497632); b = hh(b, c, d, a, x[i + 10], 23, -1094730640);
    a = hh(a, b, c, d, x[i + 13], 4, 681279174); d = hh(d, a, b, c, x[i + 0], 11, -358537222);
    c = hh(c, d, a, b, x[i + 3], 16, -722521979); b = hh(b, c, d, a, x[i + 6], 23, 76029189);
    a = hh(a, b, c, d, x[i + 9], 4, -640364487); d = hh(d, a, b, c, x[i + 12], 11, -421815835);
    c = hh(c, d, a, b, x[i + 15], 16, 530742520); b = hh(b, c, d, a, x[i + 2], 23, -995338651);
    a = ii(a, b, c, d, x[i + 0], 6, -198630844); d = ii(d, a, b, c, x[i + 7], 10, 1126891415);
    c = ii(c, d, a, b, x[i + 14], 15, -1416354905); b = ii(b, c, d, a, x[i + 5], 21, -57434055);
    a = ii(a, b, c, d, x[i + 12], 6, 1700485571); d = ii(d, a, b, c, x[i + 3], 10, -1894986606);
    c = ii(c, d, a, b, x[i + 10], 15, -1051523); b = ii(b, c, d, a, x[i + 1], 21, -2054922799);
    a = ii(a, b, c, d, x[i + 8], 6, 1873313359); d = ii(d, a, b, c, x[i + 15], 10, -30611744);
    c = ii(c, d, a, b, x[i + 6], 15, -1560198380); b = ii(b, c, d, a, x[i + 13], 21, 1309151649);
    a = ii(a, b, c, d, x[i + 4], 6, -145523070); d = ii(d, a, b, c, x[i + 11], 10, -1120210379);
    c = ii(c, d, a, b, x[i + 2], 15, 718787259); b = ii(b, c, d, a, x[i + 9], 21, -343485551);
    a = ad(a, oa); b = ad(b, ob); c = ad(c, oc); d = ad(d, od);
  }
  return rh(a) + rh(b) + rh(c) + rh(d);
}

async function sha(algorithm: string, text: string): Promise<string> {
  const buffer = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest(algorithm, buffer);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function HashGenerator() {
  const [input, setInput] = useState('');
  const [hashes, setHashes] = useState<{ md5: string; sha1: string; sha256: string; sha512: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const generate = async () => {
    if (!input) {
      setHashes(null);
      return;
    }
    const [sha1Hash, sha256Hash, sha512Hash] = await Promise.all([
      sha('SHA-1', input),
      sha('SHA-256', input),
      sha('SHA-512', input),
    ]);
    setHashes({ md5: md5(input), sha1: sha1Hash, sha256: sha256Hash, sha512: sha512Hash });
  };

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-4 text-slate-100">
      <div>
        <label className="block text-sm font-semibold mb-2 text-slate-200">Texte à hasher</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={4}
          placeholder="Tape ou colle ton texte ici..."
          className="w-full px-4 py-3 rounded-xl border border-[#9ccbff]/20 bg-[#071526] text-white font-mono text-sm focus:outline-none focus:border-[#9ccbff]/60 resize-y"
        />
      </div>

      <button onClick={generate} className="w-full py-3 bg-gradient-to-r from-brand-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center gap-2">
        <Hash className="w-4 h-4" />
        Générer les hash
      </button>

      {hashes && (
        <div className="space-y-2">
          {[
            { name: 'MD5', value: hashes.md5, algo: '⚠️ Non sécurisé (legacy)' },
            { name: 'SHA-1', value: hashes.sha1, algo: '⚠️ Déprécié' },
            { name: 'SHA-256', value: hashes.sha256, algo: '✅ Recommandé' },
            { name: 'SHA-512', value: hashes.sha512, algo: '✅ Très sécurisé' },
          ].map((h) => (
            <div key={h.name} className="overflow-hidden rounded-xl border border-[#9ccbff]/20 bg-[#0b1830]/80 shadow-[0_12px_28px_rgba(7,19,40,0.28)]">
              <div className="flex items-center justify-between border-b border-[#9ccbff]/15 bg-[#071526]/90 p-3">
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    {h.name}
                    <span className="text-xs font-normal text-slate-400">{h.algo}</span>
                  </div>
                </div>
                <button onClick={() => copy(h.value, h.name)} className="text-xs text-[#9ccbff] font-semibold flex items-center gap-1 hover:text-white transition">
                  {copied === h.name ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied === h.name ? 'Copié' : 'Copier'}
                </button>
              </div>
              <pre className="overflow-x-auto break-all p-3 text-xs font-mono text-slate-100">{h.value}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
