/**
 * Standard VAT rates by country, to prefill the VAT calculator and the invoice generator.
 * They are starting points, always editable: rates change with each finance law, and some
 * countries add a surcharge to the VAT (Congo, Cameroon), which `note` explains.
 * Last reviewed: November 2026.
 */

export type VatCountry = {
  code: string;
  fr: string;
  en: string;
  /** Standard rate, in percent, as charged on the invoice. */
  rate: number;
  currency: string;
  note?: { fr: string; en: string };
};

export const VAT_COUNTRIES: VatCountry[] = [
  // CEMAC (franc CFA BEAC, XAF)
  { code: 'GA', fr: 'Gabon', en: 'Gabon', rate: 18, currency: 'XAF', note: { fr: 'Taux réduit de 10 % pour certains produits.', en: 'Reduced 10% rate for some goods.' } },
  { code: 'CG', fr: 'Congo', en: 'Republic of the Congo', rate: 18.9, currency: 'XAF', note: { fr: '18 % de TVA plus 5 % de centimes additionnels calculés sur la TVA, soit 18,9 % du montant HT.', en: '18% VAT plus a 5% surcharge on the VAT, i.e. 18.9% of the net amount.' } },
  { code: 'CM', fr: 'Cameroun', en: 'Cameroon', rate: 19.25, currency: 'XAF', note: { fr: '17,5 % de TVA plus 10 % de centimes additionnels communaux calculés sur la TVA, soit 19,25 %.', en: '17.5% VAT plus a 10% municipal surcharge on the VAT, i.e. 19.25%.' } },
  { code: 'TD', fr: 'Tchad', en: 'Chad', rate: 18, currency: 'XAF' },
  { code: 'CF', fr: 'Centrafrique', en: 'Central African Republic', rate: 19, currency: 'XAF' },
  { code: 'GQ', fr: 'Guinée équatoriale', en: 'Equatorial Guinea', rate: 15, currency: 'XAF' },
  // UEMOA (franc CFA BCEAO, XOF)
  { code: 'CI', fr: 'Côte d’Ivoire', en: 'Côte d’Ivoire', rate: 18, currency: 'XOF' },
  { code: 'SN', fr: 'Sénégal', en: 'Senegal', rate: 18, currency: 'XOF' },
  { code: 'BJ', fr: 'Bénin', en: 'Benin', rate: 18, currency: 'XOF' },
  { code: 'BF', fr: 'Burkina Faso', en: 'Burkina Faso', rate: 18, currency: 'XOF' },
  { code: 'ML', fr: 'Mali', en: 'Mali', rate: 18, currency: 'XOF' },
  { code: 'NE', fr: 'Niger', en: 'Niger', rate: 19, currency: 'XOF' },
  { code: 'TG', fr: 'Togo', en: 'Togo', rate: 18, currency: 'XOF' },
  // Other French-speaking countries
  { code: 'CD', fr: 'RD Congo', en: 'DR Congo', rate: 16, currency: 'CDF' },
  { code: 'GN', fr: 'Guinée', en: 'Guinea', rate: 18, currency: 'GNF' },
  { code: 'MG', fr: 'Madagascar', en: 'Madagascar', rate: 20, currency: 'MGA' },
  { code: 'MA', fr: 'Maroc', en: 'Morocco', rate: 20, currency: 'MAD' },
  { code: 'FR', fr: 'France', en: 'France', rate: 20, currency: 'EUR' },
  { code: 'BE', fr: 'Belgique', en: 'Belgium', rate: 21, currency: 'EUR' },
];

export function vatCountry(code: string): VatCountry | undefined {
  return VAT_COUNTRIES.find((country) => country.code === code);
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * From a net amount (HT) or a gross amount (TTC): the net, the VAT and the gross, rounded to
 * the currency's decimals (none for the CFA franc). The VAT is the difference, so net + VAT
 * always equals gross exactly.
 */
export function computeVat(amount: number, rate: number, from: 'net' | 'gross', decimals: number) {
  const net = round(from === 'net' ? amount : amount / (1 + rate / 100), decimals);
  const gross = round(from === 'net' ? amount * (1 + rate / 100) : amount, decimals);
  return { net, vat: round(gross - net, decimals), gross };
}
