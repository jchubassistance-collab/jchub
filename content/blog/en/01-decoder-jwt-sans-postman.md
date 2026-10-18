---
slug: decode-jwt-without-postman
title: "How to decode a JWT (JSON Web Token) without Postman — 2026 Guide"
description: "Struggling to debug a JWT? Here's how to decode it in 30 seconds, without installing Postman, with a free online tool."
excerpt: "How to decode a JWT JSON Web Token without Postman. Struggling to debug a JWT token that doesn't work in your API? Don't want to install Postman..."
keywords: ["decode jwt","jwt decoder","json web token","debug token","online jwt","base64 jwt"]
---
# How to decode a JWT (JSON Web Token) without Postman

Struggling to debug a JWT token that doesn't work in your API? Don't want to install Postman just to see what's inside? Good news: you can do it in 30 seconds, in your browser, without installing anything. Here's how.

## What exactly is a JWT?

A **JWT** (JSON Web Token) is an authentication token that your backend generates when a user signs in. It's a long string of characters that looks like this:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

What you don't see at first glance is that this token is actually **three parts separated by dots**:

1. **Header** (before the 1st dot): the algorithm used (`HS256`, `RS256`...)
2. **Payload** (between the 2 dots): the data (user_id, email, expiration...)
3. **Signature** (after the 2nd dot): the proof of integrity

These three parts are just **JSON encoded in Base64URL**. That's why they can be decoded.

## Why you need to decode it

The cases where you need to "look inside" a JWT:

- 🐛 **Debugging**: "Why isn't my auth working?"
- 🔍 **Checking the expiration**: "When does my token expire?"
- 👀 **Seeing the claims**: "Which fields is the backend sending me?"
- 🛡️ **Auditing**: "Is there sensitive data I shouldn't be storing?"

## How to decode a JWT in 30 seconds

### Method 1: With an online tool (the fastest)

1. Go to [https://jchub.io/outils/jwt-decoder](https://jchub.io/outils/jwt-decoder)
2. Paste your token into the field
3. The tool instantly shows you:
   - The **header** as formatted JSON
   - The **payload** with every claim detailed
   - The **signature** (which can't be read, that's normal)
   - The status: valid or expired
4. You can copy each part in one click

**Advantage**: you see everything, and you even get an "expired" or "valid" indicator with the expiration date in plain text.

### Method 2: In the browser console

If you don't have time to open a tool, you can do it right in DevTools (F12):

```javascript
// Paste this into the console
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
const parts = token.split('.');
const decode = (str) => JSON.parse(atob(str.replace(/-/g, '+').replace(/_/g, '/')));

console.log('Header:', decode(parts[0]));
console.log('Payload:', decode(parts[1]));
```

This method works, but it doesn't give you:
- The expiration indicator
- Nicely formatted JSON
- Automatic validation

### Method 3: On the command line (for pros)

On macOS or Linux:

```bash
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." | cut -d'.' -f2 | base64 -d
```

On Windows (PowerShell):

```powershell
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($token.Split('.')[1]))
```

## A concrete example: debugging a 401 error

Imagine: you're coding an API in Node.js, you send a JWT in the `Authorization` header, but you get a **401 Unauthorized** error.

Here's how to diagnose it:

1. **Get your token** (from localStorage, the network tab or the backend)
2. **Paste it** into the JWT decoder
3. **Look at the payload** — check:
   - `exp` (expiration): if the date has passed → your token is dead, you need to request a new one
   - `sub` (subject): is it the expected user ID?
   - `iss` (issuer): is it your backend's URL?
   - `aud` (audience): is it your frontend?
4. **Check the algorithm** in the header — if the backend expects `RS256` but you send `HS256`, it's not going to work

**In 90% of cases, it's the `exp` that has expired.** The decoder tells you at a glance.

## What NOT to do with a JWT

⚠️ **Never put sensitive data** in the payload (password, card number, etc.). Why? Because anyone can decode it — it's not encrypted, just encoded. Base64 is like a `.zip` file without a password.

For sensitive data, use an **encrypted token** (JWE) instead, or keep it on the server side.

## Conclusion

Decoding a JWT isn't rocket science. It's just Base64 + JSON. But having a tool that shows you all of it nicely formatted, with the expiration indicator, saves you 10 minutes of debugging every time.

👉 **Try it for free**: [https://jchub.io/outils/jwt-decoder](https://jchub.io/outils/jwt-decoder)

**Copy your token, paste it, get your answer.** That's it.

---

**Want more free dev tools?** JcHub offers 14 tools (JWT, hash, timestamp, API tester, regex, color, QR code, etc.). All free, all online, zero install. → [Discover all the tools](https://jchub.io/outils)
