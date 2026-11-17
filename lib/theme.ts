/**
 * Light or dark theme of the public site. Light is the default, whatever the device setting; dark
 * only applies once the visitor picks it, and that choice is kept in this browser.
 * The pages stay static: nothing is read on the server.
 */
export const THEME_STORAGE_KEY = 'jchub-theme';

export type Theme = 'light' | 'dark';

/**
 * Runs in <head> before the page is painted, so a dark visitor never sees a white flash.
 * Inline on purpose: the public pages are served without a nonce and the CSP allows inline scripts there.
 */
export const THEME_BOOT_SCRIPT = `(function(){try{var s=localStorage.getItem('${THEME_STORAGE_KEY}');var d=s==='dark';document.documentElement.setAttribute('data-theme',d?'dark':'light');}catch(e){}})();`;
