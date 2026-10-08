# Publication sociale JcHub

## Architecture

Le tableau de bord `Admin > Publication sociale` prépare des publications depuis les articles publiés du blog. `lib/publishing-agent.ts` transforme le contenu en trois textes adaptés via Gemini, puis l’outbox Firestore (`social_publications`) conserve une entrée par plateforme. Les gardes atomiques (`social_publication_guards`) empêchent de republier le même article vers la même destination, même si le texte généré varie. Une transaction réserve chaque publication avant l’appel réseau.

Les workflows durables exécutent la préparation et les appels réseau. Les canaux échouent indépendamment. Les réponses inconnues après un POST passent à `UNKNOWN`; elles ne sont jamais réessayées automatiquement. Un administrateur doit vérifier la destination et confirmer explicitement l’absence de publication avant de réessayer.

GitHub publie uniquement dans un fichier Markdown configuré. Avant chaque écriture, le système vérifie le dépôt, la branche et le fichier, puis évite le PUT quand le contenu est déjà présent. Il ne crée ni issue, ni release, ni workflow.

## Valeurs par défaut et activation

Valeurs sûres initiales : `DRY_RUN=true`, `AUTO_PUBLISH=false`, plateformes désactivées. Les secrets sont lus exclusivement côté serveur depuis l’environnement. L’interface affiche seulement si les credentials requis sont présents. Configurez d’abord les variables, gardez le dry-run activé et vérifiez les textes proposés dans l’administration. Les appels externes nécessitent de désactiver le dry-run et d’activer explicitement la plateforme.

Les paramètres fonctionnels sont enregistrés dans `app_config/social_publishing`. Les tokens ne sont jamais enregistrés dans Firestore. `AUTO_PUBLISH=true` ne publie que les plateformes activées; avec `AUTO_PUBLISH=false`, chaque brouillon attend l’approbation manuelle.

## Variables d’environnement

| Variable | Usage |
| --- | --- |
| `DRY_RUN` | Bloque tous les appels de publication si `true` (défaut). |
| `AUTO_PUBLISH` | Autorise la publication automatique des nouvelles entrées (défaut `false`). |
| `PUBLISH_TIMEZONE` | Fuseau IANA initial (défaut `Africa/Lagos`). |
| `GEMINI_API_KEY` | Clé serveur déjà utilisée par les fonctions IA; requise pour générer les variantes. |
| `GEMINI_MODEL` | Modèle Gemini facultatif (défaut `gemini-2.5-flash`). |
| `LINKEDIN_ENABLED` | Active le canal LinkedIn (défaut `false`). |
| `LINKEDIN_ACCESS_TOKEN` | OAuth access token côté serveur. |
| `LINKEDIN_AUTHOR_URN` | URN de membre, format `urn:li:person:…`; les profils personnels sont visés. |
| `LINKEDIN_REDIRECT_URI` | Callback OAuth exact; en local `http://127.0.0.1:3000/api/auth/linkedin/callback`. |
| `LINKEDIN_API_VERSION` | Version mensuelle LinkedIn `YYYYMM` (défaut `202609`; vérifier la version encore prise en charge au déploiement). |
| `FACEBOOK_ENABLED` | Active le canal Page Facebook (défaut `false`). |
| `FACEBOOK_PAGE_ID` | ID numérique de la Page. |
| `FACEBOOK_ACCESS_TOKEN` | Page Access Token côté serveur. |
| `FACEBOOK_APP_ID` | ID de l’application Meta utilisé pour OAuth en développement local. |
| `FACEBOOK_APP_SECRET` | Secret de l’application Meta, conservé côté serveur. |
| `FACEBOOK_REDIRECT_URI` | Callback OAuth exact; en local `http://127.0.0.1:3000/api/auth/facebook/callback`. |
| `FACEBOOK_GRAPH_API_VERSION` | Version Graph API (défaut `v26.0`; vérifier la version disponible au déploiement). |
| `GITHUB_ENABLED` | Active la publication Markdown (défaut `false`). |
| `GITHUB_TOKEN` | Token à permissions minimales, `Contents: write` uniquement sur le dépôt cible. |
| `GITHUB_OWNER` | Propriétaire du dépôt; défaut `jchubassistance-collab`. |
| `GITHUB_REPOSITORY` | Dépôt; défaut `jchub`. |
| `GITHUB_BRANCH` | Branche cible (défaut `main`). |
| `GITHUB_PUBLISH_PATH` | Fichier Markdown autorisé (défaut `docs/social-publications.md`). |
| `GITHUB_API_VERSION` | Version REST GitHub (défaut `2026-03-10`). |
| `CRON_SECRET` | Secret serveur partagé qui protège les routes cron; configurez-le dans l’environnement de déploiement. |

Les trois interrupteurs de plateformes et les modes auto/dry-run peuvent ensuite être pilotés depuis le tableau de bord administrateur. Conservez les tokens uniquement dans les variables serveur du déploiement; ne les préfixez jamais avec `NEXT_PUBLIC_`.

## Connexion des plateformes

### LinkedIn

Créer une application LinkedIn, obtenir l’accès produit requis pour l’API Community Management, puis autoriser la permission `w_member_social` pour une publication au nom du membre. Renseigner le token et l’URN du membre. Le code utilise l’API officielle Posts (`/rest/posts`) et, si une image autorisée est disponible, l’API officielle Images (`/rest/images`). Les autorisations d’accès peuvent dépendre d’une revue LinkedIn; sans elles, la publication réelle échouera.

Références : [Posts API LinkedIn](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api?tabs=curl&view=li-lms-2026-06), [Images API LinkedIn](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/images-api?view=li-lms-2026-03).

### Connexion OAuth LinkedIn en local

Le bouton « Connecter le compte LinkedIn » ouvre `/api/auth/linkedin/login`. Les deux routes OAuth exigent une session administrateur, utilisent un `state` aléatoire protégé par cookie HttpOnly et ne renvoient jamais le jeton au navigateur. Le callback demande les scopes `openid`, `profile` et `w_member_social`, échange le code côté serveur, puis écrit le jeton et l’URN dans `.env.local` uniquement en développement. Vérifie que `.env.local` est ignoré par Git.

Dans le portail LinkedIn Developer, ajoute exactement `http://127.0.0.1:3000/api/auth/linkedin/callback` comme Authorized redirect URL. L’application doit avoir l’accès aux produits Sign In with LinkedIn using OpenID Connect et Share on LinkedIn; les permissions disponibles dépendent de l’approbation de l’application. Si le callback échoue, vérifie d’abord l’URL exacte, les identifiants client réels et l’accès à ces produits.

En production, le callback OAuth refuse volontairement l’échange car le processus web ne peut pas modifier ses variables de déploiement de manière persistante. Configure `LINKEDIN_ACCESS_TOKEN` et `LINKEDIN_AUTHOR_URN` dans **Vercel → Project Settings → Environment Variables**, marque le token sensible et redéploie. Ne crée pas de variable Vercel API token dans l’application.

Référence : [Authorization Code Flow LinkedIn](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow).

### Facebook

Créer une application Meta et obtenir un Page Access Token avec les permissions et l’accès de revue nécessaires à la Page, notamment `pages_manage_posts`. Renseigner l’ID de la Page. Le code n’utilise que l’API officielle pour publier sur une Page, jamais un profil personnel. En l’absence d’accès approuvé, garder le canal désactivé.

Référence : [API Pages Meta](https://developers.facebook.com/docs/pages-api/posts/).

### Connexion OAuth Facebook en local

Le bouton « Connecter une Page Facebook » ouvre `/api/auth/facebook/login`. Les routes exigent une session administrateur et utilisent un `state` aléatoire dans un cookie HttpOnly. Le flux demande `pages_show_list`, `pages_manage_posts` et `pages_read_engagement`, échange le code côté serveur, puis récupère les Pages autorisées et leurs Page Access Tokens via `/me/accounts`. Le jeton sélectionné est enregistré uniquement dans `.env.local` en développement et n’est jamais renvoyé au navigateur.

Dans Meta for Developers, configure le Facebook Login et enregistre exactement `http://127.0.0.1:3000/api/auth/facebook/callback` parmi les redirect URIs autorisées. Si le compte ne donne accès qu’à une Page, elle est sélectionnée automatiquement. S’il en retourne plusieurs, définis `FACEBOOK_PAGE_ID` dans `.env.local` avant de relancer la connexion; aucune Page n’est choisie arbitrairement. L’application Meta doit obtenir les permissions avancées et l’approbation requises pour l’usage réel.

En production, le flux OAuth local est désactivé. Configure `FACEBOOK_ACCESS_TOKEN` et `FACEBOOK_PAGE_ID` dans **Vercel → Project Settings → Environment Variables**, marque le token sensible et redéploie. Il s’agit d’un Page Access Token, jamais d’un token de profil personnel.

### GitHub

Créer un fine-grained personal access token limité au dépôt visé, avec `Contents: write`. Vérifier `GITHUB_OWNER`, `GITHUB_REPOSITORY`, `GITHUB_BRANCH` et `GITHUB_PUBLISH_PATH`. Le token a besoin d’un accès de lecture pour vérifier dépôt, branche et fichier. Aucun autre type d’objet GitHub n’est créé.

Référence : [GitHub REST Contents API](https://docs.github.com/en/rest/repos/contents).

## Approbation, planification et cron

Les administrateurs authentifiés peuvent préparer un article, examiner chaque texte, approuver, publier maintenant, planifier ou annuler. Le planificateur Vercel vérifie les publications dues toutes les cinq minutes sur `/api/cron/publish-social`; la route exige `Authorization: Bearer <CRON_SECRET>`. La date choisie est interprétée dans le fuseau IANA configuré et stockée en UTC. Les heures locales inexistantes lors d’un changement d’heure sont rejetées. Le cron est un déclencheur périodique, pas une garantie d’exécution à la seconde exacte.

Vercel Cron suit UTC : [documentation Vercel Cron](https://vercel.com/docs/cron-jobs). Vérifiez que `CRON_SECRET` est défini dans les environnements Preview/Production concernés. Les fonctions Workflow du projet doivent être activées et prises en charge par le plan de déploiement utilisé.

## Erreurs, reprises et sécurité

- Les erreurs montrées au client sont assainies; les réponses brutes des fournisseurs et les tokens ne sont pas enregistrés.
- Les appels réseau ont un délai maximum. Les écritures sociales ne sont pas réessayées automatiquement après timeout ou résultat ambigu.
- GitHub peut relire les ressources GET avec un backoff limité. Les PUT ne sont jamais réessayés à l’aveugle.
- Une publication `UNKNOWN` exige une vérification manuelle avant toute reprise.
- Les images ne sont récupérées que depuis le domaine du site et `res.cloudinary.com`, en HTTPS, sans redirection et avec limite de 5 Mo. Un format image non pris en charge provoque un repli vers le texte/lien.
- Les API d’administration passent par `requireAdmin`; la route cron utilise un secret comparé en temps constant.
- Les textes sont validés côté serveur, comprennent le lien de l’article, sont distincts et limités en taille.
- La file Firestore suppose que Firebase Admin est correctement configuré. Restreignez l’accès Firestore à l’identité serveur et configurez vos règles pour refuser l’accès client aux collections internes.

## Dépannage

- **Génération non disponible** : vérifier `GEMINI_API_KEY`, le modèle sélectionné et la disponibilité Gemini; les détails fournisseur ne sont pas renvoyés dans l’interface.
- **Credentials manquants** : contrôler les noms des variables serveur dans le déploiement; l’interface indique uniquement leur présence.
- **LinkedIn/Meta refusent le POST** : vérifier la version d’API, l’expiration du token, les permissions et l’approbation de l’application.
- **Publication UNKNOWN** : vérifier manuellement la destination. Ne confirmer une reprise que si le post ou commit n’existe pas.
- **Planification en retard** : contrôler le cron Vercel, `CRON_SECRET`, les workflows durables, le fuseau choisi et la disponibilité de Firestore.

## Vérification locale

`npm run test:social` utilise des mocks locaux et ne publie rien. Ces tests vérifient génération/validation, déduplication, modes, appels simulés, erreurs/timeout, branche GitHub, résultats partiels, fuseau et protections d’accès. Aucun test ne valide l’accès réel aux plateformes.

Publication réelle non testée — credentials requis et autorisations de plateforme à valider. Aucun déploiement ni appel de publication réel n’a été effectué.
