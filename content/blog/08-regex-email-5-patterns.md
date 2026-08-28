---
title: "Regex email : 5 patterns à connaître (et les pièges à éviter)"
description: "La regex pour valider un email, c'est pas aussi simple que /\\S+@\\S+\\.\\S+/. Voici 5 patterns utiles, testés en prod, avec leurs limites."
slug: regex-email-5-patterns
keywords: ["regex email", "expression régulière", "regex test", "validation email", "regex javascript", "regex phone"]
author: Jessy Ngnambongo
date: 2026-08-25
category: Développement
readingTime: 5 min
---

# Regex email : 5 patterns à connaître (et les pièges à éviter)

Y'a 2 ans, j'ai mis ça comme validation email dans un projet :

```javascript
const isValid = /\S+@\S+\.\S+/.test(email);
```

Un user m'écrit : "Ton site accepte `a@b` mais rejette mon adresse pro." 

Effectivement, `jean@.com` passait. Oups.

La regex pour valider un email, c'est un piège classique. Voici ce que j'aurais aimé savoir avant.

## Le mythe de la regex email parfaite

Spoiler : **elle n'existe pas**.

La regex RFC 5322 officielle pour valider un email fait **6 500 caractères**. Et même elle est pas parfaite (elle accepte `..` et d'autres bizarreries).

Mon conseil : utilise une **regex simple** pour le format de base, puis **envoie un email de confirmation** pour valider que l'adresse existe vraiment.

## Les 5 regex que j'utilise en prod

### 1. **Email basique (95% des cas)**

```javascript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
```

✅ Accepte : `jean@example.com`, `j.dupont@pro.io`
❌ Rejette : `jean@`, `@example.com`, `jean @example.com`, `jean@example`

C'est ce que j'utilise dans 95% des cas. Simple, lisible, couvre les cas courants.

### 2. **Email strict (plus picky)**

```javascript
const emailRegexStrict = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
```

✅ Ajoute : restriction des caractères valides, TLD d'au moins 2 lettres
❌ Rejette : `jean@ex.c` (TLD trop court), caractères spéciaux hors liste

Mieux, mais attention : `jean+tag@gmail.com` passe (le `+` est dans la liste `%+-`), mais des adresses valides type `jean@xn--mnchen-3ya.de` (IDN en punycode) passent pas.

### 3. **Téléphone international**

```javascript
// Format E.164 : +[country code][number]
const phoneRegex = /^\+?[1-9]\d{1,14}$/;

// Formats courants : +242 06 123 45 67
const phoneRegexFR = /^(?:\+?\d{1,3}[\s.-]?)?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}$/;
```

Le format **E.164** (Jcpp), c'est le standard international : `+242069550625` pour le Congo. Max 15 chiffres.

⚠️ Les regex de téléphone sont **toujours** un compromis. Valide côté backend (lib `libphonenumber` de Google par exemple).

### 4. **URL**

```javascript
// Simple
const urlRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/;

// Stricte (capture les groupes)
const urlRegexStrict = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w.-]*)*\/?$/;
```

✅ Accepte : `https://jchub.io`, `http://example.com/path?query=1#hash`
❌ Rejette : `ftp://...`, `not a url`

**Encore mieux** : utilise `new URL()` en JavaScript, c'est natif et plus safe.

```javascript
try {
  new URL("https://jchub.io");
  // C'est valide
} catch {
  // Pas valide
}
```

### 5. **Mot de passe fort**

```javascript
// Minimum 8 chars, 1 majuscule, 1 minuscule, 1 chiffre, 1 symbole
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
```

✅ Accepte : `Password123!`, `MonMot2passe!`
❌ Rejette : `password`, `PASSWORD123`, `12345678`

⚠️ **Attention** : les regex de mot de passe强制 des patterns bizarres que les users oublient. Préfère :
- Min 12 caractères
- Pas de pattern强行
- Vérifier si le password est dans la liste des pires (Have I Been Pwned API)

## Les pièges que j'ai appris en prod

### 1. **Les espaces et caractères invisibles**

```javascript
" jean@example.com ".match(/\S+@\S+\.\S+/) // match
"jean@example.com".match(/\S+@\S+\.\S+/) // match

// Toujours trim avant de tester
const email = input.trim().toLowerCase();
```

### 2. **Casse des emails**

Les adresses email sont **insensibles à la casse** pour la partie locale (gmail le permet). Normalise en lowercase.

```javascript
const normalizedEmail = input.trim().toLowerCase();
```

### 3. **Les emails jetables**

`mailinator.com`, `tempmail.com`, etc. sont des services d'email jetable. Bloque-les si tu veux des users sérieux.

Liste à jour : [github.com/disposable-email-domains](https://github.com/disposable-email-domains/disposable-email-domains)

### 4. **Les emails unicode (IDN)**

`jean@例え.jp` est valide mais pas couvert par la plupart des regex. Convertis en punycode avec `punycode.js` avant validation.

## Comment tester tes regex

Mon outil gratuit : [Regex Tester](https://jchub.io/outils/regex-tester). Tu colles ta regex, ton texte de test, et il te dit en temps réel :
- Si ça match
- Les groupes capturés
- Les positions des matches

Très utile pour débugger une regex qui marche pas.

## TL;DR

- **Pas de regex email parfaite** → simple + confirmation email
- **5 patterns utiles** : email basique, email strict, téléphone, URL, mot de passe
- **Normalise** : trim + lowercase
- **Bloque les emails jetables** si besoin
- **Teste avec** : [jchub.io/outils/regex-tester](https://jchub.io/outils/regex-tester)
- **Préfère `new URL()`** à une regex pour les URLs

---

**Tu codes un formulaire d'inscription et t'as besoin d'aide ?** Mon [Regex Tester](https://jchub.io/outils/regex-tester) te permet de tester tes patterns en temps réel.

Y'a 14 outils dev gratuits sur JcHub → [jchub.io/outils](https://jchub.io/outils)
