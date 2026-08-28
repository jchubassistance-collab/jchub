---
title: "Comment tester une API REST sans Postman (gratuit, dans le navigateur)"
description: "Postman te saoule avec ses 200 MB d'installation et son compte obligatoire ? Voici 3 alternatives légères, dont une 100% gratuite et sans install."
slug: tester-api-rest-sans-postman
keywords: ["api tester", "postman alternative", "client http gratuit", "rest client", "tester api", "http request", "postman vs insomnia"]
author: Jessy Ngnambongo
date: 2026-08-25
category: Développement
readingTime: 6 min
---

# Comment tester une API REST sans Postman (gratuit, dans le navigateur)

J'utilise Postman depuis 2017. Mais en 2024, j'ai décidé de l'arrêter. Pourquoi ?

- 200 MB d'install
- Un compte obligatoire pour sync
- L'app Electron qui bouffe 1.5 GB de RAM
- Des features premium cachées derrière un paywall

J'ai cherché une alternative. J'en ai trouvé 3 qui valent le coup. Et j'en ai construit une aussi (on en parle plus bas).

## Les 3 alternatives à Postman en 2026

### 1. **Insomnia** (l'open source)

- ✅ Gratuit et open source
- ✅ Plus léger que Postman (~80 MB)
- ❌ Compte optionnel (mais sync galère sans)
- ❌ Pas mal de features payantes maintenant

**Pour qui** : devs qui veulent une app native, pas un outil web.

### 2. **Hoppscotch** (l'open source web)

- ✅ 100% web, rien à installer
- ✅ Open source
- ✅ Self-hostable
- ❌ UI un peu chargée
- ❌ Pas de génération de code native

**Pour qui** : devs qui veulent du web, du gratuit, et de l'open source.

### 3. **Bruno** (le nouveau challenger)

- ✅ Open source
- ✅ Stocke les requêtes en fichiers `.bru` dans ton repo
- ✅ Versionné avec Git (fini la perte de collections)
- ❌ CLI-only au début, l'app desktop est jeune

**Pour qui** : équipes qui veulent versionner leurs requêtes API avec le code.

## Et mon outil : JcHub API Tester

J'ai construit un client HTTP 100% gratuit dans le navigateur. Pas d'install, pas de compte, pas de pub.

**[JcHub API Tester](https://jchub.io/outils/api-tester)**

Pourquoi je l'utilise au quotidien :

- **29 KB** vs 200 MB pour Postman
- **Pas d'install** : ouvre l'onglet, c'est prêt
- **Pas de compte** : tout reste dans le localStorage
- **Génération de code** : cURL, fetch, axios, Python requests
- **Historique** : 20 dernières requêtes
- **Sauvegarde** : mes requêtes favorites restent

**Limite connue** : CORS peut bloquer certaines requêtes depuis le navigateur. Pour bypasser, utilise une extension Chrome "Allow CORS" (à tes risques).

## Comment tester une API en 5 étapes

### Étape 1 : Choisis ta méthode

`GET` pour lire, `POST` pour créer, `PUT` pour update, `DELETE` pour supprimer, `PATCH` pour update partiel.

### Étape 2 : Tape ton URL

```
https://jsonplaceholder.typicode.com/todos/1
```

### Étape 3 : Ajoute des headers (si besoin)

```javascript
Content-Type: application/json
Authorization: Bearer eyJhbGciOi...
```

### Étape 4 : Ajoute un body (pour POST/PUT)

```json
{
  "title": "Apprendre à tester une API",
  "completed": false
}
```

### Étape 5 : Clique sur Send

Tu reçois :
- Le **status code** (200 OK, 404 Not Found, 500 Server Error)
- Le **temps de réponse** (en ms)
- La **taille** de la réponse
- Le **body** formaté (JSON pretty-print)
- Les **headers** de la réponse

## Les 4 codes HTTP que tu dois connaître par cœur

| Code | Signification | Action |
|---|---|---|
| **2xx** | Tout va bien | Continue |
| **3xx** | Redirection | Suis la redirection |
| **4xx** | T'as merdé | Fix ton code client |
| **5xx** | Le serveur a merdé | Fix le backend |

**Détails utiles** :
- `200 OK` : succès
- `201 Created` : ressource créée (POST)
- `204 No Content` : succès mais rien à renvoyer (DELETE)
- `400 Bad Request` : ta requête est mal formée
- `401 Unauthorized` : t'es pas authentifié
- `403 Forbidden` : t'es authentifié mais t'as pas le droit
- `404 Not Found` : la ressource existe pas
- `429 Too Many Requests` : rate limit, attends
- `500 Internal Server Error` : le serveur a crashé
- `503 Service Unavailable` : le serveur est down ou en maintenance

## Comment débugger un 401 Unauthorized

Tu reçois un 401 sur ton endpoint protégé. Voici comment diagnostiquer :

1. **Vérifie ton header** `Authorization` : est-ce que le token est bien là ?
2. **Décode ton JWT** : est-ce qu'il est expiré ? → [JWT Decoder](https://jchub.io/outils/jwt-decoder)
3. **Vérifie l'algo** : `Bearer` ou `Basic` ? Le backend attend quoi ?
4. **Teste avec curl** : `curl -H "Authorization: Bearer xxx" https://api.com/me`
5. **Regarde les logs serveur** : souvent y'a plus d'info côté backend

## Le workflow que j'utilise au quotidien

```
1. Teste en local avec mon API Tester
2. Vérifie le status, le body, les headers
3. Copie le code généré (fetch, axios, cURL)
4. Colle dans mon code de prod
5. Teste en staging
6. Deploy
```

**Astuce** : pour les APIs en CORS restrictif, je génère le code cURL, je le colle dans mon terminal, et j'ai pas le souci CORS.

## La fonctionnalité qui change tout : la génération de code

Tu fais une requête POST avec un body JSON, un header Authorization, et tu cliques sur "Code". L'outil te sort :

```javascript
// fetch
const response = await fetch('https://api.com/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbG...'
  },
  body: JSON.stringify({ name: 'Jean', email: 'jean@example.com' })
});
const data = await response.json();
```

```python
# Python requests
import requests
response = requests.post(
    'https://api.com/users',
    headers={'Authorization': 'Bearer eyJhbG...'},
    json={'name': 'Jean', 'email': 'jean@example.com'}
)
```

```bash
# cURL
curl -X POST 'https://api.com/users' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbG...' \
  -d '{"name": "Jean", "email": "jean@example.com"}'
```

Tu copies, tu colles dans ton projet, c'est prêt. Pas de guessing sur la syntaxe.

## TL;DR

- **3 alternatives à Postman** : Insomnia (natif), Hoppscotch (web), Bruno (CLI + files)
- **Mon outil gratuit** : [jchub.io/outils/api-tester](https://jchub.io/outils/api-tester) (29 KB, dans le navigateur)
- **Codes HTTP** : 2xx = OK, 4xx = t'as merdé, 5xx = serveur a merdé
- **Génération de code** : copy-paste direct dans ton projet
- **Pour CORS** : génère le cURL et teste en terminal

---

**Tu veux essayer ?** Va sur [JcHub API Tester](https://jchub.io/outils/api-tester), colle n'importe quelle URL, et regarde.

Y'a aussi 13 autres outils dev gratuits sur JcHub → [jchub.io/outils](https://jchub.io/outils)
