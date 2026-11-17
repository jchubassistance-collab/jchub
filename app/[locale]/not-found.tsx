import { LocaleNotFoundClient } from '@/components/LocaleNotFoundClient';

// No getLocale() here: it reads the headers and turns the 404 of a static page into a 500.
export default function LocaleNotFound() {
  return <LocaleNotFoundClient />;
}
