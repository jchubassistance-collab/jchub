'use client';

// Errors of every admin page, shown inside the admin layout.
import { ErrorContent, type ErrorPageProps } from '@/components/ErrorContent';

export default function AdminError(props: ErrorPageProps) {
  return <ErrorContent {...props} />;
}
