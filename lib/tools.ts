// lib/tools.ts — Catalogue des outils JcHub
import { reportUserError } from '@/lib/user-error';
import { isToolComponentName } from '@/lib/tool-components';
import type { Locale } from '@/i18n/routing';
import { categoryLabel } from '@/lib/categories';

/** English version of a tool: its own address slug, texts and search keywords. */
export type ToolTranslation = {
  slug: string;
  name: string;
  description: string;
  tags: string[];
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
};

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
  /** The French fields above are the reference; `slug` stays the tool's identifier in every language. */
  translations?: { en?: ToolTranslation };
  /** Address slug in the language the tool was localized for (see localizeTool). */
  localSlug?: string;
};

/**
 * The tool as shown in `locale`: translated texts and address slug, same identifier,
 * component and schedule. A tool not yet translated keeps its French texts.
 */
export function localizeTool(tool: Tool, locale: Locale): Tool {
  const translation = locale === 'en' ? tool.translations?.en : undefined;
  if (!translation) return { ...tool, category: categoryLabel(tool.category, locale), localSlug: tool.slug };
  return {
    ...tool,
    name: translation.name || tool.name,
    description: translation.description || tool.description,
    category: categoryLabel(tool.category, locale),
    tags: translation.tags.length ? translation.tags : tool.tags,
    seo: {
      title: translation.seo.title || tool.seo.title,
      description: translation.seo.description || tool.seo.description,
      keywords: translation.seo.keywords.length ? translation.seo.keywords : tool.seo.keywords,
    },
    localSlug: translation.slug || tool.slug,
  };
}

/** Address of the tool page in `locale`: /fr/outils/<slug> in French, /en/tools/<english-slug> in English. */
export function toolPath(tool: Tool, locale: Locale): string {
  const prefix = `/${locale}`;
  if (tool.path) return `${prefix}${tool.path}`;
  const slug = locale === 'en' ? tool.translations?.en?.slug || tool.slug : tool.slug;
  return `${prefix}${locale === 'en' ? '/tools' : '/outils'}/${encodeURIComponent(slug)}`;
}

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
    translations: {
      en: {
        slug: 'images-to-pdf',
        name: 'Images to PDF',
        description: 'Convert several JPG, JPEG or PNG images into one PDF, with one image per page and the page size of your choice.',
        tags: ['image', 'jpg', 'jpeg', 'png', 'pdf', 'conversion'],
        seo: {
          title: 'Convert images to PDF for free — JcHub',
          description: 'Combine JPG, JPEG and PNG images into a PDF. Choose the page size and orientation; each image fills one page.',
          keywords: ['images to pdf', 'jpg to pdf', 'png to pdf', 'convert image to pdf'],
        },
      },
    },
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
    translations: {
      en: {
        slug: 'webp-png-image-optimizer',
        name: 'WebP / PNG Image Optimizer and Converter',
        description: 'Convert your JPG, PNG or WebP images to WebP or PNG and shrink their file size in seconds.',
        tags: ['image', 'webp', 'png', 'optimizer', 'compression', 'conversion'],
        seo: {
          title: 'WebP / PNG Image Optimizer and Converter — JcHub',
          description: 'Convert and optimize your JPG, PNG and WebP images for free. Adjustable WebP quality, files deleted after processing.',
          keywords: ['webp image optimizer', 'webp png converter', 'compress image', 'convert png to webp'],
        },
      },
    },
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
    category: 'Développement',
    icon: '💸',
    tags: ['api', 'pricing', 'cost', 'usage', 'rate limit', 'developer tools', 'json', 'http'],
    component: 'ApiCostCalculator',
    translations: {
      en: {
        slug: 'api-cost-calculator',
        name: 'API Cost Calculator',
        description: 'Estimate API request volumes, monthly costs, quotas, retries, and rate limits.',
        tags: ['api', 'pricing', 'cost', 'usage', 'rate limit', 'developer tools', 'json', 'http'],
        seo: {
          title: 'API Cost Calculator – Estimate API Usage & Costs | JcHub',
          description: "Calculate API costs, estimate monthly usage, simulate request volumes, and monitor API rate limits with JcHub's free API Cost Calculator.",
          keywords: ['API Cost Calculator', 'API Pricing Calculator', 'API Usage Calculator', 'API Budget Calculator', 'API Rate Limit Calculator', 'API Cost Estimator'],
        },
      },
    },
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
    translations: {
      en: {
        slug: 'password-generator',
        name: 'Secure password generator',
        description: 'Generate strong, random, customized passwords.',
        tags: ['password', 'security', 'random', 'generator'],
        seo: {
          title: 'Free secure password generator — JcHub',
          description: 'Create strong, random passwords in one click.',
          keywords: ['password generator', 'secure password', 'random password'],
        },
      },
    },
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
    translations: {
      en: {
        slug: 'json-formatter',
        name: 'JSON Formatter & Validator',
        description: 'Format, validate and minify your JSON in real time.',
        tags: ['json', 'formatter', 'validator'],
        seo: {
          title: 'Free JSON Formatter & Validator — JcHub',
          description: 'Format and validate your JSON code instantly.',
          keywords: ['json formatter', 'json validator'],
        },
      },
    },
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
    translations: {
      en: {
        slug: 'base64-encoder',
        name: 'Base64 Encoder / Decoder',
        description: 'Encode or decode text to and from Base64.',
        tags: ['base64', 'encode', 'decode'],
        seo: {
          title: 'Online Base64 Encoder / Decoder — JcHub',
          description: 'Encode and decode text in Base64 for free.',
          keywords: ['base64 encoder', 'base64 decoder'],
        },
      },
    },
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
    translations: {
      en: {
        slug: 'uuid-generator',
        name: 'UUID Generator',
        description: 'Generate v1, v4 and v7 UUIDs in bulk.',
        tags: ['uuid', 'guid', 'random'],
        seo: {
          title: 'Free UUID Generator (v1, v4, v7) — JcHub',
          description: 'Generate v1, v4 and v7 UUIDs in bulk.',
          keywords: ['uuid generator', 'guid generator'],
        },
      },
    },
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
    translations: {
      en: {
        slug: 'regex-tester',
        name: 'Visual Regex Tester',
        description: 'Test your regular expressions with real-time highlighting.',
        tags: ['regex', 'regexp', 'tester'],
        seo: {
          title: 'Free online Regex Tester — JcHub',
          description: 'Test and debug your regular expressions with highlighting.',
          keywords: ['regex tester', 'test regex'],
        },
      },
    },
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
    translations: {
      en: {
        slug: 'excel-to-csv',
        name: 'Excel to CSV',
        description: 'Convert an Excel file to CSV while keeping the table data structured.',
        tags: ['excel', 'csv', 'spreadsheet', 'conversion'],
        seo: {
          title: 'Convert Excel to CSV for free — JcHub',
          description: 'Turn an Excel file into a cleanly structured CSV in seconds.',
          keywords: ['excel to csv', 'convert excel to csv', 'xlsx csv'],
        },
      },
    },
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
    translations: {
      en: {
        slug: 'csv-to-excel',
        name: 'CSV to Excel',
        description: 'Turn a CSV file into an Excel .xlsx spreadsheet in seconds.',
        tags: ['csv', 'excel', 'xlsx', 'conversion'],
        seo: {
          title: 'Convert CSV to Excel for free — JcHub',
          description: 'Create an Excel file from a CSV while keeping its columns and rows.',
          keywords: ['csv to excel', 'convert csv to excel', 'csv xlsx'],
        },
      },
    },
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
    translations: {
      en: {
        slug: 'pdf-to-word',
        name: 'PDF to Word',
        description: 'Convert a PDF into an editable Word DOCX document in seconds.',
        tags: ['pdf', 'word', 'docx', 'conversion'],
        seo: {
          title: 'Convert PDF to Word for free — JcHub',
          description: 'Easily turn a PDF file into a Word DOCX document in seconds.',
          keywords: ['pdf to word', 'convert pdf to word', 'docx', 'pdf to docx'],
        },
      },
    },
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
    translations: {
      en: {
        slug: 'word-to-pdf',
        name: 'Word to PDF',
        description: 'Convert a Word DOCX document to PDF while keeping its layout.',
        tags: ['word', 'pdf', 'docx', 'conversion'],
        seo: {
          title: 'Convert Word to PDF for free — JcHub',
          description: 'Turn a Word DOCX document into a PDF ready to share.',
          keywords: ['word to pdf', 'convert word to pdf', 'docx to pdf'],
        },
      },
    },
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
    translations: {
      en: {
        slug: 'compress-pdf',
        name: 'Compress a PDF for free',
        description: 'Shrink a PDF document from 15 MB to under 2 MB to email it or upload it to a portal.',
        tags: ['pdf', 'compression', 'email', 'portal', 'file', 'optimization'],
        seo: {
          title: 'Compress a PDF for free — JcHub',
          description: 'Reduce the size of your PDFs to email them or upload them to a portal more easily.',
          keywords: ['compress pdf', 'reduce pdf size', 'pdf under 2 mb', 'optimize pdf free'],
        },
      },
    },
    status: 'published',
    seo: {
      title: 'Compresser un PDF gratuitement — JcHub',
      description: 'Réduit la taille de tes PDFs pour les envoyer plus facilement par e-mail ou les déposer sur un portail.',
      keywords: ['compresser pdf', 'réduire pdf', 'pdf moins de 2 mo', 'optimiser pdf gratuit'],
    },
  },
  {
    slug: 'fusionner-decouper-pdf',
    name: 'Fusion et découpe de PDF',
    description: 'Fusionne plusieurs PDF en un seul ou découpe un PDF en plusieurs fichiers, directement dans ton navigateur.',
    category: 'Document',
    icon: '✂️',
    tags: ['pdf', 'fusionner', 'découper', 'pages', 'extraire', 'document'],
    component: 'PdfMergeSplit',
    translations: {
      en: {
        slug: 'merge-split-pdf',
        name: 'PDF merge and split',
        description: 'Merge several PDFs into one or split a PDF into several files, right in your browser.',
        tags: ['pdf', 'merge', 'split', 'pages', 'extract', 'document'],
        seo: {
          title: 'Merge and split PDF files for free — JcHub',
          description: 'Combine several PDFs into one file or split a PDF by pages. Free, no sign-up: your files never leave your browser.',
          keywords: ['merge pdf', 'split pdf', 'combine pdf', 'extract pdf pages', 'pdf splitter'],
        },
      },
    },
    status: 'published',
    seo: {
      title: 'Fusionner et découper un PDF gratuitement — JcHub',
      description: 'Assemble plusieurs PDF en un seul fichier ou découpe un PDF par pages. Gratuit, sans inscription : tes fichiers restent dans ton navigateur.',
      keywords: ['fusionner pdf', 'découper pdf', 'assembler pdf', 'extraire pages pdf', 'diviser pdf'],
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
    translations: {
      en: {
        slug: 'color-converter',
        name: 'Color converter',
        description: 'Convert colors between HEX, RGB, HSL and other formats.',
        tags: ['color', 'hex', 'rgb', 'hsl'],
        seo: {
          title: 'HEX RGB HSL color converter — JcHub',
          description: 'Easily convert your colors between HEX, RGB and HSL.',
          keywords: ['color converter', 'hex to rgb', 'hsl'],
        },
      },
    },
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
    translations: {
      en: {
        slug: 'hash-generator',
        name: 'Hash generator',
        description: 'Generate MD5, SHA-1, SHA-256 and SHA-512 digests.',
        tags: ['hash', 'md5', 'sha256', 'cryptography'],
        seo: {
          title: 'Online MD5 and SHA hash generator — JcHub',
          description: 'Generate MD5, SHA-1, SHA-256 and SHA-512 hashes right in your browser.',
          keywords: ['hash generator', 'md5', 'sha256'],
        },
      },
    },
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
    translations: {
      en: {
        slug: 'jwt-decoder',
        name: 'JWT Decoder',
        description: 'Decode and inspect the header and payload of your JWT tokens.',
        tags: ['jwt', 'json web token', 'authentication'],
        seo: {
          title: 'Free online JWT Decoder — JcHub',
          description: 'Quickly decode and inspect your JSON Web Tokens.',
          keywords: ['jwt decoder', 'decode jwt', 'json web token'],
        },
      },
    },
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
    translations: {
      en: {
        slug: 'markdown-preview',
        name: 'Markdown Preview',
        description: 'Preview your Markdown in real time and export the HTML.',
        tags: ['markdown', 'preview', 'html'],
        seo: {
          title: 'Online Markdown Preview — JcHub',
          description: 'Write and preview your Markdown in real time in your browser.',
          keywords: ['markdown preview', 'markdown editor', 'markdown to html'],
        },
      },
    },
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
    translations: {
      en: {
        slug: 'number-base-converter',
        name: 'Number base converter',
        description: 'Convert numbers between binary, octal, decimal and hexadecimal.',
        tags: ['binary', 'hexadecimal', 'octal', 'conversion'],
        seo: {
          title: 'Binary, decimal, hexadecimal converter — JcHub',
          description: 'Instantly convert numbers between bases 2, 8, 10 and 16.',
          keywords: ['base converter', 'binary to decimal', 'hexadecimal'],
        },
      },
    },
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
    translations: {
      en: {
        slug: 'qr-code-generator',
        name: 'QR code generator',
        description: 'Create and download QR codes from text or a URL.',
        tags: ['qr code', 'qrcode', 'url'],
        seo: {
          title: 'Free QR code generator — JcHub',
          description: 'Create custom QR codes to download for free.',
          keywords: ['qr code generator', 'free qr code', 'url qr code'],
        },
      },
    },
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
    translations: {
      en: {
        slug: 'timestamp-converter',
        name: 'Timestamp Converter',
        description: 'Convert Unix timestamps to dates and back.',
        tags: ['timestamp', 'unix', 'date'],
        seo: {
          title: 'Online Unix Timestamp Converter — JcHub',
          description: 'Convert Unix timestamps into readable dates and back.',
          keywords: ['timestamp converter', 'unix timestamp', 'date converter'],
        },
      },
    },
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
    translations: {
      en: {
        slug: 'url-encoder',
        name: 'URL Encoder / Decoder',
        description: 'Encode or decode URLs and parameters with ease.',
        tags: ['url', 'encode', 'decode', 'uri'],
        seo: {
          title: 'Online URL encoder and decoder — JcHub',
          description: 'Quickly encode and decode URLs and their parameters.',
          keywords: ['url encoder', 'url decoder', 'encode url'],
        },
      },
    },
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
    // A Firestore copy of a built-in tool keeps the English version written in this file.
    translations: { en: toToolTranslation(data.translations?.en) ?? registeredTool?.translations?.en },
  };
}

export function toToolTranslation(data: unknown): ToolTranslation | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const value = data as Record<string, any>;
  const slug = String(value.slug || '').trim();
  const name = String(value.name || '').trim();
  if (!slug || !name) return undefined;
  return {
    slug,
    name,
    description: String(value.description || ''),
    tags: Array.isArray(value.tags) ? value.tags.map(String) : [],
    seo: {
      title: String(value.seo?.title || name),
      description: String(value.seo?.description || value.description || ''),
      keywords: Array.isArray(value.seo?.keywords) ? value.seo.keywords.map(String) : [],
    },
  };
}

/** Share catalog reads across requests and keep Firestore throttling off the render path. */
const TOOL_DOCUMENTS_CACHE_MS = 60_000;
const TOOL_DOCUMENTS_TIMEOUT_MS = 1_200;
const TOOL_DOCUMENTS_RETRY_MS = 60_000;
let toolDocumentsCache: Tool[] | null = null;
let toolDocumentsCachedAt = 0;
let toolDocumentsRetryAt = 0;
let toolDocumentsRequest: Promise<Tool[] | null> | null = null;

function readToolDocuments(): Promise<Tool[] | null> {
  if (!toolDocumentsRequest) {
    const request = (async () => {
      try {
        const { getAdminDb } = await import('@/lib/firebase-admin');
        const snapshot = await getAdminDb().collection('tools').get();
        const documents = snapshot.docs.map((document) => toToolRecord(document.data()));
        toolDocumentsCache = documents;
        toolDocumentsCachedAt = Date.now();
        toolDocumentsRetryAt = 0;
        return documents;
      } catch (error) {
        toolDocumentsRetryAt = Date.now() + TOOL_DOCUMENTS_RETRY_MS;
        reportUserError(error);
        return null;
      }
    })().finally(() => {
      if (toolDocumentsRequest === request) toolDocumentsRequest = null;
    });
    toolDocumentsRequest = request;
  }
  return toolDocumentsRequest;
}

async function getFirestoreToolsWithoutBlocking(): Promise<Tool[] | null> {
  if (toolDocumentsCache && Date.now() - toolDocumentsCachedAt < TOOL_DOCUMENTS_CACHE_MS) {
    return toolDocumentsCache;
  }
  if (Date.now() < toolDocumentsRetryAt) return toolDocumentsCache;

  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timedOut = new Promise<null>((resolve) => {
    timeout = setTimeout(() => {
      toolDocumentsRetryAt = Date.now() + TOOL_DOCUMENTS_RETRY_MS;
      resolve(null);
    }, TOOL_DOCUMENTS_TIMEOUT_MS);
  });

  const documents = await Promise.race([readToolDocuments(), timedOut]);
  if (timeout) clearTimeout(timeout);
  return documents ?? toolDocumentsCache;
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
    const fromFirestore = await getFirestoreToolsWithoutBlocking();

    if (!fromFirestore || fromFirestore.length === 0) {
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
    reportUserError(error);
    return filterPublished(tools);
  }
}

/**
 * Finds a tool by the slug of its address in `locale`. In English the French slug is
 * accepted too, so the page can redirect old or shared links to the English address.
 */
export async function getToolBySlug(slug: string, locale: Locale = 'fr'): Promise<Tool | null> {
  const toolList = await getPublishedTools();
  const tool = locale === 'en'
    ? toolList.find((candidate) => candidate.translations?.en?.slug === slug) ?? toolList.find((candidate) => candidate.slug === slug)
    : toolList.find((candidate) => candidate.slug === slug);
  if (!tool || DISABLED_TOOL_SLUGS.has(tool.slug)) return null;
  return tool;
}
