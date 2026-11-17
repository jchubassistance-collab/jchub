/**
 * HTML of an e-mail signature. Mail clients (Outlook above all) ignore stylesheets, classes and
 * flexbox, and Gmail drops images embedded as data URLs: the signature is built from nested
 * tables with inline styles, and images are public https addresses.
 */

export const SIGNATURE_TEMPLATES = ['classic', 'modern', 'minimal'] as const;
export type SignatureTemplate = (typeof SIGNATURE_TEMPLATES)[number];

export const SIGNATURE_FONTS = {
  arial: 'Arial, Helvetica, sans-serif',
  verdana: 'Verdana, Geneva, sans-serif',
  trebuchet: "'Trebuchet MS', Tahoma, sans-serif",
  georgia: 'Georgia, Times, serif',
} as const;
export type SignatureFont = keyof typeof SIGNATURE_FONTS;

export const SIGNATURE_ACCENTS = ['#2563eb', '#0f766e', '#7c3aed', '#c2410c', '#be123c', '#0f172a'];

export const SOCIAL_NETWORKS = ['linkedin', 'x', 'facebook', 'instagram', 'github', 'youtube'] as const;
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number];
export const SOCIAL_LABELS: Record<SocialNetwork, string> = {
  linkedin: 'LinkedIn', x: 'X', facebook: 'Facebook', instagram: 'Instagram', github: 'GitHub', youtube: 'YouTube',
};

export type SignatureData = {
  template: SignatureTemplate;
  accent: string;
  font: SignatureFont;
  name: string;
  title: string;
  company: string;
  phone: string;
  mobile: string;
  email: string;
  website: string;
  address: string;
  image: string;
  imageKind: 'photo' | 'logo';
  socials: Record<SocialNetwork, string>;
  ctaText: string;
  ctaUrl: string;
  disclaimer: string;
};

export type SignatureLabels = { phone: string; mobile: string; email: string; website: string };

export function emptySignature(): SignatureData {
  return {
    template: 'classic', accent: SIGNATURE_ACCENTS[0], font: 'arial',
    name: '', title: '', company: '', phone: '', mobile: '', email: '', website: '', address: '',
    image: '', imageKind: 'photo',
    socials: { linkedin: '', x: '', facebook: '', instagram: '', github: '', youtube: '' },
    ctaText: '', ctaUrl: '', disclaimer: '',
  };
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
}

/** An http(s) address, with https:// added to a bare domain; anything else (javascript:…) is refused. */
export function safeWebUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed.replace(/^\/+/, '')}`;
  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
  } catch {
    return '';
  }
}

/** The image must be reachable by the recipient's mail client: a public https address only. */
export function safeImageUrl(value: string): string {
  const url = safeWebUrl(value);
  return url.startsWith('https://') ? url : '';
}

function telHref(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : '';
}

function isEmail(value: string): boolean {
  return /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(value.trim());
}

/** The address as shown: without scheme, www-less, without the trailing slash. */
function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

/**
 * Social icons are PNG files of the site (public/email-signature), one per network and accent:
 * mail clients show neither SVG nor icon fonts. `assetBase` is the site address they are served from.
 */
export function socialIconUrl(assetBase: string, network: SocialNetwork, accent: string): string {
  return `${assetBase.replace(/\/$/, '')}/email-signature/${network}-${accent.replace('#', '')}.png`;
}

const MUTED = '#64748b';
const TEXT = '#334155';
const STRONG = '#0f172a';

type Line = { label: string; text: string; href: string };

function contactLines(data: SignatureData, labels: SignatureLabels): Line[] {
  const lines: Line[] = [];
  if (data.phone.trim()) lines.push({ label: labels.phone, text: data.phone.trim(), href: telHref(data.phone) });
  if (data.mobile.trim()) lines.push({ label: labels.mobile, text: data.mobile.trim(), href: telHref(data.mobile) });
  if (isEmail(data.email)) lines.push({ label: labels.email, text: data.email.trim(), href: `mailto:${data.email.trim()}` });
  const website = safeWebUrl(data.website);
  if (website) lines.push({ label: labels.website, text: displayUrl(website), href: website });
  return lines;
}

function link(href: string, text: string, color: string): string {
  const content = escapeHtml(text);
  return href ? `<a href="${escapeHtml(href)}" style="color:${color};text-decoration:none;">${content}</a>` : content;
}

/** The finished signature, ready to paste into a mail client. */
export function buildSignatureHtml(data: SignatureData, labels: SignatureLabels, assetBase: string): string {
  const accent = SIGNATURE_ACCENTS.includes(data.accent) ? data.accent : SIGNATURE_ACCENTS[0];
  const font = SIGNATURE_FONTS[data.font] ?? SIGNATURE_FONTS.arial;
  const name = escapeHtml(data.name.trim());
  const role = [data.title.trim(), data.company.trim()].filter(Boolean).map(escapeHtml).join(data.template === 'minimal' ? ', ' : ' · ');
  const lines = contactLines(data, labels);
  const address = escapeHtml(data.address.trim()).replace(/\r?\n/g, '<br>');
  const image = safeImageUrl(data.image);
  const socialCells = SOCIAL_NETWORKS
    .map((network) => ({ network, url: safeWebUrl(data.socials[network] ?? '') }))
    .filter(({ url }) => url)
    .map(({ network, url }) => `<td style="padding:0 6px 0 0;"><a href="${escapeHtml(url)}" style="text-decoration:none;"><img src="${escapeHtml(socialIconUrl(assetBase, network, accent))}" alt="${SOCIAL_LABELS[network]}" width="24" height="24" style="display:block;width:24px;height:24px;border:0;"></a></td>`)
    .join('');
  const socials = socialCells ? `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;margin-top:8px;"><tr>${socialCells}</tr></table>` : '';
  const ctaUrl = safeWebUrl(data.ctaUrl);
  const ctaText = escapeHtml(data.ctaText.trim());
  const disclaimer = escapeHtml(data.disclaimer.trim()).replace(/\r?\n/g, '<br>');

  const p = (content: string, style = '') => `<p style="margin:0;${style}">${content}</p>`;

  const imageTag = (() => {
    if (!image) return '';
    const alt = escapeHtml(data.company.trim() || data.name.trim());
    return data.imageKind === 'photo'
      ? `<img src="${escapeHtml(image)}" alt="${alt}" width="80" height="80" style="display:block;width:80px;height:80px;border:0;border-radius:40px;object-fit:cover;">`
      : `<img src="${escapeHtml(image)}" alt="${alt}" width="110" style="display:block;width:110px;max-width:110px;height:auto;border:0;">`;
  })();

  let contact: string;
  if (data.template === 'classic') {
    contact = lines.map((line) => p(`<span style="color:${accent};font-weight:bold;">${escapeHtml(line.label)}</span>&nbsp;&nbsp;${link(line.href, line.text, TEXT)}`)).join('');
  } else {
    contact = lines.length ? p(lines.map((line) => link(line.href, line.text, data.template === 'modern' ? TEXT : MUTED)).join(`<span style="color:${MUTED};">&nbsp;&nbsp;|&nbsp;&nbsp;</span>`)) : '';
  }

  const blocks: string[] = [];
  if (name) {
    const size = data.template === 'minimal' ? 14 : data.template === 'modern' ? 18 : 16;
    const color = data.template === 'modern' ? accent : STRONG;
    blocks.push(p(name, `font-size:${size}px;font-weight:bold;color:${color};`));
  }
  if (role) blocks.push(p(role, `color:${data.template === 'classic' ? accent : MUTED};${data.template === 'minimal' ? '' : 'font-weight:bold;'}`));
  if (data.template === 'modern' && (name || role)) {
    blocks.push(`<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;margin:8px 0;"><tr><td width="40" height="3" style="width:40px;height:3px;background-color:${accent};font-size:0;line-height:0;">&nbsp;</td></tr></table>`);
  } else if (contact || address) {
    blocks.push(`<div style="height:8px;line-height:8px;font-size:0;">&nbsp;</div>`);
  }
  if (contact) blocks.push(contact);
  if (address) blocks.push(p(address, `color:${MUTED};`));
  if (socials) blocks.push(socials);
  if (ctaText && ctaUrl) {
    blocks.push(`<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;margin-top:10px;"><tr><td bgcolor="${accent}" style="background-color:${accent};border-radius:4px;padding:7px 14px;"><a href="${escapeHtml(ctaUrl)}" style="color:#ffffff;text-decoration:none;font-weight:bold;font-size:12px;">${ctaText}</a></td></tr></table>`);
  }
  const text = blocks.join('');

  const tableStyle = `border-collapse:collapse;font-family:${font};font-size:13px;line-height:1.5;color:${TEXT};`;
  let row: string;
  if (data.template === 'minimal' || !imageTag) {
    const logo = imageTag && data.template === 'minimal' ? `<div style="padding-top:10px;">${imageTag}</div>` : '';
    const border = data.template === 'classic' ? `border-left:3px solid ${accent};padding-left:14px;` : '';
    row = `<tr><td style="vertical-align:top;${border}">${text}${logo}</td></tr>`;
  } else if (data.template === 'classic') {
    row = `<tr><td style="vertical-align:top;padding-right:16px;">${imageTag}</td><td style="vertical-align:top;border-left:3px solid ${accent};padding-left:16px;">${text}</td></tr>`;
  } else {
    row = `<tr><td style="vertical-align:top;padding-right:18px;">${imageTag}</td><td style="vertical-align:top;">${text}</td></tr>`;
  }

  const table = `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="${tableStyle}">${row}</table>`;
  const legal = disclaimer ? `<p style="margin:12px 0 0;max-width:520px;font-family:${font};font-size:11px;line-height:1.4;color:#94a3b8;">${disclaimer}</p>` : '';
  return `${table}${legal}`;
}

/** The same signature for mail clients set to plain text. */
export function buildSignatureText(data: SignatureData, labels: SignatureLabels): string {
  const lines = [
    data.name.trim(),
    [data.title.trim(), data.company.trim()].filter(Boolean).join(' · '),
    ...contactLines(data, labels).map((line) => `${line.label} ${line.text}`),
    data.address.trim(),
    ...SOCIAL_NETWORKS.map((network) => {
      const url = safeWebUrl(data.socials[network] ?? '');
      return url ? `${SOCIAL_LABELS[network]} : ${url}` : '';
    }),
    data.ctaText.trim() && safeWebUrl(data.ctaUrl) ? `${data.ctaText.trim()} : ${safeWebUrl(data.ctaUrl)}` : '',
  ].filter(Boolean);
  const disclaimer = data.disclaimer.trim();
  return ['--', ...lines, ...(disclaimer ? ['', disclaimer] : [])].join('\n');
}

/** A standalone page holding the signature, for the download. */
export function signatureDocument(html: string, title: string): string {
  return `<!doctype html>\n<html>\n<head>\n<meta charset="utf-8">\n<title>${escapeHtml(title)}</title>\n</head>\n<body style="margin:24px;background:#ffffff;">\n${html}\n</body>\n</html>\n`;
}

export function isSignatureData(value: unknown): value is SignatureData {
  const data = value as SignatureData;
  return Boolean(data) && typeof data === 'object' && typeof data.name === 'string' && typeof data.socials === 'object' && data.socials !== null
    && (SIGNATURE_TEMPLATES as readonly string[]).includes(data.template);
}
