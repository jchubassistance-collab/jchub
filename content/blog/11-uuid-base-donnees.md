---
title: "UUID v4 vs UUID v7 : lequel utiliser pour tes primary keys en 2026"
description: "Tu connais UUID v4 par cœur, mais UUID v7 change la donne. Voici pourquoi les bases de données modernes switchent, avec des exemples concrets."
slug: uuid-base-donnees-v4-v7
keywords: ["uuid v4", "uuid v7", "générer uuid", "primary key uuid", "uuid database", "ulid"]
author: Jessy Ngnambongo
date: 2026-08-25
category: Base de données
readingTime: 4 min
---

# UUID v4 vs UUID v7 : lequel utiliser pour tes primary keys en 2026

Pendant des années, j'ai mis des `id` en **auto-increment** dans toutes mes tables. Simple, efficace, et tout le monde comprend.

Puis j'ai découvert les problèmes :
- **Prévisibles** : un user peut deviner l'ID du user suivant
- **Limite à 32 bits** : 2 milliards d'enregistrements max sur INT
- **Galère en sharding** : comment générer un ID unique sur 3 serveurs ?

J'ai switché sur **UUID**. Mais pas n'importe lequel. Voici ce que j'aurais aimé savoir avant.

## C'est quoi un UUID ?

Un **UUID** (Universally Unique Identifier), c'est un identifiant de **128 bits** représenté sous forme de string hexadécimale :

```
550e8400-e29b-41d4-a716-446655440000
```

La probabilité de collision est tellement faible (1 sur 2^122) que tu peux générer des UUIDs à l'infini sans risque de doublon.

## Les versions qui existent

| Version | Basé sur | Usage |
|---|---|---|
| **v1** | Timestamp + MAC address | ⚠️ Fuite d'info sur la machine |
| **v3** | Hash MD5 d'un namespace | ❌ Plus utilisé |
| **v4** | Random | ✅ Standard, le plus courant |
| **v5** | Hash SHA-1 d'un namespace | ❌ Remplacé par v7 |
| **v7** | Timestamp + random | ✅ Best en 2026 |

## UUID v4 : le standard depuis 15 ans

```javascript
// En Node.js avec crypto
import { randomUUID } from 'crypto';
const id = randomUUID();
// "550e8400-e29b-41d4-a716-446655440000"

// En Python
import uuid
id = str(uuid.uuid4())
# "550e8400-e29b-41d4-a716-446655440000"

// En ligne (mon outil)
# https://jchub.io/outils/uuid-generator
```

**Avantages** :
- ✅ Simple, supporté partout
- ✅ Pas de fuite d'info
- ✅ Pas de coordination (tu peux en générer offline)

**Problèmes** :
- ❌ Pas de tri naturel (random = pas d'ordre chronologique)
- ❌ **Fragmentation des index** : les B-trees galèrent avec du random
- ❌ Plus gros que nécessaire (16 bytes vs 4/8 pour INT)

## UUID v7 : la révolution 2026

UUID v7 a été standardisé en **RFC 9562** (mai 2024). Le concept :

```
[ 48 bits timestamp | 12 bits random | 62 bits random ]
```

**Pourquoi c'est mieux** :

1. **Tri naturel** : les UUIDs générés à des moments proches sont proches lexicographiquement
2. **Index B-tree friendly** : les nouvelles entrées s'ajoutent à la fin de l'index
3. **Performance** : PostgreSQL 17+ stocke les UUIDs en 8 bytes (au lieu de 16) quand ils sont v7

```javascript
// En Node.js (Node 20+)
import { randomUUID } from 'crypto';
// ⚠️ Par défaut, c'est v4. Pour v7, faut une lib.

// lib: uuid v9+
import { v7 as uuidv7 } from 'uuid';
const id = uuidv7();
// "018b6c34-d9d2-7def-8a5b-1234567890ab"

// Python (uuid v3.14+)
import uuid
id = uuid.uuid7()
```

**Performance comparée** (insertion de 1M de rows dans PostgreSQL) :

| Type | Temps | Taille index |
|---|---|---|
| **SERIAL (INT)** | 15s | 4 bytes |
| **UUID v4** | 90s (random = fragmentation) | 16 bytes |
| **UUID v7** | 18s (tri naturel) | 8 bytes (PG 17+) |

UUID v7 est presque aussi rapide que SERIAL, avec les avantages d'un UUID unique global.

## Quand utiliser quoi

### **Utilise SERIAL/INT** si :

- Tu fais du SQL simple
- Pas de sharding
- Pas d'exposition des IDs en URL
- Exemples : app interne, MVP, blog perso

### **Utilise UUID v4** si :

- Tu veux un ID unique global sans coordination
- T'exposes les IDs en URL (pas d'énumération)
- Pas de problème de perf d'index
- Exemples : API publique, système distribué

### **Utilise UUID v7** si :

- Tu codes un nouveau projet en 2026
- T'as une grosse table (millions de rows)
- Tu veux le meilleur des deux mondes
- Exemples : SaaS, app à fort trafic, fintech

## Comment générer des UUIDs

### Outil en ligne (le plus rapide)

J'ai un [UUID Generator gratuit](https://jchub.io/outils/uuid-generator) sur JcHub. Tu cliques, t'as un UUID v4. Besoin de plusieurs ? Tu peux en générer par lot.

### En ligne de commande

```bash
# Linux/Mac
uuidgen              # v4 par défaut
uuidgen | tr 'A-Z' 'a-z'

# Python
python3 -c "import uuid; print(uuid.uuid4())"

# Node.js
node -e "console.log(require('crypto').randomUUID())"
```

### Dans ton code

```javascript
// Node.js (v4 natif)
import { randomUUID } from 'crypto';
const id = randomUUID();

// UUID v7
import { v7 as uuidv7 } from 'uuid';
const id = uuidv7();
```

```python
# Python
import uuid

# v4
id = str(uuid.uuid4())

# v7 (Python 3.14+)
id = str(uuid.uuid7())
```

```sql
-- PostgreSQL
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  -- v4
  email TEXT UNIQUE NOT NULL
);

-- Avec pg_uuidv7 extension (v7)
CREATE EXTENSION IF NOT EXISTS pg_uuidv7;
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  email TEXT UNIQUE NOT NULL
);
```

## Les pièges à éviter

### 1. **UUID dans les URLs**

```javascript
// ❌ Trop long pour taper
app.get('/users/550e8400-e29b-41d4-a716-446655440000', ...);

// ✅ Utilise des slugs lisibles
app.get('/users/jean-dupont', ...);
```

### 2. **Stockage**

En SQL, **toujours** stocker en type `UUID` (binaire 16 bytes), pas en `VARCHAR(36)` (36 bytes). La différence est énorme sur des millions de rows.

### 3. **Performance d'index**

Si tu utilises v4 sur une grosse table, attends-toi à des problèmes de performance. Switch sur v7 ou utilise un ID interne auto-increment + un UUID public.

## TL;DR

- **UUID v4** = random, OK pour API publique
- **UUID v7** = tri naturel, best en 2026, presque aussi rapide qu'un INT
- **Stocke en binaire** (16 bytes) pas en string
- **Pour nouvelle table** : utilise v7, c'est le futur
- **Outil gratuit** : [jchub.io/outils/uuid-generator](https://jchub.io/outils/uuid-generator)

---

**Tu codes un nouveau projet et t'hésites sur le type d'ID ?** V7, sans hésiter. Mon [UUID Generator](https://jchub.io/outils/uuid-generator) te permet de tester les deux formats.

Y'a 14 outils dev gratuits sur JcHub → [jchub.io/outils](https://jchub.io/outils)
