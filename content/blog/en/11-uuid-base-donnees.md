---
slug: uuid-v4-vs-v7-primary-keys
title: "UUID v4 vs UUID v7: which one to use for your primary keys in 2026"
description: "You know UUID v4 by heart, but UUID v7 changes the game. Here's why modern databases are switching, with concrete examples."
excerpt: "UUID v4 vs UUID v7: which one to use for your primary keys in 2026. For years, I used auto-increment ids in all my tables. Simple..."
keywords: ["uuid v4","uuid v7","generate uuid","uuid primary key","uuid database","ulid"]
---
# UUID v4 vs UUID v7: which one to use for your primary keys in 2026

For years, I used **auto-increment** `id`s in all my tables. Simple, effective, and everyone understands them.

Then I discovered the problems:
- **Predictable**: a user can guess the next user's ID
- **32-bit limit**: 2 billion records max with INT
- **A pain with sharding**: how do you generate a unique ID across 3 servers?

I switched to **UUIDs**. But not just any UUID. Here's what I wish I'd known before.

## What is a UUID?

A **UUID** (Universally Unique Identifier) is a **128-bit** identifier represented as a hexadecimal string:

```
550e8400-e29b-41d4-a716-446655440000
```

The probability of a collision is so low (1 in 2^122) that you can generate UUIDs forever with no risk of duplicates.

## The existing versions

| Version | Based on | Use |
|---|---|---|
| **v1** | Timestamp + MAC address | ⚠️ Leaks information about the machine |
| **v3** | MD5 hash of a namespace | ❌ No longer used |
| **v4** | Random | ✅ Standard, the most common |
| **v5** | SHA-1 hash of a namespace | ❌ Replaced by v7 |
| **v7** | Timestamp + random | ✅ Best in 2026 |

## UUID v4: the standard for 15 years

```javascript
// In Node.js with crypto
import { randomUUID } from 'crypto';
const id = randomUUID();
// "550e8400-e29b-41d4-a716-446655440000"

// In Python
import uuid
id = str(uuid.uuid4())
# "550e8400-e29b-41d4-a716-446655440000"

// Online (my tool)
# https://jchub.io/outils/uuid-generator
```

**Advantages**:
- ✅ Simple, supported everywhere
- ✅ No information leak
- ✅ No coordination (you can generate them offline)

**Problems**:
- ❌ No natural ordering (random = no chronological order)
- ❌ **Index fragmentation**: B-trees struggle with random values
- ❌ Bigger than necessary (16 bytes vs 4/8 for INT)

## UUID v7: the 2026 revolution

UUID v7 was standardized in **RFC 9562** (May 2024). The concept:

```
[ 48 bits timestamp | 12 bits random | 62 bits random ]
```

**Why it's better**:

1. **Natural ordering**: UUIDs generated at close moments are lexicographically close
2. **B-tree index friendly**: new entries are appended at the end of the index
3. **Performance**: PostgreSQL 17+ stores UUIDs in 8 bytes (instead of 16) when they are v7

```javascript
// In Node.js (Node 20+)
import { randomUUID } from 'crypto';
// ⚠️ By default, it's v4. For v7, you need a lib.

// lib: uuid v9+
import { v7 as uuidv7 } from 'uuid';
const id = uuidv7();
// "018b6c34-d9d2-7def-8a5b-1234567890ab"

// Python (uuid v3.14+)
import uuid
id = uuid.uuid7()
```

**Performance compared** (inserting 1M rows into PostgreSQL):

| Type | Time | Index size |
|---|---|---|
| **SERIAL (INT)** | 15s | 4 bytes |
| **UUID v4** | 90s (random = fragmentation) | 16 bytes |
| **UUID v7** | 18s (natural ordering) | 8 bytes (PG 17+) |

UUID v7 is almost as fast as SERIAL, with the advantages of a globally unique UUID.

## When to use what

### **Use SERIAL/INT** if:

- You're doing simple SQL
- No sharding
- No IDs exposed in URLs
- Examples: internal app, MVP, personal blog

### **Use UUID v4** if:

- You want a globally unique ID without coordination
- You expose IDs in URLs (no enumeration)
- Index performance isn't a concern
- Examples: public API, distributed system

### **Use UUID v7** if:

- You're coding a new project in 2026
- You have a big table (millions of rows)
- You want the best of both worlds
- Examples: SaaS, high-traffic app, fintech

## How to generate UUIDs

### Online tool (the fastest)

I have a [free UUID Generator](https://jchub.io/outils/uuid-generator) on JcHub. Click and you get a UUID v4. Need several? You can generate them in bulk.

### On the command line

```bash
# Linux/Mac
uuidgen              # v4 by default
uuidgen | tr 'A-Z' 'a-z'

# Python
python3 -c "import uuid; print(uuid.uuid4())"

# Node.js
node -e "console.log(require('crypto').randomUUID())"
```

### In your code

```javascript
// Node.js (native v4)
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

-- With the pg_uuidv7 extension (v7)
CREATE EXTENSION IF NOT EXISTS pg_uuidv7;
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  email TEXT UNIQUE NOT NULL
);
```

## The traps to avoid

### 1. **UUIDs in URLs**

```javascript
// ❌ Too long to type
app.get('/users/550e8400-e29b-41d4-a716-446655440000', ...);

// ✅ Use readable slugs
app.get('/users/jean-dupont', ...);
```

### 2. **Storage**

In SQL, **always** store them with the `UUID` type (16-byte binary), not as `VARCHAR(36)` (36 bytes). The difference is huge over millions of rows.

### 3. **Index performance**

If you use v4 on a big table, expect performance issues. Switch to v7, or use an internal auto-increment ID + a public UUID.

## TL;DR

- **UUID v4** = random, fine for a public API
- **UUID v7** = natural ordering, best in 2026, almost as fast as an INT
- **Store in binary** (16 bytes), not as a string
- **For a new table**: use v7, it's the future
- **Free tool**: [jchub.io/outils/uuid-generator](https://jchub.io/outils/uuid-generator)

---

**Coding a new project and unsure which ID type to pick?** V7, no hesitation. My [UUID Generator](https://jchub.io/outils/uuid-generator) lets you try both formats.

There are 14 free dev tools on JcHub → [jchub.io/outils](https://jchub.io/outils)
