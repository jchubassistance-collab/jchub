const USER_ERROR_MESSAGE = 'Une erreur est survenue. Veuillez réessayer.';

export function reportUserError(cause?: unknown): void {
  // This helper is called after errors have already been handled with a fallback.
  // Keep the diagnostic in the server logs without surfacing it as a render error
  // in Next.js's development error overlay.
  if (cause instanceof Error) {
    console.warn(USER_ERROR_MESSAGE, cause);
    return;
  }

  console.warn(USER_ERROR_MESSAGE);
}
