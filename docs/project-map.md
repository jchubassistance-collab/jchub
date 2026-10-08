# Carte du projet JcHub

## Démarrage

- `app/layout.tsx` : métadonnées, favicon et layout racine.
- `app/page.tsx` : page d'accueil.
- `app/loading.tsx` : écran de chargement global.
- `app/globals.css` : styles globaux et animations.
- `components/layout/AppChrome.tsx` : choix entre site public et espace privé.

## Pages publiques

- `app/outils/` : catalogue et détail des outils.
- `app/livres/` : catalogue et détail des livres audio.
- `app/blog/` : liste et détail des articles.
- `app/pricing/` : offres d'abonnement.
- `app/checkout/` : paiement d'un abonnement ou d'un livre.
- `app/compte/` : connexion, inscription et tableau de bord.

## Composants

- `components/layout/` : header et footer du site.
- `components/tools/` : outils interactifs.
- `components/dashboard/` : interface après connexion.
- `components/admin/` : interface d'administration.

## Logique métier

- `lib/books.ts` : catalogue et normalisation des livres.
- `lib/tools.ts` : catalogue et normalisation des outils.
- `lib/blog.ts` : lecture des articles Firestore avec fallback Markdown.
- `lib/pricing.ts` : source unique des tarifs.
- `lib/mtn.ts` : intégration MTN MoMo.
- `lib/subscription.ts` : droits et expiration des abonnements.
- `lib/firebase.ts` : Firebase côté navigateur.
- `lib/firebase-admin.ts` : Firebase côté serveur.
- `lib/brevo.ts` : envoi des campagnes Brevo.

## API

- `app/api/checkout/` : création d'un paiement.
- `app/api/webhooks/mtn/` : confirmation des paiements.
- `app/api/newsletter/` : inscription à la newsletter.
- `app/api/contact/` : réception des messages contact.
- `app/api/cron/` : tâches planifiées Vercel.
- `app/api/admin/` : opérations réservées à l'administrateur.

## Agent d'administration

- `workflows/editorial-agent.ts` : veille et proposition éditoriale hebdomadaire.
- `lib/content-agent.ts` : génération et validation des brouillons; aucune publication automatique.
- La génération utilise Gemini par défaut (`AI_PROVIDER=gemini`, `GEMINI_API_KEY`, `GEMINI_MODEL`) et OpenAI en secours (`OPENAI_API_KEY`, `OPENAI_MODEL`, modèle par défaut `gpt-4o-mini`). `AI_FALLBACK_PROVIDER` permet de choisir le fournisseur de secours.
- Les clés API doivent rester dans les variables d'environnement locales ou les variables d'environnement Vercel, jamais dans le code source.
- `app/admin/agent/` : révision, approbation, programmation et audit des contenus.
- Les articles approuvés peuvent être espacés d'au moins une semaine et restent soumis à l'approbation avant publication.
- Les notifications de brouillons sont envoyées uniquement à l'adresse d'administration via l'e-mail transactionnel Brevo, jamais à la liste newsletter.
- Les idées d'outils sont enregistrées comme brouillons à compléter; elles ne constituent pas du code fonctionnel et ne sont pas publiées automatiquement.
- Les réponses suggérées aux messages de partenariat restent modifiables et ne partent qu'après envoi manuel depuis la boîte de réception.

## Données et scripts

- `content/blog/` : articles Markdown source.
- `data/audiobooks.json` : données de livres audio importées.
- `scripts/import-articles.ts` : import des articles vers Firestore.
- `scripts/import-audiobooks.mjs` : import des livres audio.
- `scripts/import-tools.mjs` : import des outils.
- `scripts/create-admin.mjs` : création d'un administrateur.

## Règle de maintenance

Le code doit rester dans `app/`, `components/`, `lib/`, `content/`, `data/` et
`scripts/`. Les dossiers `.next*`, `out/`, les fichiers `*.tsbuildinfo` et les
variables d'environnement sont générés ou locaux et ne doivent pas être
versionnés.