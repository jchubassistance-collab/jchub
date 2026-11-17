import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { resources as builtInResources } from '@/lib/resources';
import { createResourceDraft, readStoredResources } from '@/lib/resource-store';
import { generateResource, resourceAdminError as adminError } from '@/lib/resource-generator';
import { getPublishedTools } from '@/lib/tools';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// The AI may take a while to write both languages.
export const maxDuration = 120;

/** The resources of the code (read-only here) and those created in the admin. */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const stored = await readStoredResources();
    const builtIn = builtInResources.map((resource) => ({ id: resource.id, kind: resource.kind, gated: resource.gated, fr: { slug: resource.fr.slug, title: resource.fr.title }, en: { slug: resource.en.slug, title: resource.en.title } }));
    return NextResponse.json({ builtIn, stored: stored.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')), firestore: hasFirebaseAdminConfig() });
  } catch (error) {
    return adminError(error);
  }
}

const generateSchema = z.object({
  topic: z.string().trim().min(3).max(160),
  kind: z.enum(['cheatsheet', 'checklist']),
  notes: z.string().trim().max(1000).optional().default(''),
});

/** Writes a new resource with the AI and saves it as a draft. */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    if (!hasFirebaseAdminConfig()) return NextResponse.json({ error: 'Firebase indisponible.' }, { status: 503 });
    const parsed = generateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Indique un sujet (3 caractères au moins) et un type.' }, { status: 400 });

    const [stored, tools] = await Promise.all([readStoredResources(), getPublishedTools()]);
    const { resource, provider } = await generateResource({
      ...parsed.data,
      existing: [...builtInResources, ...stored],
      tools: tools.map((tool) => tool.name),
    });
    const saved = await createResourceDraft(resource, { topic: parsed.data.topic, provider, origin: 'admin' });
    return NextResponse.json({ resource: saved });
  } catch (error) {
    return adminError(error);
  }
}
