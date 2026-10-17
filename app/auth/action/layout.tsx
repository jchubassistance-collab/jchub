import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Réinitialisation du mot de passe',
  description: 'Définis un nouveau mot de passe pour accéder à ton compte JcHub.',
  robots: { index: false, follow: false },
};

export default function AuthActionLayout({ children }: { children: React.ReactNode }) {
  return children;
}