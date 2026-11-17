/**
 * An amount written in words, as on invoices and receipts of French-speaking Africa
 * ("Arrêtée la présente facture à la somme de…"). French follows the traditional spelling:
 * vingt et un, quatre-vingts, deux cents, deux cent un, mille (invariable), deux millions.
 */

const FR_UNITS = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
const FR_TENS = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];

/** 0 to 99. `final`: the word ends the number, so quatre-vingt takes its s. */
function frBelow100(value: number, final: boolean): string {
  if (value < 20) return FR_UNITS[value];
  const ten = Math.floor(value / 10);
  let unit = value % 10;
  // 70-79 and 90-99 count on from dix: soixante-dix, quatre-vingt-onze.
  if (ten === 7 || ten === 9) unit += 10;
  const base = FR_TENS[ten];
  if (unit === 0) return ten === 8 && final ? 'quatre-vingts' : base;
  if (unit === 1 && ten < 8) return `${base} et un`;
  if (unit === 11 && ten === 7) return `${base} et onze`;
  return `${base}-${FR_UNITS[unit]}`;
}

/** 0 to 999. */
function frBelow1000(value: number, final: boolean): string {
  const hundreds = Math.floor(value / 100);
  const rest = value % 100;
  if (!hundreds) return frBelow100(rest, final);
  const head = hundreds === 1 ? 'cent' : `${FR_UNITS[hundreds]} cent${!rest && final ? 's' : ''}`;
  return rest ? `${head} ${frBelow100(rest, final)}` : head;
}

const FR_SCALES: Array<[number, string, string]> = [
  [1e9, 'milliard', 'milliards'],
  [1e6, 'million', 'millions'],
];

export function frenchNumber(value: number): string {
  const whole = Math.floor(Math.abs(value));
  if (whole === 0) return 'zéro';
  const parts: string[] = [];
  let rest = whole;
  for (const [scale, one, many] of FR_SCALES) {
    const count = Math.floor(rest / scale);
    if (!count) continue;
    // Million and milliard are nouns: un million, deux cents millions.
    parts.push(`${frenchNumber(count)} ${count > 1 ? many : one}`);
    rest %= scale;
  }
  const thousands = Math.floor(rest / 1000);
  // Mille is invariable and stands alone for 1000; the numbers before it stay singular (deux cent mille).
  if (thousands) parts.push(thousands === 1 ? 'mille' : `${frBelow1000(thousands, false)} mille`);
  const units = rest % 1000;
  if (units) parts.push(frBelow1000(units, true));
  return parts.join(' ');
}

const EN_UNITS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const EN_TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

function enBelow1000(value: number): string {
  const hundreds = Math.floor(value / 100);
  const rest = value % 100;
  const tail = rest < 20 ? EN_UNITS[rest] : `${EN_TENS[Math.floor(rest / 10)]}${rest % 10 ? `-${EN_UNITS[rest % 10]}` : ''}`;
  if (!hundreds) return tail;
  return rest ? `${EN_UNITS[hundreds]} hundred ${tail}` : `${EN_UNITS[hundreds]} hundred`;
}

export function englishNumber(value: number): string {
  const whole = Math.floor(Math.abs(value));
  if (whole === 0) return 'zero';
  const parts: string[] = [];
  let rest = whole;
  for (const [scale, name] of [[1e9, 'billion'], [1e6, 'million'], [1e3, 'thousand']] as const) {
    const count = Math.floor(rest / scale);
    if (!count) continue;
    parts.push(`${enBelow1000(count)} ${name}`);
    rest %= scale;
  }
  if (rest) parts.push(enBelow1000(rest));
  return parts.join(' ');
}

/** Name of the main unit and of its hundredth, singular and plural, by currency. */
const CURRENCY_WORDS: Record<string, { fr: [string, string, string, string]; en: [string, string, string, string] }> = {
  XAF: { fr: ['franc CFA', 'francs CFA', '', ''], en: ['CFA franc', 'CFA francs', '', ''] },
  XOF: { fr: ['franc CFA', 'francs CFA', '', ''], en: ['CFA franc', 'CFA francs', '', ''] },
  EUR: { fr: ['euro', 'euros', 'centime', 'centimes'], en: ['euro', 'euros', 'cent', 'cents'] },
  USD: { fr: ['dollar', 'dollars', 'cent', 'cents'], en: ['dollar', 'dollars', 'cent', 'cents'] },
  CAD: { fr: ['dollar canadien', 'dollars canadiens', 'cent', 'cents'], en: ['Canadian dollar', 'Canadian dollars', 'cent', 'cents'] },
  CHF: { fr: ['franc suisse', 'francs suisses', 'centime', 'centimes'], en: ['Swiss franc', 'Swiss francs', 'centime', 'centimes'] },
  GBP: { fr: ['livre sterling', 'livres sterling', 'penny', 'pence'], en: ['pound', 'pounds', 'penny', 'pence'] },
  MAD: { fr: ['dirham', 'dirhams', 'centime', 'centimes'], en: ['dirham', 'dirhams', 'centime', 'centimes'] },
  CDF: { fr: ['franc congolais', 'francs congolais', 'centime', 'centimes'], en: ['Congolese franc', 'Congolese francs', 'centime', 'centimes'] },
  GNF: { fr: ['franc guinéen', 'francs guinéens', '', ''], en: ['Guinean franc', 'Guinean francs', '', ''] },
  MGA: { fr: ['ariary', 'ariary', '', ''], en: ['ariary', 'ariary', '', ''] },
};

/**
 * "cinq cent trente et un mille francs CFA", "twelve euros and fifty cents". Currencies without
 * subunit in use (FCFA) are rounded to the unit. Negative amounts are written as their absolute value.
 */
export function amountInWords(amount: number, currency: string, locale: string): string {
  const fr = locale !== 'en';
  const words = CURRENCY_WORDS[currency]?.[fr ? 'fr' : 'en'] ?? [currency, currency, '', ''];
  const hasCents = Boolean(words[2]);
  const total = Math.round(Math.abs(amount) * (hasCents ? 100 : 1));
  const whole = hasCents ? Math.floor(total / 100) : total;
  const cents = hasCents ? total % 100 : 0;
  const say = fr ? frenchNumber : englishNumber;
  // French: "un million de francs", but "un million deux cents francs".
  const de = fr && whole >= 1e6 && whole % 1e6 === 0 ? ' de' : '';
  const main = `${say(whole)}${de} ${whole > 1 ? words[1] : words[0]}`;
  if (!cents) return main;
  return `${main} ${fr ? 'et' : 'and'} ${say(cents)} ${cents > 1 ? words[3] : words[2]}`;
}
