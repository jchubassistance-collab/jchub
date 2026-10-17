// lib/tools.ts — Catalogue des outils JcHub
import { reportUserError } from '@/lib/user-error';
import { isToolComponentName } from '@/lib/tool-components';

export type Tool = {
  slug: string;
  path?: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  tags: string[];
  component: string;
  status?: 'published' | 'draft' | 'archived';
  /** JavaScript weekday numbers in Africa/Lagos (Sunday = 0). */
  visibleDays?: number[];
  /** ISO date from which a published tool is shown on the site. */
  publishAt?: string;
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
};

const DISABLED_TOOL_SLUGS = new Set<string>();

export const tools: Tool[] = [
  {
    slug: 'images-en-pdf',
    name: 'Images en PDF',
    description: 'Convertis plusieurs images JPG, JPEG ou PNG en un PDF, avec une image par page et une taille de page au choix.',
    category: 'Document',
    icon: '🖼️',
    tags: ['image', 'jpg', 'jpeg', 'png', 'pdf', 'conversion'],
    component: 'ImagesToPdf',
    status: 'published',
    visibleDays: [5],
    seo: {
      title: 'Convertir des images en PDF gratuitement — JcHub',
      description: 'Assemble des images JPG, JPEG et PNG en PDF. Choisis le format et l’orientation des pages ; chaque image occupe une page.',
      keywords: ['images en pdf', 'jpg en pdf', 'png en pdf', 'convertir image pdf'],
    },
  },
  {
    slug: 'optimiseur-convertisseur-webp-png',
    name: 'Optimiseur et Convertisseur d’Images WebP / PNG',
    description: 'Convertis tes images JPG, PNG ou WebP en WebP ou PNG et réduis leur poids en quelques secondes.',
    category: 'Design',
    icon: '🖼️',
    tags: ['image', 'webp', 'png', 'optimiseur', 'compression', 'conversion'],
    component: 'ImageOptimizer',
    status: 'published',
    seo: {
      title: 'Optimiseur et Convertisseur d’Images WebP / PNG — JcHub',
      description: 'Convertis et optimise gratuitement tes images JPG, PNG et WebP. Réglage de la qualité WebP, fichiers supprimés après traitement.',
      keywords: ['optimiseur image webp', 'convertisseur webp png', 'compresser image', 'convertir png webp'],
    },
  },
  {
    slug: 'api-cost-calculator',
    path: '/tools/api-cost-calculator',
    name: 'API Cost Calculator',
    description: 'Estimate API request volumes, monthly costs, quotas, retries, and rate limits.',
    category: 'Development',
    icon: '💸',
    tags: ['api', 'pricing', 'cost', 'usage', 'rate limit', 'developer tools', 'json', 'http'],
    component: 'ApiCostCalculator',
    status: 'published',
    seo: {
      title: 'API Cost Calculator – Estimate API Usage & Costs | JcHub',
      description: "Calculate API costs, estimate monthly usage, simulate request volumes, and monitor API rate limits with JcHub's free API Cost Calculator.",
      keywords: ['API Cost Calculator', 'API Pricing Calculator', 'API Usage Calculator', 'API Budget Calculator', 'API Rate Limit Calculator', 'API Cost Estimator'],
    },
  },
  {
    slug: 'generateur-mot-de-passe',
    name: 'Générateur de mot de passe sécurisé',
    description: 'Génère des mots de passe forts et aléatoires personnalisés.',
    category: 'Sécurité',
    icon: '🔐',
    tags: ['password', 'security', 'random'],
    component: 'PasswordGenerator',
    status: 'published',
    seo: {
      title: 'Générateur de mot de passe sécurisé gratuit — JcHub',
      description: 'Crée des mots de passe forts et aléatoires en un clic.',
      keywords: ['générateur mot de passe', 'password generator', 'sécurisé'],
    },
  },
  {
    slug: 'json-formatter',
    name: 'JSON Formatter & Validator',
    description: 'Formate, valide et minifie ton JSON en temps réel.',
    category: 'Développement',
    icon: '📋',
    tags: ['json', 'formatter', 'validator'],
    component: 'JsonFormatter',
    status: 'published',
    seo: {
      title: 'JSON Formatter & Validator gratuit — JcHub',
      description: 'Formate et valide ton code JSON instantanément.',
      keywords: ['json formatter', 'json validator'],
    },
  },
  {
    slug: 'base64-encoder',
    name: 'Base64 Encoder / Decoder',
    description: 'Encode ou décode du texte en Base64.',
    category: 'Encodage',
    icon: '🔄',
    tags: ['base64', 'encode', 'decode'],
    component: 'Base64Tool',
    status: 'published',
    seo: {
      title: 'Base64 Encoder / Decoder en ligne — JcHub',
      description: 'Encode et décode du texte en Base64 gratuitement.',
      keywords: ['base64 encoder', 'base64 decoder'],
    },
  },
  {
    slug: 'uuid-generator',
    name: 'UUID Generator',
    description: 'Génère des UUID v1, v4 et v7 en masse.',
    category: 'Développement',
    icon: '🆔',
    tags: ['uuid', 'guid', 'random'],
    component: 'UuidGenerator',
    status: 'published',
    seo: {
      title: 'UUID Generator gratuit (v1, v4, v7) — JcHub',
      description: 'Génère des UUID v1, v4, v7 en masse.',
      keywords: ['uuid generator', 'générateur uuid'],
    },
  },
  {
    slug: 'regex-tester',
    name: 'Regex Tester visuel',
    description: 'Teste tes expressions régulières avec highlighting en temps réel.',
    category: 'Développement',
    icon: '🎯',
    tags: ['regex', 'regexp', 'tester'],
    component: 'RegexTester',
    status: 'published',
    seo: {
      title: 'Regex Tester en ligne gratuit — JcHub',
      description: 'Teste et débugge tes expressions régulières avec highlighting.',
      keywords: ['regex tester', 'tester regex'],
    },
  },
  {
    slug: 'excel-vers-csv',
    name: 'Excel vers CSV',
    description: 'Convertis un fichier Excel en CSV en gardant les données tabulaires structurées.',
    category: 'Document',
    icon: '📊',
    tags: ['excel', 'csv', 'tableur', 'conversion'],
    component: 'ExcelToCsvTool',
    status: 'published',
    seo: {
      title: 'Convertir Excel en CSV gratuitement — JcHub',
      description: 'Transforme un fichier Excel en CSV proprement structuré en quelques secondes.',
      keywords: ['excel vers csv', 'convertir excel en csv', 'xlsx csv'],
    },
  },
  {
    slug: 'csv-vers-excel',
    name: 'CSV vers Excel',
    description: 'Transforme un fichier CSV en tableau Excel .xlsx en quelques secondes.',
    category: 'Document',
    icon: '📈',
    tags: ['csv', 'excel', 'xlsx', 'conversion'],
    component: 'CsvToExcelTool',
    status: 'published',
    seo: {
      title: 'Convertir CSV en Excel gratuitement — JcHub',
      description: 'Crée un fichier Excel à partir d’un CSV en gardant les colonnes et les lignes.',
      keywords: ['csv vers excel', 'convertir csv en excel', 'csv xlsx'],
    },
  },
  {
    slug: 'pdf-to-word',
    name: 'PDF vers Word',
    description: 'Convertis un PDF en document Word DOCX modifiable en quelques secondes.',
    category: 'Document',
    icon: '📄',
    tags: ['pdf', 'word', 'docx', 'conversion'],
    component: 'PdfToWord',
    status: 'published',
    seo: {
      title: 'Convertir PDF en Word gratuitement — JcHub',
      description: 'Transforme facilement un fichier PDF en document Word DOCX en quelques secondes.',
      keywords: ['pdf vers word', 'convertir pdf en word', 'docx', 'pdf to word'],
    },
  },
  {
    slug: 'word-to-pdf',
    name: 'Word vers PDF',
    description: 'Convertis un document Word DOCX en PDF en conservant sa mise en page.',
    category: 'Document',
    icon: '📄',
    tags: ['word', 'pdf', 'docx', 'conversion'],
    component: 'WordToPdf',
    status: 'published',
    seo: {
      title: 'Convertir Word en PDF gratuitement — JcHub',
      description: 'Transforme un document Word DOCX en PDF prêt à partager.',
      keywords: ['word vers pdf', 'convertir word en pdf', 'docx en pdf', 'word to pdf'],
    },
  },
  {
    slug: 'compresser-pdf',
    name: 'Compresser un PDF gratuitement',
    description: 'Réduit un document PDF de 15 Mo à moins de 2 Mo pour l’envoyer par e-mail ou le déposer sur un portail.',
    category: 'Document',
    icon: '📦',
    tags: ['pdf', 'compression', 'email', 'portail', 'fichier', 'optimisation'],
    component: 'PdfCompressor',
    status: 'published',
    seo: {
      title: 'Compresser un PDF gratuitement — JcHub',
      description: 'Réduit la taille de tes PDFs pour les envoyer plus facilement par e-mail ou les déposer sur un portail.',
      keywords: ['compresser pdf', 'réduire pdf', 'pdf moins de 2 mo', 'optimiser pdf gratuit'],
    },
  },
  {
    slug: 'convertisseur-couleurs',
    name: 'Convertisseur de couleurs',
    description: 'Convertis les couleurs entre HEX, RGB, HSL et autres formats.',
    category: 'Design',
    icon: '🎨',
    tags: ['couleur', 'hex', 'rgb', 'hsl'],
    component: 'ColorConverter',
    status: 'published',
    seo: {
      title: 'Convertisseur de couleurs HEX RGB HSL — JcHub',
      description: 'Convertis facilement tes couleurs entre HEX, RGB et HSL.',
      keywords: ['convertisseur couleur', 'hex rgb', 'hsl'],
    },
  },
  {
    slug: 'generateur-de-hash',
    name: 'Générateur de hash',
    description: 'Génère des empreintes MD5, SHA-1, SHA-256 et SHA-512.',
    category: 'Sécurité',
    icon: '#️⃣',
    tags: ['hash', 'md5', 'sha256', 'cryptographie'],
    component: 'HashGenerator',
    status: 'published',
    seo: {
      title: 'Générateur de hash MD5 et SHA en ligne — JcHub',
      description: 'Génère des hash MD5, SHA-1, SHA-256 et SHA-512 directement dans ton navigateur.',
      keywords: ['générateur hash', 'md5', 'sha256'],
    },
  },
  {
    slug: 'decodeur-jwt',
    name: 'Décodeur JWT',
    description: 'Décode et inspecte le header et le payload de tes tokens JWT.',
    category: 'Développement',
    icon: '🔑',
    tags: ['jwt', 'json web token', 'authentification'],
    component: 'JwtDecoder',
    status: 'published',
    seo: {
      title: 'Décodeur JWT en ligne gratuit — JcHub',
      description: 'Décode et inspecte rapidement tes tokens JSON Web Token.',
      keywords: ['jwt decoder', 'décodeur jwt', 'json web token'],
    },
  },
  {
    slug: 'apercu-markdown',
    name: 'Aperçu Markdown',
    description: 'Prévisualise ton Markdown en temps réel et exporte le HTML.',
    category: 'Développement',
    icon: '📝',
    tags: ['markdown', 'preview', 'html'],
    component: 'MarkdownPreview',
    status: 'published',
    seo: {
      title: 'Aperçu Markdown en ligne — JcHub',
      description: 'Écris et prévisualise ton Markdown en temps réel dans ton navigateur.',
      keywords: ['markdown preview', 'éditeur markdown', 'markdown html'],
    },
  },
  {
    slug: 'convertisseur-de-bases',
    name: 'Convertisseur de bases numériques',
    description: 'Convertis des nombres entre les bases binaire, octale, décimale et hexadécimale.',
    category: 'Développement',
    icon: '🔢',
    tags: ['binaire', 'hexadécimal', 'octal', 'conversion'],
    component: 'NumberBaseConverter',
    status: 'published',
    seo: {
      title: 'Convertisseur binaire, décimal, hexadécimal — JcHub',
      description: 'Convertis instantanément des nombres entre les bases 2, 8, 10 et 16.',
      keywords: ['convertisseur base', 'binaire décimal', 'hexadécimal'],
    },
  },
  {
    slug: 'generateur-de-qr-code',
    name: 'Générateur de QR code',
    description: 'Crée et télécharge des QR codes à partir de texte ou d’une URL.',
    category: 'Productivité',
    icon: '📱',
    tags: ['qr code', 'qrcode', 'url'],
    component: 'QrCodeGenerator',
    status: 'published',
    seo: {
      title: 'Générateur de QR code gratuit — JcHub',
      description: 'Crée gratuitement des QR codes personnalisés à télécharger.',
      keywords: ['générateur qr code', 'qrcode gratuit', 'qr url'],
    },
  },
  {
    slug: 'convertisseur-timestamp',
    name: 'Convertisseur Timestamp',
    description: 'Convertis des timestamps Unix en dates et inversement.',
    category: 'Développement',
    icon: '🕒',
    tags: ['timestamp', 'unix', 'date'],
    component: 'TimestampConverter',
    status: 'published',
    seo: {
      title: 'Convertisseur Timestamp Unix en ligne — JcHub',
      description: 'Convertis des timestamps Unix en dates lisibles et inversement.',
      keywords: ['timestamp converter', 'unix timestamp', 'convertisseur date'],
    },
  },
  {
    slug: 'encodeur-url',
    name: 'Encodeur / Décodeur URL',
    description: 'Encode ou décode des URL et paramètres en toute simplicité.',
    category: 'Encodage',
    icon: '🔗',
    tags: ['url', 'encode', 'decode', 'uri'],
    component: 'UrlEncoder',
    status: 'published',
    seo: {
      title: 'Encodeur et décodeur URL en ligne — JcHub',
      description: 'Encode et décode rapidement des URL et leurs paramètres.',
      keywords: ['url encoder', 'url decoder', 'encodeur url'],
    },
  },
];

export function isToolVisibleToday(tool: Tool, date = new Date()): boolean {
  if (!tool.visibleDays?.length) return true;
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Lagos',
    weekday: 'short',
  }).format(date);
  const weekdayNumber: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return tool.visibleDays.includes(weekdayNumber[weekday]);
}

/**
 * A published tool reaches the public catalog once its publication date has passed
 * and its component exists in the running deployment: a tool merged from the admin
 * stays hidden until Vercel has deployed its code.
 */
function isToolLive(tool: Tool, options: { includeScheduled?: boolean }, now = Date.now()): boolean {
  const released = options.includeScheduled || !tool.publishAt || Date.parse(tool.publishAt) <= now;
  const deployable = Boolean(tool.path) || isToolComponentName(tool.component);
  return released && deployable;
}

function toToolRecord(data: Record<string, any>): Tool {
  const registeredTool = tools.find((tool) => tool.slug === String(data.slug || ''));
  return {
    slug: String(data.slug || ''),
    path: typeof data.path === 'string' ? data.path : registeredTool?.path,
    name: String(data.name || 'Outil sans nom'),
    description: String(data.description || ''),
    category: String(data.category || 'Autre'),
    icon: String(data.icon || '🛠️'),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    component: String(data.component || data.slug || 'GenericTool'),
    status: data.status === 'draft' || data.status === 'archived' ? data.status : 'published',
    visibleDays: Array.isArray(data.visibleDays) ? data.visibleDays.map(Number) : registeredTool?.visibleDays,
    publishAt: typeof data.publishAt?.toDate === 'function' ? data.publishAt.toDate().toISOString() : undefined,
    seo: {
      title: String(data.seo?.title || data.name || 'Outil JcHub'),
      description: String(data.seo?.description || data.description || ''),
      keywords: Array.isArray(data.seo?.keywords) ? data.seo.keywords.map(String) : [],
    },
  };
}

export async function getPublishedTools(options: { includeScheduled?: boolean } = {}): Promise<Tool[]> {
  const filterPublished = (list: Tool[]) => list.filter((tool) =>
    tool.status === 'published'
    && !DISABLED_TOOL_SLUGS.has(tool.slug)
    && (options.includeScheduled || isToolVisibleToday(tool))
    && isToolLive(tool, options),
  );
  const hasConfig = Boolean(
    process.env.FIREBASE_PROJECT_ID
    && process.env.FIREBASE_CLIENT_EMAIL
    && process.env.FIREBASE_PRIVATE_KEY,
  );

  if (!hasConfig) {
    return filterPublished(tools);
  }

  try {
    const { getAdminDb } = await import('@/lib/firebase-admin');
    const snapshot = await getAdminDb().collection('tools').get();
    const fromFirestore = snapshot.docs.map((document) => toToolRecord(document.data()));

    if (fromFirestore.length === 0) {
      return filterPublished(tools);
    }

    const mergedBySlug = new Map<string, Tool>();

    for (const tool of tools) {
      mergedBySlug.set(tool.slug, tool);
    }

    for (const tool of fromFirestore) {
      if (tool.slug) {
        mergedBySlug.set(tool.slug, tool);
      }
    }

    return filterPublished(Array.from(mergedBySlug.values()));
  } catch (error) {
    reportUserError();
    return filterPublished(tools);
  }
}

export async function getToolBySlug(slug: string): Promise<Tool | null> {
  if (DISABLED_TOOL_SLUGS.has(slug)) return null;
  const toolList = await getPublishedTools();
  return toolList.find((tool) => tool.slug === slug) ?? null;
}
