/**
 * Pagination shared by the site: the public lists show more items on demand ("See more"), the admin
 * tables go from page to page. The page lives in the address (?page=3), so the Back button and a
 * shared link find the same list.
 */

/** Pages a list can reach through the address: beyond it, a typo would build a huge list. */
export const MAX_PAGE = 500;
/** Rows per page offered in the admin tables. */
export const ADMIN_PAGE_SIZES = [8, 25, 50] as const;

/** The page read from the address: a whole number from 1, or 1 for anything else. */
export function pageFromParam(value: string | null | undefined): number {
  if (!value || !/^\d{1,4}$/.test(value.trim())) return 1;
  return Math.min(MAX_PAGE, Math.max(1, Number(value.trim())));
}

/**
 * The page buttons of a long list: always the first and the last page, the current one and its
 * neighbors, and a gap ('gap') for the pages skipped. A gap never hides a single page: that page
 * is shown instead. Up to 7 pages, they are all shown.
 */
export function pageWindow(current: number, total: number): (number | 'gap')[] {
  if (total <= 7) return Array.from({ length: Math.max(1, total) }, (_, index) => index + 1);
  const page = Math.min(Math.max(1, current), total);
  const kept = new Set([1, total, page - 1, page, page + 1]);
  // Near an end, the row keeps the same length: 1 2 3 4 … 15 rather than 1 2 … 15.
  if (page <= 3) [2, 3, 4].forEach((value) => kept.add(value));
  if (page >= total - 2) [total - 3, total - 2, total - 1].forEach((value) => kept.add(value));
  const pages = Array.from(kept).filter((value) => value >= 1 && value <= total).sort((a, b) => a - b);
  const result: (number | 'gap')[] = [];
  for (const value of pages) {
    const previous = result[result.length - 1];
    if (typeof previous === 'number' && value - previous === 2) result.push(previous + 1);
    else if (typeof previous === 'number' && value - previous > 2) result.push('gap');
    result.push(value);
  }
  return result;
}
