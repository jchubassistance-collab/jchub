export type Guide = {
  slug: string;
  title: string;
  description: string;
  category: string;
  level: 'Débutant' | 'Intermédiaire' | 'Avancé';
  format: string;
  size: string;
  downloadUrl: string;
  cloudinaryPublicId?: string;
};

export const guides: Guide[] = [
  {
    slug: 'creer-un-utilisateur-windows-cmd',
    title: 'Créer un utilisateur Windows avec CMD',
    description: 'Une fiche pratique pour créer, configurer et vérifier un compte local depuis l’invite de commandes.',
    category: 'Windows / CMD',
    level: 'Débutant',
    format: 'TXT',
    size: '3 Ko',
    downloadUrl: '/api/guides/file/creer-un-utilisateur-windows-cmd',
  },
  {
    slug: 'changer-mot-de-passe-windows',
    title: 'Changer un mot de passe Windows',
    description: 'Un guide PDF pratique pour modifier le mot de passe d’un compte Windows en toute simplicité.',
    category: 'Windows',
    level: 'Débutant',
    format: 'PDF',
    size: 'Guide PDF',
    downloadUrl: '/api/guides/file/changer-mot-de-passe-windows',
  },
];

export function getGuide(slug: string) {
  return guides.find((guide) => guide.slug === slug);
}
