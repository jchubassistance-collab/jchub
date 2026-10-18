import { HelpCenter } from '@/components/help/HelpCenter';
import { pageMetadata } from '@/lib/seo';
import { bilingual } from '@/i18n/copy';
import { isLocale } from '@/i18n/routing';

const copy = bilingual({
  title: 'Centre d’aide',
  description: 'Retrouve les réponses aux questions fréquentes sur les outils JcHub, les conversions de fichiers et le dépannage.',
}, {
  title: 'Help center',
  description: 'Find answers to frequently asked questions about JcHub tools, file conversions and troubleshooting.',
});

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata({ locale, title: copy[locale].title, description: copy[locale].description, href: '/aide' });
}

export default function HelpPage() {
  return <HelpCenter />;
}
