import { getLocale } from 'next-intl/server';
import { NotFoundContent, notFoundMetadata } from '@/components/NotFoundContent';

export async function generateMetadata() {
  return notFoundMetadata(await getLocale());
}

export default async function LocaleNotFound() {
  return <NotFoundContent locale={await getLocale()} />;
}
