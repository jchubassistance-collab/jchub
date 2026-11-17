import { z } from 'zod';
import type { Locale } from '../i18n/routing';
import type { Resource, ResourceSection } from './resources';

/**
 * Shape of a resource written by the AI or edited in the admin (Admin > Ressources). Only free
 * resources can be created this way: a template sent by email needs a reviewed Word text.
 * Only relative imports: the tests load this file with plain Node.
 */

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const line = (max: number) => z.string().trim().min(1).max(max);

const rowSchema = z.object({ term: line(220), text: line(320) });
const sectionSchema = z.object({ title: line(80), rows: z.array(rowSchema).min(1).max(15) });

export const resourceTextSchema = z.object({
  slug: z.string().trim().min(3).max(80).regex(SLUG_PATTERN),
  title: line(80),
  summary: line(220),
  seoTitle: line(90),
  seoDescription: line(200),
  sections: z.array(sectionSchema).min(1).max(12),
});

export const editableResourceSchema = z.object({
  kind: z.enum(['cheatsheet', 'checklist']),
  code: z.boolean(),
  fr: resourceTextSchema,
  en: resourceTextSchema,
}).superRefine((value, context) => {
  const shape = (locale: Locale) => value[locale].sections.map((section) => section.rows.length).join(',');
  if (shape('fr') !== shape('en')) {
    context.addIssue({ code: 'custom', path: ['en', 'sections'], message: 'Les versions française et anglaise doivent avoir les mêmes parties et le même nombre de lignes.' });
  }
});

export type EditableResource = z.infer<typeof editableResourceSchema>;
export type ResourceStatus = 'draft' | 'published';

/** A resource saved in Firestore, with what the admin needs around it. */
export type ResourceResearch = { reason: string; signals: string[]; runId: string };
export type StoredResource = Resource & {
  status: ResourceStatus;
  topic: string;
  provider: string;
  /** Written from the admin's request, or by the weekly agent from its research. */
  origin: 'admin' | 'agent';
  research: ResourceResearch | null;
  createdAt: string | null;
  updatedAt: string | null;
};

/** Lower case, no accents, words joined by dashes: the address of a page. */
export function slugify(value: string): string {
  return value
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 80).replace(/-+$/, '');
}

/** A slug not used by another resource: the wanted one, cleaned, then numbered if it is taken. */
export function uniqueSlug(wanted: string, fallback: string, taken: Set<string>): string {
  const base = slugify(wanted) || slugify(fallback) || 'ressource';
  let slug = base;
  for (let index = 2; taken.has(slug); index += 1) slug = `${base}-${index}`;
  taken.add(slug);
  return slug;
}

const SEPARATOR = ' | ';

/**
 * The content as plain text for the admin editor: "## Part title", then one line per entry,
 * "term | explanation". The first " | " splits a line, so a term cannot contain one.
 */
export function sectionsToText(sections: ResourceSection[]): string {
  return sections.map((section) => [`## ${section.title}`, ...section.rows.map((row) => `${row.term}${SEPARATOR}${row.text}`)].join('\n')).join('\n\n');
}

export function textToSections(text: string): { sections: ResourceSection[]; errors: string[] } {
  const sections: ResourceSection[] = [];
  const errors: string[] = [];
  text.split(/\r?\n/).forEach((raw, index) => {
    const value = raw.trim();
    if (!value) return;
    if (value.startsWith('## ')) {
      sections.push({ title: value.slice(3).trim(), rows: [] });
      return;
    }
    const at = value.indexOf(SEPARATOR);
    if (!sections.length) errors.push(`Ligne ${index + 1} : commence par un titre de partie (## Titre).`);
    else if (at < 1) errors.push(`Ligne ${index + 1} : sépare le terme et l’explication par « | ».`);
    else sections[sections.length - 1].rows.push({ term: value.slice(0, at).trim(), text: value.slice(at + SEPARATOR.length).trim() });
  });
  for (const section of sections) if (!section.rows.length) errors.push(`La partie « ${section.title} » n’a aucune ligne.`);
  return { sections, errors };
}

/** Readable messages of a failed validation, for the admin. */
export function validationMessages(error: z.ZodError): string[] {
  return error.issues.slice(0, 6).map((issue) => `${issue.path.join(' › ') || 'Ressource'} : ${issue.message}`);
}

/** ISO week of a date, e.g. 2026-W45: the Monday cron runs once per week whatever happens. */
export function isoWeekKey(date = new Date()): string {
  const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const weekday = day.getUTCDay() || 7;
  day.setUTCDate(day.getUTCDate() + 4 - weekday);
  const yearStart = new Date(Date.UTC(day.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((day.getTime() - yearStart.getTime()) / 86400_000 + 1) / 7);
  return `${day.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}
