'use client';

import { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useLocale } from 'next-intl';
import { bilingual } from '@/i18n/copy';
import { amountInWords } from '@/lib/amount-words';
import { CURRENCIES, currencyDecimals, formatMoney, formatNumber, parseAmount } from '@/lib/invoice';
import { VAT_COUNTRIES, computeVat, vatCountry } from '@/lib/vat-rates';

const copy = bilingual({
  country: 'Pays',
  other: 'Autre pays : taux à saisir',
  rate: 'Taux de TVA (%)',
  currency: 'Devise',
  from: 'Je connais le montant',
  fromNet: 'Hors taxes (HT)',
  fromGross: 'Toutes taxes comprises (TTC)',
  amount: (net: boolean): string => (net ? 'Montant HT' : 'Montant TTC'),
  net: 'Montant HT',
  vat: (rate: string) => `TVA (${rate} %)`,
  gross: 'Montant TTC',
  inWords: 'TTC en toutes lettres',
  copy: 'Copier le détail',
  copied: 'Copié',
  summary: (net: string, vat: string, gross: string) => `HT : ${net}\nTVA : ${vat}\nTTC : ${gross}`,
  disclaimer: 'Taux normaux connus en novembre 2026, à vérifier auprès de l’administration fiscale : ils changent avec les lois de finances et certains produits ont un taux réduit ou sont exonérés. Le calcul se fait dans ton navigateur.',
}, {
  country: 'Country',
  other: 'Other country: enter the rate',
  rate: 'VAT rate (%)',
  currency: 'Currency',
  from: 'I know the amount',
  fromNet: 'Before tax (net)',
  fromGross: 'Including tax (gross)',
  amount: (net: boolean) => (net ? 'Net amount' : 'Gross amount'),
  net: 'Net amount',
  vat: (rate: string) => `VAT (${rate}%)`,
  gross: 'Gross amount',
  inWords: 'Gross amount in words',
  copy: 'Copy the breakdown',
  copied: 'Copied',
  summary: (net: string, vat: string, gross: string) => `Net: ${net}\nVAT: ${vat}\nGross: ${gross}`,
  disclaimer: 'Standard rates known in November 2026, to check with the tax administration: they change with each finance law, and some goods have a reduced rate or are exempt. The calculation runs in your browser.',
});

export function VatCalculator() {
  const locale = useLocale();
  const t = copy[locale];
  const fr = locale !== 'en';
  const [countryCode, setCountryCode] = useState(fr ? 'GA' : 'FR');
  const [rateText, setRateText] = useState(String(vatCountry(countryCode)?.rate ?? 18));
  const [currency, setCurrency] = useState(vatCountry(countryCode)?.currency ?? 'XAF');
  const [from, setFrom] = useState<'net' | 'gross'>('net');
  const [amountText, setAmountText] = useState(fr ? '100 000' : '1,000');
  const [copied, setCopied] = useState(false);

  const country = vatCountry(countryCode);
  const rate = parseAmount(rateText, locale);
  const amount = parseAmount(amountText, locale);
  const result = useMemo(() => computeVat(amount, rate, from, currencyDecimals(currency)), [amount, rate, from, currency]);
  const money = (value: number) => formatMoney(value, currency, locale);

  const chooseCountry = (code: string) => {
    setCountryCode(code);
    const chosen = vatCountry(code);
    if (!chosen) return;
    setRateText(String(chosen.rate));
    setCurrency(chosen.currency);
  };

  const copySummary = async () => {
    await navigator.clipboard?.writeText(t.summary(money(result.net), money(result.vat), money(result.gross))).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const field = 'mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900';
  const label = 'block text-xs font-semibold text-slate-600';
  const chip = (active: boolean) => `min-h-10 flex-1 rounded-lg border px-3 text-sm font-semibold transition ${active ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'}`;

  return <div className="space-y-5 text-slate-700">
    <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
      <label className={label}>{t.country}
        <select value={countryCode} onChange={(event) => chooseCountry(event.target.value)} className={field}>
          {VAT_COUNTRIES.map((item) => <option key={item.code} value={item.code}>{`${item[fr ? 'fr' : 'en']} — ${formatNumber(item.rate, locale)}${fr ? ' %' : '%'}`}</option>)}
          <option value="">{t.other}</option>
        </select>
      </label>
      <label className={label}>{t.rate}
        <input inputMode="decimal" value={rateText} onChange={(event) => setRateText(event.target.value)} className={field} />
      </label>
      <label className={label}>{t.currency}
        <select value={currency} onChange={(event) => setCurrency(event.target.value)} className={field}>
          {CURRENCIES.map((code) => <option key={code} value={code}>{code === 'XAF' || code === 'XOF' ? `${code} (FCFA)` : code}</option>)}
        </select>
      </label>
    </div>
    {country?.note && <p className="text-xs text-slate-500">{country.note[fr ? 'fr' : 'en']}</p>}

    <div>
      <p className="mb-2 text-xs font-semibold text-slate-600">{t.from}</p>
      <div className="flex gap-2" role="group" aria-label={t.from}>
        <button type="button" aria-pressed={from === 'net'} onClick={() => setFrom('net')} className={chip(from === 'net')}>{t.fromNet}</button>
        <button type="button" aria-pressed={from === 'gross'} onClick={() => setFrom('gross')} className={chip(from === 'gross')}>{t.fromGross}</button>
      </div>
    </div>

    <label className={label}>{t.amount(from === 'net')}
      <input inputMode="decimal" value={amountText} onChange={(event) => setAmountText(event.target.value)} className={`${field} text-lg font-semibold`} />
    </label>

    <dl className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-slate-50" aria-live="polite">
      <div className="flex items-center justify-between gap-4 px-4 py-3"><dt>{t.net}</dt><dd className="font-semibold text-slate-900">{money(result.net)}</dd></div>
      <div className="flex items-center justify-between gap-4 px-4 py-3"><dt>{t.vat(formatNumber(rate, locale))}</dt><dd className="font-semibold text-slate-900">{money(result.vat)}</dd></div>
      <div className="flex items-center justify-between gap-4 px-4 py-3 text-lg font-bold text-slate-900"><dt>{t.gross}</dt><dd>{money(result.gross)}</dd></div>
      {result.gross > 0 && <div className="px-4 py-3 text-sm"><dt className="text-xs font-semibold text-slate-500">{t.inWords}</dt><dd className="mt-0.5 italic text-slate-700">{amountInWords(result.gross, currency, locale)}</dd></div>}
    </dl>

    <button type="button" onClick={() => void copySummary()} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
      {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}{copied ? t.copied : t.copy}
    </button>
    <p className="text-xs text-slate-500">{t.disclaimer}</p>
  </div>;
}
