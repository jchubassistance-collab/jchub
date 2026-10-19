/**
 * Name of every file the site lets visitors download: the name of the file it comes from, an
 * optional detail (pages-1-3, 256…), then -jchub, e.g. rapport-pages-1-3-jchub.pdf. A name that
 * already ends with -jchub (a file made here before) does not get it twice.
 */
export const DOWNLOAD_SUFFIX = 'jchub';

const ALREADY_SUFFIXED = new RegExp(`-${DOWNLOAD_SUFFIX}$`, 'i');

/** The name without extension, cleaned for file systems, with the detail and -jchub. */
export function downloadBaseName(source: string, detail = '', fallback = 'fichier'): string {
  const base = source
    .replace(/\.[^./\\]+$/, '')
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')
    .replace(/[. ]+$/g, '')
    .replace(ALREADY_SUFFIXED, '')
    .slice(0, 80)
    .replace(/[. ]+$/g, '') || fallback;
  return `${base}${detail ? `-${detail}` : ''}-${DOWNLOAD_SUFFIX}`;
}

export function downloadName(source: string, extension: string, detail = '', fallback = 'fichier'): string {
  return `${downloadBaseName(source, detail, fallback)}.${extension}`;
}
