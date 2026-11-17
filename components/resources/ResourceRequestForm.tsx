'use client';

import { type FormEvent, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Download, Loader2, Mail } from 'lucide-react';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { bilingual } from '@/i18n/copy';
import { LOCALE_HEADER } from '@/i18n/request-locale';
import { RESOURCE_TOKEN_PARAM } from '@/lib/resource-requests';
import { trackEvent } from '@/lib/analytics-client';

const copy = bilingual({
  title: 'Reçois le modèle par e-mail',
  text: 'Indique ton adresse : on t’envoie le lien de téléchargement du fichier Word, valable 7 jours.',
  emailLabel: 'Ton adresse e-mail',
  placeholder: 'ton@email.com',
  newsletter: 'Je veux aussi recevoir la newsletter JcHub (nouveaux outils et ressources). Désinscription en un clic.',
  submit: 'Recevoir le lien',
  sending: 'Envoi…',
  sent: (email: string) => `C’est envoyé à ${email}. Ouvre l’e-mail et appuie sur le lien. Rien reçu d’ici quelques minutes ? Regarde dans les spams.`,
  privacyStart: 'Ton adresse sert à t’envoyer ce lien',
  privacyNewsletter: ' et, si tu coches la case, la newsletter',
  privacyEnd: '. Détails dans la ',
  privacyLink: 'politique de confidentialité',
  readyTitle: 'Ton modèle est prêt',
  readyText: 'Appuie sur le bouton pour enregistrer le fichier Word. Ce lien reste valable 7 jours.',
  download: 'Télécharger le fichier Word',
  downloading: 'Préparation…',
  downloaded: 'Fichier téléchargé. Ouvre-le dans Word, LibreOffice ou Google Docs.',
  newLink: 'Demander un nouveau lien',
  generic: 'Une erreur est survenue. Réessaie dans quelques instants.',
}, {
  title: 'Get the template by email',
  text: 'Enter your address: we send you the download link of the Word file, valid for 7 days.',
  emailLabel: 'Your email address',
  placeholder: 'you@email.com',
  newsletter: 'I also want the JcHub newsletter (new tools and resources). Unsubscribe in one click.',
  submit: 'Get the link',
  sending: 'Sending…',
  sent: (email: string) => `Sent to ${email}. Open the email and tap the link. Nothing within a few minutes? Check your spam folder.`,
  privacyStart: 'Your address is used to send you this link',
  privacyNewsletter: ' and, if you tick the box, the newsletter',
  privacyEnd: '. Details in the ',
  privacyLink: 'privacy policy',
  readyTitle: 'Your template is ready',
  readyText: 'Press the button to save the Word file. This link stays valid for 7 days.',
  download: 'Download the Word file',
  downloading: 'Preparing…',
  downloaded: 'File downloaded. Open it in Word, LibreOffice or Google Docs.',
  newLink: 'Ask for a new link',
  generic: 'Something went wrong. Try again in a moment.',
});

const inputClass = 'w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100';
const buttonClass = 'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#93c5fd] px-7 py-3.5 text-sm font-bold text-[#0f172a] shadow-sm transition hover:bg-[#60a5fa] hover:shadow-lg disabled:cursor-wait disabled:opacity-70';

async function errorOf(response: Response, fallback: string): Promise<string> {
  const data = await response.json().catch(() => null) as { error?: unknown } | null;
  return typeof data?.error === 'string' ? data.error : fallback;
}

/**
 * Asks for the emailed link of a template. When the page is opened from that link, the token
 * is in the address and the form becomes the download button.
 */
export function ResourceRequestForm({ resourceId, fileName }: { resourceId: string; fileName: string }) {
  const locale = useLocale();
  const t = copy[locale];
  const token = useSearchParams()?.get(RESOURCE_TOKEN_PARAM) ?? null;
  const [askAgain, setAskAgain] = useState(false);

  return (
    <div className="rounded-[1.5rem] bg-white p-6 shadow-[0_10px_40px_rgba(37,99,235,.08)] sm:p-8">
      {token && !askAgain
        ? <DownloadStep token={token} fileName={fileName} resourceId={resourceId} onAskAgain={() => setAskAgain(true)} t={t} locale={locale} />
        : <RequestStep resourceId={resourceId} t={t} locale={locale} />}
    </div>
  );
}

type Texts = (typeof copy)['fr'];

function RequestStep({ resourceId, t, locale }: { resourceId: string; t: Texts; locale: string }) {
  const [email, setEmail] = useState('');
  const [newsletter, setNewsletter] = useState(false);
  const [state, setState] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState('loading');
    setError('');
    try {
      const response = await fetch('/api/resources/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', [LOCALE_HEADER]: locale },
        body: JSON.stringify({ resource: resourceId, email, newsletter }),
      });
      if (!response.ok) throw new Error(await errorOf(response, t.generic));
      trackEvent('resource_request', { resource: resourceId });
      setState('sent');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.generic);
      setState('error');
    }
  };

  if (state === 'sent') {
    return (
      <div role="status" className="flex gap-3">
        <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" aria-hidden="true" />
        <p className="leading-7 text-slate-700">{t.sent(email)}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-[#0f172a]" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>{t.title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{t.text}</p>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-slate-700">{t.emailLabel}</span>
        <span className="relative block">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input required type="email" autoComplete="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder={t.placeholder} className={inputClass} />
        </span>
      </label>
      <label className="flex items-start gap-3 text-sm leading-6 text-slate-600">
        <input type="checkbox" checked={newsletter} onChange={(event) => setNewsletter(event.target.checked)} className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 accent-blue-600" />
        {t.newsletter}
      </label>
      <button type="submit" disabled={state === 'loading'} className={buttonClass}>
        {state === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
        {state === 'loading' ? t.sending : t.submit}
      </button>
      {state === 'error' && <p role="alert" className="text-sm font-medium text-red-700">{error}</p>}
      <p className="text-xs leading-5 text-slate-500">
        {t.privacyStart}{t.privacyNewsletter}{t.privacyEnd}<Link href="/confidentialite" className="font-semibold text-blue-700 underline-offset-2 hover:underline">{t.privacyLink}</Link>.
      </p>
    </form>
  );
}

function DownloadStep({ token, fileName, resourceId, onAskAgain, t, locale }: { token: string; fileName: string; resourceId: string; onAskAgain: () => void; t: Texts; locale: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  const download = async () => {
    setState('loading');
    setError('');
    try {
      const response = await fetch('/api/resources/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', [LOCALE_HEADER]: locale },
        body: JSON.stringify({ token }),
      });
      if (!response.ok) throw new Error(await errorOf(response, t.generic));
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      trackEvent('resource_download', { resource: resourceId, format: 'docx' });
      setState('done');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.generic);
      setState('error');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-[#0f172a]" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>{t.readyTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{t.readyText}</p>
      </div>
      <button type="button" onClick={download} disabled={state === 'loading'} className={buttonClass}>
        {state === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {state === 'loading' ? t.downloading : t.download}
      </button>
      {state === 'done' && <p role="status" className="flex gap-2 text-sm leading-6 text-slate-700"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />{t.downloaded}</p>}
      {state === 'error' && (
        <div role="alert" className="space-y-2 text-sm">
          <p className="font-medium text-red-700">{error}</p>
          <button type="button" onClick={onAskAgain} className="font-bold text-blue-700 underline-offset-2 hover:underline">{t.newLink}</button>
        </div>
      )}
    </div>
  );
}
