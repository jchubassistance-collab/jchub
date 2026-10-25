import 'server-only';

import { generateQuickText } from '@/lib/content-agent';
import { findPhotos, photosEnabled, readPhoto, trackPhotoDownload, type Photo } from '@/lib/photos';
import { buildPhotoQueriesPrompt, generateValidated, parsePhotoQueries } from '@/lib/social-copy';
import { reportUserError } from '@/lib/user-error';

// Photo de couverture d'un article publié par l'agent : l'IA décrit une scène qui évoque le sujet, Unsplash la fournit.
// Une photo déjà choisie est gardée; sans clé Unsplash ou en cas d'échec, la couverture se dessine sans photo.
export async function findArticlePhoto(article: { title: string; description: string; photo?: unknown }): Promise<Photo | null> {
  const current = readPhoto(article.photo);
  if (current || !photosEnabled()) return current;
  try {
    const queries = await generateValidated(buildPhotoQueriesPrompt(article), async (prompt) => (await generateQuickText(prompt)).text, parsePhotoQueries, 2);
    const [photo] = await findPhotos(queries, 'landscape', 3);
    if (photo) await trackPhotoDownload(photo);
    return photo ?? null;
  } catch {
    reportUserError();
    return null;
  }
}
