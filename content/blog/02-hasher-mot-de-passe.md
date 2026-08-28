---
title: "MD5 vs SHA-256 : lequel choisir pour hasher un mot de passe (le vrai avis)"
description: "J'ai testé MD5, SHA-1, SHA-256 et SHA-512 sur mes propres projets. Voici celui que tu devrais utiliser (et pourquoi)."
slug: hasher-mot-de-passe-md5-sha256
keywords: ["md5 vs sha256", "hasher mot de passe", "hash function", "sha256", "bcrypt", "sécurité mot de passe"]
author: Jessy Ngnambongo
date: 2026-08-25
category: Sécurité
readingTime: 5 min
---

# MD5 vs SHA-256 : lequel choisir pour hasher un mot de passe

Y'a 6 mois, j'ai débuggé un site qui stockait les mots de passe en **MD5**. En clair. Dans la base. J'ai failli pleurer.

Le pire, c'est que le dev qui l'avait codé pensait bien faire. "C'est hashé, c'est sécurisé, non ?"

**Non.** MD5 c'est cassé depuis 2004. Voici ce que j'aurais aimé lui dire.

## Le problème avec MD5 (et SHA-1)

MD5 et SHA-1 sont des fonctions de **hachage rapide**. C'est-à-dire qu'elles sont faites pour être rapides à calculer. C'est cool pour de l'intégrité de fichier, mais c'est catastrophique pour des mots de passe.

Pourquoi ? Parce qu'un attaquant peut tester **des milliards de hashs par seconde** avec une simple GPU.

Un mot de passe en MD5, c'est crackable en :
- 8 caractères (lettres + chiffres) : **quelques secondes**
- 12 caractères avec symboles : **quelques heures**
- 16+ caractères : **jours/mois** (mais on s'en fout, le mec va abandonner)

Tu veux pas que ton mot de passe soit crackable en "quelques secondes", si ?

## SHA-256, c'est mieux mais pas top

SHA-256 est plus lent que MD5 (environ 1000x), donc un peu plus dur à brute-forcer. Mais c'est **toujours pas assez** pour des mots de passe.

Un dev mal intentionné avec un rig de minage de crypto peut quand même tester des milliards de SHA-256 par seconde.

SHA-256 c'est bien pour :
- Signer des transactions blockchain
- Vérifier l'intégrité d'un fichier
- Certificats SSL

SHA-256 c'est **pas** bien pour :
- Hasher des mots de passe
- Stocker des credentials user

## Ce que tu devrais utiliser : bcrypt, scrypt ou Argon2

Ces algos sont **lents volontairement**. Ça veut dire qu'un attaquant va mettre beaucoup plus de temps à brute-forcer.

### Bcrypt (le plus simple)

```javascript
// En Node.js
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash('monMotDePasse', 12);
// $2b$12$KIXxPfnK2H5gN1YqLqXm8e...
```

**Pourquoi c'est bien** :
- L'exposant `12` est le "cost factor" (12 = 2^12 = 4096 itérations)
- Tu peux augmenter ce chiffre si ton serveur devient plus puissant
- Sel automatique (pas besoin de gérer le salt toi-même)

### Argon2 (le winner 2026)

```javascript
// En Node.js
const argon2 = require('argon2');
const hash = await argon2.hash('monMotDePasse');
// $argon2id$v=19$m=65536,t=3,p=4$...
```

Argon2 a gagné le Password Hashing Competition en 2015. C'est l'état de l'art en 2026. Il est encore plus lent que bcrypt et résiste aux attaques GPU/ASIC.

**Quand utiliser quoi** :
- **bcrypt** : si t'as un vieux projet, c'est rétrocompatible et bien supporté
- **Argon2** : si tu pars de zéro, c'est le meilleur choix
- **MD5/SHA-1** : JAMAIS pour des mots de passe
- **SHA-256** : OK pour de l'intégrité, **pas** pour de l'auth

## Comment tester tes hashs

Si t'as un vieux projet et tu veux savoir si tes hashs sont costauds, colle-les dans mon outil gratuit :

👉 [JcHub Hash Generator](https://jchub.io/outils/hash-generator)

Tu peux hasher une string en MD5, SHA-1, SHA-256 ou SHA-512 et comparer. C'est utile pour :
- Vérifier qu'un hash correspond à un password (tests unitaires)
- Comparer les temps de hash (MD5 = ~0.001ms vs SHA-256 = ~0.05ms)
- Comprendre la différence visuelle (MD5 = 32 chars, SHA-256 = 64 chars)

## Le cas concret qui m'a fait changer

J'ai travaillé sur un site e-commerce en 2024. Le dev original avait stocké **120 000 mots de passe en SHA-256 sans sel**. Quand on m'a demandé de faire un audit sécurité, j'ai pris 5 hashs au hasard, je les ai mis sur CrackStation, et **4 ont été crackés en moins d'une seconde**.

Le site est passé à bcrypt en urgence. On a forcé tous les users à reset leur mot de passe. Le CEO était pas content.

Depuis, je fais toujours :
1. Argon2 pour les nouveaux projets
2. Bcrypt cost=12 minimum
3. **Jamais** de MD5/SHA-1 sur des credentials

## En résumé

| Algo | Usage | Sécu |
|---|---|---|
| MD5 | ❌ Jamais pour de l'auth | 💀 Cassé |
| SHA-1 | ❌ Jamais pour de l'auth | 💀 Vulnérable |
| SHA-256 | ✅ Intégrité de fichier | ⚠️ Trop rapide pour password |
| Bcrypt | ✅ Mots de passe | ✅ Lent volontairement |
| Argon2 | ✅ Mots de passe (best) | ✅ Le plus sûr en 2026 |

**Si t'as MD5 en prod, change ça cette semaine.** Sérieusement.

---

**Tu veux tester ?** Hash n'importe quoi en MD5, SHA-1, SHA-256 ou SHA-512 ici : [Hash Generator gratuit](https://jchub.io/outils/hash-generator)

Et si t'as d'autres questions sécurité, j'ai 14 outils dev gratuits sur JcHub → [jchub.io/outils](https://jchub.io/outils)
