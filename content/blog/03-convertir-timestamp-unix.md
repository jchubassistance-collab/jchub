---
title: "Timestamp Unix : comment convertir 1704067200 en date lisible (et inversement)"
description: "Tu reçois un nombre à 10 chiffres de ton backend et tu sais pas ce que c'est ? C'est un timestamp Unix. Voici comment le décoder en 30 secondes."
slug: convertir-timestamp-unix-date
keywords: ["timestamp unix", "epoch time", "convertir timestamp", "date javascript", "unix timestamp", "epoch converter"]
author: Jessy Ngnambongo
date: 2026-08-25
category: Développement
readingTime: 3 min
---

# Timestamp Unix : comment convertir 1704067200 en date lisible

L'autre jour, je debug une API. Je reçois un payload JSON avec un champ `"created_at": 1704067200`. Je me gratte la tête. C'est quoi ce délire ?

C'est un **timestamp Unix** (aussi appelé "epoch time"). C'est le nombre de secondes écoulées depuis le 1er janvier 1970 à minuit UTC.

Et devine quoi : **1704067200 = 1er janvier 2024 à 00:00:00 UTC**.

C'est le format que la plupart des backends utilisent parce que c'est simple à stocker (un nombre, pas une string de 30 chars) et facile à comparer (juste une soustraction).

## Comment le convertir en 30 secondes

### Méthode 1 : Outil en ligne (la plus rapide)

Va sur [JcHub Timestamp Converter](https://jchub.io/outils/timestamp-converter), colle ton nombre, et t'as la conversion en :

- **Date locale** (selon ton fuseau horaire)
- **Date UTC** (temps universel)
- **ISO 8601** (format standard : `2024-01-01T00:00:00Z`)
- **Date relative** ("il y a 8 mois", "dans 2 jours")

Tu peux aussi convertir dans l'autre sens : tu tapes "1er janvier 2030" et t'as le timestamp.

### Méthode 2 : JavaScript (dans la console)

```javascript
// Timestamp Unix → Date
const timestamp = 1704067200;
const date = new Date(timestamp * 1000); // ⚠️ Multiplie par 1000 (en ms)
console.log(date.toISOString());
// "2024-01-01T00:00:00.000Z"

// Date → Timestamp Unix
const now = Math.floor(Date.now() / 1000);
console.log(now);
// 1724616000 (par exemple)
```

⚠️ **Le piège classique** : `Date()` en JavaScript attend des **millisecondes**, pas des secondes. Donc tu multiplies par 1000.

En Python c'est l'inverse :

```python
import datetime
timestamp = 1704067200
date = datetime.datetime.fromtimestamp(timestamp)
# 2024-01-01 00:00:00
```

### Méthode 3 : Bash (sur le serveur)

```bash
# Linux/Mac
date -d @1704067200
# Mon Jan  1 00:00:00 UTC 2024

# Mac (BSD date)
date -r 1704067200

# Windows PowerShell
[DateTimeOffset]::FromUnixTimeSeconds(1704067200).DateTime
```

## Les 3 pièges classiques avec les timestamps

### 1. **Secondes vs millisecondes**

JavaScript `Date.now()` retourne des **ms**.
PHP `time()` retourne des **secondes**.
Python `time.time()` retourne des **secondes** (mais `datetime.now()` retourne des µs).
Les APIs utilisent souvent des secondes.

Si tu mélanges les deux, t'as un bug qui date de 1970 ou de l'an 5138. C'est rigolo, mais ça plante ton app.

### 2. **Fuseau horaire**

Un timestamp Unix est **toujours en UTC**. Quand tu le convertis en date, il s'affiche dans **ton fuseau local**.

Par exemple, `1704067200` :
- UTC : 1er janvier 2024 à 00:00
- Paris (UTC+1) : 1er janvier 2024 à 01:00
- Brazzaville (UTC+1) : 1er janvier 2024 à 01:00
- New York (UTC-5) : 31 décembre 2023 à 19:00

Donc si tu compares des dates de différents pays, **normalise tout en UTC**.

### 3. **2038, c'est dans 18 ans**

Les timestamps 32 bits (signés) max à **2 147 483 647** (19 janvier 2038 à 03:14:07 UTC). Après ça, ça overflow.

La plupart des systèmes modernes utilisent des 64 bits, donc pas de problème. Mais si tu bosses sur un vieux système embarqué, méfie-toi.

## Pourquoi c'est si utilisé

Les timestamps Unix ont 3 avantages :

1. **Compact** : un nombre au lieu d'une string ISO 8601 (10 chars vs 25+)
2. **Comparable** : `>` `<` `=` marchent direct
3. **Universel** : pas de souci de format (MM/DD/YYYY vs DD/MM/YYYY)

C'est pour ça que les bases de données (PostgreSQL, MySQL, MongoDB) stockent souvent les dates en timestamp.

## Cas d'usage réels

- **Logs serveur** : "cette erreur est arrivée à 1704067200" → facile à stocker
- **Sessions** : "ta session expire dans 3600 secondes"
- **JWT** : `exp` (expiration) et `iat` (issued at) sont des timestamps
- **Cache** : "ce cache est valide jusqu'à X"
- **Git commits** : `git log --format=%ct` retourne un timestamp

## TL;DR

- **1704067200** = 1er janvier 2024 à 00:00 UTC
- Pour convertir : `new Date(timestamp * 1000)` en JS
- Multiplie par 1000 en JS (ms), pas en Python
- Toujours en UTC, conversion locale côté frontend
- Outil rapide : [jchub.io/outils/timestamp-converter](https://jchub.io/outils/timestamp-converter)

---

**Tu bosses sur une API et t'as besoin de tester tes dates ?** J'ai aussi un [API Tester gratuit](https://jchub.io/outils/api-tester) pour faire tes requêtes HTTP sans Postman.

Et si t'as d'autres questions dev, j'ai 14 outils gratuits en ligne sur JcHub → [jchub.io/outils](https://jchub.io/outils)
