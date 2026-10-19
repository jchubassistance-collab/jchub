// Pure rules for tools generated from the admin with Gemini: component naming,
// safety checks on the generated source and edits to the tool registries.
// No imports, so `node --test` can load this file directly.

export const GENERATED_TOOLS_DIR = 'components/tools/generated';
export const TOOL_COMPONENTS_PATH = 'lib/tool-components.ts';
export const TOOL_RENDERER_PATH = 'components/tools/ToolRenderer.tsx';
export const STYLE_REFERENCE_PATH = 'components/tools/Base64Tool.tsx';
export const REGISTRY_MARKER = '// @generated-tools:';

const MAX_SOURCE_LENGTH = 60_000;
// next-intl and @/i18n/copy give the component its French and English texts, like every tool of the site;
// @/lib/download-name names downloaded files like every other tool (original name, then -jchub).
const ALLOWED_IMPORTS = new Set(['react', 'lucide-react', 'next-intl', '@/i18n/copy', '@/lib/download-name']);
export const TOOL_CATEGORIES = ['Développement', 'Design', 'Document', 'Productivité', 'Sécurité', 'Texte'] as const;

/**
 * Generated tools must stay "100 % in the browser": no network, storage, code
 * execution or external resources. The PR review and the preview test remain the
 * real gate; these checks reject obvious violations before anything reaches GitHub.
 */
const FORBIDDEN_PATTERNS: Array<[RegExp, string]> = [
  [/\bfetch\s*\(/, 'requête réseau (fetch)'],
  [/XMLHttpRequest|WebSocket|EventSource|sendBeacon|RTCPeerConnection/, 'API réseau'],
  [/\beval\s*\(|new\s+Function\b|\bset(?:Timeout|Interval)\s*\(\s*['"`]/, 'exécution de code dynamique'],
  [/dangerouslySetInnerHTML|\.innerHTML\b|\.outerHTML\b|insertAdjacentHTML|document\.write/, 'injection de HTML'],
  [/document\.cookie|localStorage|sessionStorage|indexedDB|\bcaches\./, 'stockage dans le navigateur'],
  [/window\.open|location\.(?:href|assign|replace)\b|\blocation\s*=[^=]/, 'navigation forcée'],
  [/\bimport\s*\(|\brequire\s*\(/, 'chargement dynamique de module'],
  [/process\.env/, 'variables d’environnement'],
  [/<script\b|<iframe\b|<object\b|<embed\b|<img\b|<link\b|new\s+Image\s*\(/, 'ressource externe'],
  [/\burl\s*\(/, 'URL dans du CSS'],
  [/postMessage|new\s+(?:Shared)?Worker\b|serviceWorker/, 'communication hors de la page'],
];

/** PascalCase component name derived from the tool name, unique among `existing`. */
export function componentNameFromTitle(title: string, existing: readonly string[]): string {
  const words = title.normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^A-Za-z0-9]+/).filter(Boolean);
  let base = words.map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase()).join('').slice(0, 40);
  if (!/^[A-Z]/.test(base)) base = `Outil${base}`;
  let name = base;
  for (let suffix = 2; existing.includes(name); suffix += 1) name = `${base}${suffix}`;
  return name;
}

/** Component names currently listed in lib/tool-components.ts. */
export function extractRegisteredComponents(componentsSource: string): string[] {
  const list = componentsSource.match(/TOOL_COMPONENTS\s*=\s*\[([\s\S]*?)\]\s*as\s+const/);
  return list ? Array.from(list[1].matchAll(/'([A-Za-z0-9]+)'/g), (match) => match[1]) : [];
}

/** Returns the reasons the generated source is refused; empty when it is acceptable. */
export function checkGeneratedSource(source: string, componentName: string): string[] {
  const problems: string[] = [];
  if (source.length > MAX_SOURCE_LENGTH) problems.push(`Le fichier dépasse ${MAX_SOURCE_LENGTH} caractères.`);
  if (!/^\s*['"]use client['"];?/.test(source)) problems.push('La première instruction doit être \'use client\';');
  if (!new RegExp(`export\\s+function\\s+${componentName}\\s*\\(`).test(source)) problems.push(`Le fichier doit exporter « export function ${componentName}() ».`);
  if (/export\s+default\b/.test(source)) problems.push('Pas d’export par défaut.');
  if (/export\s+(?:\*|\{[^}]*\})\s+from\b/.test(source)) problems.push('Pas de réexport depuis un autre module.');
  const imports = Array.from(source.matchAll(/^\s*import\s+(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/gm), (match) => match[1]);
  imports.filter((module) => !ALLOWED_IMPORTS.has(module)).forEach((module) => {
    problems.push(`Import interdit : « ${module} » (seuls react, lucide-react, next-intl, @/i18n/copy et @/lib/download-name sont autorisés).`);
  });
  // The site exists in French and English: the interface follows the visitor's language.
  if (!/\buseLocale\s*\(/.test(source) || !/\bbilingual\s*\(/.test(source)) {
    problems.push('L’interface doit être bilingue : textes dans bilingual() de @/i18n/copy, langue lue avec useLocale() de next-intl.');
  }
  for (const [pattern, label] of FORBIDDEN_PATTERNS) {
    if (pattern.test(source)) problems.push(`Interdit : ${label}.`);
  }
  return problems;
}

/** Inserts `line` just above the registry marker, keeping its indentation and line endings. Idempotent. */
export function insertAboveMarker(source: string, line: string): string {
  if (source.includes(line)) return source;
  const markerIndex = source.indexOf(REGISTRY_MARKER);
  if (markerIndex === -1) throw new Error('Marqueur @generated-tools introuvable dans le registre des outils.');
  const lineStart = source.lastIndexOf('\n', markerIndex) + 1;
  const indent = source.slice(lineStart, markerIndex);
  const eol = source.includes('\r\n') ? '\r\n' : '\n';
  return `${source.slice(0, lineStart)}${indent}${line}${eol}${source.slice(lineStart)}`;
}

/** Registry files with the new component added, ready to commit. */
export function registerGeneratedTool(componentsSource: string, rendererSource: string, componentName: string) {
  return {
    components: insertAboveMarker(componentsSource, `'${componentName}',`),
    renderer: insertAboveMarker(rendererSource, `${componentName}: dynamic(() => import('@/components/tools/generated/${componentName}').then((m) => m.${componentName})),`),
  };
}

export type GeneratedTool = {
  code: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  icon: string;
  category: string;
  tags: string[];
};

function text(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, maxLength) : '';
}

/**
 * Reads a model answer in either format: a JSON object with a `code` field (Gemini's
 * structured output), or a ```tsx block followed by a ```json metadata block (models
 * without JSON mode, where escaping a whole file inside a JSON string often breaks).
 * The source code itself is checked separately.
 */
export function parseGeneratedTool(raw: string): GeneratedTool {
  let data: Record<string, unknown>;
  const codeBlock = raw.match(/```(?:tsx|typescript|ts|jsx)\s*\n([\s\S]*?)\n```/i);
  if (codeBlock) {
    const metadataBlock = raw.match(/```json\s*\n([\s\S]*?)\n```/i);
    try {
      data = { ...(metadataBlock ? JSON.parse(metadataBlock[1]) as Record<string, unknown> : {}), code: codeBlock[1] };
    } catch {
      throw new Error('Le bloc JSON de métadonnées est invalide.');
    }
  } else {
    try {
      data = JSON.parse(raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')) as Record<string, unknown>;
    } catch {
      throw new Error('La réponse n’est ni un JSON valide ni un bloc de code ```tsx.');
    }
  }
  if (typeof data.code !== 'string' || !data.code.trim()) throw new Error('La réponse ne contient pas de code.');
  const code = data.code.replace(/^```(?:tsx?|typescript)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
  const category = text(data.category, 40);
  return {
    code: `${code}\n`,
    description: text(data.description, 200),
    seoTitle: text(data.seoTitle, 80),
    seoDescription: text(data.seoDescription, 170),
    icon: text(data.icon, 8) || '🛠️',
    category: (TOOL_CATEGORIES as readonly string[]).includes(category) ? category : 'Développement',
    tags: Array.isArray(data.tags) ? data.tags.map((tag) => text(tag, 40)).filter(Boolean).slice(0, 8) : [],
  };
}
