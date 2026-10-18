'use client';

import { useState, type ReactNode } from 'react';
import { useLocale } from 'next-intl';
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
import { Link } from '@/i18n/navigation';
import { bilingual } from '@/i18n/copy';
import type { StaticPathname } from '@/i18n/routing';

type CategoryId = 'start' | 'documents' | 'privacy' | 'troubleshooting';

type HelpQuestion = {
  category: CategoryId;
  question: string;
  searchTerms: string;
  answer: ReactNode;
};

const categoryIcons: Record<CategoryId, typeof CircleHelp> = {
  start: Sparkles,
  documents: FileText,
  privacy: ShieldCheck,
  troubleshooting: Wrench,
};

function InlineLink({ href, children }: { href: StaticPathname; children: ReactNode }) {
  return (
    <Link className="font-semibold text-blue-700 underline decoration-blue-200 underline-offset-4 hover:text-blue-900" href={href}>
      {children}
    </Link>
  );
}

const copy = bilingual({
  categories: { start: 'Bien démarrer', documents: 'Outils et fichiers', privacy: 'Confidentialité', troubleshooting: 'Dépannage' } as Record<CategoryId, string>,
  questions: [
    {
      category: 'start',
      question: 'Faut-il créer un compte pour utiliser JcHub ?',
      searchTerms: 'inscription connexion compte utilisateur accès',
      answer: <p>Non. Tu peux ouvrir les outils directement depuis le{' '}<InlineLink href="/outils">catalogue JcHub</InlineLink>{' '}sans créer de compte.</p>,
    },
    {
      category: 'start',
      question: 'Les outils JcHub sont-ils gratuits ?',
      searchTerms: 'prix paiement abonnement gratuit coût',
      answer: <p>Les outils JcHub sont accessibles gratuitement. Le calculateur de coûts API, lui, fournit une estimation : les éventuels frais facturés par un fournisseur d’API restent indépendants de JcHub.</p>,
    },
    {
      category: 'start',
      question: 'Comment trouver l’outil dont j’ai besoin ?',
      searchTerms: 'rechercher catalogue catégorie outil',
      answer: <p>Parcours le{' '}<InlineLink href="/outils">catalogue des outils</InlineLink>{' '}et utilise sa recherche ou ses filtres. Chaque fiche précise l’usage de l’outil et les formats concernés.</p>,
    },
    {
      category: 'start',
      question: 'Où trouver des tutoriels et des conseils pratiques ?',
      searchTerms: 'guide tutoriel apprendre article ressource blog',
      answer: <p>Le{' '}<InlineLink href="/blog">blog JcHub</InlineLink>{' '}rassemble des articles et des guides pratiques pour aller plus loin.</p>,
    },
    {
      category: 'documents',
      question: 'Quels formats de fichiers puis-je utiliser ?',
      searchTerms: 'extension format PDF PNG JPG JPEG DOCX XLSX CSV',
      answer: <p>Les formats acceptés dépendent de l’outil. Consulte sa fiche avant de commencer : elle indique les fichiers compatibles ainsi que les limites éventuelles.</p>,
    },
    {
      category: 'documents',
      question: 'Comment convertir un document ou une image ?',
      searchTerms: 'conversion transformer PDF Word Excel CSV image',
      answer: <p>Ouvre l’outil correspondant dans le{' '}<InlineLink href="/outils">catalogue</InlineLink>, sélectionne un fichier dans les formats indiqués, puis lance la conversion. Lorsque le résultat est prêt, suis les indications affichées pour le télécharger.</p>,
    },
    {
      category: 'documents',
      question: 'Y a-t-il une limite de taille pour les fichiers ?',
      searchTerms: 'taille poids lourd maximum Mo limite fichier',
      answer: <p>La limite varie selon l’outil. Elle est affichée dans l’interface ou la fiche de l’outil ; si ton fichier la dépasse, essaie une version plus légère ou contacte-nous.</p>,
    },
    {
      category: 'documents',
      question: 'Où récupérer le fichier converti ?',
      searchTerms: 'résultat sortie télécharger export fichier',
      answer: <p>Le résultat apparaît dans l’outil une fois le traitement terminé. Utilise le bouton de téléchargement affiché et vérifie ensuite le dossier de téléchargements de ton navigateur.</p>,
    },
    {
      category: 'privacy',
      question: 'Mes fichiers sont-ils traités dans mon navigateur ?',
      searchTerms: 'confidentialité données privé stockage serveur upload navigateur local',
      answer: <p>Cela dépend de l’outil : certains, comme l’optimiseur d’images, indiquent un traitement dans le navigateur ; d’autres conversions nécessitent l’envoi temporaire du fichier pour être traitées. Vérifie les précisions sur la fiche de l’outil et consulte notre{' '}<InlineLink href="/confidentialite">politique de confidentialité</InlineLink>. Évite d’envoyer des documents sensibles si tu n’es pas sûr du mode de traitement.</p>,
    },
    {
      category: 'privacy',
      question: 'Les outils nécessitent-ils une installation ?',
      searchTerms: 'installer installation application navigateur browser logiciel',
      answer: <p>Non. Les outils s’utilisent depuis le site JcHub dans ton navigateur, sans installer de logiciel.</p>,
    },
    {
      category: 'troubleshooting',
      question: 'La conversion échoue ou reste bloquée. Que faire ?',
      searchTerms: 'erreur échec bloqué chargement conversion traitement',
      answer: <p>Vérifie que le fichier est dans un format accepté et respecte la limite indiquée. Puis réessaie, éventuellement après avoir actualisé la page. Si le problème continue,{' '}<InlineLink href="/contact">contacte l’équipe</InlineLink>{' '}en précisant le nom de l’outil et le message d’erreur.</p>,
    },
    {
      category: 'troubleshooting',
      question: 'Le téléchargement ne démarre pas. Comment résoudre le problème ?',
      searchTerms: 'télécharger download bouton navigateur pop-up',
      answer: <p>Vérifie que le traitement est terminé et que ton navigateur n’a pas bloqué le téléchargement. Tu peux aussi réessayer dans un nouvel onglet ou avec un autre navigateur récent.</p>,
    },
    {
      category: 'troubleshooting',
      question: 'Comment signaler un bug ou suggérer un outil ?',
      searchTerms: 'bug problème idée proposition suggestion feedback',
      answer: <p>Écris-nous depuis la page{' '}<InlineLink href="/contact">Contact</InlineLink>. Pour un bug, indique l’outil, les étapes suivies et le message affiché. Pour ta sécurité, n’envoie pas de document confidentiel.</p>,
    },
  ] as HelpQuestion[],
  breadcrumb: 'Fil d’Ariane',
  home: 'Accueil',
  helpCenter: 'Centre d’aide',
  badge: 'Centre d’aide JcHub',
  titleStart: 'Une réponse, ',
  titleEnd: 'tout de suite.',
  intro: 'Retrouve les réponses sur les outils, les fichiers et les problèmes courants. Sans compte, sans détour.',
  searchLabel: 'Rechercher dans le centre d’aide',
  searchPlaceholder: 'Ex. convertir un PDF, taille de fichier…',
  clearSearch: 'Effacer la recherche',
  searchHint: 'Recherche par mot-clé dans les questions fréquentes.',
  faqEyebrow: 'Questions fréquentes',
  faqTitle: 'Comment peut-on t’aider ?',
  count: (count: number) => `${count} ${count > 1 ? 'réponses' : 'réponse'}`,
  filterLabel: 'Filtrer par catégorie',
  all: 'Tout',
  noResultTitle: 'Aucun résultat pour cette recherche',
  noResultText: 'Essaie un autre mot-clé ou contacte-nous : l’équipe pourra t’aider.',
  clearFilters: 'Effacer les filtres',
  toolsTitle: 'Explore les outils',
  toolsText: 'Accède au catalogue et trouve l’outil adapté à ton besoin.',
  toolsLink: 'Voir les outils',
  blogTitle: 'Pour aller plus loin',
  blogText: 'Découvre les articles et tutoriels du blog JcHub.',
  blogLink: 'Lire le blog',
  questionTitle: 'Encore une question ?',
  questionText: 'Décris-nous ton besoin et l’équipe JcHub te répondra.',
  contactTeam: 'Contacter l’équipe',
  noAccount: 'Pas de compte nécessaire pour utiliser les outils.',
  personalHelp: 'Besoin d’aide personnalisée ?',
}, {
  categories: { start: 'Getting started', documents: 'Tools and files', privacy: 'Privacy', troubleshooting: 'Troubleshooting' },
  questions: [
    {
      category: 'start',
      question: 'Do I need an account to use JcHub?',
      searchTerms: 'sign up sign in account user access register',
      answer: <p>No. You can open the tools right from the{' '}<InlineLink href="/outils">JcHub catalog</InlineLink>{' '}without creating an account.</p>,
    },
    {
      category: 'start',
      question: 'Are JcHub tools free?',
      searchTerms: 'price payment subscription free cost',
      answer: <p>JcHub tools are free to use. The API cost calculator provides an estimate: any fees charged by an API provider remain independent of JcHub.</p>,
    },
    {
      category: 'start',
      question: 'How do I find the tool I need?',
      searchTerms: 'search catalog category tool find',
      answer: <p>Browse the{' '}<InlineLink href="/outils">tools catalog</InlineLink>{' '}and use its search or filters. Each tool page explains what the tool does and which formats it handles.</p>,
    },
    {
      category: 'start',
      question: 'Where can I find tutorials and practical tips?',
      searchTerms: 'guide tutorial learn article resource blog',
      answer: <p>The{' '}<InlineLink href="/blog">JcHub blog</InlineLink>{' '}brings together articles and practical guides to go further.</p>,
    },
    {
      category: 'documents',
      question: 'Which file formats can I use?',
      searchTerms: 'extension format PDF PNG JPG JPEG DOCX XLSX CSV',
      answer: <p>Accepted formats depend on the tool. Check its page before you start: it lists the compatible files and any limits.</p>,
    },
    {
      category: 'documents',
      question: 'How do I convert a document or an image?',
      searchTerms: 'conversion convert transform PDF Word Excel CSV image',
      answer: <p>Open the matching tool in the{' '}<InlineLink href="/outils">catalog</InlineLink>, select a file in one of the listed formats, then start the conversion. When the result is ready, follow the instructions shown to download it.</p>,
    },
    {
      category: 'documents',
      question: 'Is there a file size limit?',
      searchTerms: 'size weight large maximum MB limit file',
      answer: <p>The limit depends on the tool. It is shown in the interface or on the tool page; if your file exceeds it, try a lighter version or contact us.</p>,
    },
    {
      category: 'documents',
      question: 'Where do I get the converted file?',
      searchTerms: 'result output download export file',
      answer: <p>The result appears in the tool once processing is done. Use the download button shown, then check your browser’s downloads folder.</p>,
    },
    {
      category: 'privacy',
      question: 'Are my files processed in my browser?',
      searchTerms: 'privacy data private storage server upload browser local',
      answer: <p>It depends on the tool: some, like the image optimizer, state that they process files in the browser; other conversions require the file to be sent temporarily to be processed. Check the details on the tool page and read our{' '}<InlineLink href="/confidentialite">privacy policy</InlineLink>. Avoid sending sensitive documents if you’re not sure how they will be processed.</p>,
    },
    {
      category: 'privacy',
      question: 'Do the tools need to be installed?',
      searchTerms: 'install installation application browser software',
      answer: <p>No. The tools are used from the JcHub website in your browser, without installing any software.</p>,
    },
    {
      category: 'troubleshooting',
      question: 'The conversion fails or gets stuck. What should I do?',
      searchTerms: 'error failure stuck loading conversion processing',
      answer: <p>Check that the file is in an accepted format and within the stated limit. Then try again, possibly after refreshing the page. If the problem continues,{' '}<InlineLink href="/contact">contact the team</InlineLink>{' '}with the name of the tool and the error message.</p>,
    },
    {
      category: 'troubleshooting',
      question: 'The download doesn’t start. How do I fix it?',
      searchTerms: 'download button browser pop-up',
      answer: <p>Check that processing is finished and that your browser hasn’t blocked the download. You can also try again in a new tab or with another recent browser.</p>,
    },
    {
      category: 'troubleshooting',
      question: 'How do I report a bug or suggest a tool?',
      searchTerms: 'bug problem idea proposal suggestion feedback',
      answer: <p>Write to us from the{' '}<InlineLink href="/contact">Contact</InlineLink>{' '}page. For a bug, mention the tool, the steps you followed and the message shown. For your safety, don’t send confidential documents.</p>,
    },
  ],
  breadcrumb: 'Breadcrumb',
  home: 'Home',
  helpCenter: 'Help center',
  badge: 'JcHub help center',
  titleStart: 'An answer, ',
  titleEnd: 'right away.',
  intro: 'Find answers about the tools, files and common problems. No account, no detours.',
  searchLabel: 'Search the help center',
  searchPlaceholder: 'E.g. convert a PDF, file size…',
  clearSearch: 'Clear search',
  searchHint: 'Keyword search across the frequently asked questions.',
  faqEyebrow: 'Frequently asked questions',
  faqTitle: 'How can we help you?',
  count: (count: number) => `${count} ${count === 1 ? 'answer' : 'answers'}`,
  filterLabel: 'Filter by category',
  all: 'All',
  noResultTitle: 'No results for this search',
  noResultText: 'Try another keyword or contact us: the team can help you.',
  clearFilters: 'Clear filters',
  toolsTitle: 'Explore the tools',
  toolsText: 'Open the catalog and find the right tool for your need.',
  toolsLink: 'See the tools',
  blogTitle: 'Go further',
  blogText: 'Discover the articles and tutorials on the JcHub blog.',
  blogLink: 'Read the blog',
  questionTitle: 'Still have a question?',
  questionText: 'Tell us what you need and the JcHub team will get back to you.',
  contactTeam: 'Contact the team',
  noAccount: 'No account needed to use the tools.',
  personalHelp: 'Need personal help?',
});

function normalize(value: string, locale: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLocaleLowerCase(locale)
    .trim();
}

export function HelpCenter() {
  const locale = useLocale();
  const t = copy[locale];
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryId | null>(null);
  const normalizedQuery = normalize(query, locale);
  const queryTerms = normalizedQuery.split(/\s+/).filter(Boolean);

  const filteredQuestions = t.questions.filter((item) => {
    const matchesCategory = !activeCategory || item.category === activeCategory;
    const searchableText = normalize(`${item.question} ${item.searchTerms}`, locale);
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
          <nav aria-label={t.breadcrumb} className="mb-9 flex items-center gap-2 text-sm text-slate-500">
            <Link href="/" className="transition hover:text-blue-800">{t.home}</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page" className="font-semibold text-slate-800">{t.helpCenter}</span>
          </nav>

          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/85 px-4 py-2 text-sm font-semibold text-blue-900 shadow-sm">
              <LifeBuoy className="h-4 w-4" aria-hidden="true" />
              {t.badge}
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-[-.04em] sm:text-6xl">
              {t.titleStart}<span className="text-blue-700">{t.titleEnd}</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              {t.intro}
            </p>

            <div className="mx-auto mt-8 max-w-2xl">
              <label htmlFor="help-search" className="sr-only">{t.searchLabel}</label>
              <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-white p-2 pl-4 shadow-[0_18px_50px_rgba(37,99,235,.12)] focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100">
                <Search className="h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" />
                <input
                  id="help-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="min-h-11 min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 sm:text-base"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                    aria-label={t.clearSearch}
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
              <p className="mt-3 text-xs text-slate-500">{t.searchHint}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-14 lg:px-10 lg:py-16">
        <div className="min-w-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-blue-700">{t.faqEyebrow}</p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">{t.faqTitle}</h2>
            </div>
            <p className="text-sm text-slate-500" aria-live="polite" aria-atomic="true">
              {t.count(filteredQuestions.length)}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label={t.filterLabel}>
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
              {t.all}
            </button>
            {(Object.keys(categoryIcons) as CategoryId[]).map((id) => {
              const Icon = categoryIcons[id];
              return (
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
                  {t.categories[id]}
                </button>
              );
            })}
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
                <h3 className="mt-4 text-lg font-bold">{t.noResultTitle}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {t.noResultText}
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-5 rounded-full border border-blue-200 bg-white px-5 py-2.5 text-sm font-bold text-blue-800 transition hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  {t.clearFilters}
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
            <h2 className="mt-4 text-lg font-extrabold">{t.toolsTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {t.toolsText}
            </p>
            <Link
              href="/outils"
              className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-blue-700 transition hover:gap-3 hover:text-blue-900"
            >
              {t.toolsLink} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-[0_12px_35px_rgba(37,99,235,.07)]">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-700">
              <BookOpen className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-lg font-extrabold">{t.blogTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {t.blogText}
            </p>
            <Link
              href="/blog"
              className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-blue-700 transition hover:gap-3 hover:text-blue-900"
            >
              {t.blogLink} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="rounded-3xl bg-[#102a43] p-6 text-white shadow-[0_16px_40px_rgba(15,42,67,.18)]">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-blue-200">
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-lg font-extrabold">{t.questionTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {t.questionText}
            </p>
            <Link
              href="/contact"
              className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#93c5fd] px-5 py-2.5 text-sm font-bold text-[#0f172a] transition hover:bg-[#bfdbfe] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <Mail className="h-4 w-4" aria-hidden="true" /> {t.contactTeam}
            </Link>
          </div>
        </aside>
      </section>

      <section className="border-t border-blue-100 bg-white/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <p className="inline-flex items-center gap-2">
            <Check className="h-4 w-4 text-blue-700" aria-hidden="true" />
            {t.noAccount}
          </p>
          <Link href="/contact" className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-900">
            {t.personalHelp} <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
