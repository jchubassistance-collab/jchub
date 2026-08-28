---
title: "JSON minifié = 5000 caractères sur une ligne ? Voici comment le formater"
description: "Tu reçois du JSON sur une ligne et tu peux rien lire ? Voilà comment le formater, le débugger, et le valider en 10 secondes."
slug: formater-deboguer-json
keywords: ["json formatter", "formater json", "json validator", "json pretty print", "json en ligne", "minified json"]
author: Jessy Ngnambongo
date: 2026-08-25
category: Développement
readingTime: 3 min
---

# JSON minifié = 5000 caractères sur une ligne ? Voici comment le formater

Y'a 3 jours, je débugge une API. J'ouvre la console Chrome et je vois ça :

```json
{"id":12345,"name":"Jean Dupont","email":"jean@example.com","address":{"street":"123 Rue de la Paix","city":"Brazzaville","country":"CG","zip":""},"orders":[{"id":1,"total":99.99,"items":[{"productId":"abc","qty":2,"price":49.99}]},{"id":2,"total":149.50,"items":[{"productId":"def","qty":1,"price":149.50}]}],"preferences":{"theme":"dark","language":"fr","notifications":true,"newsletter":false}}
```

5000 caractères sur une ligne. J'ai mal aux yeux rien qu'à le lire.

10 secondes plus tard, j'ai la version lisible :

```json
{
  "id": 12345,
  "name": "Jean Dupont",
  "email": "jean@example.com",
  "address": {
    "street": "123 Rue de la Paix",
    "city": "Brazzaville",
    "country": "CG",
    "zip": ""
  },
  "orders": [
    {
      "id": 1,
      "total": 99.99,
      "items": [
        { "productId": "abc", "qty": 2, "price": 49.99 }
      ]
    },
    {
      "id": 2,
      "total": 149.50,
      "items": [
        { "productId": "def", "qty": 1, "price": 149.50 }
      ]
    }
  ],
  "preferences": {
    "theme": "dark",
    "language": "fr",
    "notifications": true,
    "newsletter": false
  }
}
```

Voilà comment je m'y prends.

## 4 méthodes pour formater du JSON

### 1. **Chrome DevTools (déjà ouvert)**

Dans l'onglet Network → Preview, Chrome formate automatiquement le JSON. Mais ça marche pas si t'as collé le JSON dans la console.

Dans la console, tape juste :

```javascript
const data = {"id":12345,"name":"Jean Dupont", /* ... */};
console.log(JSON.stringify(JSON.parse(data), null, 2));
```

Le `2` c'est l'indentation (nombre d'espaces).

### 2. **VS Code (mon préféré pour le code)**

Tu colles ton JSON minifié, et :
- **Shift + Alt + F** (Windows/Linux) ou **Shift + Option + F** (Mac) pour formatter
- Ou clic droit → "Format Document"

VS Code détecte automatiquement que c'est du JSON et l'indente proprement.

### 3. **jq (le champion en CLI)**

```bash
# Installation
brew install jq        # Mac
apt install jq         # Linux
choco install jq       # Windows

# Utilisation
echo '{"id":12345,"name":"Jean"}' | jq .
# {
#   "id": 12345,
#   "name": "Jean"
# }

# Filtres avancés
curl -s https://api.github.com/users/jchub | jq '.name, .bio, .public_repos'
# "JcHub"
# "Smart Learning & Career Ecosystem"
# 42
```

`jq` c'est le meilleur outil CLI pour manipuler du JSON. Apprends-le, tu vas gagner des heures.

### 4. **Outil en ligne (pour les non-devs ou en rush)**

J'ai un [JSON Formatter gratuit](https://jchub.io/outils/json-formatter) sur JcHub. Tu colles, tu cliques, t'as la version formatée. Bonus : il te dit si ton JSON est valide (parsing errors).

## Comment débugger du JSON invalide

Tu colles ton JSON dans un parser, et tu obtiens :

```
SyntaxError: Unexpected token } at position 245
```

Voici les 5 erreurs les plus courantes :

### 1. **Virgule en trop**

```json
{
  "name": "Jean",  ← virgule en trop
}
```

### 2. **Guillemets manquants**

```json
{
  name: "Jean"  ← name doit être entre guillemets
}
```

### 3. **Apostrophes au lieu de guillemets**

```json
{
  'name': 'Jean'  ← JSON veut des guillemets doubles, pas simples
}
```

### 4. **Commentaire JSON (impossible)**

```json
{
  // commentaire  ← JSON ne supporte PAS les commentaires
  "name": "Jean"
}
```

Si t'as besoin de commentaires, utilise **JSON5** ou **JSONC** (VS Code les supporte).

### 5. **Caractère d'échappement oublié**

```json
{
  "message": "Il a dit \"Bonjour\""  ← OK, échappement correct
  "message": "Il a dit "Bonjour""    ← ❌ cassé
}
```

## L'astuce que personne te dit : le schéma JSON

Si tu bosses avec une API qui renvoie du JSON complexe, **génère un schéma JSON** (JSON Schema). C'est un fichier qui décrit la structure attendue.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "id": { "type": "number" },
    "name": { "type": "string" },
    "email": { "type": "string", "format": "email" },
    "preferences": {
      "type": "object",
      "properties": {
        "theme": { "type": "string", "enum": ["light", "dark"] }
      }
    }
  },
  "required": ["id", "name", "email"]
}
```

Ensuite, valide ton JSON contre le schéma. Si l'API change et renvoie un truc inattendu, tu le sauras tout de suite.

Outils pour générer un schéma depuis un JSON :
- [jsonschema.net](https://www.jsonschema.net/)
- VS Code avec l'extension "JSON to JSON Schema"

## Le workflow que j'utilise

```
1. API me renvoie du JSON → je le copie
2. Je colle dans mon JSON Formatter
3. Je vérifie que c'est valide
4. Je copie la version formatée
5. Je la colle dans VS Code pour l'analyser
6. Je code mon parser/consumer
```

Si le JSON est récurrent, je génère un JSON Schema et je l'utilise pour valider chaque réponse.

## TL;DR

- **JSON mal formaté** = mal aux yeux garanti
- **VS Code** : Shift+Alt+F pour formatter
- **Chrome console** : `JSON.stringify(JSON.parse(data), null, 2)`
- **jq** en CLI pour les filtres avancés
- **Outil rapide** : [jchub.io/outils/json-formatter](https://jchub.io/outils/json-formatter)
- **5 erreurs courantes** : virgule en trop, guillemets manquants, apostrophes, commentaires, échappement

---

**Tu bosses sur une API et t'as besoin de tester rapidement ?** Mon [API Tester](https://jchub.io/outils/api-tester) formate les réponses JSON automatiquement. Combiné avec le JSON Formatter, t'es tranquille.

Y'a 14 outils dev gratuits sur JcHub → [jchub.io/outils](https://jchub.io/outils)
