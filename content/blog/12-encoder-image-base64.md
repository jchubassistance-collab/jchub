---
title: "Base64 : c'est pas du chiffrement (et c'est important à comprendre)"
description: "Encoder une image en Base64, c'est pas la rendre secrète. Voici quand utiliser Base64, comment ça marche, et pourquoi c'est parfois utile (parfois pas)."
slug: encoder-image-base64
keywords: ["base64 encoder", "image base64", "base64 decoder", "data uri", "base64 css", "base64 vs chiffrement"]
author: Jessy Ngnambongo
date: 2026-08-25
category: Développement
readingTime: 4 min
---

# Base64 : c'est pas du chiffrement (et c'est important à comprendre)

L'autre jour, un dev junior me demande : "J'ai mis mon mot de passe admin en Base64 dans le code, c'est sécurisé non ?"

**Non.**

Base64 c'est juste un **encodage**, pas un **chiffrement**. C'est l'équivalent d'écrire ton mot de passe en majuscules : n'importe qui peut le re-transformer en clair.

Mais Base64 a des **vrais usages**. Voici quand, pourquoi, et comment.

## C'est quoi Base64 ?

Base64 c'est une façon de représenter des **données binaires** (images, fichiers, bytes) en **string ASCII** (lettres, chiffres, +, /).

### Exemple simple

La string "Hello" en Base64 :

```
SGVsbG8=
```

### Pourquoi ça existe

Historiquement, beaucoup de systèmes ne géraient que du texte (emails, URLs, JSON). Mais parfois t'avais besoin d'envoyer du binaire (une image dans un email, par exemple). Base64 permet de **convertir du binaire en texte**.

**C'est tout.** Pas de sécurité, juste de la conversion.

## Comment encoder en Base64

### Outil en ligne

Mon [Base64 Tool gratuit](https://jchub.io/outils/base64-encoder) sur JcHub. Tu colles ton texte, t'as l'encodage en 1 clic. Pareil dans l'autre sens (décoder).

### En JavaScript

```javascript
// Encoder
const original = "Hello World";
const encoded = btoa(original);
// "SGVsbG8gV29ybGQ="

// Décoder
const decoded = atob(encoded);
// "Hello World"

// Pour les caractères Unicode (accents, émojis)
const text = "Héllo 🌍";
const encodedUnicode = btoa(unescape(encodeURIComponent(text)));
// "SGVsbG8g8J+MjQ=="
const decodedUnicode = decodeURIComponent(escape(atob(encodedUnicode)));
// "Héllo 🌍"
```

⚠️ `btoa` et `atob` ne gèrent que l'ASCII. Pour l'Unicode, faut passer par `encodeURIComponent` + `unescape`.

### En Python

```python
import base64

# Encoder
text = "Hello World"
encoded = base64.b64encode(text.encode()).decode()
# "SGVsbG8gV29ybGQ="

# Décoder
decoded = base64.b64decode(encoded).decode()
# "Hello World"
```

### En ligne de commande

```bash
# Encoder
echo -n "Hello World" | base64
# SGVsbG8gV29ybGQ=

# Décoder
echo "SGVsbG8gV29ybGQ=" | base64 -d
# Hello World

# Encoder un fichier
base64 image.png > image.b64

# Décoder un fichier
base64 -d image.b64 > image-decoded.png
```

## Les vrais usages de Base64

### 1. **Images inline en CSS (data URIs)**

```css
.hero {
  background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');
}
```

**Avantage** : 1 seule requête HTTP au lieu de 2 (HTML + image).
**Inconvénient** : l'image est ~30% plus grosse en Base64.

**Quand utiliser** :
- ✅ Petites icônes (moins de 10 KB)
- ✅ SVG simples
- ❌ Grandes images (taille + 30% + pas de cache)

### 2. **Pièces jointes email (MIME)**

Les emails ne supportent que du texte. Pour envoyer une image, on l'encode en Base64 et on l'inclut dans le body.

```
Content-Type: image/png; name="logo.png"
Content-Transfer-Encoding: base64

iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=
```

### 3. **Auth Basic**

```http
Authorization: Basic amVhbjpkb3VibGV2ZHJvaXQ=
```

Le `amVhbjpkb3VibGV2ZHJvaXQ=` c'est `jean:doubleverdroit` en Base64. C'est juste un encoding pour passer des caractères spéciaux dans le header HTTP.

⚠️ **Encore une fois** : c'est PAS sécurisé. Le header est envoyé en clair. Faut HTTPS pour chiffrer.

### 4. **JWT (JSON Web Tokens)**

```javascript
// Header
{"alg":"HS256","typ":"JWT"}

// Header en Base64
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
```

Les JWT utilisent Base64 pour encoder header + payload (pas la signature). C'est pour ça que n'importe qui peut décoder un JWT et lire son contenu. La **signature** empêche la modification, pas la lecture.

### 5. **Stocker des binaires dans une DB NoSQL**

MongoDB stocke du BSON, pas du Base64. Mais tu peux stocker du Base64 dans une string si t'as pas le choix.

```javascript
const user = {
  name: "Jean",
  avatar: "data:image/png;base64,iVBORw0KGgo..."  // OK mais suboptimal
};
```

**Mieux** : stocke l'URL de l'image (Cloudinary, S3, etc.).

## La taille : 33% plus gros

Base64 encode 3 bytes en 4 caractères. Donc **chaque 3 bytes devient 4 chars** = 33% de plus.

```
Image PNG : 100 KB
Image Base64 : 133 KB
```

Pour une icône de 5 KB, ça fait 6.6 KB. Pour une image de 2 MB, ça fait 2.6 MB. Pas négligeable.

## Pourquoi c'est pas du chiffrement

```
Original :  "Password123"
Base64 :    "UGFzc3dvcmQxMjM="
Reverse:    "Password123"
```

N'importe qui peut décoder. Y'a **aucune clé**, **aucun secret**. C'est juste une transformation déterministe.

C'est comme dire "j'ai sécurisé mon mot de passe en l'écrivant à l'envers". Reversible trivialement.

**Pour vraiment chiffrer**, il faut :
- Un **algorithme** : AES, ChaCha20, RSA
- Une **clé** : connue seulement de toi
- Une **lib** : `bcrypt`, `argon2`, `crypto.subtle`

## TL;DR

- **Base64** = encodage, PAS chiffrement
- **5 vrais usages** : data URIs CSS, MIME email, Basic Auth, JWT, stockage NoSQL
- **+33% de taille** : pas pour les grosses images
- **Si tu veux sécuriser** : AES, bcrypt, argon2
- **Outil gratuit** : [jchub.io/outils/base64-encoder](https://jchub.io/outils/base64-encoder)

---

**Tu débugges un JWT et t'as besoin de décoder son payload ?** Le payload d'un JWT est en Base64, donc utilise mon [JWT Decoder](https://jchub.io/outils/jwt-decoder) (gratuit).

Y'a 14 outils dev gratuits sur JcHub → [jchub.io/outils](https://jchub.io/outils)
