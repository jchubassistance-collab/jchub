// lib/tools.ts — Catalogue des outils JcHub
import { reportUserError } from '@/lib/user-error';

export type Tool = {
  slug: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  tags: string[];
  component: string;
  status?: 'published' | 'draft';
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
};

const DISABLED_TOOL_SLUGS = new Set(['images-en-pdf']);

export const tools: Tool[] = [
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
    description: 'Transforme un fichier CSV en tableau Excel .xlsx directement depuis le navigateur.',
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
    description: 'Convertis un PDF en document Word DOCX directement depuis le navigateur.',
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

function toToolRecord(data: Record<string, any>): Tool {
  return {
    slug: String(data.slug || ''),
    name: String(data.name || 'Outil sans nom'),
    description: String(data.description || ''),
    category: String(data.category || 'Autre'),
    icon: String(data.icon || '🛠️'),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    component: String(data.component || data.slug || 'GenericTool'),
    status: data.status === 'draft' ? 'draft' : 'published',
    seo: {
      title: String(data.seo?.title || data.name || 'Outil JcHub'),
      description: String(data.seo?.description || data.description || ''),
      keywords: Array.isArray(data.seo?.keywords) ? data.seo.keywords.map(String) : [],
    },
  };
}

export async function getPublishedTools(): Promise<Tool[]> {
  const hasConfig = Boolean(
    process.env.FIREBASE_PROJECT_ID
    && process.env.FIREBASE_CLIENT_EMAIL
    && process.env.FIREBASE_PRIVATE_KEY,
  );

  if (!hasConfig) {
    return tools;
  }

  try {
    const { getAdminDb } = await import('@/lib/firebase-admin');
    const snapshot = await getAdminDb().collection('tools').where('status', '==', 'published').get();
    const fromFirestore = snapshot.docs.map((document) => toToolRecord(document.data()));

    if (fromFirestore.length === 0) {
      return tools;
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

    return Array.from(mergedBySlug.values()).filter((tool) => !DISABLED_TOOL_SLUGS.has(tool.slug));
  } catch (error) {
    reportUserError();
    return tools;
  }
}

export async function getToolBySlug(slug: string): Promise<Tool | null> {
  if (DISABLED_TOOL_SLUGS.has(slug)) return null;
  const toolList = await getPublishedTools();
  return toolList.find((tool) => tool.slug === slug) ?? tools.find((tool) => tool.slug === slug) ?? null;
}
