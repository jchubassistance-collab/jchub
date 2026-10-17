import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Contact',
  description: 'Contacte l’équipe JcHub pour une question, un partenariat ou une suggestion d’outil numérique.',
  path: '/contact',
});

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}