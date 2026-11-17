'use client';

import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Download, Eraser, ImagePlus } from 'lucide-react';
import { useLocale } from 'next-intl';
import { bilingual } from '@/i18n/copy';
import { downloadName } from '@/lib/download-name';
import { amountInWords } from '@/lib/amount-words';
import { CURRENCIES, INVOICE_ACCENTS, parseAmount } from '@/lib/invoice';
import { PAYMENT_METHODS, completeReceipt, emptyReceipt, layoutReceipt, type PaymentMethod, type ReceiptData, type ReceiptLabels } from '@/lib/receipt';
import { DocumentPreview, Field, FormSection, TextArea, forgetDraft, imageToDataUrl, readDraft, savePdf, useDraftSaving, useIsClient, usePdfKit } from '@/components/tools/DocumentPreview';

const DRAFT_KEY = 'jchub-receipt-v1';

const METHOD_NAMES = bilingual<Record<'cash' | 'transfer' | 'check' | 'other', string>>(
  { cash: 'Espèces', transfer: 'Virement bancaire', check: 'Chèque', other: 'Autre' },
  { cash: 'Cash', transfer: 'Bank transfer', check: 'Check', other: 'Other' },
);
const methodName = (locale: string) => (method: PaymentMethod) => (method in METHOD_NAMES.fr ? METHOD_NAMES[locale === 'en' ? 'en' : 'fr'][method as keyof typeof METHOD_NAMES.fr] : method);

const copy = bilingual({
  document: {
    title: 'Reçu', number: 'N°', date: 'Date', place: 'Lieu', received: 'Reçu de', payer: 'Payeur', phone: 'tél.',
    sum: 'La somme de', amountBox: 'Montant reçu', reason: 'Pour', method: 'Moyen de paiement', reference: 'Réf. transaction :',
    balance: 'Reste à payer', settled: 'Soldé', signature: 'Signature et cachet', registry: 'RCCM / NIU :',
  } as Omit<ReceiptLabels, 'methodName'>,
  fileName: 'recu',
  details: 'Références',
  number: 'Numéro du reçu',
  date: 'Date',
  place: 'Lieu (ville)',
  business: 'Ton entreprise (qui reçoit)',
  logo: 'Ajouter un logo',
  changeLogo: 'Changer le logo',
  removeLogo: 'Retirer',
  logoFailed: 'Impossible de lire cette image.',
  name: 'Nom ou raison sociale',
  address: 'Adresse',
  phone: 'Téléphone',
  registry: 'RCCM ou NIU',
  payer: 'Client (qui paie)',
  payerName: 'Nom du client',
  payerPhone: 'Téléphone du client',
  payment: 'Paiement',
  amount: 'Montant reçu',
  currency: 'Devise',
  reason: 'Motif',
  reasonHint: 'Ex. Acompte sur la facture 2026-014, loyer de novembre…',
  method: 'Moyen de paiement',
  reference: 'ID de transaction',
  referenceHint: 'Ex. MP241117.1532.A12345',
  balance: 'Reste à payer (facultatif)',
  inWords: 'En lettres',
  accent: 'Couleur',
  download: 'Télécharger le PDF',
  clear: 'Tout effacer',
  confirmClear: 'Effacer tout le reçu ?',
  preview: 'Aperçu du reçu',
  page: (current: number, total: number) => `Page ${current} sur ${total}`,
  previous: 'Page précédente',
  next: 'Page suivante',
  privacy: 'Tout se passe dans ton navigateur : rien n’est envoyé à un serveur. Le reçu reste enregistré sur cet appareil.',
}, {
  document: {
    title: 'Receipt', number: 'No.', date: 'Date', place: 'Place', received: 'Received from', payer: 'Payer', phone: 'tel.',
    sum: 'The sum of', amountBox: 'Amount received', reason: 'For', method: 'Payment method', reference: 'Transaction ID:',
    balance: 'Balance due', settled: 'Paid in full', signature: 'Signature and stamp', registry: 'Reg. no.:',
  } as Omit<ReceiptLabels, 'methodName'>,
  fileName: 'receipt',
  details: 'References',
  number: 'Receipt number',
  date: 'Date',
  place: 'Place (city)',
  business: 'Your business (receiving)',
  logo: 'Add a logo',
  changeLogo: 'Change the logo',
  removeLogo: 'Remove',
  logoFailed: 'Could not read this image.',
  name: 'Name or company',
  address: 'Address',
  phone: 'Phone',
  registry: 'Company registration no.',
  payer: 'Customer (paying)',
  payerName: 'Customer name',
  payerPhone: 'Customer phone',
  payment: 'Payment',
  amount: 'Amount received',
  currency: 'Currency',
  reason: 'Reason',
  reasonHint: 'E.g. Deposit on invoice 2026-014, November rent…',
  method: 'Payment method',
  reference: 'Transaction ID',
  referenceHint: 'E.g. MP241117.1532.A12345',
  balance: 'Balance due (optional)',
  inWords: 'In words',
  accent: 'Color',
  download: 'Download the PDF',
  clear: 'Clear all',
  confirmClear: 'Clear the whole receipt?',
  preview: 'Receipt preview',
  page: (current: number, total: number) => `Page ${current} of ${total}`,
  previous: 'Previous page',
  next: 'Next page',
  privacy: 'Everything happens in your browser: nothing is sent to a server. The receipt stays saved on this device.',
});

/** A filled-in example, so the first visit shows what the receipt looks like. */
function sampleReceipt(locale: string): ReceiptData {
  const fr = locale !== 'en';
  return {
    ...emptyReceipt(),
    place: 'Libreville',
    business: { name: 'Boutique Nkoghe', address: fr ? 'Quartier Louis, Libreville' : 'Louis district, Libreville', phone: '+241 77 12 34 56', registry: 'GA-LBV-01-2024-A10-00123' },
    payer: { name: 'Mme Ella Mba', phone: '+241 66 98 76 54' },
    amount: fr ? '75 000' : '75,000',
    reason: fr ? 'Acompte sur la commande de 4 tenues (facture 2026-014)' : 'Deposit on the order of 4 outfits (invoice 2026-014)',
    method: 'Airtel Money',
    reference: 'CI241117.1532.B40211',
    balance: fr ? '45 000' : '45,000',
  };
}

function isReceiptData(value: unknown): value is ReceiptData {
  const receipt = value as ReceiptData;
  return Boolean(receipt) && typeof receipt === 'object' && typeof receipt.business === 'object' && typeof receipt.payer === 'object';
}

export function ReceiptGenerator() {
  const locale = useLocale();
  const isClient = useIsClient();
  if (!isClient) return <div className="h-[32rem] animate-pulse rounded-xl bg-slate-100" />;
  const draft = readDraft(DRAFT_KEY, isReceiptData);
  return <ReceiptEditor initial={draft ? completeReceipt(draft) : sampleReceipt(locale)} />;
}

function ReceiptEditor({ initial }: { initial: ReceiptData }) {
  const locale = useLocale();
  const t = copy[locale];
  const kit = usePdfKit();
  const logoInput = useRef<HTMLInputElement>(null);
  const [receipt, setReceipt] = useState(initial);
  const [logoError, setLogoError] = useState('');
  useDraftSaving(DRAFT_KEY, receipt);

  const amount = parseAmount(receipt.amount, locale);
  const balance = receipt.balance.trim() ? parseAmount(receipt.balance, locale) : null;
  const labels = useMemo<ReceiptLabels>(() => ({ ...t.document, methodName: methodName(locale) }), [t, locale]);
  const pages = useMemo(() => (kit ? layoutReceipt(receipt, labels, locale, amount, balance, kit.measure) : null), [kit, receipt, labels, locale, amount, balance]);

  const set = <K extends keyof ReceiptData>(key: K, value: ReceiptData[K]) => setReceipt((current) => ({ ...current, [key]: value }));
  const setBusiness = (key: keyof ReceiptData['business'], value: string) => setReceipt((current) => ({ ...current, business: { ...current.business, [key]: value } }));
  const setPayer = (key: keyof ReceiptData['payer'], value: string) => setReceipt((current) => ({ ...current, payer: { ...current.payer, [key]: value } }));

  const chooseLogo = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const { src, ratio } = await imageToDataUrl(file, 600, { type: 'image/png' });
      setReceipt((current) => ({ ...current, logo: src, logoRatio: ratio }));
      setLogoError('');
    } catch {
      setLogoError(t.logoFailed);
    }
  };

  const clearAll = () => {
    if (!window.confirm(t.confirmClear)) return;
    forgetDraft(DRAFT_KEY);
    // The business stays: it is the same on every receipt.
    setReceipt({ ...emptyReceipt(), business: receipt.business, logo: receipt.logo, logoRatio: receipt.logoRatio, accent: receipt.accent, currency: receipt.currency, method: receipt.method, place: receipt.place });
  };

  const download = () => {
    if (!kit || !pages) return;
    const base = [t.fileName, receipt.number.trim().replace(/\s+/g, '-')].filter(Boolean).join('-');
    savePdf(kit, pages, downloadName(`${base}.pdf`, 'pdf', '', t.fileName));
  };

  const select = 'mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900';

  return <div className="space-y-5 text-slate-700">
    <div className="flex items-center gap-2" role="group" aria-label={t.accent}>
      <span className="text-sm font-semibold text-slate-700">{t.accent}</span>
      {INVOICE_ACCENTS.concat('#0f766e').filter((color, index, all) => all.indexOf(color) === index).map((color) => <button key={color} type="button" aria-label={`${t.accent} ${color}`} aria-pressed={receipt.accent === color} onClick={() => set('accent', color)} className={`h-7 w-7 rounded-full border-2 transition ${receipt.accent === color ? 'border-slate-900 ring-2 ring-slate-300' : 'border-white ring-1 ring-slate-300'}`} style={{ backgroundColor: color }} />)}
    </div>

    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
      <div className="space-y-3">
        <FormSection title={t.payment}>
          <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-3">
            <Field label={t.amount} inputMode="decimal" value={receipt.amount} onChange={(event) => set('amount', event.target.value)} className="[&_input]:text-lg [&_input]:font-semibold" />
            <label className="block text-xs font-semibold text-slate-600">{t.currency}
              <select value={receipt.currency} onChange={(event) => set('currency', event.target.value)} className={select}>
                {CURRENCIES.map((code) => <option key={code} value={code}>{code === 'XAF' || code === 'XOF' ? `${code} (FCFA)` : code}</option>)}
              </select>
            </label>
          </div>
          {amount > 0 && <p className="text-xs italic text-slate-500">{t.inWords} : {amountInWords(amount, receipt.currency, locale)}</p>}
          <TextArea label={t.reason} value={receipt.reason} rows={2} placeholder={t.reasonHint} onChange={(event) => set('reason', event.target.value)} />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-slate-600">{t.method}
              <select value={receipt.method} onChange={(event) => set('method', event.target.value as PaymentMethod)} className={select}>
                {PAYMENT_METHODS.map((method) => <option key={method} value={method}>{methodName(locale)(method)}</option>)}
              </select>
            </label>
            <Field label={t.reference} value={receipt.reference} placeholder={t.referenceHint} onChange={(event) => set('reference', event.target.value)} />
          </div>
          <Field label={t.balance} inputMode="decimal" value={receipt.balance} onChange={(event) => set('balance', event.target.value)} />
        </FormSection>

        <FormSection title={t.payer}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t.payerName} value={receipt.payer.name} onChange={(event) => setPayer('name', event.target.value)} />
            <Field label={t.payerPhone} type="tel" value={receipt.payer.phone} onChange={(event) => setPayer('phone', event.target.value)} />
          </div>
        </FormSection>

        <FormSection title={t.details}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field label={t.number} value={receipt.number} onChange={(event) => set('number', event.target.value)} className="col-span-2 sm:col-span-1" />
            <Field label={t.date} type="date" value={receipt.date} onChange={(event) => set('date', event.target.value)} />
            <Field label={t.place} value={receipt.place} onChange={(event) => set('place', event.target.value)} />
          </div>
        </FormSection>

        <FormSection title={t.business}>
          <div className="flex items-center gap-3">
            <input ref={logoInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={chooseLogo} />
            {/* eslint-disable-next-line @next/next/no-img-element -- local data URL */}
            {receipt.logo ? <img src={receipt.logo} alt="" className="h-12 max-w-[8rem] object-contain" /> : <span className="grid h-12 w-12 place-items-center rounded-lg bg-slate-100 text-slate-400"><ImagePlus className="h-5 w-5" aria-hidden="true" /></span>}
            <button type="button" onClick={() => logoInput.current?.click()} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:border-slate-400">{receipt.logo ? t.changeLogo : t.logo}</button>
            {receipt.logo && <button type="button" onClick={() => set('logo', '')} className="text-sm font-semibold text-slate-500 hover:text-rose-600">{t.removeLogo}</button>}
          </div>
          {logoError && <p role="alert" className="text-sm text-rose-700">{logoError}</p>}
          <Field label={t.name} value={receipt.business.name} onChange={(event) => setBusiness('name', event.target.value)} />
          <Field label={t.address} value={receipt.business.address} onChange={(event) => setBusiness('address', event.target.value)} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t.phone} type="tel" value={receipt.business.phone} onChange={(event) => setBusiness('phone', event.target.value)} />
            <Field label={t.registry} value={receipt.business.registry} onChange={(event) => setBusiness('registry', event.target.value)} />
          </div>
        </FormSection>
      </div>

      <div className="space-y-3 lg:sticky lg:top-24 lg:self-start">
        <DocumentPreview pages={pages} labels={t} />
        <button type="button" disabled={!pages} onClick={download} className="btn-download flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 py-3"><Download className="h-5 w-5" aria-hidden="true" />{t.download}</button>
        <button type="button" onClick={clearAll} className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-slate-500 hover:text-rose-600"><Eraser className="h-4 w-4" aria-hidden="true" />{t.clear}</button>
      </div>
    </div>
    <p className="text-xs text-slate-500">{t.privacy}</p>
  </div>;
}
