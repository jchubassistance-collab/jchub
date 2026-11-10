---
slug: md5-vs-sha256-password-hashing
title: 'MD5 vs SHA-256: Which One Should Hash Your Passwords?'
description: >-
  I tested MD5, SHA-1, SHA-256, and SHA-512 on my own projects. Here is the one
  you should be using (and why).
excerpt: >-
  MD5 vs SHA-256: Which one should you choose to hash passwords? Six months ago,
  I debugged a site that stored passwords in MD5. Plain text. In the...
keywords:
  - md5 vs sha256
  - password hashing
  - hash function
  - sha256
  - bcrypt
  - password security
sourceHash: 2af54026624a9b72998b0db3
translatedAt: '2026-11-06T07:51:32.443Z'
---
# MD5 vs SHA-256: Which Should You Use to Hash Passwords?

Six months ago, I debugged a site that was storing passwords in **MD5**. Plain text. In the database. I almost cried.

The worst part was that the dev who wrote it thought they were doing the right thing. "It's hashed, so it's secure, right?"

**No.** MD5 has been broken since 2004. Here's what I wish I could have told them.

## The Problem with MD5 (and SHA-1)

MD5 and SHA-1 are **fast hash functions**. Meaning, they are designed to be computed quickly. That's great for file integrity, but it's disastrous for passwords.

Why? Because an attacker can test **billions of hashes per second** using a simple GPU.

An MD5 password can be cracked in:
- 8 characters (letters + numbers): **a few seconds**
- 12 characters with symbols: **a few hours**
- 16+ characters: **days/months** (doesn't matter though, they'll just give up)

You don't want your passwords to be crackable in "a few seconds", right?

## SHA-256 is Better, But Still Not Great

SHA-256 is slower than MD5 (about 1,000x), so it's a bit harder to brute-force. But it's **still not enough** for passwords.

A malicious dev with a crypto mining rig can still test billions of SHA-256 hashes per second.

SHA-256 is good for:
- Signing blockchain transactions
- Verifying file integrity
- SSL certificates

SHA-256 is **not** good for:
- Hashing passwords
- Storing user credentials

## What You Should Use: bcrypt, scrypt, or Argon2

These algorithms are **slow on purpose**. That means an attacker will take significantly longer to brute-force them.

### Bcrypt (The Simplest Option)

```javascript
// In Node.js
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash('monMotDePasse', 12);
// $2b$12$KIXxPfnK2H5gN1YqLqXm8e...
```

**Why it's great**:
- The exponent `12` is the "cost factor" (12 = 2^12 = 4,096 iterations)
- You can increase this number if your server gets more powerful
- Automatic salting (no need to manage the salt yourself)

### Argon2 (The 2026 Winner)

```javascript
// In Node.js
const argon2 = require('argon2');
const hash = await argon2.hash('monMotDePasse');
// $argon2id$v=19$m=65536,t=3,p=4$...
```

Argon2 won the Password Hashing Competition in 2015. It's state-of-the-art in 2026. It's even slower than bcrypt and resists GPU/ASIC attacks.

**When to use what**:
- **bcrypt**: If you have a legacy project, it's backward-compatible and well-supported
- **Argon2**: If you're starting from scratch, it's the best choice
- **MD5/SHA-1**: NEVER for passwords
- **SHA-256**: OK for integrity, **not** for auth

## How to Test Your Hashes

If you have a legacy project and want to know if your hashes are strong, paste them into my free tool:

👉 [JcHub Hash Generator](https://jchub.dev/fr/outils/generateur-de-hash)

You can hash a string in MD5, SHA-1, SHA-256, or SHA-512 and compare them. It's useful to:
- Verify that a hash matches a password (unit testing)
- Compare hashing times (MD5 = ~0.001ms vs SHA-256 = ~0.05ms)
- Understand the visual difference (MD5 = 32 chars, SHA-256 = 64 chars)

## The Real-World Case That Made Me Switch

I worked on an e-commerce site back in 2024. The original dev had stored **120,000 passwords in unsalted SHA-256**. When I was asked to do a security audit, I picked 5 random hashes, put them into CrackStation, and **4 were cracked in under a second**.

The site switched to bcrypt immediately. We forced all users to reset their passwords. The CEO wasn't happy.

Since then, I always do this:
1. Argon2 for new projects
2. Bcrypt with a minimum cost factor of 12
3. **Never** MD5/SHA-1 on credentials

## In Summary

| Algo | Usage | Security |
|---|---|---|
| MD5 | ❌ Never for auth | 💀 Broken |
| SHA-1 | ❌ Never for auth | 💀 Vulnerable |
| SHA-256 | ✅ File integrity | ⚠️ Too fast for passwords |
| Bcrypt | ✅ Passwords | ✅ Slow on purpose |
| Argon2 | ✅ Passwords (best) | ✅ Safest in 2026 |

**If you have MD5 in production, fix it this week.** Seriously.

---

**Want to test it out?** Hash anything in MD5, SHA-1, SHA-256, or SHA-512 here: [Free Hash Generator](https://jchub.dev/fr/outils/generateur-de-hash)

And if you have other security questions, I built 14 free dev tools on JcHub → [jchub.dev/fr/outils](https://jchub.dev/fr/outils)
