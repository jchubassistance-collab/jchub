import 'server-only';

import { revalidateTag } from 'next/cache';
import { TOOLS_CACHE_TAG } from '@/lib/tools';

/** After a tool changed in Firestore: the next page reads the catalog again (lib/tools.ts). */
export function revalidateTools() {
  try {
    revalidateTag(TOOLS_CACHE_TAG, { expire: 0 });
  } catch (error) {
    // Outside a request (a script): nothing is cached there.
    console.warn('[tools] Cache du catalogue non vidé :', error instanceof Error ? error.message : error);
  }
}
