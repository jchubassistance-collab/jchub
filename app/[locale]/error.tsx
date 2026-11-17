'use client';

// Errors of every public page: shown between the site’s header and footer.
import { ErrorContent, type ErrorPageProps } from '@/components/ErrorContent';

export default function RootError(props: ErrorPageProps) {
  return <ErrorContent {...props} />;
}
