---
slug: email-regex-5-patterns
title: 'Email regex: 5 patterns to know (and the traps to avoid)'
description: "A regex to validate an email isn't as simple as /\\S+@\\S+\\.\\S+/. Here are 5 useful patterns, tested in production, with their limits."
excerpt: 'Email regex: 5 patterns to know and the traps to avoid. 2 years ago, I used this as email validation in a project: A user wrote to me: "Your site...'
keywords:
  - email regex
  - regular expression
  - regex test
  - email validation
  - javascript regex
  - phone regex
sourceHash: a025a4ebf0baea773a149e3b
translatedAt: '2026-10-19T07:58:18.301Z'
---
# Email regex: 5 patterns to know (and the traps to avoid)

2 years ago, I used this as email validation in a project:

```javascript
const isValid = /\S+@\S+\.\S+/.test(email);
```

A user wrote to me: "Your site accepts `a@b` but rejects my work address."

And sure enough, `jean@.com` got through. Oops.

A regex to validate an email is a classic trap. Here's what I wish I'd known before.

## The myth of the perfect email regex

Spoiler: **it doesn't exist**.

The official RFC 5322 regex to validate an email is **6,500 characters** long. And even it isn't perfect (it accepts `..` and other oddities).

My advice: use a **simple regex** for the basic format, then **send a confirmation email** to check that the address really exists.

## The 5 regexes I use in production

### 1. **Basic email (95% of cases)**

```javascript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
```

✅ Accepts: `jean@example.com`, `j.dupont@pro.io`
❌ Rejects: `jean@`, `@example.com`, `jean @example.com`, `jean@example`

It's what I use in 95% of cases. Simple, readable, covers the common cases.

### 2. **Strict email (pickier)**

```javascript
const emailRegexStrict = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
```

✅ Adds: restricted valid characters, a TLD of at least 2 letters
❌ Rejects: `jean@ex.c` (TLD too short), special characters not in the list

Better, but careful: `jean+tag@gmail.com` gets through (the `+` is in the `%+-` list), but valid addresses like `jean@xn--mnchen-3ya.de` (IDN in punycode) don't.

### 3. **International phone number**

```javascript
// E.164 format: +[country code][number]
const phoneRegex = /^\+?[1-9]\d{1,14}$/;

// Common formats: +242 06 123 45 67
const phoneRegexFR = /^(?:\+?\d{1,3}[\s.-]?)?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}$/;
```

The **E.164** format is the international standard: `+242069550625` for Congo. 15 digits max.

⚠️ Phone regexes are **always** a compromise. Validate on the backend (with Google's `libphonenumber` library, for example).

### 4. **URL**

```javascript
// Simple
const urlRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/;

// Strict (captures groups)
const urlRegexStrict = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w.-]*)*\/?$/;
```

✅ Accepts: `https://jchub.io`, `http://example.com/path?query=1#hash`
❌ Rejects: `ftp://...`, `not a url`

**Even better**: use `new URL()` in JavaScript, it's native and safer.

```javascript
try {
  new URL("https://jchub.io");
  // It's valid
} catch {
  // Not valid
}
```

### 5. **Strong password**

```javascript
// Minimum 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 symbol
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
```

✅ Accepts: `Password123!`, `MyPassw0rd!`
❌ Rejects: `password`, `PASSWORD123`, `12345678`

⚠️ **Careful**: password regexes force odd patterns that users forget. Prefer:
- At least 12 characters
- No forced patterns
- Checking whether the password is on the list of the worst ones (Have I Been Pwned API)

## The traps I learned in production

### 1. **Spaces and invisible characters**

```javascript
" jean@example.com ".match(/\S+@\S+\.\S+/) // match
"jean@example.com".match(/\S+@\S+\.\S+/) // match

// Always trim before testing
const email = input.trim().toLowerCase();
```

### 2. **Email case**

Email addresses are **case-insensitive** in practice for the local part (Gmail allows it). Normalize to lowercase.

```javascript
const normalizedEmail = input.trim().toLowerCase();
```

### 3. **Disposable emails**

`mailinator.com`, `tempmail.com`, etc. are disposable email services. Block them if you want serious users.

Up-to-date list: [github.com/disposable-email-domains](https://github.com/disposable-email-domains/disposable-email-domains)

### 4. **Unicode emails (IDN)**

`jean@例え.jp` is valid but not covered by most regexes. Convert it to punycode with `punycode.js` before validating.

## How to test your regexes

My free tool: [Regex Tester](https://jchub.io/outils/regex-tester). Paste your regex and your test text, and it tells you in real time:
- Whether it matches
- The captured groups
- The positions of the matches

Really handy to debug a regex that doesn't work.

## TL;DR

- **No perfect email regex** → simple regex + confirmation email
- **5 useful patterns**: basic email, strict email, phone, URL, password
- **Normalize**: trim + lowercase
- **Block disposable emails** if needed
- **Test with**: [jchub.io/outils/regex-tester](https://jchub.io/outils/regex-tester)
- **Prefer `new URL()`** over a regex for URLs

---

**Coding a sign-up form and need help?** My [Regex Tester](https://jchub.io/outils/regex-tester) lets you test your patterns in real time.

There are 14 free dev tools on JcHub → [jchub.io/outils](https://jchub.io/outils)

