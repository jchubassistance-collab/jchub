---
slug: create-a-truly-secure-password
title: "How to create a truly secure password (and remember it)"
description: "All the usual password advice is useless. Here's the real strategy: generator + manager + 2FA. Simple, effective, actionable."
excerpt: "How to create a truly secure password and remember it. The classic advice: \"Use capital letters, numbers, symbols, and change it..."
keywords: ["secure password","password generator","password manager","bitwarden","2fa","account security"]
---
# How to create a truly secure password (and remember it)

The classic advice: "Use capital letters, numbers, symbols, and change it every 3 months."

That's **nonsense**.

A NIST study (2017) showed that this kind of rule forces people to use predictable patterns (`Password1!`, `Summer2026!`, etc.) that attackers crack in seconds.

Here's the real method, used by security pros.

## The 3 rules that actually work

### 1. **Length > complexity**

A **16-character** password in lowercase only is **much** harder to crack than a 9-character `P@ssw0rd!`.

**Why**: a password's strength is measured in **entropy** (bits of randomness):

- 8 lowercase chars (26^8) = 38 bits → crackable in seconds
- 16 lowercase chars (26^16) = 75 bits → 3 million years
- 9 chars with symbols (90^9) = 59 bits → 1 year

Length wins. Aim for **16+ characters**.

### 2. **Unique per site**

**NEVER** use the same password on 2 sites. If one site gets leaked (and that happens every day), all your accounts are compromised.

### 3. **No human memorization**

Your brain can remember 5-10 passwords at most. Beyond that, you'll reuse them or make them simple. The solution: a **password manager**.

## The setup I recommend (free)

### 1. **Bitwarden** (manager)

- ✅ Open source
- ✅ Free (the free version is enough)
- ✅ Syncs across all your devices
- ✅ Built-in password generator
- ✅ Audit: tells you which passwords are weak/reused

Download: [bitwarden.com](https://bitwarden.com/)

**Setup (5 min)**:
1. Create a Bitwarden account with a **really good password** (the only one to remember)
2. Turn on 2FA for your Bitwarden account
3. Import your passwords from Chrome/Firefox
4. Bitwarden will tell you which ones to change

### 2. **A really strong master password**

The only password you need to know by heart: your Bitwarden one. It must be **very strong** because it unlocks all the others.

**The random passphrase method** (Diceware):

```
CorrectHorseBatteryStaple42!
```

Or use my [password generator](https://jchub.io/outils/generateur-mot-de-passe) on JcHub. Generate 24+ characters, copy it into Bitwarden, forget it.

### 3. **2FA wherever possible**

2FA (Two-Factor Authentication) adds a layer of security. Even if your password leaks, the attacker needs your phone.

**Recommended apps**:
- **Authy**: syncs across devices, cloud backup
- **Google Authenticator**: simple, but no backup
- **1Password**: paid but excellent
- **Bitwarden Authenticator**: free, built into Bitwarden

**Avoid SMS 2FA**: it's vulnerable to SIM swapping.

## How to generate a strong password

### Online tool (the fastest)

My [Password Generator](https://jchub.io/outils/generateur-mot-de-passe) on JcHub. You choose:
- The length (16+ recommended)
- Whether you want capital letters
- Whether you want numbers
- Whether you want symbols
- You click and get your password

### On the CLI (for devs)

```bash
# Linux/Mac with openssl
openssl rand -base64 24 | tr -d "=+/" | cut -c1-24

# Mac with pwgen (brew install pwgen)
pwgen -s 24 1

# Linux with apg (apt install apg)
apg -a 1 -m 24 -x 24 -n 1
```

### In Bitwarden

Bitwarden has a built-in generator. Go to `bitwarden.com/password-generator` (while logged in) or use the extension.

## The mistakes everyone makes

### 1. **Predictable variations**

You take "MyPassw0rd!" and do:
- Gmail: "MyPassw0rd!G"
- Facebook: "MyPassw0rd!F"
- Twitter: "MyPassw0rd!T"

Attackers test this kind of pattern first. **Really** not secure.

### 2. **Security questions**

"What was the name of your first pet?" → information you can find on social media.

**Solution**: generate a **random answer** and store it in Bitwarden. For "Name of your first pet", put `xK9$mP2vQ` and store it in a secure note.

### 3. **Storing passwords in the browser**

Chrome and Firefox can store your passwords. It's better than nothing, but:
- Not end-to-end encrypted
- Accessible to anyone with access to your profile
- No secure cross-device sharing

**Prefer a real manager** (Bitwarden, 1Password, KeePass).

### 4. **Disposable emails for "security"**

Using `temp-mail.com` to create an account isn't a security measure. On the contrary, you lose access to the account.

Use an **email alias** (SimpleLogin, AnonAddy) linked to your real inbox. You can delete it if needed without losing your other accounts.

## The 30-minute security checklist

```
□ Install Bitwarden
□ Import my existing passwords
□ Check the Bitwarden audit (weak, reused passwords)
□ Change the 5 most critical accounts (email, bank, GitHub, Google, Apple)
  → Use the Bitwarden generator (24+ chars, random)
  → Turn on 2FA
□ Turn on 2FA on Bitwarden itself
□ Back up the 2FA recovery code (print it or store it physically)
□ Change the rest gradually (as you go)
```

**Critical accounts to change first**:
1. Main email (if someone gets in, they can reset all the others)
2. Bank / mobile money
3. Apple/Google/Microsoft (device recovery)
4. GitHub (your projects' source code)
5. The password manager itself

## The specific case of developers

If you're a dev, you have **API keys**, **JWT tokens** and **database passwords** to manage. The worst places to put them:

- ❌ **In plain text in the code** (Git push = public leak)
- ❌ **In plain text in a committed `.env`** (same thing)
- ❌ **In plain text in production environment variables** (visible to ops)

**The right places**:
- ✅ **Vault** (HashiCorp Vault): for infrastructure secrets
- ✅ **Doppler / Infisical**: for app secrets
- ✅ **AWS Secrets Manager / GCP Secret Manager**: for the cloud
- ✅ **Bitwarden**: for your personal secrets (SSH key, personal API token)
- ✅ **.env locally + .gitignore + environment variables in production** (the minimum)

## TL;DR

- **Length > complexity**: aim for 16+ characters
- **Unique per site**: 1 password = 1 site, never reuse
- **Manager**: Bitwarden (free, open source)
- **2FA**: wherever possible, app > SMS
- **No real security answers**: generate random answers
- **Free generator**: [jchub.io/outils/generateur-mot-de-passe](https://jchub.io/outils/generateur-mot-de-passe)

---

**Want to check whether your current passwords are strong?** My [Password Generator](https://jchub.io/outils/generateur-mot-de-passe) includes a real-time strength indicator.

There are 14 free dev tools on JcHub → [jchub.io/outils](https://jchub.io/outils)
