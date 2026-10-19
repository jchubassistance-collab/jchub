'use client';

// Errors of every page, public or admin: shown between the site's header and footer.
import { ErrorContent, type ErrorPageProps } from '@/components/ErrorContent';

export default function RootError(props: ErrorPageProps) {
  return <ErrorContent {...props} />;
}
