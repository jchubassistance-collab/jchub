'use client';

import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Check, Code2, Copy, Download, Eraser, ImagePlus, Loader2 } from 'lucide-react';
import { useLocale } from 'next-intl';
import { bilingual } from '@/i18n/copy';
import { downloadName } from '@/lib/download-name';
import {
  SIGNATURE_ACCENTS, SIGNATURE_FONTS, SIGNATURE_TEMPLATES, SOCIAL_LABELS, SOCIAL_NETWORKS,
  buildSignatureHtml, buildSignatureText, emptySignature, isSignatureData, safeImageUrl, signatureDocument,
  type SignatureData, type SignatureFont, type SignatureTemplate, type SocialNetwork,
} from '@/lib/email-signature';
import { getPublicBaseUrl } from '@/lib/site-url';
import { Field, FormSection, TextArea, forgetDraft, imageToDataUrl, readDraft, useDraftSaving, useIsClient } from '@/components/tools/DocumentPreview';

const DRAFT_KEY = 'jchub-email-signature-v1';

const copy = bilingual({
  labels: { phone: 'Tél.', mobile: 'Mobile', email: 'E-mail', website: 'Site' },
  template: 'Modèle',
  templates: { classic: 'Classique', modern: 'Moderne', minimal: 'Sobre' } as Record<SignatureTemplate, string>,
  accent: 'Couleur',
  accentName: (color: string) => `Couleur ${color}`,
  font: 'Police',
  identity: 'Identité',
  name: 'Nom complet',
  title: 'Poste',
  company: 'Entreprise',
  contact: 'Coordonnées',
  phone: 'Téléphone',
  mobile: 'Mobile',
  email: 'E-mail',
  website: 'Site web',
  address: 'Adresse',
  image: 'Photo ou logo',
  upload: 'Importer depuis mon appareil',
  uploading: 'Envoi en cours…',
  uploadFailed: 'Impossible d’envoyer cette image. Réessaie ou colle l’adresse d’une image déjà en ligne.',
  uploadNote: 'Ton image est réduite puis hébergée en ligne : les messageries n’affichent que les images accessibles par une adresse publique, pour tous tes correspondants.',
  imageUrl: 'Ou l’adresse d’une image déjà en ligne (https://…)',
  imageInvalid: 'Il faut une adresse publique qui commence par https://.',
  removeImage: 'Retirer l’image',
  photo: 'Photo ronde',
  logo: 'Logo',
  socials: 'Réseaux sociaux',
  extras: 'Bouton et mention légale',
  ctaText: 'Texte du bouton',
  ctaTextHint: 'Prendre rendez-vous',
  ctaUrl: 'Lien du bouton',
  disclaimer: 'Mention en bas de signature',
  disclaimerHint: 'Ce message et ses pièces jointes sont confidentiels…',
  preview: 'Aperçu',
  previewNote: 'Rendu proche de celui de Gmail et d’Outlook.',
  copySignature: 'Copier la signature',
  copyHtml: 'Copier le code HTML',
  copied: 'Copié !',
  copyFailed: 'La copie a échoué : sélectionne l’aperçu à la souris puis fais Ctrl+C.',
  download: 'Télécharger en .html',
  fileName: 'signature-email',
  clear: 'Tout effacer',
  confirmClear: 'Effacer toute la signature ?',
  empty: 'Remplis au moins ton nom pour voir la signature.',
  howTo: 'Comment l’ajouter à ta messagerie',
  steps: [
    ['Gmail', 'Paramètres (roue dentée) › Voir tous les paramètres › Général › Signature › Créer. Colle la signature, puis « Enregistrer les modifications » en bas de page.'],
    ['Outlook (web et nouvel Outlook)', 'Paramètres › Comptes › Signatures › Nouvelle signature. Colle-la puis enregistre.'],
    ['Outlook classique (Windows)', 'Fichier › Options › Courrier › Signatures › Nouveau. Colle-la dans la zone de modification.'],
    ['Apple Mail', 'Réglages › Signatures › +. Décoche « Toujours utiliser ma police par défaut », puis colle la signature.'],
  ] as [string, string][],
  privacy: 'La signature est créée dans ton navigateur et ton brouillon reste sur cet appareil. Seule l’image que tu importes est envoyée, pour être hébergée.',
}, {
  labels: { phone: 'Tel.', mobile: 'Mobile', email: 'Email', website: 'Web' },
  template: 'Template',
  templates: { classic: 'Classic', modern: 'Modern', minimal: 'Plain' } as Record<SignatureTemplate, string>,
  accent: 'Colour',
  accentName: (color: string) => `Colour ${color}`,
  font: 'Font',
  identity: 'Identity',
  name: 'Full name',
  title: 'Job title',
  company: 'Company',
  contact: 'Contact details',
  phone: 'Phone',
  mobile: 'Mobile',
  email: 'Email',
  website: 'Website',
  address: 'Address',
  image: 'Photo or logo',
  upload: 'Upload from my device',
  uploading: 'Uploading…',
  uploadFailed: 'This image could not be uploaded. Try again or paste the address of an image that is already online.',
  uploadNote: 'Your image is resized, then hosted online: mail clients only show images reachable at a public address, for every recipient.',
  imageUrl: 'Or the address of an image already online (https://…)',
  imageInvalid: 'This must be a public address starting with https://.',
  removeImage: 'Remove the image',
  photo: 'Round photo',
  logo: 'Logo',
  socials: 'Social networks',
  extras: 'Button and legal notice',
  ctaText: 'Button text',
  ctaTextHint: 'Book a call',
  ctaUrl: 'Button link',
  disclaimer: 'Notice under the signature',
  disclaimerHint: 'This message and its attachments are confidential…',
  preview: 'Preview',
  previewNote: 'Close to how Gmail and Outlook display it.',
  copySignature: 'Copy the signature',
  copyHtml: 'Copy the HTML code',
  copied: 'Copied!',
  copyFailed: 'Copying failed: select the preview with your mouse, then press Ctrl+C.',
  download: 'Download as .html',
  fileName: 'email-signature',
  clear: 'Clear everything',
  confirmClear: 'Clear the whole signature?',
  empty: 'Fill in at least your name to see the signature.',
  howTo: 'How to add it to your mail client',
  steps: [
    ['Gmail', 'Settings (gear) › See all settings › General › Signature › Create new. Paste the signature, then “Save changes” at the bottom of the page.'],
    ['Outlook (web and new Outlook)', 'Settings › Accounts › Signatures › New signature. Paste it and save.'],
    ['Classic Outlook (Windows)', 'File › Options › Mail › Signatures › New. Paste it into the edit box.'],
    ['Apple Mail', 'Settings › Signatures › +. Untick “Always match my default message font”, then paste the signature.'],
  ] as [string, string][],
  privacy: 'The signature is built in your browser and your draft stays on this device. Only an image you upload is sent, to be hosted.',
});

const FONT_NAMES: Record<SignatureFont, string> = { arial: 'Arial', verdana: 'Verdana', trebuchet: 'Trebuchet', georgia: 'Georgia' };

function sampleSignature(locale: string): SignatureData {
  const fr = locale === 'fr';
  return {
    ...emptySignature(),
    name: 'Awa Mbemba',
    title: fr ? 'Responsable commerciale' : 'Sales manager',
    company: 'Atelier Kintana',
    phone: '+242 06 555 12 34',
    email: 'awa@atelier-kintana.com',
    website: 'atelier-kintana.com',
    address: fr ? 'Avenue de la Paix, Brazzaville' : 'Avenue de la Paix, Brazzaville, Congo',
    socials: { ...emptySignature().socials, linkedin: 'linkedin.com/in/awa-mbemba' },
  };
}

export function EmailSignatureGenerator() {
  const locale = useLocale();
  const isClient = useIsClient();
  // The draft lives in this browser: the server renders a placeholder.
  if (!isClient) return <div className="h-[32rem] animate-pulse rounded-xl bg-slate-100" />;
  const draft = readDraft(DRAFT_KEY, isSignatureData);
  return <SignatureEditor initial={draft ? { ...emptySignature(), ...draft, socials: { ...emptySignature().socials, ...draft.socials } } : sampleSignature(locale)} />;
}

function SignatureEditor({ initial }: { initial: SignatureData }) {
  const t = copy[useLocale()];
  const [data, setData] = useState(initial);
  const [copied, setCopied] = useState<'' | 'rich' | 'html'>('');
  const [copyError, setCopyError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  useDraftSaving(DRAFT_KEY, data);

  // The copied signature points to the public site; the preview to this one, so icons show before a deploy too.
  const html = useMemo(() => buildSignatureHtml(data, t.labels, getPublicBaseUrl()), [data, t]);
  const previewHtml = useMemo(() => buildSignatureHtml(data, t.labels, window.location.origin), [data, t]);
  const text = useMemo(() => buildSignatureText(data, t.labels), [data, t]);
  const ready = Boolean(data.name.trim());
  const imageInvalid = Boolean(data.image.trim()) && !safeImageUrl(data.image);

  const set = <K extends keyof SignatureData>(key: K, value: SignatureData[K]) => setData((current) => ({ ...current, [key]: value }));
  const setSocial = (network: SocialNetwork, value: string) => setData((current) => ({ ...current, socials: { ...current.socials, [network]: value } }));

  const uploadImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true);
    setUploadError(false);
    try {
      // Shrunk here first: a phone photo of several MB becomes a few KB before leaving the device.
      const { src } = await imageToDataUrl(file, 240, { square: data.imageKind === 'photo', type: 'image/png' });
      const form = new FormData();
      // Decoded by hand: the site's CSP does not let fetch() read data: URLs.
      const bytes = Uint8Array.from(atob(src.slice(src.indexOf(',') + 1)), (char) => char.charCodeAt(0));
      form.append('file', new Blob([bytes], { type: 'image/png' }), 'signature.png');
      form.append('kind', data.imageKind);
      const response = await fetch('/api/tools/email-signature-image', { method: 'POST', body: form });
      const result = await response.json().catch(() => ({})) as { url?: string };
      if (!response.ok || !result.url) throw new Error('upload failed');
      set('image', result.url);
    } catch {
      setUploadError(true);
    } finally {
      setUploading(false);
    }
  };

  const confirmCopy = (kind: 'rich' | 'html') => {
    setCopyError(false);
    setCopied(kind);
    setTimeout(() => setCopied(''), 2000);
  };

  // The formatted signature, as when it is selected and copied from a page: mail clients paste it as is.
  const copySignature = async () => {
    try {
      await navigator.clipboard.write([new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([text], { type: 'text/plain' }),
      })]);
      confirmCopy('rich');
      return;
    } catch {
      // Older browsers: copy the selected preview instead.
    }
    const preview = previewRef.current;
    const selection = window.getSelection();
    if (!preview || !selection) return setCopyError(true);
    const range = document.createRange();
    range.selectNodeContents(preview);
    selection.removeAllRanges();
    selection.addRange(range);
    const done = document.execCommand('copy');
    selection.removeAllRanges();
    if (done) confirmCopy('rich');
    else setCopyError(true);
  };

  const copyHtml = async () => {
    try {
      await navigator.clipboard.writeText(html);
      confirmCopy('html');
    } catch {
      setCopyError(true);
    }
  };

  const download = () => {
    const blob = new Blob([signatureDocument(html, data.name.trim() || t.fileName)], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = downloadName(data.name.trim() ? `${t.fileName}-${data.name.trim().toLowerCase().replace(/\s+/g, '-')}` : t.fileName, 'html', '', t.fileName);
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const clearAll = () => {
    if (!window.confirm(t.confirmClear)) return;
    forgetDraft(DRAFT_KEY);
    setData({ ...emptySignature(), template: data.template, accent: data.accent, font: data.font });
  };

  const chipClass = (active: boolean) => `min-h-9 rounded-lg border px-3 text-sm font-semibold transition ${active ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'}`;
  const secondaryButton = 'flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-400 disabled:opacity-40';

  return <div className="space-y-5 text-slate-700">
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t.template}>
        {SIGNATURE_TEMPLATES.map((template) => <button key={template} type="button" aria-pressed={data.template === template} onClick={() => set('template', template)} className={chipClass(data.template === template)}>{t.templates[template]}</button>)}
      </div>
      <div className="flex items-center gap-2" role="group" aria-label={t.accent}>
        <span className="text-sm font-semibold text-slate-700">{t.accent}</span>
        {SIGNATURE_ACCENTS.map((color) => <button key={color} type="button" aria-label={t.accentName(color)} aria-pressed={data.accent === color} onClick={() => set('accent', color)} className={`h-7 w-7 rounded-full border-2 transition ${data.accent === color ? 'border-slate-900 ring-2 ring-slate-300' : 'border-white ring-1 ring-slate-300'}`} style={{ backgroundColor: color }} />)}
      </div>
      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">{t.font}
        <select value={data.font} onChange={(event) => set('font', event.target.value as SignatureFont)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900">
          {(Object.keys(SIGNATURE_FONTS) as SignatureFont[]).map((font) => <option key={font} value={font}>{FONT_NAMES[font]}</option>)}
        </select>
      </label>
    </div>

    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-3">
        <FormSection title={t.identity}>
          <Field label={t.name} value={data.name} autoComplete="name" onChange={(event) => set('name', event.target.value)} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t.title} value={data.title} autoComplete="organization-title" onChange={(event) => set('title', event.target.value)} />
            <Field label={t.company} value={data.company} autoComplete="organization" onChange={(event) => set('company', event.target.value)} />
          </div>
        </FormSection>

        <FormSection title={t.contact}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t.phone} type="tel" value={data.phone} onChange={(event) => set('phone', event.target.value)} />
            <Field label={t.mobile} type="tel" value={data.mobile} onChange={(event) => set('mobile', event.target.value)} />
            <Field label={t.email} type="email" value={data.email} onChange={(event) => set('email', event.target.value)} />
            <Field label={t.website} value={data.website} inputMode="url" onChange={(event) => set('website', event.target.value)} />
          </div>
          <TextArea label={t.address} value={data.address} rows={2} onChange={(event) => set('address', event.target.value)} />
        </FormSection>

        <FormSection title={t.image} open={Boolean(data.image)}>
          <div className="flex gap-2" role="group" aria-label={t.image}>
            <button type="button" aria-pressed={data.imageKind === 'photo'} onClick={() => set('imageKind', 'photo')} className={chipClass(data.imageKind === 'photo')}>{t.photo}</button>
            <button type="button" aria-pressed={data.imageKind === 'logo'} onClick={() => set('imageKind', 'logo')} className={chipClass(data.imageKind === 'logo')}>{t.logo}</button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input ref={imageInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={uploadImage} />
            {safeImageUrl(data.image)
              ? <img src={safeImageUrl(data.image)} alt="" className={`h-12 max-w-[8rem] object-contain ${data.imageKind === 'photo' ? 'w-12 rounded-full object-cover' : ''}`} />
              : <span className="grid h-12 w-12 place-items-center rounded-lg bg-slate-100 text-slate-400"><ImagePlus className="h-5 w-5" aria-hidden="true" /></span>}
            <button type="button" disabled={uploading} onClick={() => imageInput.current?.click()} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:border-slate-400 disabled:opacity-60">
              {uploading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}{uploading ? t.uploading : t.upload}
            </button>
            {data.image && !uploading && <button type="button" onClick={() => set('image', '')} className="text-sm font-semibold text-slate-500 hover:text-rose-600">{t.removeImage}</button>}
          </div>
          {uploadError && <p role="alert" className="text-sm text-rose-700">{t.uploadFailed}</p>}
          <p className="text-xs text-slate-500">{t.uploadNote}</p>
          <Field label={t.imageUrl} value={data.image} inputMode="url" placeholder="https://" aria-invalid={imageInvalid} onChange={(event) => set('image', event.target.value)} />
          {imageInvalid && <p role="alert" className="text-sm text-rose-700">{t.imageInvalid}</p>}
        </FormSection>

        <FormSection title={t.socials} open={SOCIAL_NETWORKS.some((network) => data.socials[network])}>
          <div className="grid gap-3 sm:grid-cols-2">
            {SOCIAL_NETWORKS.map((network) => <Field key={network} label={SOCIAL_LABELS[network]} value={data.socials[network]} inputMode="url" placeholder="https://" onChange={(event) => setSocial(network, event.target.value)} />)}
          </div>
        </FormSection>

        <FormSection title={t.extras} open={Boolean(data.ctaText || data.disclaimer)}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t.ctaText} value={data.ctaText} placeholder={t.ctaTextHint} onChange={(event) => set('ctaText', event.target.value)} />
            <Field label={t.ctaUrl} value={data.ctaUrl} inputMode="url" placeholder="https://" onChange={(event) => set('ctaUrl', event.target.value)} />
          </div>
          <TextArea label={t.disclaimer} value={data.disclaimer} rows={3} placeholder={t.disclaimerHint} onChange={(event) => set('disclaimer', event.target.value)} />
        </FormSection>
      </div>

      <div className="space-y-3 lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-baseline justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-bold text-slate-900">{t.preview}</h3>
            <span className="text-xs text-slate-500">{t.previewNote}</span>
          </div>
          {/* keep-light: the preview shows the signature as a white e-mail does, in dark mode too. */}
          <div className="keep-light overflow-x-auto rounded-b-xl bg-white px-4 py-6">
            {ready
              // The HTML is built by lib/email-signature.ts, which escapes every field and keeps only http(s) links.
              ? <div ref={previewRef} dangerouslySetInnerHTML={{ __html: previewHtml }} />
              : <p className="text-sm text-slate-500">{t.empty}</p>}
          </div>
        </div>
        <button type="button" disabled={!ready} onClick={copySignature} className="btn-download flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 py-3">
          {copied === 'rich' ? <Check className="h-5 w-5" aria-hidden="true" /> : <Copy className="h-5 w-5" aria-hidden="true" />}{copied === 'rich' ? t.copied : t.copySignature}
        </button>
        <div className="grid gap-2 sm:grid-cols-2">
          <button type="button" disabled={!ready} onClick={copyHtml} className={secondaryButton}>
            {copied === 'html' ? <Check className="h-4 w-4" aria-hidden="true" /> : <Code2 className="h-4 w-4" aria-hidden="true" />}{copied === 'html' ? t.copied : t.copyHtml}
          </button>
          <button type="button" disabled={!ready} onClick={download} className={secondaryButton}><Download className="h-4 w-4" aria-hidden="true" />{t.download}</button>
        </div>
        {copyError && <p role="alert" className="text-sm text-rose-700">{t.copyFailed}</p>}
        <details className="rounded-xl border border-slate-200 bg-white">
          <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-slate-900">{t.howTo}</summary>
          <dl className="space-y-3 border-t border-slate-100 px-4 py-4 text-sm">
            {t.steps.map(([client, how]) => <div key={client}><dt className="font-semibold text-slate-900">{client}</dt><dd className="text-slate-600">{how}</dd></div>)}
          </dl>
        </details>
        <button type="button" onClick={clearAll} className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-slate-500 hover:text-rose-600"><Eraser className="h-4 w-4" aria-hidden="true" />{t.clear}</button>
      </div>
    </div>
    <p className="text-xs text-slate-500">{t.privacy}</p>
  </div>;
}
