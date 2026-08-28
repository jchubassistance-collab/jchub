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
- `lib/payment.ts` : intégration CinetPay.
- `lib/subscription.ts` : droits et expiration des abonnements.
- `lib/firebase.ts` : Firebase côté navigateur.
- `lib/firebase-admin.ts` : Firebase côté serveur.
- `lib/brevo.ts` : envoi des campagnes Brevo.

## API

- `app/api/checkout/` : création d'un paiement.
- `app/api/webhooks/cinetpay/` : confirmation des paiements.
- `app/api/newsletter/` : inscription à la newsletter.
- `app/api/contact/` : réception des messages contact.
- `app/api/cron/` : tâches planifiées Vercel.
- `app/api/admin/` : opérations réservées à l'administrateur.

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