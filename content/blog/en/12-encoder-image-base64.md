---
slug: base64-is-not-encryption
title: "Base64 is not encryption (and it's important to understand why)"
description: "Encoding an image in Base64 doesn't make it secret. Here's when to use Base64, how it works, and why it's sometimes useful (and sometimes not)."
excerpt: "Base64 is not encryption and it's important to understand why. The other day, a junior dev asked me: \"I put my admin password in Base64..."
keywords: ["base64 encoder","base64 image","base64 decoder","data uri","base64 css","base64 vs encryption"]
---
# Base64 is not encryption (and it's important to understand why)

The other day, a junior dev asked me: "I put my admin password in Base64 in the code, that's secure, right?"

**No.**

Base64 is just an **encoding**, not **encryption**. It's the equivalent of writing your password in capital letters: anyone can turn it back into plain text.

But Base64 does have **real uses**. Here's when, why and how.

## What is Base64?

Base64 is a way to represent **binary data** (images, files, bytes) as an **ASCII string** (letters, digits, +, /).

### A simple example

The string "Hello" in Base64:

```
SGVsbG8=
```

### Why it exists

Historically, many systems only handled text (emails, URLs, JSON). But sometimes you needed to send binary data (an image in an email, for example). Base64 lets you **convert binary data into text**.

**That's all.** No security, just conversion.

## How to encode in Base64

### Online tool

My [free Base64 Tool](https://jchub.io/outils/base64-encoder) on JcHub. Paste your text and get the encoding in 1 click. Same in the other direction (decoding).

### In JavaScript

```javascript
// Encode
const original = "Hello World";
const encoded = btoa(original);
// "SGVsbG8gV29ybGQ="

// Decode
const decoded = atob(encoded);
// "Hello World"

// For Unicode characters (accents, emojis)
const text = "Héllo 🌍";
const encodedUnicode = btoa(unescape(encodeURIComponent(text)));
// "SGVsbG8g8J+MjQ=="
const decodedUnicode = decodeURIComponent(escape(atob(encodedUnicode)));
// "Héllo 🌍"
```

⚠️ `btoa` and `atob` only handle ASCII. For Unicode, you have to go through `encodeURIComponent` + `unescape`.

### In Python

```python
import base64

# Encode
text = "Hello World"
encoded = base64.b64encode(text.encode()).decode()
# "SGVsbG8gV29ybGQ="

# Decode
decoded = base64.b64decode(encoded).decode()
# "Hello World"
```

### On the command line

```bash
# Encode
echo -n "Hello World" | base64
# SGVsbG8gV29ybGQ=

# Decode
echo "SGVsbG8gV29ybGQ=" | base64 -d
# Hello World

# Encode a file
base64 image.png > image.b64

# Decode a file
base64 -d image.b64 > image-decoded.png
```

## The real uses of Base64

### 1. **Inline images in CSS (data URIs)**

```css
.hero {
  background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');
}
```

**Advantage**: a single HTTP request instead of 2 (HTML + image).
**Drawback**: the image is ~30% bigger in Base64.

**When to use it**:
- ✅ Small icons (under 10 KB)
- ✅ Simple SVGs
- ❌ Large images (size + 30% + no caching)

### 2. **Email attachments (MIME)**

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

The `amVhbjpkb3VibGV2ZHJvaXQ=` part is `jean:doubleverdroit` in Base64. It's just an encoding to pass special characters in the HTTP header.

⚠️ **Once again**: it's NOT secure. The header is sent in plain text. You need HTTPS to encrypt it.

### 4. **JWT (JSON Web Tokens)**

```javascript
// Header
{"alg":"HS256","typ":"JWT"}

// Header in Base64
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
```

JWTs use Base64 to encode the header + payload (not the signature). That's why anyone can decode a JWT and read its content. The **signature** prevents modification, not reading.

### 5. **Storing binary data in a NoSQL DB**

MongoDB stores BSON, not Base64. But you can store Base64 in a string if you have no choice.

```javascript
const user = {
  name: "Jean",
  avatar: "data:image/png;base64,iVBORw0KGgo..."  // OK but suboptimal
};
```

**Better**: store the image URL (Cloudinary, S3, etc.).

## The size: 33% bigger

Base64 encodes 3 bytes into 4 characters. So **every 3 bytes become 4 chars** = 33% more.

```
PNG image: 100 KB
Base64 image: 133 KB
```

For a 5 KB icon, that's 6.6 KB. For a 2 MB image, that's 2.6 MB. Not negligible.

## Why it's not encryption

```
Original:  "Password123"
Base64:    "UGFzc3dvcmQxMjM="
Reverse:   "Password123"
```

Anyone can decode it. There's **no key**, **no secret**. It's just a deterministic transformation.

It's like saying "I secured my password by writing it backwards". Trivially reversible.

**To actually encrypt**, you need:
- An **algorithm**: AES, ChaCha20, RSA
- A **key**: known only to you
- A **lib**: `bcrypt`, `argon2`, `crypto.subtle`

## TL;DR

- **Base64** = encoding, NOT encryption
- **5 real uses**: CSS data URIs, MIME email, Basic Auth, JWT, NoSQL storage
- **+33% size**: not for large images
- **If you want security**: AES, bcrypt, argon2
- **Free tool**: [jchub.io/outils/base64-encoder](https://jchub.io/outils/base64-encoder)

---

**Debugging a JWT and need to decode its payload?** A JWT payload is in Base64, so use my [JWT Decoder](https://jchub.io/outils/jwt-decoder) (free).

There are 14 free dev tools on JcHub → [jchub.io/outils](https://jchub.io/outils)
