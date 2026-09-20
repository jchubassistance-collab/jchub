import 'server-only';

import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import type { Guide } from '@/lib/guides';
import { reportUserError } from '@/lib/user-error';

export async function getGuides(): Promise<Guide[]> {
  if (!hasFirebaseAdminConfig()) return [];

  try {
    const snapshot = await getAdminDb().collection('guides').where('status', '==', 'published').get();
    const storedGuides = snapshot.docs.map((document) => {
      const data = document.data();
      return {
        slug: document.id,
        title: String(data.title || document.id),
        description: String(data.description || ''),
        category: String(data.category || 'Guides'),
        level: (data.level || 'Débutant') as Guide['level'],
        format: String(data.format || 'PDF'),
        size: String(data.size || 'PDF'),
        downloadUrl: String(data.downloadUrl || ''),
        cloudinaryPublicId: data.cloudinaryPublicId ? String(data.cloudinaryPublicId) : undefined,
      } satisfies Guide;
    }).filter((guide) => guide.downloadUrl);

    return storedGuides;
  } catch (error) {
    reportUserError();
    return [];
  }
}

export async function getGuideBySlug(slug: string): Promise<Guide | undefined> {
  const allGuides = await getGuides();
  return allGuides.find((guide) => guide.slug === slug);
}
