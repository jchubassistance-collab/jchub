const USER_ERROR_MESSAGE = 'Une erreur est survenue. Veuillez réessayer.';

export function reportUserError(): void {
  console.error(USER_ERROR_MESSAGE);
}
