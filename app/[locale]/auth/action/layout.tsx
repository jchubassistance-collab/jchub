import type { Metadata } from 'next';
import { bilingual } from '@/i18n/copy';
import { isLocale } from '@/i18n/routing';

const copy = bilingual({
  title: 'Réinitialisation du mot de passe',
  description: 'Définis un nouveau mot de passe pour accéder à ton compte JcHub.',
}, {
  title: 'Password reset',
  description: 'Set a new password to access your JcHub account.',
});

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = copy[isLocale(locale) ? locale : 'fr'];
  return { title: t.title, description: t.description, robots: { index: false, follow: false } };
}

export default function AuthActionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
