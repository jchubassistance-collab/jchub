import { getLocale } from 'next-intl/server';
import { NotFoundContent } from '@/components/NotFoundContent';

export default async function NotFound() {
  return <NotFoundContent locale={await getLocale()} />;
}
