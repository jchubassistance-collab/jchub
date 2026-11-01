import { BookOpen, ExternalLink, FolderOpen, Image as ImageIcon, Link2, ListChecks, Send, ShieldCheck, Users } from 'lucide-react';
import { MIN_PUBLISHED_WORDS, WRITER_CATEGORIES } from '@/lib/writer-rules';

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://jchub.dev').replace(/\/$/, '');

const markdown: [string, string][] = [
  ['## Sous-titre', 'Un sous-titre de partie (le titre de l’article est déjà au-dessus : pas de #).'],
  ['### Sous-partie', 'Un sous-titre à l’intérieur d’une partie.'],
  ['**texte**', 'Du texte en gras.'],
  ['*texte*', 'Du texte en italique.'],
  ['- élément', 'Une liste à puces (une ligne par élément).'],
  ['1. étape', 'Une liste numérotée, idéale pour un pas-à-pas.'],
  ['[texte](https://…)', 'Un lien.'],
  ['`commande`', 'Une commande ou un nom de fichier dans le texte.'],
  ['```\\nbloc de code\\n```', 'Un bloc de code sur plusieurs lignes.'],
  ['> citation', 'Un encadré, pour une astuce ou une mise en garde.'],
  ['![description](https://…)', 'Une image, avec sa description pour les lecteurs malvoyants.'],
];

const sections = [
  { id: 'lecteurs', title: 'Pour qui écrivez-vous ?', icon: Users, body: <>
    <p>JcHub s’adresse à des personnes qui veulent mieux utiliser la technologie : étudiants, indépendants, développeurs débutants ou confirmés. Ils arrivent souvent depuis Google avec une question précise et veulent une réponse claire, qu’ils peuvent appliquer tout de suite.</p>
    <p>Les articles <strong>tutoient le lecteur</strong>, sur un ton simple et direct. Un article répond à une seule question : « Comment installer Windows 11 sur un ancien PC ? » plutôt que « Tout sur Windows 11 ».</p>
    <p>Avant de vous lancer, vérifiez sur le <a href={`${siteUrl}/fr/blog`} target="_blank" rel="noreferrer">blog</a> que le sujet n’est pas déjà traité.</p>
  </> },
  { id: 'guide', title: 'Structure d’un article', icon: ListChecks, body: <>
    <ul>
      <li><strong>Titre</strong> : 50 à 70 caractères, avec les mots que le lecteur taperait dans Google. Pas de point final.</li>
      <li><strong>Résumé</strong> : 120 à 160 caractères. Il s’affiche sous le titre, dans Google et sur les réseaux sociaux : dites ce que le lecteur va apprendre.</li>
      <li><strong>Introduction</strong> : 2 ou 3 phrases qui posent le problème et annoncent la solution.</li>
      <li><strong>Parties</strong> : des sous-titres <code>##</code> toutes les 200 à 300 mots, des paragraphes courts (3 ou 4 lignes), des listes pour les étapes.</li>
      <li><strong>Conclusion</strong> : ce qu’il faut retenir, et la prochaine action pour le lecteur.</li>
    </ul>
    <p>Visez 800 à 1 500 mots. Un article doit en compter au moins {MIN_PUBLISHED_WORDS} pour être publié.</p>
    <p>Catégories de départ : {WRITER_CATEGORIES.join(', ')}. Si aucune ne convient, saisissez la vôtre dans le champ Catégorie et ajoutez-la : elle sera proposée à tous les rédacteurs.</p>
  </> },
  { id: 'liens', title: 'Liens et images', icon: Link2, body: <>
    <p><strong>Liens vers JcHub</strong> : quand un outil JcHub aide le lecteur, citez-le. Ouvrez sa page sur le site et gardez l’adresse à partir de <code>/fr/</code>, par exemple <code>[le générateur de QR code](/fr/outils/…)</code> : le lien suivra aussi la version anglaise.</p>
    <p><strong>Sources</strong> : citez les sites officiels (documentation Microsoft, Google, Mozilla…) plutôt que d’autres blogs.</p>
    <p><strong>Couverture</strong> : elle est créée automatiquement à la publication, à partir d’une photo Unsplash et de votre titre. Vous n’avez rien à fournir.</p>
    <p><strong>Images dans le texte</strong> : facultatives. Utilisez uniquement des images libres de droits (<a href="https://unsplash.com" target="_blank" rel="noreferrer">Unsplash</a>) ou vos propres captures d’écran, déjà en ligne à une adresse <code>https://</code>.</p>
  </> },
  { id: 'publication', title: 'Ce qui se passe quand vous publiez', icon: Send, body: <>
    <ul>
      <li>L’article apparaît sur le site <strong>en quelques minutes</strong>, le temps de la mise en ligne, signé de votre nom.</li>
      <li>Une <strong>version anglaise</strong> est créée automatiquement, puis mise à jour à chaque modification du texte.</li>
      <li>L’administrateur est prévenu par e-mail.</li>
      <li>Vous pouvez encore modifier le texte : cliquez sur « Mettre à jour l’article » pour publier vos changements. L’<strong>adresse</strong> de l’article, elle, ne change plus.</li>
      <li>Pour retirer un article publié, contactez l’administrateur.</li>
    </ul>
    <p>Les brouillons s’enregistrent tout seuls pendant que vous écrivez (et avec Ctrl+S). Ils ne sont visibles que de vous et de l’administrateur.</p>
  </> },
  { id: 'regles', title: 'Les règles à respecter', icon: ShieldCheck, body: <>
    <ul>
      <li><strong>Pas de copier-coller</strong> d’autres sites : c’est interdit par le droit d’auteur, et Google pénalise les textes copiés.</li>
      <li>Un texte rédigé avec l’aide d’une IA doit être <strong>relu, vérifié et réécrit</strong> avec vos mots.</li>
      <li><strong>Testez</strong> les manipulations et les commandes que vous décrivez, et précisez les versions (Windows 11 24H2, Chrome 130…).</li>
      <li>Pas de lien sponsorisé ou d’affiliation sans l’accord de l’administrateur.</li>
      <li>Relisez l’onglet <strong>Aperçu</strong> avant chaque publication : c’est exactement ce que verront les lecteurs.</li>
    </ul>
  </> },
];

export default function WriterResourcesPage() {
  return <div className="mx-auto max-w-[1100px] space-y-6">
    <header>
      <h1 className="text-[28px] font-extrabold tracking-tight text-[#0f1c3f]">Ressources</h1>
      <p className="mt-1.5 text-[15px] text-slate-600">Le guide de rédaction de JcHub et les liens utiles pour écrire vos articles.</p>
    </header>

    <nav aria-label="Sommaire" className="flex flex-wrap gap-2">
      {[...sections.map(({ id, title }) => ({ id, title })), { id: 'markdown', title: 'Mise en forme' }, { id: 'ressources', title: 'Liens utiles' }].map(({ id, title }) => <a key={id} href={`#${id}`} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:border-blue-300 hover:text-blue-700">{title}</a>)}
    </nav>

    <div className="grid gap-5">
      {sections.map(({ id, title, icon: Icon, body }) => <section key={id} id={id} className="scroll-mt-24 rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(15,28,63,.05)] sm:p-7">
        <h2 className="flex items-center gap-3 text-lg font-bold text-[#0f1c3f]"><span className="grid h-9 w-9 place-items-center rounded-full bg-blue-50 text-blue-600"><Icon className="h-[18px] w-[18px]" /></span>{title}</h2>
        <div className="mt-4 space-y-3 text-[15px] leading-7 text-slate-600 [&_a]:font-medium [&_a]:text-blue-700 [&_a]:underline [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[13px] [&_code]:text-slate-800 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-slate-800 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">{body}</div>
      </section>)}

      <section id="markdown" className="scroll-mt-24 rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(15,28,63,.05)] sm:p-7">
        <h2 className="flex items-center gap-3 text-lg font-bold text-[#0f1c3f]"><span className="grid h-9 w-9 place-items-center rounded-full bg-blue-50 text-blue-600"><BookOpen className="h-[18px] w-[18px]" /></span>Mise en forme (Markdown)</h2>
        <p className="mt-3 text-[15px] leading-7 text-slate-600">Les boutons au-dessus du texte insèrent ces codes pour vous. Le HTML n’est pas pris en compte.</p>
        <div className="mt-4"><table className="w-full table-fixed text-left text-sm"><thead className="border-b border-slate-200 text-slate-500"><tr><th className="w-[46%] py-2.5 pr-3 font-medium sm:w-[38%]">Vous écrivez</th><th className="py-2.5 font-medium">Vous obtenez</th></tr></thead><tbody>{markdown.map(([code, result]) => <tr key={code} className="border-b border-slate-100 last:border-0"><td className="py-2.5 pr-3 align-top"><code className="inline-block max-w-full whitespace-pre-wrap break-all rounded bg-slate-100 px-1.5 py-0.5 text-[13px] text-slate-800">{code.replace(/\\n/g, '\n')}</code></td><td className="py-2.5 text-slate-600">{result}</td></tr>)}</tbody></table></div>
      </section>

      <section id="ressources" className="scroll-mt-24 rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(15,28,63,.05)] sm:p-7">
        <h2 className="flex items-center gap-3 text-lg font-bold text-[#0f1c3f]"><span className="grid h-9 w-9 place-items-center rounded-full bg-blue-50 text-blue-600"><FolderOpen className="h-[18px] w-[18px]" /></span>Liens utiles</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            { href: `${siteUrl}/fr/blog`, title: 'Le blog JcHub', text: 'Les articles déjà publiés : le ton, la longueur, les sujets traités.', icon: BookOpen },
            { href: `${siteUrl}/fr/outils`, title: 'Les outils JcHub', text: 'Tous les outils gratuits du site, à citer dans vos articles.', icon: Link2 },
            { href: 'https://unsplash.com', title: 'Unsplash', text: 'Des photos libres de droits pour illustrer le texte.', icon: ImageIcon },
            { href: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content?hl=fr', title: 'Bien écrire pour Google', text: 'Les conseils officiels de Google pour des contenus utiles aux lecteurs.', icon: ListChecks },
          ].map(({ href, title, text, icon: Icon }) => <a key={href} href={href} target="_blank" rel="noreferrer" className="group flex gap-3.5 rounded-lg border border-slate-200 p-4 hover:border-blue-200 hover:bg-blue-50/40">
            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-slate-500 group-hover:text-blue-600" />
            <span><strong className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">{title}<ExternalLink className="h-3.5 w-3.5 text-slate-400" /></strong><span className="mt-1 block text-sm text-slate-500">{text}</span></span>
          </a>)}
        </div>
      </section>
    </div>
  </div>;
}
