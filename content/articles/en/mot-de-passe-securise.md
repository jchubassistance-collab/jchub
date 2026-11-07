---
slug: create-a-truly-secure-password
title: How to Create a Truly Secure Password (and Actually Remember It)
description: >-
  All the usual password advice sucks. Here's the real strategy: generator +
  manager + 2FA. Simple, effective, actionable.
excerpt: >-
  How to Create a Truly Secure Password (and Actually Remember It) The classic
  advice: "Add uppercase letters, numbers, symbols, and change it ...
keywords:
  - secure password
  - password generator
  - password manager
  - bitwarden
  - 2fa
  - account security
sourceHash: 8b8058a2c7994c7d28e1cec3
translatedAt: '2026-11-07T07:51:03.929Z'
---
# How to Create a Truly Secure Password (and Actually Remember It)

The classic advice: "Add uppercase letters, numbers, symbols, and change it every 3 months."

That's **total nonsense**.

A 2017 NIST study showed that these kinds of rules force people into predictable patterns (`Password1!`, `Summer2026!`, etc.) that attackers can crack in seconds.

Here is the real method used by security pros.

## The 3 rules that actually work

### 1. **Length > complexity**

A **16-character** lowercase-only password is **much** harder to crack than a 9-character `P@ssw0rd!`.

**Why**: Password strength is measured in **entropy** (bits of randomness):

- 8 lowercase chars (26^8) = 38 bits → crackable in seconds
- 16 lowercase chars (26^16) = 75 bits → 3 million years
- 9 chars with symbols (90^9) = 59 bits → 1 year

Length wins. Aim for **16+ characters**.

### 2. **Unique per site**

**NEVER** use the same password across two sites. If one site gets leaked (and it happens every day), all your accounts are compromised.

### 3. **No human memorization**

Your brain can remember 5–10 passwords max. Beyond that, you'll end up reusing them or creating simple ones. The fix: a **password manager**.

## My recommended setup (free)

### 1. **Bitwarden** (password manager)

- ✅ Open source
- ✅ Free (the free tier is plenty)
- ✅ Syncs across all your devices
- ✅ Built-in password generator
- ✅ Vault audit: tells you which passwords are weak or reused

Download: [bitwarden.com](https://bitwarden.com/)

**Setup (5 mins)**:
1. Create a Bitwarden account with a **really solid master password** (the only one you'll need to remember)
2. Enable 2FA on your Bitwarden account
3. Import your passwords from Chrome/Firefox
4. Bitwarden will show you which ones need changing

### 2. **A genuinely strong master password**

The only password you need to memorize: your Bitwarden one. It needs to be **extremely strong** because it unlocks everything else.

**The passphrase method** (Diceware):

```
CorrectHorseBatteryStaple42!
```

Or use my [Password Generator](https://jchub.dev/fr/outils/generateur-mot-de-passe) on JcHub. Generate 24+ characters, copy it into Bitwarden, and forget it.

### 3. **2FA everywhere possible**

2FA (Two-Factor Authentication) adds an extra layer of security. Even if your password leaks, an attacker still needs your phone.

**Recommended apps**:
- **Authy**: cross-device sync, cloud backup
- **Google Authenticator**: simple, but no backup
- **1Password**: paid, but excellent
- **Bitwarden Authenticator**: free, built into Bitwarden

**Avoid SMS 2FA**: it's vulnerable to SIM swapping.

## How to generate a strong password

### Online tool (the fastest way)

My [Password Generator](https://jchub.dev/fr/outils/generateur-mot-de-passe) on JcHub. You pick:
- Length (16+ recommended)
- Whether you want uppercase letters
- Whether you want numbers
- Whether you want symbols
- Click once, and you have your password

### Via CLI (for devs)

```bash
# Linux/Mac with openssl
openssl rand -base64 24 | tr -d "=+/" | cut -c1-24

# Mac with pwgen (brew install pwgen)
pwgen -s 24 1

# Linux with apg (apt install apg)
apg -a 1 -m 24 -x 24 -n 1
```

### Inside Bitwarden

Bitwarden has a built-in generator. Head to `bitwarden.com/password-generator` (while logged in) or use the extension.

## Mistakes everyone makes

### 1. **Predictable variations**

You take "MonMot2passe!" and do:
- Gmail: "MonMot2passe!G"
- Facebook: "MonMot2passe!F"
- Twitter: "MonMot2passe!T"

Attackers test these exact patterns first. **Definitely** not secure.

### 2. **Security questions**

"What was the name of your first pet?" → easily found on social media.

**Solution**: generate a **random response** and store it in Bitwarden. For "First pet's name", enter `xK9$mP2vQ` and save it in a secure note.

### 3. **Storing passwords in the browser**

Chrome and Firefox can store your passwords. It's better than nothing, but:
- Not end-to-end encrypted
- Accessible to anyone who has access to your profile
- No secure cross-device sharing

**Stick to a dedicated password manager** (Bitwarden, 1Password, KeePass).

### 4. **Disposable emails for "security"**

Using `temp-mail.com` to sign up isn't a security feature. In fact, you risk losing access to your account.

Use an **email alias** (SimpleLogin, AnonAddy) linked to your main inbox. You can disable it whenever needed without losing your other accounts.

## The 30-minute security checklist

```
□ Install Bitwarden
□ Import existing passwords
□ Check Bitwarden vault audit (weak, reused passwords)
□ Change your 5 most critical accounts (email, banking, GitHub, Google, Apple)
  → Use Bitwarden's generator (24+ chars, random)
  → Enable 2FA
□ Enable 2FA on Bitwarden itself
□ Back up your 2FA recovery codes (print or store physically)
□ Change the rest gradually over time
```

**Critical accounts to change first**:
1. Primary email (if someone gets in, they can reset all your other accounts)
2. Banking / mobile money
3. Apple/Google/Microsoft (device recovery)
4. GitHub (your project source code)
5. The password manager itself

## The developer-specific case

If you're a developer, you have **API keys**, **JWT tokens**, and **DB passwords** to manage. The absolute worst places to put them:

- ❌ **Plaintext in code** (Git push = public leak)
- ❌ **Plaintext in committed `.env` files** (same thing)
- ❌ **Plaintext in production env variables** (visible to ops)

**The right places**:
- ✅ **Vault** (HashiCorp Vault): for infrastructure secrets
- ✅ **Doppler / Infisical**: for app secrets
- ✅ **AWS Secrets Manager / GCP Secret Manager**: for cloud secrets
- ✅ **Bitwarden**: for personal secrets (SSH keys, personal API tokens)
- ✅ **Local `.env` + `.gitignore` + prod env variables** (the bare minimum)

## TL;DR

- **Length > complexity**: aim for 16+ characters
- **Unique per site**: 1 password = 1 site, never reuse
- **Password manager**: Bitwarden (free, open-source)
- **2FA**: everywhere possible, authenticator app > SMS
- **No security questions**: generate random answers
- **Free generator**: [jchub.dev/fr/outils/generateur-mot-de-passe](https://jchub.dev/fr/outils/generateur-mot-de-passe)

---

**Want to test if your current passwords are solid?** My [Password Generator](https://jchub.dev/fr/outils/generateur-mot-de-passe) includes a real-time strength meter.

There are 14 free developer tools on JcHub → [jchub.dev/fr/outils](https://jchub.dev/fr/outils)
