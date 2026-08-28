// lib/books.ts — Catalogue des livres JcHub (avec URLs Cloudinary)
import { getBookPrice } from './pricing';
import { cloudinaryAssets } from './cloudinary';

export type Book = {
  slug: string;
  title: string;
  author: string;
  description: string;
  longDescription?: string;
  category: string;
  cover?: string;
  totalPages: number;
  estimatedAudioHours: number;
  rights: 'public_domain' | 'cc_by' | 'cc_by_sa' | 'cc_by_nc' | 'cc_by_nc_sa' | 'original';
  rightsNote: string;
  pricing: 'free' | 'paid' | 'freemium';
  oneTimePriceXAF?: number;
  pdfUrl: string;
  audioStatus: 'available' | 'coming_soon';
  totalChapters: number;
  isFeatured: boolean;
  isNew?: boolean;
  tags: string[];
  status: 'available' | 'coming_soon' | 'audio_processing';
};

// Helper pour générer les URLs Cloudinary
const pdfUrl = (slug: string) => cloudinaryAssets.bookPdf(slug);
const coverUrl = (slug: string) => cloudinaryAssets.bookCover(slug);

export const books: Book[] = [
  // ============ PREMIUM (payants) ============
  {
    slug: 'la-circulation-de-la-vie',
    title: 'La circulation de la vie',
    author: 'Jacob Moleschott',
    description:
      "Un classique de la pensée scientifique du XIXe siècle, explorant les cycles de la matière et de l'énergie. Œuvre du domaine public, disponible en audio pour la première fois.",
    longDescription:
      "Publié en 1852, ce livre fondateur de Jacob Moleschott a marqué un tournant dans la pensée matérialiste du XIXe siècle. En s'appuyant sur les découvertes de la chimie organique de son époque, l'auteur développe une vision matérialiste de la vie qui a profondément influencé la pensée scientifique. Moleschott y défend l'idée que la pensée est le produit de l'activité du cerveau, elle-même conditionnée par la nutrition et la circulation des éléments dans l'organisme. Une œuvre qui mérite d'être redécouverte par les esprits curieux.",
    category: 'Histoire / Sciences',
    cover: coverUrl('la-circulation-de-la-vie'),
    totalPages: 220,
    estimatedAudioHours: 7.3,
    rights: 'public_domain',
    rightsNote: 'Publié en 1852 — domaine public',
    pricing: 'freemium',
    oneTimePriceXAF: getBookPrice(220),
    pdfUrl: pdfUrl('la-circulation-de-la-vie'),
    audioStatus: 'available',
    totalChapters: 12,
    isFeatured: true,
    isNew: true,
    tags: ['histoire', 'sciences', 'philosophie', 'domaine-public'],
    status: 'available',
  },
  {
    slug: 'cours-de-reseaux',
    title: 'Cours de Réseaux',
    author: 'Karim Sehaba',
    description:
      "Support de cours de l'Université Lyon 2 : les fondamentaux des réseaux informatiques (modèle OSI, TCP/IP, routage, sécurité). Synthétique et pédagogique.",
    longDescription:
      "Ce support pédagogique issu de l'Université Lyon 2 offre une introduction complète aux réseaux informatiques. Il couvre les couches OSI et TCP/IP, le routage, les protocoles applicatifs (HTTP, DNS, FTP), ainsi que les bases de la sécurité réseau. Pensé pour des étudiants débutants, ce cours propose une approche progressive avec de nombreux schémas et exemples concrets.",
    category: 'Dev / Réseaux',
    cover: coverUrl('cours-de-reseaux'),
    totalPages: 90,
    estimatedAudioHours: 3,
    rights: 'cc_by_sa',
    rightsNote: "Licence académique compatible (CC BY-SA) — commercialisable",
    pricing: 'freemium',
    oneTimePriceXAF: getBookPrice(90),
    pdfUrl: pdfUrl('cours-de-reseaux'),
    audioStatus: 'available',
    totalChapters: 8,
    isFeatured: true,
    tags: ['réseaux', 'tcp-ip', 'dev', 'osi'],
    status: 'available',
  },
  {
    slug: 'debuter-en-cybersecurite',
    title: 'Débuter en Cybersécurité',
    author: 'Michel Happy',
    description:
      "Guide pratique pour entrer dans le monde de la cybersécurité. Concepts, outils, premières étapes. Format court et accessible.",
    longDescription:
      "Un guide parfait pour les débutants qui souhaitent s'orienter vers la cybersécurité. En quelques pages, ce livre présente les fondamentaux : les types de menaces, les outils essentiels (Wireshark, Metasploit, Nmap), les certifications à viser (CEH, OSCP, CompTIA Security+), et les ressources pour continuer à apprendre.",
    category: 'Dev / Cybersécurité',
    cover: coverUrl('debuter-en-cybersecurite'),
    totalPages: 35,
    estimatedAudioHours: 1.2,
    rights: 'cc_by_sa',
    rightsNote: 'CC BY-SA — commercialisable',
    pricing: 'freemium',
    oneTimePriceXAF: getBookPrice(35),
    pdfUrl: pdfUrl('debuter-en-cybersecurite'),
    audioStatus: 'available',
    totalChapters: 5,
    isFeatured: false,
    tags: ['cybersécurité', 'sécurité', 'guide', 'débutant'],
    status: 'available',
  },

  // ============ GRATUITS (CC BY-NC-SA) ============
  {
    slug: 'les-reseaux-de-zero',
    title: 'Les réseaux de zéro',
    author: 'Vince',
    description:
      "Cours communautaire pour comprendre les réseaux informatiques à partir de zéro. Licence libre — accès gratuit pour tous.",
    longDescription:
      "Ce cours communautaire, créé par Vince et partagé sous licence libre, est parfait pour quiconque souhaite comprendre les réseaux sans prérequis. Du fonctionnement d'Internet à la configuration d'un petit réseau local, ce cours couvre l'essentiel avec une approche très pédagogique. Idéal pour les étudiants en informatique ou les autodidactes qui débutent.",
    category: 'Dev / Réseaux',
    cover: coverUrl('les-reseaux-de-zero'),
    totalPages: 180,
    estimatedAudioHours: 6,
    rights: 'cc_by_nc_sa',
    rightsNote: 'CC BY-NC-SA — non commercial, accès libre',
    pricing: 'free',
    pdfUrl: pdfUrl('les-reseaux-de-zero'),
    audioStatus: 'available',
    totalChapters: 10,
    isFeatured: true,
    tags: ['réseaux', 'débutant', 'cc-by-nc-sa', 'internet'],
    status: 'available',
  },
  {
    slug: 'apprenez-a-programmer-en-java',
    title: 'Apprenez à programmer en Java',
    author: 'OpenClassrooms',
    description:
      "Le tutoriel de référence pour apprendre Java, des bases aux concepts avancés (POO, collections, streams). Licence libre — accès gratuit pour tous.",
    longDescription:
      "Le cours Java emblématique d'OpenClassrooms, mis à disposition sous licence libre. Vous y apprendrez progressivement : la syntaxe Java, la programmation orientée objet (classes, héritage, polymorphisme), les collections (List, Map, Set), les streams et lambda expressions, ainsi que les bonnes pratiques de développement. Un must pour tout développeur qui souhaite maîtriser Java.",
    category: 'Dev / Java',
    cover: coverUrl('apprenez-a-programmer-en-java'),
    totalPages: 250,
    estimatedAudioHours: 8.3,
    rights: 'cc_by_nc_sa',
    rightsNote: 'CC BY-NC-SA — non commercial, accès libre',
    pricing: 'free',
    pdfUrl: pdfUrl('apprenez-a-programmer-en-java'),
    audioStatus: 'available',
    totalChapters: 14,
    isFeatured: true,
    tags: ['java', 'programmation', 'cc-by-nc-sa', 'poo'],
    status: 'available',
  },

  // ============ À VENIR ============
  {
    slug: 'data-science-fondamentaux',
    title: 'Data Science : fondamentaux et études de cas',
    author: 'Éric Biernat & Michel Lutz',
    description:
      "Les fondamentaux de la data science appliqués à des cas concrets. Statistiques, machine learning, visualisation.",
    longDescription:
      "Un panorama complet de la data science moderne, des bases statistiques jusqu'aux applications de machine learning. Ce livre aborde Python pour la data, pandas, scikit-learn, et propose plusieurs études de cas réels : prédiction de churn, classification d'images, recommandation de produits. Idéal pour les développeurs qui souhaitent se spécialiser en IA.",
    category: 'IA / Data',
    cover: coverUrl('data-science-fondamentaux'),
    totalPages: 300,
    estimatedAudioHours: 10,
    rights: 'cc_by_sa',
    rightsNote: 'CC BY-SA — commercialisable',
    pricing: 'freemium',
    oneTimePriceXAF: getBookPrice(300),
    pdfUrl: pdfUrl('data-science-fondamentaux'),
    audioStatus: 'coming_soon',
    totalChapters: 15,
    isFeatured: false,
    tags: ['data-science', 'ia', 'machine-learning', 'python'],
    status: 'coming_soon',
  },
  {
    slug: 'apprendre-python',
    title: 'Apprendre à programmer avec Python',
    author: 'Gérard Swinnen',
    description:
      "Le tutoriel Python de référence : des bases aux concepts avancés, avec exercices corrigés.",
    longDescription:
      "Le livre de Gérard Swinnen est une référence pour apprendre Python en français. Très progressif, il accompagne le lecteur depuis l'installation de Python jusqu'à la programmation orientée objet, en passant par les structures de données, les exceptions, et la programmation graphique avec tkinter. Les nombreux exercices corrigés en font un excellent support pour l'autoformation.",
    category: 'Dev / Python',
    cover: coverUrl('apprendre-python'),
    totalPages: 450,
    estimatedAudioHours: 15,
    rights: 'cc_by_sa',
    rightsNote: 'CC BY-SA — commercialisable',
    pricing: 'freemium',
    oneTimePriceXAF: getBookPrice(450),
    pdfUrl: pdfUrl('apprendre-python'),
    audioStatus: 'coming_soon',
    totalChapters: 20,
    isFeatured: false,
    tags: ['python', 'programmation', 'débutant'],
    status: 'coming_soon',
  },
  {
    slug: 'securite-informatique-ethical-hacking',
    title: 'Sécurité Informatique - Ethical Hacking',
    author: 'ACISSI',
    description:
      "Apprenez les techniques offensives de sécurité informatique, dans un cadre légal et éthique.",
    longDescription:
      "Rédigé par l'ACISSI (Audit, Conseil, Installation et Support en Sécurité des Systèmes d'Information), ce livre est une référence francophone sur l'ethical hacking. Il couvre les différentes phases d'un test d'intrusion, les outils essentiels, ainsi que les aspects juridiques. Un must pour les professionnels de la sécurité francophones.",
    category: 'Dev / Cybersécurité',
    cover: coverUrl('securite-informatique-ethical-hacking'),
    totalPages: 350,
    estimatedAudioHours: 11.6,
    rights: 'cc_by_sa',
    rightsNote: 'CC BY-SA — commercialisable',
    pricing: 'freemium',
    oneTimePriceXAF: getBookPrice(350),
    pdfUrl: pdfUrl('securite-informatique-ethical-hacking'),
    audioStatus: 'coming_soon',
    totalChapters: 16,
    isFeatured: false,
    tags: ['cybersécurité', 'ethical-hacking', 'pentest'],
    status: 'coming_soon',
  },
];

export function getBookBySlug(slug: string): Book | undefined {
  return books.find((b) => b.slug === slug);
}

export function getFeaturedBooks(): Book[] {
  return books.filter((b) => b.isFeatured);
}

export function getFreeBooks(): Book[] {
  return books.filter((b) => b.pricing === 'free');
}

export function getPaidBooks(): Book[] {
  return books.filter((b) => b.pricing === 'freemium');
}
