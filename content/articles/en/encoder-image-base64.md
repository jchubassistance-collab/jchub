---
slug: base64-is-not-encryption
title: 'Base64: It''s Not Encryption (And Why That Matters)'
description: >-
  Encoding an image in Base64 doesn't make it secret. Here's when to use Base64,
  how it works, and why it's sometimes useful (and sometimes not).
excerpt: >-
  Base64: It's not encryption and why it matters The other day, a junior dev
  asked me: "I put my admin password in Base...
keywords:
  - base64 encoder
  - base64 image
  - base64 decoder
  - data uri
  - base64 css
  - base64 vs encryption
sourceHash: 0a31e71e0e477cafbe7b916f
translatedAt: '2026-11-05T07:52:07.118Z'
---
# Base64: It's Not Encryption (And Why That Matters)

The other day, a junior dev asked me: "I put my admin password in Base64 in the code, so it's secure right?"

**No.**

Base64 is just an **encoding**, not an **encryption**. It's the equivalent of writing your password in all caps: anyone can easily turn it back into plain text.

However, Base64 does have **real use cases**. Here is when, why, and how to use it.

## What is Base64?

Base64 is a way to represent **binary data** (images, files, bytes) as an **ASCII string** (letters, numbers, +, /).

### Simple Example

The string "Hello" in Base64:

```
SGVsbG8=
```

### Why It Exists

Historically, many systems only handled text (emails, URLs, JSON). But sometimes you need to send binary data (like an image in an email). Base64 lets you **convert binary into text**.

**That's it.** No security, just conversion.

## How to Encode in Base64

### Online Tool

Try my free [Base64 Tool](https://jchub.dev/fr/outils/base64-encoder) on JcHub. Paste your text, and you get the encoding in 1 click. Works the other way around for decoding too.

### In JavaScript

```javascript
// Encoder
const original = "Hello World";
const encoded = btoa(original);
// "SGVsbG8gV29ybGQ="

// Décoder
const decoded = atob(encoded);
// "Hello World"

// Pour les caractères Unicode (accents, émojis)
const text = "Héllo 🌍";
const encodedUnicode = btoa(unescape(encodeURIComponent(text)));
// "SGVsbG8g8J+MjQ=="
const decodedUnicode = decodeURIComponent(escape(atob(encodedUnicode)));
// "Héllo 🌍"
```

⚠️ `btoa` and `atob` only handle ASCII. For Unicode, you need to use `encodeURIComponent` + `unescape`.

### In Python

```python
import base64

# Encoder
text = "Hello World"
encoded = base64.b64encode(text.encode()).decode()
# "SGVsbG8gV29ybGQ="

# Décoder
decoded = base64.b64decode(encoded).decode()
# "Hello World"
```

### Command Line

```bash
# Encoder
echo -n "Hello World" | base64
# SGVsbG8gV29ybGQ=

# Décoder
echo "SGVsbG8gV29ybGQ=" | base64 -d
# Hello World

# Encoder un fichier
base64 image.png > image.b64

# Décoder un fichier
base64 -d image.b64 > image-decoded.png
```

## Real Use Cases for Base64

### 1. **Inline Images in CSS (Data URIs)**

```css
.hero {
  background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');
}
```

**Advantage**: 1 single HTTP request instead of 2 (HTML + image).
**Disadvantage**: The image is ~30% larger in Base64.

**When to use**:
- ✅ Small icons (under 10 KB)
- ✅ Simple SVGs
- ❌ Large images (size + 30% + no caching)

### 2. **Email Attachments (MIME)**

Emails only support text. To send an image, you encode it in Base64 and include it in the body.

```
Content-Type: image/png; name="logo.png"
Content-Transfer-Encoding: base64

iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=
```

### 3. **Basic Auth**

```http
Authorization: Basic amVhbjpkb3VibGV2ZHJvaXQ=
```

The `amVhbjpkb3VibGV2ZHJvaXQ=` string is just `jean:doubleverdroit` in Base64. It's simply an encoding used to pass special characters in the HTTP header.

⚠️ **Once again**: it is NOT secure. The header is sent in plain text. You need HTTPS to encrypt it.

### 4. **JWT (JSON Web Tokens)**

```javascript
// Header
{"alg":"HS256","typ":"JWT"}

// Header en Base64
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
```

JWTs use Base64 to encode the header and payload (not the signature). That's why anyone can decode a JWT and read its contents. The **signature** prevents tampering, not reading.

### 5. **Storing Binary Data in a NoSQL DB**

MongoDB stores BSON, not Base64. But you can store Base64 in a string if you have no other choice.

```javascript
const user = {
  name: "Jean",
  avatar: "data:image/png;base64,iVBORw0KGgo..."  // OK mais suboptimal
};
```

**Better**: Store the image URL instead (Cloudinary, S3, etc.).

## Size: 33% Larger

Base64 encodes 3 bytes into 4 characters. Therefore, **every 3 bytes becomes 4 chars** = 33% larger.

```
PNG Image: 100 KB
Base64 Image: 133 KB
```

For a 5 KB icon, that becomes 6.6 KB. For a 2 MB image, it becomes 2.6 MB. Not negligible.

## Why It's Not Encryption

```
Original :  "Password123"
Base64 :    "UGFzc3dvcmQxMjM="
Reverse:    "Password123"
```

Anyone can decode it. There is **no key**, **no secret**. It's just a deterministic transformation.

It's like saying "I secured my password by writing it backwards." Trivially reversible.

**To actually encrypt**, you need:
- An **algorithm**: AES, ChaCha20, RSA
- A **key**: known only to you
- A **library**: `bcrypt`, `argon2`, `crypto.subtle`

## TL;DR

- **Base64** = encoding, NOT encryption
- **5 real use cases**: CSS data URIs, email MIME, Basic Auth, JWTs, NoSQL storage
- **+33% size**: not meant for large images
- **If you want security**: use AES, bcrypt, argon2
- **Free tool**: [jchub.dev/fr/outils/base64-encoder](https://jchub.dev/fr/outils/base64-encoder)

---

**Debugging a JWT and need to decode its payload?** A JWT payload is in Base64, so feel free to use my free [JWT Decoder](https://jchub.dev/fr/outils/decodeur-jwt).

There are 14 free dev tools on JcHub → [jchub.dev/fr/outils](https://jchub.dev/fr/outils)
