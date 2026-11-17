/** Emailed links of the templates (app/api/resources): shared by the routes, the page and the tests. */

/** Name of the query parameter that carries the token in the emailed link. */
export const RESOURCE_TOKEN_PARAM = 'cle';
/** The emailed link works this long, as many times as needed. */
export const RESOURCE_LINK_LIFETIME_MS = 7 * 86400_000;
/** At most one email per address and per template in this period. */
export const RESOURCE_RESEND_DELAY_MS = 3600_000;
/** A request (address, template, dates) is erased after this period, by Firestore's TTL. */
export const RESOURCE_REQUEST_RETENTION_MS = 365 * 86400_000;
