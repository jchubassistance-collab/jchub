import type { Instrumentation } from 'next';

/** Lets reportUserError record errors in the site reports (lib/reports/server.ts). */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { installErrorReporter } = await import('./lib/reports/server');
  installErrorReporter();
}

/** Errors Next.js caught itself: thrown by a page, a route handler, a server action or the proxy. */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { recordUnhandledError } = await import('./lib/reports/server');
  await recordUnhandledError(error, request, context);
};
