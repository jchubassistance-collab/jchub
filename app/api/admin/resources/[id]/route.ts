import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { resources as builtInResources } from '@/lib/resources';
import { editableResourceSchema, validationMessages } from '@/lib/resource-schema';
import { forgetStoredResources, readStoredResources, RESOURCES_COLLECTION, toStoredResource } from '@/lib/resource-store';
import { resourceAdminError as adminError } from '@/lib/resource-generator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  status: z.enum(['draft', 'published']).optional(),
  resource: z.unknown().optional(),
});

/** Saves the edited content and/or publishes or unpublishes a resource of the admin. */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin(request);
    if (!hasFirebaseAdminConfig()) return NextResponse.json({ error: 'Firebase indisponible.' }, { status: 503 });
    const { id } = await params;
    const body = patchSchema.safeParse(await request.json().catch(() => null));
    if (!body.success || (!body.data.status && body.data.resource === undefined)) return NextResponse.json({ error: 'Modification invalide.' }, { status: 400 });

    const reference = getAdminDb().collection(RESOURCES_COLLECTION).doc(id);
    const current = await reference.get();
    if (!current.exists) return NextResponse.json({ error: 'Ressource introuvable.' }, { status: 404 });
    const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };

    if (body.data.resource !== undefined) {
      const parsed = editableResourceSchema.safeParse(body.data.resource);
      if (!parsed.success) return NextResponse.json({ error: validationMessages(parsed.error).join('\n') }, { status: 400 });
      const others = [...builtInResources, ...(await readStoredResources()).filter((resource) => resource.id !== id)];
      const taken = new Set(others.flatMap((resource) => [resource.fr.slug, resource.en.slug]));
      const clash = [parsed.data.fr.slug, parsed.data.en.slug].find((slug) => taken.has(slug));
      if (clash) return NextResponse.json({ error: `L’adresse « ${clash} » est déjà utilisée par une autre ressource.` }, { status: 409 });
      Object.assign(update, parsed.data);
    }
    if (body.data.status) update.status = body.data.status;
    if (body.data.status === 'published') update.publishedAt = FieldValue.serverTimestamp();

    await reference.update(update);
    forgetStoredResources();
    const saved = await reference.get();
    return NextResponse.json({ resource: toStoredResource(saved.id, saved.data() ?? {}) });
  } catch (error) {
    return adminError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin(request);
    if (!hasFirebaseAdminConfig()) return NextResponse.json({ error: 'Firebase indisponible.' }, { status: 503 });
    const { id } = await params;
    await getAdminDb().collection(RESOURCES_COLLECTION).doc(id).delete();
    forgetStoredResources();
    return NextResponse.json({ success: true });
  } catch (error) {
    return adminError(error);
  }
}
