---
slug: email-regex-5-patterns
title: 'Email Regex: 5 Patterns You Should Know (and Pitfalls to Avoid)'
description: >-
  Email validation regex isn't as simple as /\S+@\S+\.\S+/. Here are 5 useful
  patterns, tested in production, along with their limitations.
excerpt: >-
  Email Regex: 5 patterns you should know and pitfalls to avoid. Two years ago,
  I used this for email validation in a project: A user wrote to me: "Your s...
keywords:
  - email regex
  - regular expression
  - regex test
  - email validation
  - javascript regex
  - phone regex
sourceHash: c817fdd3110d471b1ee0c2e0
translatedAt: '2026-11-07T07:51:36.894Z'
---
# Email Regex: 5 Patterns You Should Know (and Pitfalls to Avoid)

Two years ago, I put this in a project for email validation:

```javascript
const isValid = /\S+@\S+\.\S+/.test(email);
```

A user wrote to me: "Your site accepts `a@b` but rejects my work email address."

Sure enough, `jean@.com` was passing validation. Oops.

Email regex is a classic trap. Here is what I wish I had known back then.

## The Myth of the Perfect Email Regex

Spoiler alert: **it doesn't exist**.

The official RFC 5322 regex to validate an email is **6,500 characters long**. And even that one isn't perfect (it accepts `..` and other oddities).

My advice: use a **simple regex** for the basic format, then **send a confirmation email** to verify that the address actually exists.

## The 5 Regex Patterns I Use in Production

### 1. **Basic Email (95% of use cases)**

```javascript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
```

✅ Accepts: `jean@example.com`, `j.dupont@pro.io`
❌ Rejects: `jean@`, `@example.com`, `jean @example.com`, `jean@example`

This is what I use 95% of the time. Simple, readable, covers standard cases.

### 2. **Strict Email (more picky)**

```javascript
const emailRegexStrict = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
```

✅ Adds: character restrictions, TLD of at least 2 letters
❌ Rejects: `jean@ex.c` (TLD too short), special characters not in the list

Better, but heads up: `jean+tag@gmail.com` passes (the `+` is in the `%+-` list), but valid addresses like `jean@xn--mnchen-3ya.de` (IDN in punycode) don't.

### 3. **International Phone Number**

```javascript
// E.164 format: +[country code][number]
const phoneRegex = /^\+?[1-9]\d{1,14}$/;

// Common formats: +242 06 123 45 67
const phoneRegexFR = /^(?:\+?\d{1,3}[\s.-]?)?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}$/;
```

The **E.164** format is the international standard: `+242069550625` for Congo. Max 15 digits.

⚠️ Phone regexes are **always** a compromise. Validate on the backend instead (using Google's `libphonenumber` library, for example).

### 4. **URL**

```javascript
// Simple
const urlRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/;

// Strict (captures groups)
const urlRegexStrict = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w.-]*)*\/?$/;
```

✅ Accepts: `https://jchub.dev`, `http://example.com/path?query=1#hash`
❌ Rejects: `ftp://...`, `not a url`

**Even better**: use `new URL()` in JavaScript. It's built-in and safer.

```javascript
try {
  new URL("https://jchub.dev");
  // Valid URL
} catch {
  // Invalid URL
}
```

### 5. **Strong Password**

```javascript
// Minimum 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 symbol
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
```

✅ Accepts: `Password123!`, `MonMot2passe!`
❌ Rejects: `password`, `PASSWORD123`, `12345678`

⚠️ **Heads up**: password regexes enforce weird patterns that users end up forgetting. Better to:
- Require a min length of 12 characters
- Avoid forced arbitrary rules
- Check if the password has been leaked using an API like Have I Been Pwned

## Pitfalls I Learned the Hard Way in Prod

### 1. **Whitespace and invisible characters**

```javascript
" jean@example.com ".match(/\S+@\S+\.\S+/) // match
"jean@example.com".match(/\S+@\S+\.\S+/) // match

// Always trim before testing
const email = input.trim().toLowerCase();
```

### 2. **Email casing**

Email addresses are **case-insensitive** for the local part (Gmail allows this). Normalize to lowercase.

```javascript
const normalizedEmail = input.trim().toLowerCase();
```

### 3. **Disposable email addresses**

`mailinator.com`, `tempmail.com`, etc. are temporary email services. Block them if you want actual, high-quality users.

Up-to-date list: [github.com/disposable-email-domains](https://github.com/disposable-email-domains/disposable-email-domains)

### 4. **Unicode emails (IDN)**

`jean@例え.jp` is valid but not supported by most regexes. Convert to punycode with `punycode.js` before validation.

## How to Test Your Regexes

My free tool: [Regex Tester](https://jchub.dev/fr/outils/regex-tester). Paste your regex and test text, and it shows you in real time:
- Whether it matches
- Captured groups
- Match positions

Super handy for debugging a regex that isn't working as expected.

## TL;DR

- **No perfect email regex** → simple regex + email confirmation
- **5 useful patterns**: basic email, strict email, phone number, URL, password
- **Normalize**: trim + lowercase
- **Block disposable emails** if needed
- **Test with**: [jchub.dev/fr/outils/regex-tester](https://jchub.dev/fr/outils/regex-tester)
- **Prefer `new URL()`** over regex for URLs

---

**Building a signup form and need help?** My [Regex Tester](https://jchub.dev/fr/outils/regex-tester) lets you test your patterns in real time.

There are 14 free dev tools on JcHub → [jchub.dev/fr/outils](https://jchub.dev/fr/outils)
