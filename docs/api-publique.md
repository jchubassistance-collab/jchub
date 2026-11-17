# API publique et widget d'intégration

Permet à n'importe quel site d'afficher les outils et les derniers articles de JcHub.
Lecture seule, sans clé, CORS ouvert (`*`), mis en cache par le CDN (1 h) : une visite sur un
site tiers ne déclenche pas de fonction Vercel.

## Widget (le plus simple)

```html
<div data-jchub="tools" data-lang="fr" data-limit="6"></div>
<script src="https://jchub.dev/embed.js" async></script>
```

| Attribut        | Valeurs                          | Défaut  |
|-----------------|----------------------------------|---------|
| `data-jchub`    | `tools` ou `articles`            | `tools` |
| `data-lang`     | `fr` ou `en`                     | `fr`    |
| `data-limit`    | 1 à 24                           | 6       |
| `data-columns`  | 1 à 4 (passe à 2 puis 1 sur mobile) | 3    |
| `data-category` | nom de catégorie dans la langue choisie (ex. `Document`, `Design`) | toutes |
| `data-theme`    | `light`, `dark`, `auto`          | `light` |

Plusieurs blocs par page sont possibles ; le script n'est chargé qu'une fois. Les cartes sont
dans un Shadow DOM (le CSS du site hôte ne les touche pas) et les liens portent
`utm_source=<domaine du site>&utm_medium=jchub-embed`, visibles dans GA4.
Pour un contenu ajouté après le chargement : `window.JcHubEmbed.refresh()`.

Un site avec une CSP stricte doit autoriser `https://jchub.dev` dans `script-src`,
`connect-src` et `img-src`.

## JSON

- `GET https://jchub.dev/api/public/v1/fr/tools` (ou `/en/tools`)
- `GET https://jchub.dev/api/public/v1/fr/articles` (ou `/en/articles`)

```json
{ "version": 1, "locale": "fr", "source": "https://jchub.dev", "count": 28,
  "tools": [{ "id": "apercu-markdown", "name": "Aperçu Markdown", "description": "…",
              "icon": "📝", "category": "Développement", "tags": ["markdown"],
              "url": "https://jchub.dev/fr/outils/apercu-markdown" }] }
```

Articles : `id, title, excerpt, category, image, readTime, author, publishedAt, url`, du plus
récent au plus ancien. Le texte complet n'est volontairement pas exposé (il reste sur jchub.dev
pour le référencement). Le flux RSS (`/fr/rss.xml`) reste disponible à côté.

## Code

- `lib/public-api.ts` : forme des données et en-têtes (CORS, cache).
- `app/api/public/v1/[locale]/{tools,articles}/route.ts` : routes statiques régénérées toutes les heures.
- `public/embed.js` : widget, JavaScript sans dépendance.
- `next.config.mjs` : `/api/public/` est exclu de la règle `no-store` des API.
