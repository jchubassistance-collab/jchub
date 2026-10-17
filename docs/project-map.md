# Carte du projet JcHub

## Démarrage

- `app/layout.tsx` : métadonnées, favicon et layout racine.
- `app/page.tsx` : page d'accueil.
- `app/loading.tsx` : écran de chargement global.
- `app/globals.css` : styles globaux et animations.
- `components/layout/AppChrome.tsx` : choix entre site public et espace privé.

## Pages publiques

- `app/outils/` : catalogue et détail des outils.
- `app/blog/` : liste et détail des articles.
- `app/compte/` : connexion et tableau de bord.

## Composants

- `components/layout/` : header et footer du site.
- `components/tools/` : outils interactifs.
- `components/dashboard/` : interface après connexion.
- `components/admin/` : interface d'administration.

## Logique métier

- `lib/books.ts` : catalogue et normalisation des livres.
- `lib/tools.ts` : catalogue et normalisation des outils.
- `lib/blog.ts` : lecture des articles Firestore avec fallback Markdown.
- `lib/firebase.ts` : Firebase côté navigateur.
- `lib/firebase-admin.ts` : Firebase côté serveur.
- `lib/brevo.ts` : envoi des campagnes Brevo.

## API

- `app/api/newsletter/` : inscription à la newsletter.
- `app/api/contact/` : réception des messages contact.
- `app/api/cron/` : tâches planifiées Vercel.
- `app/api/admin/` : opérations réservées à l'administrateur.

## Agent d'administration

- `workflows/editorial-agent.ts` : veille et proposition éditoriale hebdomadaire.
- `lib/content-agent.ts` : génération et validation des brouillons; aucune publication automatique.
- L'agent utilise Gemini par défaut et peut essayer OpenRouter, OpenAI et DeepSeek en secours. `AI_FALLBACK_PROVIDER` accepte une liste ordonnée séparée par des virgules; les clés sont `OPENROUTER_API_KEY`, `OPENAI_API_KEY` et `DEEPSEEK_API_KEY` (ou `DEEPSEEK_API`). Dans Next.js, `.env.local` remplace les valeurs homonymes de `.env`; ne laissez pas de clés factices dans `.env.local`.
- `app/admin/agent/` : révision, approbation, programmation et audit des contenus.
- Les articles approuvés peuvent être espacés d'au moins une semaine et restent soumis à l'approbation avant publication.
- Les notifications de brouillons sont envoyées uniquement à l'adresse d'administration via l'e-mail transactionnel Brevo, jamais à la liste newsletter.
- Les idées d'outils sont enregistrées comme brouillons à compléter; elles ne constituent pas du code fonctionnel et ne sont pas publiées automatiquement.
- Les réponses suggérées aux messages de partenariat restent modifiables et ne partent qu'après envoi manuel depuis la boîte de réception.

## Création d'outils par IA

Depuis Admin > Outils, le bouton ✨ d'un outil sans composant lance ce parcours :

1. `app/api/admin/tools/[slug]/generation/` demande le composant à Gemini (`lib/tool-generator.ts`),
   avec les règles de `lib/tool-generation-rules.ts` : outil 100 % navigateur, imports limités à
   `react` et `lucide-react`, ni réseau, ni stockage, ni exécution dynamique. Si Gemini échoue
   (quota, panne, réponse illisible), les modèles gratuits d'OpenRouter prennent le relais ; la
   Pull Request indique quel modèle a écrit le code. Un code refusé est redemandé avec les motifs
   du refus, dans un budget de 4 minutes.
2. `lib/github.ts` dépose `components/tools/generated/<Composant>.tsx` et l'inscrit au-dessus des
   marqueurs `@generated-tools` de `lib/tool-components.ts` et `components/tools/ToolRenderer.tsx`,
   sur une branche `outil-ia/<slug>`, puis ouvre une Pull Request.
3. Vercel construit l'aperçu de la Pull Request ; l'outil s'y teste sur `/outils/apercu/<Composant>`
   (page absente en production). La CI GitHub (`.github/workflows/ci.yml`) lance le lint et les tests.
4. « Approuver » fusionne exactement le commit testé ; si le site a changé entre-temps, la branche
   est reconstruite sur la dernière version et un nouvel aperçu est attendu.
5. La date de mise en ligne (`publishAt`) se choisit ensuite. Un outil publié n'apparaît qu'une fois
   cette date passée et son composant présent dans le déploiement en cours.

Variables : `GITHUB_TOKEN` (ou `GITHUB_TOOLS_TOKEN`), `GITHUB_OWNER`, `GITHUB_REPOSITORY`, `GEMINI_API_KEY`, `GEMINI_TOOL_MODEL`,
`OPENROUTER_API_KEY`, `OPENROUTER_TOOL_MODEL`.

## Données et scripts

- `content/blog/` : articles Markdown source.
- `data/audiobooks.json` : données de livres audio importées.
- `scripts/import-articles.ts` : import des articles vers Firestore.
- `scripts/import-audiobooks.mjs` : import des livres audio.
- `scripts/import-tools.mjs` : import des outils.
- `scripts/create-admin.mjs` : attribue le rôle admin à un compte existant (`npm run create-admin -- adresse@email`).

## Règle de maintenance

Le code doit rester dans `app/`, `components/`, `lib/`, `content/`, `data/` et
`scripts/`. Les dossiers `.next*`, `out/`, les fichiers `*.tsbuildinfo` et les
variables d'environnement sont générés ou locaux et ne doivent pas être
versionnés.