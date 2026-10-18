import { pageMetadata } from '@/lib/seo';
import { bilingual } from '@/i18n/copy';
import { isLocale } from '@/i18n/routing';

const copy = bilingual({
  title: 'Contact',
  description: 'Contacte l’équipe JcHub pour une question, un partenariat ou une suggestion d’outil numérique.',
}, {
  title: 'Contact',
  description: 'Contact the JcHub team with a question, a partnership idea or a suggestion for a digital tool.',
});

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata({ locale, title: copy[locale].title, description: copy[locale].description, href: '/contact' });
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
