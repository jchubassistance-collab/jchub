'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  CircleHelp,
  FileQuestion,
  FileText,
  LifeBuoy,
  Mail,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Wrench,
  X,
} from 'lucide-react';

type CategoryId = 'start' | 'documents' | 'privacy' | 'troubleshooting';

type HelpQuestion = {
  category: CategoryId;
  question: string;
  searchTerms: string;
  answer: ReactNode;
};

const categories: { id: CategoryId; label: string; icon: typeof CircleHelp }[] = [
  { id: 'start', label: 'Bien démarrer', icon: Sparkles },
  { id: 'documents', label: 'Outils et fichiers', icon: FileText },
  { id: 'privacy', label: 'Confidentialité', icon: ShieldCheck },
  { id: 'troubleshooting', label: 'Dépannage', icon: Wrench },
];

const questions: HelpQuestion[] = [
  {
    category: 'start',
    question: 'Faut-il créer un compte pour utiliser JcHub ?',
    searchTerms: 'inscription connexion compte utilisateur accès',
    answer: (
      <p>
        Non. Tu peux ouvrir les outils directement depuis le{' '}
        <Link className="font-semibold text-blue-700 underline decoration-blue-200 underline-offset-4 hover:text-blue-900" href="/outils">
          catalogue JcHub
        </Link>{' '}
        sans créer de compte.
      </p>
    ),
  },
  {
    category: 'start',
    question: 'Les outils JcHub sont-ils gratuits ?',
    searchTerms: 'prix paiement abonnement gratuit coût',
    answer: (
      <p>
        Les outils JcHub sont accessibles gratuitement. Le calculateur de coûts API, lui, fournit une estimation :
        les éventuels frais facturés par un fournisseur d’API restent indépendants de JcHub.
      </p>
    ),
  },
  {
    category: 'start',
    question: 'Comment trouver l’outil dont j’ai besoin ?',
    searchTerms: 'rechercher catalogue catégorie outil',
    answer: (
      <p>
        Parcours le{' '}
        <Link className="font-semibold text-blue-700 underline decoration-blue-200 underline-offset-4 hover:text-blue-900" href="/outils">
          catalogue des outils
        </Link>{' '}
        et utilise sa recherche ou ses filtres. Chaque fiche précise l’usage de l’outil et les formats concernés.
      </p>
    ),
  },
  {
    category: 'start',
    question: 'Où trouver des tutoriels et des conseils pratiques ?',
    searchTerms: 'guide tutoriel apprendre article ressource blog',
    answer: (
      <p>
        Le{' '}
        <Link className="font-semibold text-blue-700 underline decoration-blue-200 underline-offset-4 hover:text-blue-900" href="/blog">
          blog JcHub
        </Link>{' '}
        rassemble des articles et des guides pratiques pour aller plus loin.
      </p>
    ),
  },
  {
    category: 'documents',
    question: 'Quels formats de fichiers puis-je utiliser ?',
    searchTerms: 'extension format PDF PNG JPG JPEG DOCX XLSX CSV',
    answer: (
      <p>
        Les formats acceptés dépendent de l’outil. Consulte sa fiche avant de commencer : elle indique les fichiers
        compatibles ainsi que les limites éventuelles.
      </p>
    ),
  },
  {
    category: 'documents',
    question: 'Comment convertir un document ou une image ?',
    searchTerms: 'conversion transformer PDF Word Excel CSV image',
    answer: (
      <p>
        Ouvre l’outil correspondant dans le{' '}
        <Link className="font-semibold text-blue-700 underline decoration-blue-200 underline-offset-4 hover:text-blue-900" href="/outils">
          catalogue
        </Link>
        , sélectionne un fichier dans les formats indiqués, puis lance la conversion. Lorsque le résultat est prêt,
        suis les indications affichées pour le télécharger.
      </p>
    ),
  },
  {
    category: 'documents',
    question: 'Y a-t-il une limite de taille pour les fichiers ?',
    searchTerms: 'taille poids lourd maximum Mo limite fichier',
    answer: (
      <p>
        La limite varie selon l’outil. Elle est affichée dans l’interface ou la fiche de l’outil ; si ton fichier la
        dépasse, essaie une version plus légère ou contacte-nous.
      </p>
    ),
  },
  {
    category: 'documents',
    question: 'Où récupérer le fichier converti ?',
    searchTerms: 'résultat sortie télécharger export fichier',
    answer: (
      <p>
        Le résultat apparaît dans l’outil une fois le traitement terminé. Utilise le bouton de téléchargement affiché
        et vérifie ensuite le dossier de téléchargements de ton navigateur.
      </p>
    ),
  },
  {
    category: 'privacy',
    question: 'Mes fichiers sont-ils traités dans mon navigateur ?',
    searchTerms: 'confidentialité données privé stockage serveur upload navigateur local',
    answer: (
      <p>
        Cela dépend de l’outil : certains, comme l’optimiseur d’images, indiquent un traitement dans le navigateur ;
        d’autres conversions nécessitent l’envoi temporaire du fichier pour être traitées. Vérifie les précisions sur
        la fiche de l’outil et consulte notre{' '}
        <Link className="font-semibold text-blue-700 underline decoration-blue-200 underline-offset-4 hover:text-blue-900" href="/confidentialite">
          politique de confidentialité
        </Link>
        . Évite d’envoyer des documents sensibles si tu n’es pas sûr du mode de traitement.
      </p>
    ),
  },
  {
    category: 'privacy',
    question: 'Les outils nécessitent-ils une installation ?',
    searchTerms: 'installer installation application navigateur browser logiciel',
    answer: (
      <p>
        Non. Les outils s’utilisent depuis le site JcHub dans ton navigateur, sans installer de logiciel.
      </p>
    ),
  },
  {
    category: 'troubleshooting',
    question: 'La conversion échoue ou reste bloquée. Que faire ?',
    searchTerms: 'erreur échec bloqué chargement conversion traitement',
    answer: (
      <p>
        Vérifie que le fichier est dans un format accepté et respecte la limite indiquée. Puis réessaie, éventuellement
        après avoir actualisé la page. Si le problème continue,{' '}
        <Link className="font-semibold text-blue-700 underline decoration-blue-200 underline-offset-4 hover:text-blue-900" href="/contact">
          contacte l’équipe
        </Link>{' '}
        en précisant le nom de l’outil et le message d’erreur.
      </p>
    ),
  },
  {
    category: 'troubleshooting',
    question: 'Le téléchargement ne démarre pas. Comment résoudre le problème ?',
    searchTerms: 'télécharger download bouton navigateur pop-up',
    answer: (
      <p>
        Vérifie que le traitement est terminé et que ton navigateur n’a pas bloqué le téléchargement. Tu peux aussi
        réessayer dans un nouvel onglet ou avec un autre navigateur récent.
      </p>
    ),
  },
  {
    category: 'troubleshooting',
    question: 'Comment signaler un bug ou suggérer un outil ?',
    searchTerms: 'bug problème idée proposition suggestion feedback',
    answer: (
      <p>
        Écris-nous depuis la page{' '}
        <Link className="font-semibold text-blue-700 underline decoration-blue-200 underline-offset-4 hover:text-blue-900" href="/contact">
          Contact
        </Link>
        . Pour un bug, indique l’outil, les étapes suivies et le message affiché. Pour ta sécurité, n’envoie pas de
        document confidentiel.
      </p>
    ),
  },
];

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr')
    .trim();
}

export function HelpCenter() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryId | null>(null);
  const normalizedQuery = normalize(query);
  const queryTerms = normalizedQuery.split(/\s+/).filter(Boolean);

  const filteredQuestions = questions.filter((item) => {
    const matchesCategory = !activeCategory || item.category === activeCategory;
    const searchableText = normalize(`${item.question} ${item.searchTerms}`);
    const matchesQuery = queryTerms.every((term) => searchableText.includes(term));
    return matchesCategory && matchesQuery;
  });

  const resetFilters = () => {
    setQuery('');
    setActiveCategory(null);
  };

  return (
    <div className="min-h-screen bg-[#eff6ff] text-[#0f172a]">
      <section className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_12%_20%,rgba(147,197,253,.48),transparent_30%),radial-gradient(circle_at_90%_80%,rgba(191,219,254,.55),transparent_32%),#eff6ff]">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          aria-hidden="true"
          style={{
            backgroundImage:
              'linear-gradient(rgba(37,99,235,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,.045) 1px,transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse at center,black 20%,transparent 76%)',
          }}
        />
        <div className="relative mx-auto max-w-7xl px-5 pb-12 pt-14 sm:px-8 sm:pb-16 lg:px-10 lg:pt-20">
          <nav aria-label="Fil d’Ariane" className="mb-9 flex items-center gap-2 text-sm text-slate-500">
            <Link href="/" className="transition hover:text-blue-800">Accueil</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page" className="font-semibold text-slate-800">Centre d’aide</span>
          </nav>

          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/85 px-4 py-2 text-sm font-semibold text-blue-900 shadow-sm">
              <LifeBuoy className="h-4 w-4" aria-hidden="true" />
              Centre d’aide JcHub
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-[-.04em] sm:text-6xl">
              Une réponse, <span className="text-blue-700">tout de suite.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Retrouve les réponses sur les outils, les fichiers et les problèmes courants. Sans compte, sans détour.
            </p>

            <div className="mx-auto mt-8 max-w-2xl">
              <label htmlFor="help-search" className="sr-only">Rechercher dans le centre d’aide</label>
              <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-white p-2 pl-4 shadow-[0_18px_50px_rgba(37,99,235,.12)] focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100">
                <Search className="h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" />
                <input
                  id="help-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Ex. convertir un PDF, taille de fichier…"
                  className="min-h-11 min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 sm:text-base"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                    aria-label="Effacer la recherche"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
              <p className="mt-3 text-xs text-slate-500">Recherche par mot-clé dans les questions fréquentes.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-14 lg:px-10 lg:py-16">
        <div className="min-w-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-blue-700">Questions fréquentes</p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">Comment peut-on t’aider ?</h2>
            </div>
            <p className="text-sm text-slate-500" aria-live="polite" aria-atomic="true">
              {filteredQuestions.length} {filteredQuestions.length > 1 ? 'réponses' : 'réponse'}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Filtrer par catégorie">
            <button
              type="button"
              aria-pressed={activeCategory === null}
              onClick={() => setActiveCategory(null)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                activeCategory === null
                  ? 'border-blue-700 bg-blue-700 text-white'
                  : 'border-blue-100 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-800'
              }`}
            >
              Tout
            </button>
            {categories.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                aria-pressed={activeCategory === id}
                onClick={() => setActiveCategory(activeCategory === id ? null : id)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                  activeCategory === id
                    ? 'border-blue-700 bg-blue-700 text-white'
                    : 'border-blue-100 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-800'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-3">
            {filteredQuestions.map((item) => (
              <details
                key={item.question}
                className="group rounded-2xl border border-blue-100 bg-white transition open:border-blue-200 open:shadow-[0_12px_35px_rgba(37,99,235,.08)]"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-5 py-5 text-left font-bold text-slate-900 marker:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:px-6">
                  <span>{item.question}</span>
                  <ChevronDown
                    className="h-5 w-5 shrink-0 text-blue-700 transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <div className="border-t border-blue-50 px-5 pb-5 pt-4 text-sm leading-7 text-slate-600 sm:px-6">
                  {item.answer}
                </div>
              </details>
            ))}

            {filteredQuestions.length === 0 && (
              <div className="rounded-2xl border border-dashed border-blue-200 bg-white/70 px-6 py-10 text-center">
                <FileQuestion className="mx-auto h-9 w-9 text-blue-500" aria-hidden="true" />
                <h3 className="mt-4 text-lg font-bold">Aucun résultat pour cette recherche</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Essaie un autre mot-clé ou contacte-nous : l’équipe pourra t’aider.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-5 rounded-full border border-blue-200 bg-white px-5 py-2.5 text-sm font-bold text-blue-800 transition hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  Effacer les filtres
                </button>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-4 lg:pt-1">
          <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-[0_12px_35px_rgba(37,99,235,.07)]">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-700">
              <Wrench className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-lg font-extrabold">Explore les outils</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Accède au catalogue et trouve l’outil adapté à ton besoin.
            </p>
            <Link
              href="/outils"
              className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-blue-700 transition hover:gap-3 hover:text-blue-900"
            >
              Voir les outils <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-[0_12px_35px_rgba(37,99,235,.07)]">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-700">
              <BookOpen className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-lg font-extrabold">Pour aller plus loin</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Découvre les articles et tutoriels du blog JcHub.
            </p>
            <Link
              href="/blog"
              className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-blue-700 transition hover:gap-3 hover:text-blue-900"
            >
              Lire le blog <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="rounded-3xl bg-[#102a43] p-6 text-white shadow-[0_16px_40px_rgba(15,42,67,.18)]">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-blue-200">
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-lg font-extrabold">Encore une question ?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Décris-nous ton besoin et l’équipe JcHub te répondra.
            </p>
            <Link
              href="/contact"
              className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#93c5fd] px-5 py-2.5 text-sm font-bold text-[#0f172a] transition hover:bg-[#bfdbfe] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <Mail className="h-4 w-4" aria-hidden="true" /> Contacter l’équipe
            </Link>
          </div>
        </aside>
      </section>

      <section className="border-t border-blue-100 bg-white/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <p className="inline-flex items-center gap-2">
            <Check className="h-4 w-4 text-blue-700" aria-hidden="true" />
            Pas de compte nécessaire pour utiliser les outils.
          </p>
          <Link href="/contact" className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-900">
            Besoin d’aide personnalisée ? <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
