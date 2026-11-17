import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Code2, Gauge, Palette, ShieldCheck } from 'lucide-react';
import { EmbedConfigurator, type EmbedCategories } from '@/components/embed/EmbedConfigurator';
import { pageMetadata } from '@/lib/seo';
import { publicArticles, publicTools } from '@/lib/public-api';
import { getPublicBaseUrl } from '@/lib/site-url';
import { bilingual } from '@/i18n/copy';
import { isLocale, routing } from '@/i18n/routing';

const copy = bilingual({
  metaTitle: 'Intégrer les outils et articles JcHub sur ton site',
  metaDescription: 'Affiche gratuitement les outils et les derniers articles de JcHub sur ton site ou ton blog : un widget à copier-coller, ou une API JSON ouverte.',
  eyebrow: 'Widget et API gratuits',
  titleStart: 'Intègre JcHub',
  titleEnd: 'sur ton site.',
  intro: 'Affiche les outils gratuits de JcHub ou nos derniers articles sur ton site ou ton blog. Choisis tes réglages, copie deux lignes de code, c’est tout.',
  perks: [
    { title: 'Deux lignes de code', text: 'Fonctionne sur WordPress, Webflow, Wix, Ghost ou un site fait main.' },
    { title: 'Ton design intact', text: 'Les cartes sont isolées : elles ne touchent pas au style de ta page.' },
    { title: 'Léger et rapide', text: 'Moins de 10 Ko, chargé en différé, contenu mis à jour automatiquement.' },
    { title: 'Sans clé ni compte', text: 'Aucune inscription, aucun cookie posé chez tes visiteurs.' },
  ],
  configTitle: 'Configure ton widget',
  configText: 'L’aperçu est le vrai widget : ce que tu vois est ce que tes visiteurs verront.',
  apiTitle: 'API JSON',
  apiText: 'Pour construire ton propre affichage. Lecture seule, sans clé, accessible depuis n’importe quel site (CORS ouvert), mise à jour toutes les heures.',
  endpoint: 'Adresse',
  returns: 'Contenu',
  toolsReturn: 'Tous les outils publiés : nom, description, icône, catégorie, mots-clés et lien.',
  articlesReturn: 'Les articles, du plus récent au plus ancien : titre, résumé, image, catégorie, date, temps de lecture et lien. Le texte complet reste sur JcHub.',
  example: 'Exemple de réponse',
  notesTitle: 'Bon à savoir',
  notes: [
    'Remplace fr par en dans l’adresse pour obtenir la version anglaise.',
    'Si ton site a une Content Security Policy stricte, autorise https://jchub.dev dans script-src, connect-src et img-src.',
    'Pour un contenu ajouté après le chargement de la page, appelle window.JcHubEmbed.refresh().',
    'Merci de garder le lien vers JcHub sur chaque carte : c’est ce qui permet de garder les outils gratuits.',
  ],
}, {
  metaTitle: 'Embed JcHub tools and articles on your site',
  metaDescription: 'Show JcHub’s free tools and latest articles on your website or blog for free: a copy-paste widget, or an open JSON API.',
  eyebrow: 'Free widget and API',
  titleStart: 'Embed JcHub',
  titleEnd: 'on your site.',
  intro: 'Show JcHub’s free tools or our latest articles on your website or blog. Pick your settings, copy two lines of code, and you’re done.',
  perks: [
    { title: 'Two lines of code', text: 'Works on WordPress, Webflow, Wix, Ghost or a hand-made site.' },
    { title: 'Your design untouched', text: 'The cards are isolated: they never change your page’s styles.' },
    { title: 'Light and fast', text: 'Under 10 KB, loaded asynchronously, content updated automatically.' },
    { title: 'No key, no account', text: 'No sign-up, and no cookie set on your visitors.' },
  ],
  configTitle: 'Configure your widget',
  configText: 'The preview is the real widget: what you see is what your visitors will see.',
  apiTitle: 'JSON API',
  apiText: 'To build your own display. Read-only, no key, callable from any site (open CORS), refreshed every hour.',
  endpoint: 'Endpoint',
  returns: 'Returns',
  toolsReturn: 'Every published tool: name, description, icon, category, keywords and link.',
  articlesReturn: 'Articles, newest first: title, excerpt, image, category, date, reading time and link. The full text stays on JcHub.',
  example: 'Example response',
  notesTitle: 'Good to know',
  notes: [
    'Replace en with fr in the address to get the French version.',
    'If your site has a strict Content Security Policy, allow https://jchub.dev in script-src, connect-src and img-src.',
    'For content added after the page has loaded, call window.JcHubEmbed.refresh().',
    'Please keep the link to JcHub on each card: it is what keeps the tools free.',
  ],
});

const perkIcons = [Code2, Palette, Gauge, ShieldCheck];
const heading = { fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' };

export const revalidate = 3600;
export const generateStaticParams = () => routing.locales.map((locale) => ({ locale }));

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata({ locale, title: copy[locale].metaTitle, description: copy[locale].metaDescription, href: '/integrer' });
}

function distinct(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

export default async function EmbedPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = copy[locale];
  const origin = getPublicBaseUrl();

  const [toolsFr, toolsEn, articlesFr, articlesEn] = await Promise.all([publicTools('fr'), publicTools('en'), publicArticles('fr'), publicArticles('en')]);
  const categories: EmbedCategories = {
    fr: { tools: distinct(toolsFr.map((tool) => tool.category)), articles: distinct(articlesFr.map((article) => article.category)) },
    en: { tools: distinct(toolsEn.map((tool) => tool.category)), articles: distinct(articlesEn.map((article) => article.category)) },
  };
  const sample = (locale === 'en' ? toolsEn : toolsFr)[0];
  const example = JSON.stringify({ version: 1, locale, source: origin, count: (locale === 'en' ? toolsEn : toolsFr).length, tools: sample ? [sample] : [] }, null, 2);
  const endpoints = [
    { url: `${origin}/api/public/v1/${locale}/tools`, text: t.toolsReturn },
    { url: `${origin}/api/public/v1/${locale}/articles`, text: t.articlesReturn },
  ];

  return (
    <div className="overflow-hidden bg-[#eff6ff] text-[#0f172a]" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      <section className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_12%_20%,rgba(147,197,253,.48),transparent_30%),radial-gradient(circle_at_90%_80%,rgba(191,219,254,.55),transparent_32%),#eff6ff]">
        <div className="relative mx-auto max-w-7xl px-5 pb-12 pt-14 sm:px-8 lg:px-10 lg:pb-16 lg:pt-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/85 px-4 py-2 text-sm font-semibold text-blue-900 shadow-sm"><span className="h-2 w-2 rounded-full bg-blue-600" /> {t.eyebrow}</span>
          <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-[-.045em] sm:text-5xl lg:text-6xl" style={heading}>
            {t.titleStart} <span className="text-blue-700">{t.titleEnd}</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">{t.intro}</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {t.perks.map(({ title, text }, index) => {
              const Icon = perkIcons[index];
              return (
                <article key={title} className="rounded-[20px] border border-blue-100 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,.035)]">
                  <span className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-700"><Icon className="h-5 w-5" /></span>
                  <h2 className="text-base font-bold" style={heading}>{title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl space-y-16 px-5 py-12 sm:px-8 sm:py-16 lg:px-10">
        <section className="space-y-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-extrabold sm:text-4xl" style={heading}>{t.configTitle}</h2>
            <p className="mt-3 leading-7 text-slate-600">{t.configText}</p>
          </div>
          <EmbedConfigurator origin={origin} categories={categories} />
        </section>

        <section className="space-y-6" id="api">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-extrabold sm:text-4xl" style={heading}>{t.apiTitle}</h2>
            <p className="mt-3 leading-7 text-slate-600">{t.apiText}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {endpoints.map((endpoint) => (
              <article key={endpoint.url} className="min-w-0 rounded-[20px] border border-blue-100 bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,.035)]">
                <p className="text-xs font-bold uppercase tracking-[.14em] text-blue-700">GET · {t.endpoint}</p>
                <a href={endpoint.url} target="_blank" rel="noopener" className="mt-2 block break-all font-mono text-sm font-semibold text-slate-900 underline decoration-blue-200 underline-offset-4 hover:decoration-blue-600">{endpoint.url}</a>
                <p className="mt-4 text-xs font-bold uppercase tracking-[.14em] text-slate-500">{t.returns}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{endpoint.text}</p>
              </article>
            ))}
          </div>
          <div className="overflow-hidden rounded-[20px] border border-slate-800 bg-[#0f172a]">
            <p className="border-b border-white/10 px-5 py-3 text-sm font-semibold text-slate-300">{t.example} · /api/public/v1/{locale}/tools</p>
            <pre className="max-h-[420px] overflow-auto p-5 text-[13px] leading-6 text-blue-100"><code>{example}</code></pre>
          </div>
          <div className="rounded-[20px] border border-blue-100 bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,.035)]">
            <h3 className="text-lg font-bold" style={heading}>{t.notesTitle}</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
              {t.notes.map((note) => <li key={note}>{note}</li>)}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
