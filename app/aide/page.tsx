import { HelpCenter } from '@/components/help/HelpCenter';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Centre d’aide',
  description: 'Retrouve les réponses aux questions fréquentes sur les outils JcHub, les conversions de fichiers et le dépannage.',
  path: '/aide',
});

export default function HelpPage() {
  return <HelpCenter />;
}
