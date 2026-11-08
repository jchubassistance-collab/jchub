---
slug: uuid-v4-vs-v7-primary-keys
title: 'UUID v4 vs UUID v7: Which One Should You Use for Your Primary Keys in 2026?'
description: >-
  You know UUID v4 inside out, but UUID v7 changes the game. Here's why modern
  databases are making the switch, complete with real-world examples.
excerpt: >-
  UUID v4 vs UUID v7: Which One Should You Use for Your Primary Keys in 2026?
  For years, I put auto-incrementing IDs in all my tables. Sim...
keywords:
  - uuid v4
  - uuid v7
  - generate uuid
  - primary key uuid
  - uuid database
  - ulid
sourceHash: 9080031908a6b525c4dc5d2b
translatedAt: '2026-11-08T07:49:57.690Z'
---
# UUID v4 vs UUID v7: Which One Should You Use for Your Primary Keys in 2026?

For years, I put **auto-incrementing** `id`s in all my tables. Simple, effective, and everyone understands it.

Then I discovered the downsides:
- **Predictable**: a user can easily guess the next user's ID
- **32-bit limit**: a max of 2 billion records with INT
- **Nightmare for sharding**: how do you generate a unique ID across 3 servers?

I switched to **UUID**s. But not just any UUID. Here's what I wish I had known earlier.

## What Is a UUID?

A **UUID** (Universally Unique Identifier) is a **128-bit** identifier represented as a hexadecimal string:

```
550e8400-e29b-41d4-a716-446655440000
```

The collision probability is so low (1 in 2^122) that you can generate UUIDs practically endlessly without worrying about duplicates.

## The Available Versions

| Version | Based On | Usage |
|---|---|---|
| **v1** | Timestamp + MAC address | ⚠️ Leaks host/machine info |
| **v3** | MD5 hash of a namespace | ❌ Deprecated |
| **v4** | Random | ✅ Standard, most common |
| **v5** | SHA-1 hash of a namespace | ❌ Replaced by v7 |
| **v7** | Timestamp + random | ✅ Best choice in 2026 |

## UUID v4: The Standard for 15 Years

```javascript
// In Node.js using crypto
import { randomUUID } from 'crypto';
const id = randomUUID();
// "550e8400-e29b-41d4-a716-446655440000"

// In Python
import uuid
id = str(uuid.uuid4())
# "550e8400-e29b-41d4-a716-446655440000"

// Online (my tool)
# https://jchub.dev/fr/outils/uuid-generator
```

**Pros**:
- ✅ Simple and supported everywhere
- ✅ No info leaks
- ✅ Zero coordination required (you can generate them offline)

**Cons**:
- ❌ No natural sort order (random = non-sequential / no chronological order)
- ❌ **Index fragmentation**: B-trees struggle with random values
- ❌ Larger than necessary (16 bytes vs. 4/8 for INT)

## UUID v7: The 2026 Revolution

UUID v7 was standardized in **RFC 9562** (May 2024). Here's the layout:

```
[ 48 bits timestamp | 12 bits random | 62 bits random ]
```

**Why it's better**:

1. **Natural sorting**: UUIDs generated close in time are lexicographically close to each other
2. **B-tree index friendly**: new entries get appended to the end of the index
3. **Performance**: PostgreSQL 17+ stores UUIDs in 8 bytes (instead of 16) when they are v7

```javascript
// In Node.js (Node 20+)
import { randomUUID } from 'crypto';
// ⚠️ Defaults to v4. For v7, you need a library.

// lib: uuid v9+
import { v7 as uuidv7 } from 'uuid';
const id = uuidv7();
// "018b6c34-d9d2-7def-8a5b-1234567890ab"

// Python (uuid v3.14+)
import uuid
id = uuid.uuid7()
```

**Performance Comparison** (inserting 1M rows into PostgreSQL):

| Type | Time | Index Size |
|---|---|---|
| **SERIAL (INT)** | 15s | 4 bytes |
| **UUID v4** | 90s (random = fragmentation) | 16 bytes |
| **UUID v7** | 18s (naturally sorted) | 8 bytes (PG 17+) |

UUID v7 is almost as fast as SERIAL, while bringing all the advantages of a globally unique UUID.

## When to Use Which

### **Use SERIAL/INT** if:

- You're keeping your SQL simple
- No sharding
- You don't expose IDs in URLs
- Examples: internal tools, MVPs, personal blogs

### **Use UUID v4** if:

- You need a globally unique ID with zero coordination
- You expose IDs in URLs (prevents ID enumeration attacks)
- Index performance isn't a bottleneck
- Examples: public APIs, distributed systems

### **Use UUID v7** if:

- You're starting a new project in 2026
- You have a large table (millions of rows)
- You want the best of both worlds
- Examples: SaaS applications, high-traffic apps, fintech

## How to Generate UUIDs

### Online Tool (The Fastest Way)

I built a [free UUID Generator](https://jchub.dev/fr/outils/uuid-generator) on JcHub. Click a button, get a UUID v4. Need multiple? You can generate them in bulk.

### Command Line

```bash
# Linux/Mac
uuidgen              # v4 by default
uuidgen | tr 'A-Z' 'a-z'

# Python
python3 -c "import uuid; print(uuid.uuid4())"

# Node.js
node -e "console.log(require('crypto').randomUUID())"
```

### In Your Code

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

-- With pg_uuidv7 extension (v7)
CREATE EXTENSION IF NOT EXISTS pg_uuidv7;
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  email TEXT UNIQUE NOT NULL
);
```

## Pitfalls to Avoid

### 1. **UUIDs in URLs**

```javascript
// ❌ Too long to type manually
app.get('/users/550e8400-e29b-41d4-a716-446655440000', ...);

// ✅ Use human-readable slugs
app.get('/users/jean-dupont', ...);
```

### 2. **Storage**

In SQL, **always** store UUIDs using the `UUID` data type (16 bytes binary), never as `VARCHAR(36)` (36 bytes). The storage difference is huge when dealing with millions of rows.

### 3. **Index Performance**

If you use v4 on a massive table, expect performance issues down the road. Switch to v7 or use an internal auto-incrementing ID alongside a public UUID.

## TL;DR

- **UUID v4** = random, great for public APIs
- **UUID v7** = time-ordered/naturally sorted, the best choice in 2026, almost as fast as an INT
- **Store as binary** (16 bytes), not as a string
- **For new tables**: use v7—it's the future
- **Free tool**: [jchub.dev/fr/outils/uuid-generator](https://jchub.dev/fr/outils/uuid-generator)

---

**Building a new project and wondering which ID type to pick?** V7, without a second thought. My [UUID Generator](https://jchub.dev/fr/outils/uuid-generator) lets you test both formats.

There are 14 free developer tools on JcHub → [jchub.dev/fr/outils](https://jchub.dev/fr/outils)
