'use client';

import { Download, ExternalLink, Smartphone } from 'lucide-react';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';

const APP_URL = 'https://jchub.dev';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export function PwaInstall() {
  const [qrCode, setQrCode] = useState('');
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    QRCode.toDataURL(APP_URL, {
      width: 220,
      margin: 2,
      color: { dark: '#071526', light: '#ffffff' },
    }).then(setQrCode).catch(() => undefined);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const installApp = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  return (
    <section className="hidden overflow-hidden rounded-[1.5rem] border border-blue-100 bg-white p-6 shadow-[0_12px_40px_rgba(37,99,235,.07)] sm:block sm:p-8">
      <div className="flex flex-col items-center gap-7 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xl">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
            <Smartphone className="h-4 w-4" /> JcHub sur ton mobile
          </div>
          <h2 className="mt-3 text-2xl font-black text-[#0f172a] sm:text-3xl">Garde tes outils à portée de main.</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Scanne le QR code avec ton téléphone, puis ajoute JcHub à ton écran d’accueil depuis ton navigateur.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {installPrompt && (
              <button type="button" onClick={installApp} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500">
                <Download className="h-4 w-4" /> Installer maintenant
              </button>
            )}
            <a href={APP_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-800 transition hover:bg-blue-100">
              Ouvrir JcHub <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="shrink-0 rounded-2xl bg-white p-3 shadow-[0_12px_28px_rgba(15,23,42,.12)]">
          {qrCode ? <img src={qrCode} alt="QR code pour ouvrir JcHub" className="h-40 w-40 sm:h-44 sm:w-44" /> : <div className="h-40 w-40 animate-pulse bg-slate-200 sm:h-44 sm:w-44" aria-label="Génération du QR code" />}
        </div>
      </div>
    </section>
  );
}
