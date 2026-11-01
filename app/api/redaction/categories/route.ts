import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { requireWriter } from '@/lib/admin-auth';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { enforceRateLimit } from '@/lib/rate-limit';
import { writerError } from '@/lib/writer-articles';
import { categoryKey, normalizeCategory, WRITER_CATEGORIES, WRITER_LIMITS } from '@/lib/writer-rules';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Categories of the writing space: the built-in ones, then those writers added, shared by all
 * writers. Each added one is a writer_categories document named after its key, so « réseau » and
 * « Reseau » are one category.
 */

const addSchema = z.object({ name: z.string().trim().min(2).max(WRITER_LIMITS.category) }).strict();
const noStore = { 'Cache-Control': 'private, no-store' };

async function allCategories(): Promise<string[]> {
  const snapshot = await getAdminDb().collection('writer_categories').get();
  const known = new Set(WRITER_CATEGORIES.map(categoryKey));
  const added = snapshot.docs
    .map((document) => String(document.data().name || ''))
    .filter((name) => name && !known.has(categoryKey(name)))
    .sort((a, b) => a.localeCompare(b, 'fr'));
  return [...WRITER_CATEGORIES, ...added];
}

export async function GET(request: NextRequest) {
  try {
    await requireWriter(request);
    if (!hasFirebaseAdminConfig()) return NextResponse.json({ categories: [...WRITER_CATEGORIES] }, { headers: noStore });
    return NextResponse.json({ categories: await allCategories() }, { headers: noStore });
  } catch (error) { return writerError(error, request); }
}

/** Adds a category; one that already exists under another spelling answers with its stored name. */
export async function POST(request: NextRequest) {
  try {
    const writer = await requireWriter(request);
    if (!hasFirebaseAdminConfig()) return NextResponse.json({ error: 'Firebase indisponible.' }, { status: 503 });
    const limited = await enforceRateLimit(request, `writer-category:${writer.uid}`, 20, 60 * 60 * 1000);
    if (limited) return limited;
    const parsed = addSchema.safeParse(await request.json().catch(() => null));
    const name = parsed.success ? normalizeCategory(parsed.data.name) : '';
    const key = categoryKey(name);
    if (!key) return NextResponse.json({ error: `Donnez un nom de catégorie de 2 à ${WRITER_LIMITS.category} caractères.` }, { status: 400 });
    const builtIn = WRITER_CATEGORIES.find((category) => categoryKey(category) === key);
    if (!builtIn) {
      const reference = getAdminDb().collection('writer_categories').doc(key);
      await getAdminDb().runTransaction(async (transaction) => {
        if (!(await transaction.get(reference)).exists) transaction.create(reference, { name, createdBy: writer.uid, createdAt: FieldValue.serverTimestamp() });
      });
    }
    const categories = await allCategories();
    return NextResponse.json({ name: categories.find((category) => categoryKey(category) === key) || name, categories }, { status: 201, headers: noStore });
  } catch (error) { return writerError(error, request); }
}
