/**
 * Former slugs of an article or a tool. When its address changes, the old slug is kept in
 * `previousSlugs`: the public page finds the content by it and redirects (308) to the new
 * address, so links already shared or indexed keep working.
 */

const MAX_PREVIOUS_SLUGS = 30;

/**
 * The list to save after a slug change from `oldSlug` to `nextSlug`: the old slug is added,
 * the new one removed (a content can come back to a former address), no duplicates.
 * Returns null when nothing changes.
 */
export function nextPreviousSlugs(previous: unknown, oldSlug: string, nextSlug: string): string[] | null {
  const old = oldSlug.trim();
  const next = nextSlug.trim();
  const current = Array.isArray(previous) ? previous.map(String).filter(Boolean) : [];
  if (!old || old === next) return null;
  const list = [old, ...current].filter((slug, index, all) => slug !== next && all.indexOf(slug) === index);
  return list.slice(0, MAX_PREVIOUS_SLUGS);
}
