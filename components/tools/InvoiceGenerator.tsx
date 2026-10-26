'use client';

import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { ArrowDown, ArrowUp, Download, Eraser, ImagePlus, Plus, Trash2 } from 'lucide-react';
import { useLocale } from 'next-intl';
import { bilingual } from '@/i18n/copy';
import { downloadName } from '@/lib/download-name';
import { CURRENCIES, EMPTY_ITEM, INVOICE_ACCENTS, computeTotals, emptyInvoice, formatMoney, formatNumber, type InvoiceData, type InvoiceItem, type InvoiceLabels, type InvoiceParty } from '@/lib/invoice';
import { layoutInvoice } from '@/lib/invoice-layout';
import { DocumentPreview, Field, FormSection, TextArea, forgetDraft, imageToDataUrl, readDraft, savePdf, useDraftSaving, useIsClient, usePdfKit } from '@/components/tools/DocumentPreview';

const DRAFT_KEY = 'jchub-invoice-v1';

const copy = bilingual({
  document: (vat: boolean): InvoiceLabels => ({
    invoice: 'Facture', quote: 'Devis', number: 'N°', date: 'Date', due: 'Échéance', validUntil: 'Valable jusqu’au',
    billedTo: 'Facturé à', quoteFor: 'Devis pour', taxId: 'N° fiscal :', description: 'Description', quantity: 'Qté',
    unitPrice: 'Prix unitaire', vat: 'TVA', amount: vat ? 'Montant HT' : 'Montant', subtotal: 'Total HT',
    vatRate: (rate) => `TVA ${rate} %`, total: vat ? 'Total TTC' : 'Total', terms: 'Conditions de paiement', payment: 'Coordonnées de paiement',
  }),
  fileName: { invoice: 'facture', quote: 'devis' },
  kind: 'Document',
  invoice: 'Facture',
  quote: 'Devis',
  accent: 'Couleur',
  accentName: (color: string) => `Couleur ${color}`,
  details: 'Références',
  number: 'Numéro',
  issueDate: 'Date',
  dueDate: 'Échéance',
  validUntil: 'Valable jusqu’au',
  currency: 'Devise',
  applyVat: 'Appliquer la TVA',
  seller: 'Ton entreprise',
  client: 'Client',
  logo: 'Logo',
  addLogo: 'Ajouter un logo',
  changeLogo: 'Changer',
  removeLogo: 'Retirer',
  logoFailed: 'Impossible de lire cette image.',
  name: 'Nom ou raison sociale',
  address: 'Adresse',
  email: 'E-mail',
  phone: 'Téléphone',
  taxId: 'Identifiant fiscal (SIRET, NIU, RCCM…)',
  items: 'Prestations et produits',
  description: 'Description',
  quantity: 'Quantité',
  unitPrice: 'Prix unitaire',
  vatRate: 'TVA (%)',
  lineTotal: 'Total',
  addItem: 'Ajouter une ligne',
  moveUp: 'Monter',
  moveDown: 'Descendre',
  remove: 'Supprimer',
  subtotal: 'Total HT',
  vat: 'TVA',
  total: 'Total',
  notes: 'Conditions et paiement',
  terms: 'Conditions de paiement',
  termsHint: 'Ex. Paiement à 30 jours. Pénalités de retard…',
  payment: 'Coordonnées de paiement',
  paymentHint: 'IBAN, Mobile Money, PayPal…',
  download: 'Télécharger le PDF',
  clear: 'Tout effacer',
  confirmClear: 'Effacer tout le contenu du document ?',
  preview: 'Aperçu du document',
  page: (current: number, total: number) => `Page ${current} sur ${total}`,
  previous: 'Page précédente',
  next: 'Page suivante',
  legal: 'Vérifie les mentions obligatoires dans ton pays (numéro d’identification, TVA, pénalités de retard).',
  privacy: 'Tout se passe dans ton navigateur : rien n’est envoyé à un serveur. Le document reste enregistré sur cet appareil pour que tu le retrouves.',
}, {
  document: (vat: boolean): InvoiceLabels => ({
    invoice: 'Invoice', quote: 'Quote', number: 'No.', date: 'Date', due: 'Due date', validUntil: 'Valid until',
    billedTo: 'Bill to', quoteFor: 'Quote for', taxId: 'Tax ID:', description: 'Description', quantity: 'Qty',
    unitPrice: 'Unit price', vat: 'VAT', amount: vat ? 'Amount excl. VAT' : 'Amount', subtotal: 'Subtotal',
    vatRate: (rate) => `VAT ${rate}%`, total: 'Total', terms: 'Payment terms', payment: 'Payment details',
  }),
  fileName: { invoice: 'invoice', quote: 'quote' },
  kind: 'Document',
  invoice: 'Invoice',
  quote: 'Quote',
  accent: 'Color',
  accentName: (color: string) => `Color ${color}`,
  details: 'References',
  number: 'Number',
  issueDate: 'Date',
  dueDate: 'Due date',
  validUntil: 'Valid until',
  currency: 'Currency',
  applyVat: 'Charge VAT',
  seller: 'Your business',
  client: 'Client',
  logo: 'Logo',
  addLogo: 'Add a logo',
  changeLogo: 'Change',
  removeLogo: 'Remove',
  logoFailed: 'Could not read this image.',
  name: 'Name or company',
  address: 'Address',
  email: 'Email',
  phone: 'Phone',
  taxId: 'Tax ID (VAT number, EIN…)',
  items: 'Services and products',
  description: 'Description',
  quantity: 'Quantity',
  unitPrice: 'Unit price',
  vatRate: 'VAT (%)',
  lineTotal: 'Total',
  addItem: 'Add a line',
  moveUp: 'Move up',
  moveDown: 'Move down',
  remove: 'Delete',
  subtotal: 'Subtotal',
  vat: 'VAT',
  total: 'Total',
  notes: 'Terms and payment',
  terms: 'Payment terms',
  termsHint: 'E.g. Payment within 30 days. Late fees…',
  payment: 'Payment details',
  paymentHint: 'IBAN, mobile money, PayPal…',
  download: 'Download the PDF',
  clear: 'Clear all',
  confirmClear: 'Clear the whole document?',
  preview: 'Document preview',
  page: (current: number, total: number) => `Page ${current} of ${total}`,
  previous: 'Previous page',
  next: 'Next page',
  legal: 'Check the information required in your country (business ID, VAT, late fees).',
  privacy: 'Everything happens in your browser: nothing is sent to a server. The document stays saved on this device so you find it again.',
});

/** A filled-in example, so the first visit shows what the document looks like. */
function sampleInvoice(locale: string): InvoiceData {
  const fr = locale !== 'en';
  return {
    ...emptyInvoice(),
    currency: fr ? 'XAF' : 'USD',
    vat: true,
    seller: { name: 'Studio Kimpa', address: fr ? '12 avenue de la Paix\nBrazzaville, Congo' : '12 Peace Avenue\nBrazzaville, Congo', email: 'contact@kimpa.cg', phone: '+242 06 555 12 34', taxId: fr ? 'RCCM CG-BZV-01-2024-B12' : '' },
    client: { name: 'Atelier Mbemba', address: fr ? '5 rue Loango\nPointe-Noire, Congo' : '5 Loango Street\nPointe-Noire, Congo', email: 'compta@mbemba.cg', phone: '', taxId: '' },
    items: fr
      ? [
        { description: 'Création du site vitrine (maquettes, intégration, mise en ligne)', quantity: '1', unitPrice: '450 000', vatRate: '18' },
        { description: 'Formation à la gestion des contenus (demi-journée)', quantity: '2', unitPrice: '35 000', vatRate: '18' },
      ]
      : [
        { description: 'Showcase website (design, development, launch)', quantity: '1', unitPrice: '1,200', vatRate: '18' },
        { description: 'Content management training (half day)', quantity: '2', unitPrice: '150', vatRate: '18' },
      ],
    terms: fr ? 'Paiement à 30 jours à réception de la facture.' : 'Payment within 30 days of receipt.',
    payment: fr ? 'Mobile Money : +242 06 555 12 34' : 'Mobile money: +242 06 555 12 34',
  };
}

function isInvoiceData(value: unknown): value is InvoiceData {
  const invoice = value as InvoiceData;
  return Boolean(invoice) && typeof invoice === 'object' && Array.isArray(invoice.items) && typeof invoice.seller === 'object' && typeof invoice.client === 'object';
}

export function InvoiceGenerator() {
  const locale = useLocale();
  const isClient = useIsClient();
  // The draft lives in this browser: the server renders a placeholder.
  if (!isClient) return <div className="h-[32rem] animate-pulse rounded-xl bg-slate-100" />;
  const draft = readDraft(DRAFT_KEY, isInvoiceData);
  return <InvoiceEditor initial={draft ? { ...emptyInvoice(), ...draft } : sampleInvoice(locale)} />;
}

type PartyKey = 'seller' | 'client';

function InvoiceEditor({ initial }: { initial: InvoiceData }) {
  const locale = useLocale();
  const t = copy[locale];
  const kit = usePdfKit();
  const logoInput = useRef<HTMLInputElement>(null);
  const [invoice, setInvoice] = useState(initial);
  const [logoError, setLogoError] = useState('');
  useDraftSaving(DRAFT_KEY, invoice);
  const totals = useMemo(() => computeTotals(invoice, locale), [invoice, locale]);
  const pages = useMemo(() => (kit ? layoutInvoice(invoice, t.document(invoice.vat), locale, kit.measure) : null), [kit, invoice, t, locale]);
  const money = (amount: number) => formatMoney(amount, invoice.currency, locale);

  const set = <K extends keyof InvoiceData>(key: K, value: InvoiceData[K]) => setInvoice((current) => ({ ...current, [key]: value }));
  const setParty = (party: PartyKey, key: keyof InvoiceParty, value: string) => setInvoice((current) => ({ ...current, [party]: { ...current[party], [key]: value } }));
  const setItem = (index: number, key: keyof InvoiceItem, value: string) => setInvoice((current) => ({
    ...current,
    items: current.items.map((item, position) => (position === index ? { ...item, [key]: value } : item)),
  }));
  const moveItem = (index: number, offset: number) => setInvoice((current) => {
    const items = [...current.items];
    [items[index], items[index + offset]] = [items[index + offset], items[index]];
    return { ...current, items };
  });
  const removeItem = (index: number) => setInvoice((current) => ({ ...current, items: current.items.filter((_, position) => position !== index) }));
  const addItem = () => setInvoice((current) => ({ ...current, items: [...current.items, { ...EMPTY_ITEM, vatRate: current.items.at(-1)?.vatRate ?? EMPTY_ITEM.vatRate }] }));

  const chooseLogo = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const { src, ratio } = await imageToDataUrl(file, 600, { type: 'image/png' });
      setInvoice((current) => ({ ...current, logo: src, logoRatio: ratio }));
      setLogoError('');
    } catch {
      setLogoError(t.logoFailed);
    }
  };

  const clearAll = () => {
    if (!window.confirm(t.confirmClear)) return;
    forgetDraft(DRAFT_KEY);
    setInvoice({ ...emptyInvoice(), currency: invoice.currency, vat: invoice.vat });
  };

  const download = () => {
    if (!kit || !pages) return;
    const base = [t.fileName[invoice.kind], invoice.number.trim().replace(/\s+/g, '-')].filter(Boolean).join('-');
    savePdf(kit, pages, downloadName(`${base}.pdf`, 'pdf', '', t.fileName[invoice.kind]));
  };

  const chipClass = (active: boolean) => `min-h-9 rounded-lg border px-3 text-sm font-semibold transition ${active ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'}`;
  const iconButton = 'rounded-lg border border-slate-300 bg-white p-1.5 text-slate-600 hover:border-slate-400 disabled:opacity-30';

  const partyFields = (party: PartyKey) => <>
    <Field label={t.name} value={invoice[party].name} onChange={(event) => setParty(party, 'name', event.target.value)} />
    <TextArea label={t.address} value={invoice[party].address} rows={2} onChange={(event) => setParty(party, 'address', event.target.value)} />
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label={t.email} type="email" value={invoice[party].email} onChange={(event) => setParty(party, 'email', event.target.value)} />
      <Field label={t.phone} type="tel" value={invoice[party].phone} onChange={(event) => setParty(party, 'phone', event.target.value)} />
    </div>
    <Field label={t.taxId} value={invoice[party].taxId} onChange={(event) => setParty(party, 'taxId', event.target.value)} />
  </>;

  return <div className="space-y-5 text-slate-700">
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
      <div className="flex items-center gap-2" role="group" aria-label={t.kind}>
        <button type="button" aria-pressed={invoice.kind === 'invoice'} onClick={() => set('kind', 'invoice')} className={chipClass(invoice.kind === 'invoice')}>{t.invoice}</button>
        <button type="button" aria-pressed={invoice.kind === 'quote'} onClick={() => set('kind', 'quote')} className={chipClass(invoice.kind === 'quote')}>{t.quote}</button>
      </div>
      <div className="flex items-center gap-2" role="group" aria-label={t.accent}>
        <span className="text-sm font-semibold text-slate-700">{t.accent}</span>
        {INVOICE_ACCENTS.map((color) => <button key={color} type="button" aria-label={t.accentName(color)} aria-pressed={invoice.accent === color} onClick={() => set('accent', color)} className={`h-7 w-7 rounded-full border-2 transition ${invoice.accent === color ? 'border-slate-900 ring-2 ring-slate-300' : 'border-white ring-1 ring-slate-300'}`} style={{ backgroundColor: color }} />)}
      </div>
    </div>

    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
      <div className="space-y-3">
        <FormSection title={t.details}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field label={t.number} value={invoice.number} onChange={(event) => set('number', event.target.value)} className="col-span-2 sm:col-span-1" />
            <Field label={t.issueDate} type="date" value={invoice.issueDate} onChange={(event) => set('issueDate', event.target.value)} />
            <Field label={invoice.kind === 'quote' ? t.validUntil : t.dueDate} type="date" value={invoice.dueDate} onChange={(event) => set('dueDate', event.target.value)} />
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <label className="block text-xs font-semibold text-slate-600">{t.currency}
              <select value={invoice.currency} onChange={(event) => set('currency', event.target.value)} className="mt-1 block rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900">
                {CURRENCIES.map((code) => <option key={code} value={code}>{code === 'XAF' || code === 'XOF' ? `${code} (FCFA)` : code}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-2 pb-2 text-sm font-semibold text-slate-700">
              <input type="checkbox" checked={invoice.vat} onChange={(event) => set('vat', event.target.checked)} className="h-4 w-4 accent-blue-600" />
              {t.applyVat}
            </label>
          </div>
        </FormSection>

        <FormSection title={t.seller}>
          <div className="flex items-center gap-3">
            <input ref={logoInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={chooseLogo} />
            {/* eslint-disable-next-line @next/next/no-img-element -- local data URL */}
            {invoice.logo ? <img src={invoice.logo} alt="" className="h-12 max-w-[8rem] object-contain" /> : <span className="grid h-12 w-12 place-items-center rounded-lg bg-slate-100 text-slate-400"><ImagePlus className="h-5 w-5" aria-hidden="true" /></span>}
            <button type="button" onClick={() => logoInput.current?.click()} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:border-slate-400">{invoice.logo ? t.changeLogo : t.addLogo}</button>
            {invoice.logo && <button type="button" onClick={() => set('logo', '')} className="text-sm font-semibold text-slate-500 hover:text-rose-600">{t.removeLogo}</button>}
          </div>
          {logoError && <p role="alert" className="text-sm text-rose-700">{logoError}</p>}
          {partyFields('seller')}
        </FormSection>

        <FormSection title={t.client}>{partyFields('client')}</FormSection>

        <FormSection title={t.items}>
          {invoice.items.map((item, index) => <div key={index} role="group" aria-label={`${index + 1}. ${item.description || t.description}`} className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-start gap-2">
              <TextArea label={`${index + 1}. ${t.description}`} value={item.description} rows={2} onChange={(event) => setItem(index, 'description', event.target.value)} className="flex-1" />
              <div className="flex flex-col gap-1 pt-5">
                <button type="button" aria-label={t.moveUp} title={t.moveUp} disabled={index === 0} onClick={() => moveItem(index, -1)} className={iconButton}><ArrowUp className="h-3.5 w-3.5" aria-hidden="true" /></button>
                <button type="button" aria-label={t.moveDown} title={t.moveDown} disabled={index === invoice.items.length - 1} onClick={() => moveItem(index, 1)} className={iconButton}><ArrowDown className="h-3.5 w-3.5" aria-hidden="true" /></button>
                <button type="button" aria-label={t.remove} title={t.remove} onClick={() => removeItem(index)} className={`${iconButton} hover:text-rose-600`}><Trash2 className="h-3.5 w-3.5" aria-hidden="true" /></button>
              </div>
            </div>
            <div className={`grid gap-3 ${invoice.vat ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
              <Field label={t.quantity} inputMode="decimal" value={item.quantity} onChange={(event) => setItem(index, 'quantity', event.target.value)} />
              <Field label={t.unitPrice} inputMode="decimal" value={item.unitPrice} onChange={(event) => setItem(index, 'unitPrice', event.target.value)} />
              {invoice.vat && <Field label={t.vatRate} inputMode="decimal" value={item.vatRate} onChange={(event) => setItem(index, 'vatRate', event.target.value)} />}
              <p className="text-xs font-semibold text-slate-600">{t.lineTotal}<span className="mt-1 block py-2 text-sm font-bold text-slate-900">{money(totals.lines[index]?.amount ?? 0)}</span></p>
            </div>
          </div>)}
          <button type="button" onClick={addItem} className="inline-flex items-center gap-2 rounded-lg border border-dashed border-slate-400 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-slate-600"><Plus className="h-4 w-4" aria-hidden="true" />{t.addItem}</button>
          <dl className="ml-auto max-w-xs space-y-1 text-sm">
            {invoice.vat && <div className="flex justify-between gap-4"><dt>{t.subtotal}</dt><dd>{money(totals.subtotal)}</dd></div>}
            {totals.taxes.map((tax) => <div key={tax.rate} className="flex justify-between gap-4"><dt>{t.document(true).vatRate(formatNumber(tax.rate, locale))}</dt><dd>{money(tax.amount)}</dd></div>)}
            <div className="flex justify-between gap-4 border-t border-slate-200 pt-1 text-base font-bold text-slate-900"><dt>{t.total}</dt><dd>{money(totals.total)}</dd></div>
          </dl>
        </FormSection>

        <FormSection title={t.notes}>
          <TextArea label={t.terms} value={invoice.terms} rows={2} placeholder={t.termsHint} onChange={(event) => set('terms', event.target.value)} />
          <TextArea label={t.payment} value={invoice.payment} rows={2} placeholder={t.paymentHint} onChange={(event) => set('payment', event.target.value)} />
        </FormSection>
      </div>

      <div className="space-y-3 lg:sticky lg:top-24 lg:self-start">
        <DocumentPreview pages={pages} labels={t} />
        <button type="button" disabled={!pages} onClick={download} className="btn-download flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 py-3"><Download className="h-5 w-5" aria-hidden="true" />{t.download}</button>
        <button type="button" onClick={clearAll} className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-slate-500 hover:text-rose-600"><Eraser className="h-4 w-4" aria-hidden="true" />{t.clear}</button>
      </div>
    </div>
    <p className="text-xs text-slate-500">{t.legal} {t.privacy}</p>
  </div>;
}

