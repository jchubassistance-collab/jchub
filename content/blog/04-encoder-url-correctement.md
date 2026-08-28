---
title: "Comment encoder une URL correctement (et ne pas casser ton OAuth)"
description: "Un espace ou un accent dans une URL peut tout casser. Voici la différence entre encodeURI et encodeURIComponent, et quand utiliser lequel."
slug: encoder-url-correctement
keywords: ["encode url", "encodeURIComponent", "percent encoding", "url encoding", "oauth redirect uri", "url space"]
author: Jessy Ngnambongo
date: 2026-08-25
category: Développement
readingTime: 4 min
---

# Comment encoder une URL correctement (et ne pas casser ton OAuth)

Le mois dernier, un client m'appelle en panique : "Jessy, notre login Google marche plus, on a 5000 users bloqués".

Je regarde les logs. 30 secondes plus tard, je trouve le bug.

Le redirect_uri était : `https://app.com/callback?source=Google Ads`

L'espace et la majuscule cassaient tout. Google OAuth reject la requête avec une erreur cryptique : `redirect_uri_mismatch`.

**30 secondes de fix, 3h de downtime.** Tout ça pour un espace mal encodé.

## Le problème : les URLs et les caractères spéciaux

Une URL standard peut contenir que certains caractères : lettres, chiffres, `-`, `_`, `.`, `~`. Tout le reste doit être encodé en **percent-encoding** : un `%` suivi de 2 caractères hexa.

Par exemple :
- Espace → `%20` (ou `+` dans une query string)
- `é` → `%C3%A9`
- `&` → `%26` (sinon c'est pris pour un séparateur de param)
- `#` → `%23` (sinon c'est pris pour une ancre)

## encodeURI vs encodeURIComponent : la différence CRUCIALE

JavaScript a **deux fonctions** pour encoder les URLs, et c'est pas la même chose.

### `encodeURI` : encode l'URL entière

```javascript
encodeURI("https://app.com/callback?name=Jean Dupont&city=Brazzaville")
// "https://app.com/callback?name=Jean%20Dupont&city=Brazzaville"
```

**Ce qu'elle encode** : les espaces, accents, etc.
**Ce qu'elle laisse passer** : `:`, `/`, `?`, `&`, `=`, `#`

### `encodeURIComponent` : encode une valeur de paramètre

```javascript
encodeURIComponent("Jean Dupont & cie")
// "Jean%20Dupont%20%26%20cie"
```

**Ce qu'elle encode** : TOUT, y compris `&`, `=`, `?`, `#`

### Le piège classique

```javascript
// ❌ FAUX : encodeURI laisse passer les &, ça casse la query
const url = `https://api.com/search?q=${encodeURI(userInput)}&type=articles`;

// ✅ BON : encodeURIComponent encode tout, même les &
const url = `https://api.com/search?q=${encodeURIComponent(userInput)}&type=articles`;
```

**Règle d'or** :
- `encodeURI` : pour encoder une **URL complète**
- `encodeURIComponent` : pour encoder une **valeur de paramètre**

## Le cas OAuth qui m'a coûté 3h

Pour Google OAuth, le `redirect_uri` doit être **exactement** le même que celui déclaré dans la console développeur. Pas de différences, pas d'espaces, pas de majuscules.

```javascript
// ❌ FAUX : l'URL est encodée mais l'espace reste
const redirectUri = "https://app.com/callback?source=Google Ads";

// ✅ BON : encoder chaque valeur de param
const params = new URLSearchParams({ source: "Google Ads" });
const redirectUri = `https://app.com/callback?${params}`;
// "https://app.com/callback?source=Google+Ads"

// ✅ ENCORE MIEUX : utiliser URLSearchParams
const url = new URL("https://app.com/callback");
url.searchParams.set("source", "Google Ads");
const finalUrl = url.toString();
```

## Les 3 cas où tu DOIS encoder

### 1. **Valeurs de query params**

```javascript
const search = "Node.js & JavaScript";
const url = new URL("https://google.com/search");
url.searchParams.set("q", search);
// https://google.com/search?q=Node.js+%26+JavaScript
```

### 2. **Paths dynamiques**

```javascript
const userId = "user/123";
const url = new URL(`https://api.com/users/${encodeURIComponent(userId)}`);
// https://api.com/users/user%2F123
```

### 3. **OAuth, callbacks, redirects**

```javascript
const state = "abc123&hack=true";
const redirectUrl = new URL("https://app.com/callback");
redirectUrl.searchParams.set("state", state);
// "state" sera encodé, le & dans state ne cassera pas la query
```

## L'outil rapide pour tester

J'ai un [URL Encoder gratuit](https://jchub.io/outils/url-encoder) sur JcHub. Tu colles une URL ou une string, t'as l'encodage en `encodeURI` et `encodeURIComponent` en un clic. Très utile pour débugger un OAuth qui marche pas.

## Le tableau qui résume tout

| Caractère | encodeURI | encodeURIComponent |
|---|---|---|
| `espace` | `%20` | `%20` |
| `é` | `%C3%A9` | `%C3%A9` |
| `&` | `&` (❌) | `%26` |
| `=` | `=` (❌) | `%3D` |
| `?` | `?` (❌) | `%3F` |
| `#` | `#` (❌) | `%23` |
| `/` | `/` (❌) | `%2F` |
| `:` | `:` (❌) | `%3A` |

→ `encodeURIComponent` est **plus safe** par défaut. Utilise-le sauf si t'as une bonne raison d'utiliser `encodeURI`.

## TL;DR

- `encodeURI` = URL complète
- `encodeURIComponent` = valeur de paramètre (utilise ça 95% du temps)
- Pour être tranquille : `new URL()` + `searchParams.set()`
- Outil gratuit : [jchub.io/outils/url-encoder](https://jchub.io/outils/url-encoder)
- **Si ton OAuth marche pas, commence par vérifier ton encoding** (c'est le bug #1)

---

**Tu codes une API et t'as besoin de tester tes endpoints ?** Découvre mon [API Tester Postman-like](https://jchub.io/outils/api-tester) gratuit et 100% en ligne.

Et si t'as d'autres questions dev, j'ai 14 outils gratuits sur JcHub → [jchub.io/outils](https://jchub.io/outils)
