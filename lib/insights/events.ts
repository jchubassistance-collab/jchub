import { z } from 'zod';

/**
 * Events collected by the site's own audience measurement (Control Center, /admin/insights).
 * No cookie and no stored IP: a visitor is a hash that changes every day (see lib/insights/db.ts).
 * Only relative imports: tested with plain Node.
 */

export const EVENT_TYPES = [
  'pageview',
  'tool_upload',
  'tool_download',
  'tool_error',
  'scroll',
  'read_time',
  'web_vital',
  'outbound',
  'consent',
  'custom',
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const trackedEventSchema = z.object({
  type: z.enum(EVENT_TYPES),
  path: z.string().max(300).regex(/^\//),
  /** Event name: web vital (LCP…), consent choice, outbound host, custom event name. */
  name: z.string().max(80).optional(),
  value: z.number().finite().min(0).max(1e10).optional(),
  /** First page of the visit only: where the visitor came from. */
  referrer: z.string().max(300).optional(),
  utm: z.string().max(60).optional(),
  meta: z.record(z.string(), z.union([z.string().max(120), z.number().finite(), z.boolean()])).optional(),
});
export type TrackedEvent = z.infer<typeof trackedEventSchema>;

export const trackBatchSchema = z.object({ events: z.array(trackedEventSchema).min(1).max(25) });

