---
slug: md5-vs-sha256-password-hashing
title: "MD5 vs SHA-256: which one to choose to hash a password (my honest take)"
description: "I tested MD5, SHA-1, SHA-256 and SHA-512 on my own projects. Here's the one you should use (and why)."
excerpt: "MD5 vs SHA256: which one to choose to hash a password. 6 months ago, I debugged a site that stored passwords in MD5. In plain sight. In the..."
keywords: ["md5 vs sha256","hash password","hash function","sha256","bcrypt","password security"]
---
# MD5 vs SHA-256: which one to choose to hash a password

6 months ago, I debugged a site that stored passwords in **MD5**. In plain sight. In the database. I almost cried.

The worst part is that the dev who coded it thought they were doing the right thing. "It's hashed, so it's secure, right?"

**No.** MD5 has been broken since 2004. Here's what I wish I'd told them.

## The problem with MD5 (and SHA-1)

MD5 and SHA-1 are **fast hashing** functions. In other words, they're designed to be quick to compute. That's great for file integrity, but disastrous for passwords.

Why? Because an attacker can test **billions of hashes per second** with a simple GPU.

A password stored in MD5 can be cracked in:
- 8 characters (letters + digits): **a few seconds**
- 12 characters with symbols: **a few hours**
- 16+ characters: **days/months** (but who cares, the attacker will give up)

You don't want your password to be crackable in "a few seconds", do you?

## SHA-256 is better, but not great

SHA-256 is slower than MD5 (about 1,000x), so it's a bit harder to brute-force. But it's **still not enough** for passwords.

A malicious dev with a crypto mining rig can still test billions of SHA-256 hashes per second.

SHA-256 is good for:
- Signing blockchain transactions
- Checking file integrity
- SSL certificates

SHA-256 is **not** good for:
- Hashing passwords
- Storing user credentials

## What you should use: bcrypt, scrypt or Argon2

These algorithms are **slow on purpose**. That means an attacker will take much longer to brute-force them.

### Bcrypt (the simplest)

```javascript
// In Node.js
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash('myPassword', 12);
// $2b$12$KIXxPfnK2H5gN1YqLqXm8e...
```

**Why it's good**:
- The `12` exponent is the "cost factor" (12 = 2^12 = 4096 iterations)
- You can raise this number as your server gets more powerful
- Automatic salt (no need to manage the salt yourself)

### Argon2 (the 2026 winner)

```javascript
// In Node.js
const argon2 = require('argon2');
const hash = await argon2.hash('myPassword');
// $argon2id$v=19$m=65536,t=3,p=4$...
```

Argon2 won the Password Hashing Competition in 2015. It's the state of the art in 2026. It's even slower than bcrypt and resists GPU/ASIC attacks.

**When to use what**:
- **bcrypt**: if you have an old project, it's backward compatible and well supported
- **Argon2**: if you're starting from scratch, it's the best choice
- **MD5/SHA-1**: NEVER for passwords
- **SHA-256**: OK for integrity, **not** for authentication

## How to test your hashes

If you have an old project and want to know whether your hashes are solid, paste them into my free tool:

👉 [JcHub Hash Generator](https://jchub.io/outils/hash-generator)

You can hash a string in MD5, SHA-1, SHA-256 or SHA-512 and compare. It's useful to:
- Check that a hash matches a password (unit tests)
- Compare hashing times (MD5 = ~0.001ms vs SHA-256 = ~0.05ms)
- Understand the visual difference (MD5 = 32 chars, SHA-256 = 64 chars)

## The concrete case that changed my mind

I worked on an e-commerce site in 2024. The original dev had stored **120,000 passwords in SHA-256 without salt**. When I was asked to do a security audit, I took 5 random hashes, put them into CrackStation, and **4 were cracked in under a second**.

The site moved to bcrypt as an emergency. We forced every user to reset their password. The CEO wasn't happy.

Since then, I always do:
1. Argon2 for new projects
2. Bcrypt with cost=12 minimum
3. **Never** MD5/SHA-1 on credentials

## In short

| Algorithm | Use | Security |
|---|---|---|
| MD5 | ❌ Never for auth | 💀 Broken |
| SHA-1 | ❌ Never for auth | 💀 Vulnerable |
| SHA-256 | ✅ File integrity | ⚠️ Too fast for passwords |
| Bcrypt | ✅ Passwords | ✅ Slow on purpose |
| Argon2 | ✅ Passwords (best) | ✅ The safest in 2026 |

**If you have MD5 in production, change it this week.** Seriously.

---

**Want to try it?** Hash anything in MD5, SHA-1, SHA-256 or SHA-512 here: [free Hash Generator](https://jchub.io/outils/hash-generator)

And if you have other security questions, I have 14 free dev tools on JcHub → [jchub.io/outils](https://jchub.io/outils)
