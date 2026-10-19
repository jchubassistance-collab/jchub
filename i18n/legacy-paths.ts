/**
 * Until October 2026 French pages had no prefix (jchub.dev/outils). Their address now starts
 * with /fr: links already shared or indexed are redirected for good to the same page.
 *
 * Returns the French address of a former one, or null when the path already has a language.
 */
export function legacyFrenchPath(pathname: string): string | null {
  const [, first] = pathname.split('/');
  if (first === 'fr' || first === 'en') return null;
  return pathname === '/' ? '/fr' : `/fr${pathname}`;
}
