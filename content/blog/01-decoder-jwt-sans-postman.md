---
title: "Comment décoder un JWT (JSON Web Token) sans Postman — Guide 2026"
description: "Tu galères à débugger un JWT ? Voici comment le décoder en 30 secondes, sans installer Postman, avec un outil gratuit en ligne."
slug: decoder-jwt-sans-postman
keywords: ["décoder jwt", "jwt decoder", "json web token", "déboguer token", "jwt en ligne", "base64 jwt"]
author: Jessy Ngnambongo
date: 2026-08-25
category: Développement
readingTime: 4 min
---

# Comment décoder un JWT (JSON Web Token) sans Postman

Tu galères à débugger un token JWT qui ne marche pas dans ton API ? T'as pas envie d'installer Postman juste pour voir ce qu'il y a dedans ? Bonne nouvelle : tu peux le faire en 30 secondes, dans ton navigateur, sans rien installer. Voici comment.

## C'est quoi un JWT au juste ?

Un **JWT** (JSON Web Token), c'est un jeton d'authentification que ton backend génère quand un utilisateur se connecte. C'est une longue chaîne de caractères qui ressemble à ça :

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

Ce que tu vois pas au premier coup d'œil, c'est que ce token est en fait **trois parties séparées par des points** :

1. **Header** (avant le 1er point) : l'algo utilisé (`HS256`, `RS256`...)
2. **Payload** (entre les 2 points) : les données (user_id, email, expiration...)
3. **Signature** (après le 2e point) : la preuve d'intégrité

Ces trois parties sont juste du **JSON encodé en Base64URL**. C'est pour ça qu'on peut les décoder.

## Pourquoi tu dois le décoder

Les cas où t'as besoin de "regarder à l'intérieur" d'un JWT :

- 🐛 **Debug** : "Pourquoi mon auth marche pas ?"
- 🔍 **Vérifier l'expiration** : "Mon token est expiré à quelle date ?"
- 👀 **Voir les claims** : "Quels champs le backend m'envoie ?"
- 🛡️ **Auditer** : "Y a-t-il des données sensibles que je devrais pas stocker ?"

## Comment décoder un JWT en 30 secondes

### Méthode 1 : Avec un outil en ligne (la plus rapide)

1. Va sur [https://jchub.io/outils/jwt-decoder](https://jchub.io/outils/jwt-decoder)
2. Colle ton token dans le champ
3. L'outil te montre instantanément :
   - Le **header** en JSON formaté
   - Le **payload** avec chaque claim détaillé
   - La **signature** (qu'on peut pas lire, c'est normal)
   - Le statut : valide ou expiré
4. Tu peux copier chaque partie en un clic

**Avantage** : tu vois tout, t'as même un indicateur "expiré" ou "valide" avec la date d'expiration en clair.

### Méthode 2 : Dans la console du navigateur

Si t'as pas le temps d'ouvrir un outil, tu peux le faire direct dans DevTools (F12) :

```javascript
// Colle ça dans la console
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
const parts = token.split('.');
const decode = (str) => JSON.parse(atob(str.replace(/-/g, '+').replace(/_/g, '/')));

console.log('Header:', decode(parts[0]));
console.log('Payload:', decode(parts[1]));
```

Cette méthode marche, mais elle te donne pas :
- L'indicateur d'expiration
- Le formatage joli du JSON
- La validation automatique

### Méthode 3 : En ligne de commande (pour les pros)

Sur macOS ou Linux :

```bash
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." | cut -d'.' -f2 | base64 -d
```

Sur Windows (PowerShell) :

```powershell
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($token.Split('.')[1]))
```

## Exemple concret : débugger une erreur 401

Imagine : tu codes une API en Node.js, t'envoies un JWT dans le header `Authorization`, mais tu reçois une erreur **401 Unauthorized**.

Voici comment diagnostiquer :

1. **Récupère ton token** (depuis localStorage, le network tab, ou le backend)
2. **Colle-le** dans le décodeur JWT
3. **Regarde le payload** — vérifie :
   - `exp` (expiration) : si la date est passée → ton token est mort, faut en demander un nouveau
   - `sub` (subject) : c'est bien l'ID de l'user attendu ?
   - `iss` (issuer) : c'est bien l'URL de ton backend ?
   - `aud` (audience) : c'est bien ton frontend ?
4. **Vérifie l'algorithme** dans le header — si le backend attend `RS256` mais que t'envoies un `HS256`, c'est mort

**Dans 90% des cas, c'est le `exp` qui est expiré.** Le décodeur te le dira en un coup d'œil.

## Ce qu'il faut PAS faire avec un JWT

⚠️ **Ne mets jamais de données sensibles** dans le payload (mot de passe, n° de CB, etc.). Pourquoi ? Parce que n'importe qui peut le décoder — c'est pas chiffré, juste encodé. Le format Base64 c'est comme un fichier `.zip` sans mot de passe.

Pour les données sensibles, utilise plutôt un **token chiffré** (JWE) ou garde-les côté serveur.

## Conclusion

Décoder un JWT, c'est pas sorcier. C'est juste du Base64 + du JSON. Mais avoir un outil qui te montre tout ça bien formaté, avec l'indicateur d'expiration, ça te sauve 10 minutes de debug à chaque fois.

👉 **Essaie gratuitement** : [https://jchub.io/outils/jwt-decoder](https://jchub.io/outils/jwt-decoder)

**Tu copies ton token, tu colles, tu as ta réponse.** C'est tout.

---

**Tu veux d'autres outils dev gratuits ?** JcHub propose 14 outils (JWT, hash, timestamp, API tester, regex, color, QR code, etc.). Tous gratuits, tous en ligne, zéro install. → [Découvrir tous les outils](https://jchub.io/outils)
