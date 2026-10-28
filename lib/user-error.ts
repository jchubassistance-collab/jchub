const USER_ERROR_MESSAGE = 'Une erreur est survenue. Veuillez réessayer.';

/** What a route knows about an error: the request it served, what it was doing, useful details (never secrets nor file contents). */
export type UserErrorContext = {
  request?: Request;
  /** What the visitor was doing, when the address alone does not say it ("Conversion via Adobe"). */
  action?: string;
  /** Tool, file size, provider called… */
  details?: Record<string, unknown>;
  status?: number;
};

type ErrorReporter = (cause: unknown, context: UserErrorContext) => void;

export function reportUserError(cause?: unknown, context?: UserErrorContext): void {
  // This helper is called after errors have already been handled with a fallback.
  // Keep the diagnostic in the server logs without surfacing it as a render error
  // in Next.js's development error overlay.
  if (cause instanceof Error) {
    console.warn(USER_ERROR_MESSAGE, cause);
  } else {
    console.warn(USER_ERROR_MESSAGE);
  }

  // On the server, the site reports also record it (lib/reports/server.ts, installed by
  // instrumentation.ts). This file stays free of server imports: client components load it too.
  if (typeof window !== 'undefined') return;
  const reporter = (globalThis as { __jchubReportError?: ErrorReporter }).__jchubReportError;
  if (!reporter) return;
  try {
    // Without a cause, an error created here still tells where it was reported from.
    reporter(cause ?? Object.assign(new Error('Erreur signalée sans détail'), { name: 'Signalement' }), context || {});
  } catch {
    // Reporting never breaks the fallback that follows.
  }
}
