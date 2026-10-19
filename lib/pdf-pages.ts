/**
 * Page selections typed in the PDF merge and split tool, e.g. "1-3, 5, 8-". Each comma-separated
 * part is one group of 1-based page numbers: "8-" runs to the last page, "-3" starts at page 1.
 */
export type PageRangeResult =
  | { ok: true; groups: number[][] }
  | { ok: false; reason: 'empty' | 'syntax' | 'range'; part: string };

export function parsePageRanges(input: string, pageCount: number): PageRangeResult {
  const parts = input.split(/[,;]/).map((part) => part.trim()).filter(Boolean);
  if (!parts.length) return { ok: false, reason: 'empty', part: '' };
  const groups: number[][] = [];
  for (const part of parts) {
    const single = /^\d+$/.test(part);
    const range = /^(\d*)\s*[-–]\s*(\d*)$/.exec(part);
    if (!single && (!range || (!range[1] && !range[2]))) return { ok: false, reason: 'syntax', part };
    const start = single ? Number(part) : range?.[1] ? Number(range[1]) : 1;
    const end = single ? start : range?.[2] ? Number(range[2]) : pageCount;
    if (start < 1 || end > pageCount || start > end) return { ok: false, reason: 'range', part };
    groups.push(Array.from({ length: end - start + 1 }, (_, index) => start + index));
  }
  return { ok: true, groups };
}

/** "1-3" for pages 1 to 3, "5" for a single page: used in the names of the files. */
export function pageGroupLabel(group: number[]): string {
  return group.length === 1 ? String(group[0]) : `${group[0]}-${group[group.length - 1]}`;
}

/** File name without its extension and without characters that file systems refuse. */
export function safeBaseName(fileName: string, fallback = 'document'): string {
  return fileName
    .replace(/\.pdf$/i, '')
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')
    .replace(/[. ]+$/g, '')
    .slice(0, 80) || fallback;
}

/** Adds -2, -3… to repeated names so every file of a ZIP keeps its own name. */
export function uniqueNames(names: string[]): string[] {
  const seen = new Map<string, number>();
  return names.map((name) => {
    const count = (seen.get(name) ?? 0) + 1;
    seen.set(name, count);
    return count === 1 ? name : name.replace(/(\.[^.]+)?$/, `-${count}$1`);
  });
}
