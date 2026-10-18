# Publication sociale JcHub

## Architecture

Les posts Facebook et Instagram se préparent et se publient depuis `Espace CM > Kits de publication` (`/admin/cm#kits`); l'ancienne page `/admin/social` y redirige. Un kit (`cmKits`) contient le titre et le sous-titre du visuel, la légende et les hashtags Instagram, le texte et les hashtags Facebook, le schéma du visuel et l'état de publication par réseau. Le bouton « Publier sur Facebook et Instagram » enregistre le kit puis crée une entrée par réseau dans l'outbox Firestore (`social_publications`, lien `kitId`). Les gardes atomiques (`social_publication_guards`, clé contenu source + réseau + destination) empêchent de publier deux fois le même article ou outil au même endroit, même depuis deux kits. Une transaction réserve chaque publication avant l'appel réseau, et l'état de chaque réseau (en cours, publié, échec, à vérifier) est recopié dans le kit.

Quand un article est publié (validation d'un brouillon de l'agent ou cron `publish-scheduled`), le workflow `runSocialPreparation` crée son kit, ou reprend celui que le CM a déjà préparé. Si la publication automatique est active et le mode test désactivé, le kit part sur les réseaux actifs; sinon il attend le CM. LinkedIn et GitHub ne sont plus alimentés par ce flux : leurs adaptateurs restent disponibles dans `lib/social-platforms.ts`.

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
| `AI_PROVIDER` / `GEMINI_API_KEY` | Fournisseur IA principal des variantes sociales (Gemini par défaut, avec la chaîne de secours `AI_FALLBACK_PROVIDER`). |
| `OPENROUTER_API_KEY` | Secours OpenRouter si le fournisseur principal échoue deux fois. |
| `OPENROUTER_MODEL` | Modèle OpenRouter facultatif (défaut `openrouter/free`). |
| `LINKEDIN_ENABLED` | Active le canal LinkedIn (défaut `false`). |
| `LINKEDIN_ACCESS_TOKEN` | OAuth access token côté serveur. |
| `LINKEDIN_AUTHOR_URN` | Facultatif si le token OAuth comprend `openid profile`; sinon, URN de membre au format `urn:li:person:…`. |
| `LINKEDIN_REDIRECT_URI` | Callback OAuth exact; en local `http://127.0.0.1:3000/api/auth/linkedin/callback`. |
| `LINKEDIN_API_VERSION` | Version mensuelle LinkedIn `YYYYMM` (défaut `202609`; vérifier la version encore prise en charge au déploiement). |
| `FACEBOOK_ENABLED` | Active le canal Page Facebook (défaut `false`). |
| `FACEBOOK_PAGE_ID` | ID numérique de la Page. |
| `FACEBOOK_ACCESS_TOKEN` | Page Access Token côté serveur. |
| `FACEBOOK_APP_ID` | ID de l’application Meta utilisé pour OAuth en développement local. |
| `FACEBOOK_APP_SECRET` | Secret de l’application Meta, conservé côté serveur. |
| `FACEBOOK_REDIRECT_URI` | Callback OAuth exact; en local `http://127.0.0.1:3000/api/auth/facebook/callback`. |
| `FACEBOOK_GRAPH_API_VERSION` | Version Graph API (défaut `v26.0`; vérifier la version disponible au déploiement). |
| `INSTAGRAM_ENABLED` | Active le canal Instagram (défaut `false`). |
| `INSTAGRAM_USER_ID` | ID numérique du compte Instagram professionnel relié à la Page. Utilise le même `FACEBOOK_ACCESS_TOKEN`. |
| `GITHUB_ENABLED` | Active la publication Markdown (défaut `false`). |
| `GITHUB_TOKEN` | Token à permissions minimales, `Contents: write` uniquement sur le dépôt cible. |
| `GITHUB_OWNER` | Propriétaire du dépôt; défaut `jchubassistance-collab`. |
| `GITHUB_REPOSITORY` | Dépôt; défaut `jchub`. |
| `GITHUB_BRANCH` | Branche cible (défaut `main`). |
| `GITHUB_PUBLISH_PATH` | Fichier Markdown autorisé (défaut `docs/social-publications.md`). |
| `GITHUB_API_VERSION` | Version REST GitHub (défaut `2026-03-10`). |
| `CRON_SECRET` | Secret serveur partagé qui protège les routes cron; configurez-le dans l’environnement de déploiement. |

Les interrupteurs de plateformes et les modes auto/dry-run se pilotent dans le panneau « Réglages de publication » en haut des kits, visible des administrateurs seulement. Conservez les tokens uniquement dans les variables serveur du déploiement; ne les préfixez jamais avec `NEXT_PUBLIC_`.

## Connexion des plateformes

### LinkedIn

Créer une application LinkedIn, obtenir l’accès produit requis pour l’API Community Management, puis autoriser la permission `w_member_social` pour une publication au nom du membre. Renseigner le token et l’URN du membre. Le code utilise l’API officielle Posts (`/rest/posts`) et, si une image autorisée est disponible, l’API officielle Images (`/rest/images`). Les autorisations d’accès peuvent dépendre d’une revue LinkedIn; sans elles, la publication réelle échouera.

Références : [Posts API LinkedIn](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api?tabs=curl&view=li-lms-2026-06), [Images API LinkedIn](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/images-api?view=li-lms-2026-03).

### Connexion OAuth LinkedIn en local

Le bouton « Connecter le compte LinkedIn » ouvre `/api/auth/linkedin/login`. Les deux routes OAuth exigent une session administrateur, utilisent un `state` aléatoire protégé par cookie HttpOnly et ne renvoient jamais le jeton au navigateur. Le callback demande les scopes `openid`, `profile` et `w_member_social`, échange le code côté serveur, puis écrit le jeton et l’URN dans `.env.local` uniquement en développement. Vérifie que `.env.local` est ignoré par Git.

Dans le portail LinkedIn Developer, ajoute exactement `http://127.0.0.1:3000/api/auth/linkedin/callback` comme Authorized redirect URL. L’application doit avoir l’accès aux produits Sign In with LinkedIn using OpenID Connect et Share on LinkedIn; les permissions disponibles dépendent de l’approbation de l’application. Si le callback échoue, vérifie d’abord l’URL exacte, les identifiants client réels et l’accès à ces produits.

En production, le callback OAuth refuse volontairement l’échange car le processus web ne peut pas modifier ses variables de déploiement de manière persistante. Configure `LINKEDIN_ACCESS_TOKEN` dans **Vercel → Project Settings → Environment Variables**, marque le token sensible et redéploie. Si ce token ne donne pas accès à `/v2/userinfo`, configure aussi `LINKEDIN_AUTHOR_URN`. Ne crée pas de variable Vercel API token dans l’application.

Référence : [Authorization Code Flow LinkedIn](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow).

### Facebook

Créer une application Meta et obtenir un Page Access Token avec les permissions et l’accès de revue nécessaires à la Page, notamment `pages_manage_posts`. Renseigner l’ID de la Page. Le code n’utilise que l’API officielle pour publier sur une Page, jamais un profil personnel. En l’absence d’accès approuvé, garder le canal désactivé.

Référence : [API Pages Meta](https://developers.facebook.com/docs/pages-api/posts/).

### Statistiques Facebook et GitHub

L’écran social lit les statistiques de la Page (`page_impressions`, `page_post_engagements` et `page_views_total`) sur les 28 derniers jours, ainsi que le nombre actuel d’abonnés, avec Graph API v26. Si Meta refuse une métrique mais en accepte d’autres, les requêtes individuelles permettent d’afficher les données disponibles et un avertissement pour le reste. Le Page Access Token doit inclure `pages_read_engagement` et `read_insights`; après ajout de ces permissions à la connexion OAuth, renouvelle le token et configure `FACEBOOK_ACCESS_TOKEN` dans l’environnement de déploiement. Le token est envoyé à Meta dans l’en-tête serveur et n’est jamais transmis au navigateur.

Meta limite certains insights aux Pages ayant au moins 100 mentions J’aime, et la plupart des métriques ne sont mises à jour qu’une fois par jour. Les métriques non disponibles sont signalées dans l’admin. Les statistiques LinkedIn ne sont pas fournies par ces intégrations.

Références : [Page Insights Meta](https://developers.facebook.com/docs/graph-api/reference/page/insights/), [permission read_insights](https://developers.facebook.com/docs/permissions/).

Pour GitHub, l’admin affiche les étoiles, forks, watchers et issues/PR ouverts du dépôt configuré. L’API du dépôt utilise `GITHUB_TOKEN` côté serveur; elle ne publie rien et n’expose jamais le token.

### Connexion OAuth Facebook en local

Le bouton « Connecter une Page Facebook » ouvre `/api/auth/facebook/login`. Les routes exigent une session administrateur et utilisent un `state` aléatoire dans un cookie HttpOnly. Le flux demande `pages_show_list`, `pages_manage_posts`, `pages_read_engagement` et `read_insights`, échange le code côté serveur, puis récupère les Pages autorisées et leurs Page Access Tokens via `/me/accounts`. Le jeton sélectionné est enregistré uniquement dans `.env.local` en développement et n’est jamais renvoyé au navigateur.

Dans Meta for Developers, configure le Facebook Login et enregistre exactement la même URI HTTPS que `FACEBOOK_REDIRECT_URI` parmi les redirect URIs autorisées. Meta peut refuser un callback HTTP local; dans ce cas, utilise un tunnel HTTPS stable et ouvre aussi l’admin JcHub sur ce même hostname pendant tout le flux OAuth. Redémarre Next.js après changement de hostname; `allowedDevOrigins` autorise le hostname HTTPS configuré pour les ressources de développement. Si le compte ne donne accès qu’à une Page, elle est sélectionnée automatiquement. S’il en retourne plusieurs, définis `FACEBOOK_PAGE_ID` dans `.env.local` avant de relancer la connexion; aucune Page n’est choisie arbitrairement. L’application Meta doit obtenir les permissions avancées et l’approbation requises pour l’usage réel.

Le code accepte aussi les anciens noms `META_APP_ID`, `META_APP_SECRET`, `META_REDIRECT_URI` et `META_GRAPH_API_VERSION` comme alias des variables `FACEBOOK_*`. Le nom d’hôte doit rester le même pendant tout le flux OAuth : `localhost` et `127.0.0.1` sont des origines distinctes, et l’URI doit correspondre exactement à celle autorisée dans Meta.

En production, le flux OAuth local est désactivé. Configure `FACEBOOK_ACCESS_TOKEN` et `FACEBOOK_PAGE_ID` dans **Vercel → Project Settings → Environment Variables**, marque le token sensible et redéploie. Il s’agit d’un Page Access Token, jamais d’un token de profil personnel.

### Instagram

Instagram publie via l'API Instagram avec Facebook Login, sur un compte **professionnel** (Business ou Creator) relié à la Page Facebook. Il réutilise le Page Access Token `FACEBOOK_ACCESS_TOKEN`, qui doit inclure `instagram_basic` et `instagram_content_publish` en plus des permissions de la Page. Le bouton « Connecter Facebook et Instagram » demande ces permissions et enregistre `INSTAGRAM_USER_ID` dans `.env.local` lorsque la Page a un compte Instagram lié (`/{page-id}?fields=instagram_business_account`). En production, renseigne `INSTAGRAM_USER_ID` dans Vercel.

Instagram n'accepte pas de publication texte seule. Chaque post utilise le visuel portrait JPEG 1080×1350 (4:5) du kit, servi par `/api/kit-image/{id}` (voir « Visuels des posts »). Meta télécharge ce visuel lui-même : `NEXT_PUBLIC_SITE_URL` doit pointer vers le site public en HTTPS et la route doit être déployée. La publication se fait en trois temps : création du conteneur (`/{ig-user-id}/media`), attente du statut `FINISHED`, puis `/{ig-user-id}/media_publish`. Un échec avant `media_publish` reste relançable; un résultat ambigu de `media_publish` passe à `UNKNOWN`.

La légende fait 2200 caractères au maximum, avec 30 hashtags et 20 mentions au plus. Les liens n'y sont pas cliquables : l'IA renvoie vers jchub.dev (« lien en bio ») au lieu d'insérer l'URL. Meta limite chaque compte à 100 publications par API sur 24 heures glissantes.

Références : [Content Publishing Instagram](https://developers.facebook.com/docs/instagram-platform/content-publishing), [IG User Media](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media).

### GitHub

Créer un fine-grained personal access token limité au dépôt visé, avec `Contents: write`. Le dépôt par défaut est `jchubassistance-collab/jchub`; configure `GITHUB_OWNER` et `GITHUB_REPOSITORY` seulement pour viser un autre dépôt. Vérifier aussi `GITHUB_BRANCH` et `GITHUB_PUBLISH_PATH`. Le token a besoin d’un accès de lecture pour vérifier dépôt, branche et fichier. Aucun autre type d’objet GitHub n’est créé.

Référence : [GitHub REST Contents API](https://docs.github.com/en/rest/repos/contents).

## Génération des textes

Les textes du kit sont générés par le fournisseur IA configuré (`generateConfiguredText`, Gemini par défaut), avec deux essais. En cas d'échec, OpenRouter prend le relais avec trois essais et une limite de 5 000 tokens. `openrouter/free` choisit un modèle gratuit au hasard, et beaucoup échouent : raisonnement qui épuise la limite, JSON absent, consigne oubliée. Chaque essai est validé côté serveur (JSON, longueurs, hashtags, tutoiement) et une sortie refusée déclenche l'essai suivant.

Le prompt impose le tutoiement et interdit les étiquettes « Source : » ou « Hashtags : ». Le texte publié sur Facebook reçoit automatiquement le lien du contenu s'il n'y figure pas; Instagram renvoie vers le lien en bio.

## Visuels des posts

Chaque kit est illustré par un visuel JcHub qui explique le contenu : logo, badge thématique, titre et sous-titre du kit, schéma central, puis « Temps de lecture » et `jchub.dev/blog` pour un article, ou « Outil gratuit » et `jchub.dev/outils` pour un outil. L'IA ne dessine pas l'image. Elle choisit et remplit un schéma parmi trois types, et le gabarit `lib/social-card.tsx` le dessine avec les polices embarquées, ce qui garantit un texte net et sans faute :

- `flow` : 2 à 4 blocs reliés (composants, étapes d'un traitement, avant/après), avec des lignes de code ou de texte;
- `code` : un extrait de code ou une commande, 8 lignes au plus;
- `steps` : 3 ou 4 étapes ou conseils.

Le schéma est généré à la création du kit, en parallèle des textes (fournisseur configuré, puis OpenRouter en secours), validé (limites de longueur adaptées à la place disponible), puis enregistré dans le kit. Si la génération échoue, le visuel s'affiche sans schéma. Les kits créés avant cette version n'ont pas de schéma.

`/api/cm/kits/{id}/image` sert l'aperçu et le téléchargement au CM (`?format=instagram`, portrait 1080×1350, ou `?format=facebook`, paysage 1200×630). `/api/kit-image/{id}` sert la même image publiquement pour que Meta la télécharge, uniquement après une demande de publication; son URL porte la version du kit (`v`) pour qu'une modification ne soit pas masquée par le cache. Les polices Inter et JetBrains Mono (licence OFL) sont dans `assets/fonts` et déclarées dans `outputFileTracingIncludes`.

## Approbation, planification et cron

Le CM et les administrateurs créent un kit depuis un article ou un outil, le relisent, le corrigent, puis le publient sur Facebook et Instagram. Les réglages (réseaux actifs, mode test, publication automatique, connexion Meta) sont réservés aux administrateurs, et le serveur applique cette règle. Un envoi au résultat incertain (`UNKNOWN`) n'est relancé qu'après confirmation explicite dans le kit. Dans la configuration actuelle, Vercel appelle `/api/cron/publish-social` chaque jour à 09:00 UTC; ce cron inspecte les publications arrivées à échéance et exige `Authorization: Bearer <CRON_SECRET>`. La date choisie est interprétée dans le fuseau IANA configuré et stockée en UTC. Les heures locales inexistantes lors d’un changement d’heure sont rejetées. Une programmation peut donc être exécutée en retard selon la cadence du cron; celui-ci ne garantit pas l’exécution à la seconde exacte.

Vercel Cron suit UTC : [documentation Vercel Cron](https://vercel.com/docs/cron-jobs). Vérifiez que `CRON_SECRET` est défini dans les environnements Preview/Production concernés. Les fonctions Workflow du projet doivent être activées et prises en charge par le plan de déploiement utilisé.

## Erreurs, reprises et sécurité

- Les erreurs montrées au client sont assainies; les réponses brutes des fournisseurs et les tokens ne sont pas enregistrés.
- Les appels réseau ont un délai maximum. Les écritures sociales ne sont pas réessayées automatiquement après timeout ou résultat ambigu.
- GitHub peut relire les ressources GET avec un backoff limité. Les PUT ne sont jamais réessayés à l’aveugle.
- Une publication `UNKNOWN` exige une vérification manuelle avant toute reprise.
- Les images ne sont récupérées que depuis le domaine du site et `res.cloudinary.com`, en HTTPS, sans redirection et avec limite de 5 Mo. Un format image non pris en charge provoque un repli vers le texte/lien.
- Les API des kits (`/api/cm/kits/*`) et la lecture des réglages (`/api/cm/publishing`) exigent une session CM ou administrateur et refusent les écritures d'une autre origine; la modification des réglages exige `requireAdmin`. Chaque action est journalisée dans `cmActivity`. La route cron utilise un secret comparé en temps constant.
- Les textes sont validés côté serveur et limités en taille; le texte Facebook garde le lien du contenu.
- La file Firestore suppose que Firebase Admin est correctement configuré. Restreignez l’accès Firestore à l’identité serveur et configurez vos règles pour refuser l’accès client aux collections internes.

## Dépannage

- **Génération non disponible** : vérifier `GEMINI_API_KEY` (ou le fournisseur de `AI_PROVIDER`), puis `OPENROUTER_API_KEY` pour le secours; les détails fournisseur ne sont pas renvoyés dans l’interface.
- **Credentials manquants** : contrôler les noms des variables serveur dans le déploiement; l’interface indique uniquement leur présence.
- **LinkedIn/Meta refusent le POST** : vérifier la version d’API, l’expiration du token, les permissions et l’approbation de l’application.
- **Publication UNKNOWN** : vérifier manuellement la destination. Ne confirmer une reprise que si le post ou commit n’existe pas.
- **Planification en retard** : contrôler le cron Vercel, `CRON_SECRET`, les workflows durables, le fuseau choisi et la disponibilité de Firestore.

## Vérification locale

`npm run test:social` utilise des mocks locaux et ne publie rien. Ces tests vérifient génération/validation, déduplication, modes, appels simulés, erreurs/timeout, branche GitHub, résultats partiels, fuseau et protections d’accès. Aucun test ne valide l’accès réel aux plateformes.

Publication réelle non testée — credentials requis et autorisations de plateforme à valider. Aucun déploiement ni appel de publication réel n’a été effectué.
