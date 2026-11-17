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
  /** Former French slugs: their addresses redirect to the current one (see lib/slug-history.ts). */
  previousSlugs?: string[];
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
          description: 'Create strong random passwords in one click: choose the length, uppercase letters, digits and symbols. Free, no sign-up, right in your browser.',
          keywords: ['password generator', 'secure password', 'random password'],
        },
      },
    },
    status: 'published',
    seo: {
      title: 'Générateur de mot de passe sécurisé gratuit — JcHub',
      description: 'Crée des mots de passe forts et aléatoires en un clic : longueur, majuscules, chiffres et symboles au choix. Gratuit, sans inscription, dans ton navigateur.',
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
          description: 'Format, validate and minify your JSON in real time to make it readable and spot errors. Free, no sign-up, right in your browser.',
          keywords: ['json formatter', 'json validator'],
        },
      },
    },
    status: 'published',
    seo: {
      title: 'JSON Formatter & Validator gratuit — JcHub',
      description: 'Formate, valide et minifie ton JSON en temps réel pour le rendre lisible et repérer les erreurs. Gratuit, sans inscription, directement dans ton navigateur.',
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
          description: 'Encode text to Base64 or decode a Base64 string in one click. Free, no sign-up, and your text never leaves your browser.',
          keywords: ['base64 encoder', 'base64 decoder'],
        },
      },
    },
    status: 'published',
    seo: {
      title: 'Base64 Encoder / Decoder en ligne — JcHub',
      description: 'Encode du texte en Base64 ou décode une chaîne Base64 en un clic. Gratuit, sans inscription, et ton texte ne quitte jamais ton navigateur.',
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
          description: 'Generate UUID v1, v4 and v7 one at a time or in bulk, ready to copy into your databases and APIs. Free and no sign-up.',
          keywords: ['uuid generator', 'guid generator'],
        },
      },
    },
    status: 'published',
    seo: {
      title: 'UUID Generator gratuit (v1, v4, v7) — JcHub',
      description: 'Génère des UUID v1, v4 et v7 à l’unité ou en masse, prêts à copier pour tes bases de données et tes API. Gratuit et sans inscription.',
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
          description: 'Test and debug your regular expressions with matches highlighted in real time. Free, no sign-up, right in your browser.',
          keywords: ['regex tester', 'test regex'],
        },
      },
    },
    status: 'published',
    seo: {
      title: 'Regex Tester en ligne gratuit — JcHub',
      description: 'Teste et débogue tes expressions régulières avec les correspondances surlignées en temps réel. Gratuit, sans inscription, directement dans ton navigateur.',
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
          description: 'Convert an Excel file to CSV in a few seconds while keeping your tabular data clean and structured. Free and no sign-up.',
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
          description: 'Turn a CSV file into an Excel .xlsx spreadsheet in seconds, keeping your columns and rows intact. Free and no sign-up.',
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
          description: 'Convert a PDF into an editable Word DOCX document in seconds. Free, no sign-up, and your file is deleted once the conversion is done.',
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
          description: 'Convert a Word DOCX document to PDF while keeping its layout, ready to share or print. Free, no sign-up, and your file is deleted afterwards.',
          keywords: ['word to pdf', 'convert word to pdf', 'docx to pdf'],
        },
      },
    },
    status: 'published',
    seo: {
      title: 'Convertir Word en PDF gratuitement — JcHub',
      description: 'Convertis un document Word DOCX en PDF en gardant sa mise en page, prêt à partager ou à imprimer. Gratuit, sans inscription, fichier supprimé ensuite.',
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
    slug: 'logo-studio',
    name: 'JcHub Logo Studio',
    description: 'Retouche tes photos (filtres, lumière, recadrage, fond transparent), modifie ton logo et crée un pack d’icônes complet : SVG, sprite, PNG, police d’icônes et favicon.',
    category: 'Design',
    icon: '🎨',
    tags: ['retouche photo', 'filtres', 'logo', 'icônes', 'svg', 'favicon', 'police d’icônes', 'sprite', 'png', 'vectoriser', 'couleurs', 'fond transparent', 'recadrer', 'design'],
    component: 'LogoStudio',
    translations: {
      en: {
        slug: 'logo-studio',
        name: 'JcHub Logo Studio',
        description: 'Edit your photos (filters, light, cropping, transparent background), edit your logo and create a complete icon pack: SVG, sprite, PNG, icon font and favicon.',
        tags: ['photo editor', 'filters', 'logo', 'icons', 'svg', 'favicon', 'icon font', 'sprite', 'png', 'vectorize', 'colors', 'transparent background', 'crop', 'design'],
        seo: {
          title: 'Free online photo and logo editor — JcHub Studio',
          description: 'Edit photos with filters, light and crop, remove a plain background, recolor your logo and export icons as SVG, PNG and favicon. Free, in your browser.',
          keywords: ['online photo editor', 'free photo editor', 'photo filters', 'crop photo for instagram', 'remove white background', 'edit logo online', 'favicon generator', 'vectorize logo'],
        },
      },
    },
    status: 'published',
    seo: {
      title: 'Retouche photo et éditeur de logo gratuits — JcHub Studio',
      description: 'Retouche tes photos (filtres, lumière, recadrage, fond uni retiré), recolore ton logo et exporte tes icônes en SVG, PNG, favicon. Gratuit, dans ton navigateur.',
      keywords: ['retouche photo en ligne', 'éditeur photo gratuit', 'filtre photo', 'recadrer photo instagram', 'supprimer fond blanc', 'modifier logo en ligne', 'générateur favicon', 'vectoriser logo'],
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
          description: 'Convert colors between HEX, RGB and HSL in real time and copy CSS-ready code. Free, no sign-up, right in your browser.',
          keywords: ['color converter', 'hex to rgb', 'hsl'],
        },
      },
    },
    status: 'published',
    seo: {
      title: 'Convertisseur de couleurs HEX RGB HSL — JcHub',
      description: 'Convertis tes couleurs entre HEX, RGB et HSL en temps réel et copie le code prêt pour ton CSS. Gratuit, sans inscription, directement dans ton navigateur.',
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
          description: 'Decode a JWT and inspect its header and payload instantly. Free, no sign-up, and your token never leaves your browser.',
          keywords: ['jwt decoder', 'decode jwt', 'json web token'],
        },
      },
    },
    status: 'published',
    seo: {
      title: 'Décodeur JWT en ligne gratuit — JcHub',
      description: 'Décode un token JWT et inspecte son header et son payload en un instant. Gratuit, sans inscription, et ton token ne quitte jamais ton navigateur.',
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
          description: 'Write Markdown and see the rendered result in real time, then export the HTML. Free, no sign-up, right in your browser.',
          keywords: ['markdown preview', 'markdown editor', 'markdown to html'],
        },
      },
    },
    status: 'published',
    seo: {
      title: 'Aperçu Markdown en ligne — JcHub',
      description: 'Écris ton Markdown et vois le rendu en temps réel, puis exporte le HTML. Gratuit, sans inscription, directement dans ton navigateur.',
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
          description: 'Convert numbers between binary, octal, decimal and hexadecimal in real time. Free, no sign-up, right in your browser.',
          keywords: ['base converter', 'binary to decimal', 'hexadecimal'],
        },
      },
    },
    status: 'published',
    seo: {
      title: 'Convertisseur binaire, décimal, hexadécimal — JcHub',
      description: 'Convertis des nombres entre binaire, octal, décimal et hexadécimal en temps réel. Gratuit, sans inscription, directement dans ton navigateur.',
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
          description: 'Create a QR code from text or a URL and download it in one click. Free, no sign-up, right in your browser.',
          keywords: ['qr code generator', 'free qr code', 'url qr code'],
        },
      },
    },
    status: 'published',
    seo: {
      title: 'Générateur de QR code gratuit — JcHub',
      description: 'Crée un QR code à partir d’un texte ou d’une URL et télécharge-le en un clic. Gratuit, sans inscription, directement dans ton navigateur.',
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
          description: 'Convert a Unix timestamp to a readable date, or a date to a timestamp, in seconds or milliseconds. Free, no sign-up, right in your browser.',
          keywords: ['timestamp converter', 'unix timestamp', 'date converter'],
        },
      },
    },
    status: 'published',
    seo: {
      title: 'Convertisseur Timestamp Unix en ligne — JcHub',
      description: 'Convertis un timestamp Unix en date lisible, ou une date en timestamp, en secondes ou en millisecondes. Gratuit, sans inscription, dans ton navigateur.',
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
          description: 'Encode or decode a URL and its parameters so special characters are never misread. Free, no sign-up, right in your browser.',
          keywords: ['url encoder', 'url decoder', 'encode url'],
        },
      },
    },
    status: 'published',
    seo: {
      title: 'Encodeur et décodeur URL en ligne — JcHub',
      description: 'Encode ou décode une URL et ses paramètres pour éviter les caractères mal interprétés. Gratuit, sans inscription, directement dans ton navigateur.',
      keywords: ['url encoder', 'url decoder', 'encodeur url'],
    },
  },
  {
    slug: 'redimensionneur-recadreur-images',
    name: 'Redimensionneur et recadreur d’images pour réseaux sociaux',
    description: 'Recadre tes images selon les formats Instagram, LinkedIn et Web, ajuste les dimensions et exporte-les directement dans ton navigateur.',
    category: 'Design',
    icon: '✂️',
    tags: ['image', 'recadrage', 'redimensionner', 'instagram', 'linkedin', 'bannière', 'réseaux sociaux'],
    component: 'SocialImageCropper',
    translations: {
      en: {
        slug: 'social-image-resizer-cropper',
        name: 'Social media image resizer and cropper',
        description: 'Crop images to Instagram, LinkedIn and web formats, set custom dimensions, and export right in your browser.',
        tags: ['image', 'crop', 'resize', 'instagram', 'linkedin', 'banner', 'social media'],
        seo: {
          title: 'Social Media Image Resizer and Cropper | JcHub',
          description: 'Crop and resize images for Instagram, LinkedIn and web banners. Set custom dimensions and export PNG or JPEG in your browser.',
          keywords: ['social media image resizer', 'image cropper', 'instagram image size', 'linkedin image size'],
        },
      },
    },
    status: 'published',
    seo: {
      title: 'Redimensionneur d’images pour réseaux sociaux | JcHub',
      description: 'Recadre et redimensionne tes images pour Instagram, LinkedIn et les bannières Web. Choisis des dimensions personnalisées et exporte en PNG ou JPEG.',
      keywords: ['recadreur image', 'redimensionner image réseaux sociaux', 'format image instagram', 'format image linkedin'],
    },
  },
  {
    slug: 'generateur-cv',
    name: 'Générateur de CV',
    description: 'Crée un CV professionnel en remplissant un formulaire : deux modèles, ta photo, tes couleurs, un aperçu en direct et l’export en PDF.',
    category: 'Productivité',
    icon: '📄',
    tags: ['cv', 'curriculum vitae', 'pdf', 'emploi', 'modèle de cv', 'candidature'],
    component: 'CvGenerator',
    translations: {
      en: {
        slug: 'resume-builder',
        name: 'Resume builder',
        description: 'Create a professional resume by filling in a form: two templates, your photo, your colors, a live preview and PDF export.',
        tags: ['resume', 'cv', 'pdf', 'job', 'resume template', 'application'],
        seo: {
          title: 'Free resume builder with PDF export | JcHub',
          description: 'Fill in your details and get a clean resume in PDF: modern or classic template, photo, accent color and live preview. No sign-up, nothing sent to a server.',
          keywords: ['resume builder', 'free cv maker', 'resume pdf', 'resume template'],
        },
      },
    },
    status: 'published',
    publishAt: '2026-11-05T00:00:00+01:00',
    seo: {
      title: 'Générateur de CV gratuit avec export PDF | JcHub',
      description: 'Remplis tes informations et obtiens un CV soigné en PDF : modèle moderne ou classique, photo, couleur et aperçu en direct. Sans inscription, rien n’est envoyé.',
      keywords: ['générateur de cv', 'créer un cv gratuit', 'cv pdf', 'modèle de cv'],
    },
  },
  {
    slug: 'generateur-facture',
    name: 'Générateur de factures et de devis',
    description: 'Rédige une facture ou un devis en quelques minutes : logo, TVA par taux, euros ou francs CFA, calculs automatiques et export en PDF.',
    category: 'Productivité',
    icon: '🧾',
    tags: ['facture', 'devis', 'pdf', 'freelance', 'tva', 'auto-entrepreneur'],
    component: 'InvoiceGenerator',
    translations: {
      en: {
        slug: 'invoice-generator',
        name: 'Invoice and quote generator',
        description: 'Write an invoice or a quote in minutes: logo, VAT by rate, any major currency, automatic totals and PDF export.',
        tags: ['invoice', 'quote', 'pdf', 'freelance', 'vat', 'small business'],
        seo: {
          title: 'Free invoice generator with PDF export | JcHub',
          description: 'Create invoices and quotes with your logo, VAT and automatic totals, then download them as PDF. Works in your browser, no sign-up.',
          keywords: ['invoice generator', 'free invoice maker', 'invoice pdf', 'quote generator'],
        },
      },
    },
    status: 'published',
    publishAt: '2026-11-05T00:00:00+01:00',
    seo: {
      title: 'Générateur de factures et de devis gratuit en PDF | JcHub',
      description: 'Crée tes factures et devis avec ton logo, la TVA et des totaux calculés, en euros ou en francs CFA, puis télécharge-les en PDF. Sans inscription.',
      keywords: ['générateur de facture', 'faire une facture gratuite', 'facture pdf', 'modèle de devis'],
    },
  },
  {
    slug: 'ocr-image-en-texte',
    name: 'OCR : extraire le texte d’une image',
    description: 'Récupère le texte d’une photo, d’une capture d’écran ou d’un scan, puis copie-le ou télécharge-le en .txt.',
    category: 'Document',
    icon: '🔎',
    tags: ['ocr', 'image', 'texte', 'scan', 'extraction', 'photo'],
    component: 'OcrTool',
    translations: {
      en: {
        slug: 'image-to-text-ocr',
        name: 'OCR: extract text from an image',
        description: 'Get the text out of a photo, a screenshot or a scan, then copy it or download it as .txt.',
        tags: ['ocr', 'image', 'text', 'scan', 'extraction', 'photo'],
        seo: {
          title: 'Image to text: free online OCR | JcHub',
          description: 'Extract the text of a photo, screenshot or scanned page in seconds. Edit it, copy it or download it as a text file. Free, no sign-up.',
          keywords: ['image to text', 'ocr online', 'extract text from image', 'photo to text'],
        },
      },
    },
    status: 'published',
    publishAt: '2026-11-10T00:00:00+01:00',
    seo: {
      title: 'Extraire le texte d’une image : OCR gratuit en ligne | JcHub',
      description: 'Transforme une photo, une capture d’écran ou un scan en texte modifiable en quelques secondes. Copie-le ou télécharge-le. Gratuit, sans inscription.',
      keywords: ['image en texte', 'ocr en ligne', 'extraire texte image', 'photo en texte'],
    },
  },
  {
    slug: 'generateur-signature-email',
    name: 'Générateur de signature e-mail',
    description: 'Crée une signature e-mail professionnelle en HTML : photo ou logo, réseaux sociaux, bouton, puis copie-la dans Gmail, Outlook ou Apple Mail.',
    category: 'Productivité',
    icon: '✍️',
    tags: ['signature', 'email', 'html', 'gmail', 'outlook', 'professionnel'],
    component: 'EmailSignatureGenerator',
    translations: {
      en: {
        slug: 'email-signature-generator',
        name: 'Email signature generator',
        description: 'Create a professional HTML email signature with photo or logo, social links and a button, then paste it into Gmail, Outlook or Apple Mail.',
        tags: ['signature', 'email', 'html', 'gmail', 'outlook', 'professional'],
        seo: {
          title: 'Free email signature generator (HTML) | JcHub',
          description: 'Design a professional email signature in minutes: three templates, your colours, photo or logo and social links. Copy it into Gmail or Outlook. No sign-up.',
          keywords: ['email signature generator', 'free email signature', 'html email signature', 'gmail signature', 'outlook signature'],
        },
      },
    },
    status: 'published',
    seo: {
      title: 'Générateur de signature e-mail gratuit (HTML) | JcHub',
      description: 'Crée une signature e-mail professionnelle en quelques minutes : trois modèles, tes couleurs, photo ou logo et réseaux sociaux. À coller dans Gmail ou Outlook.',
      keywords: ['générateur signature email', 'signature mail gratuite', 'signature email html', 'signature gmail', 'signature outlook'],
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
    previousSlugs: Array.isArray(data.previousSlugs) ? data.previousSlugs.map(String).filter(Boolean) : undefined,
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

/** Tag of the shared tools cache; see lib/tools-cache.ts. */
export const TOOLS_CACHE_TAG = 'tools-catalog';

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
        // Shared by every server instance (Next data cache), emptied by revalidateTools() when a tool
        // changes: the catalog is read from Firestore about once an hour instead of every minute
        // on each instance.
        const { unstable_cache } = await import('next/cache');
        const readShared = unstable_cache(async () => {
          const { getAdminDb } = await import('@/lib/firebase-admin');
          const snapshot = await getAdminDb().collection('tools').get();
          return snapshot.docs.map((document) => toToolRecord(document.data()));
        }, ['tools-catalog'], { tags: [TOOLS_CACHE_TAG], revalidate: 3600 });
        const documents = await readShared();
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
 * accepted too, and in both languages a former slug of the tool: the page then redirects
 * old or shared links to the current address.
 */
export async function getToolBySlug(slug: string, locale: Locale = 'fr'): Promise<Tool | null> {
  const toolList = await getPublishedTools();
  const tool = (locale === 'en'
    ? toolList.find((candidate) => candidate.translations?.en?.slug === slug) ?? toolList.find((candidate) => candidate.slug === slug)
    : toolList.find((candidate) => candidate.slug === slug))
    ?? toolList.find((candidate) => candidate.previousSlugs?.includes(slug));
  if (!tool || DISABLED_TOOL_SLUGS.has(tool.slug)) return null;
  return tool;
}
