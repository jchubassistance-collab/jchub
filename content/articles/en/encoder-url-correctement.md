---
slug: encode-url-correctly
title: How to Encode a URL Properly (and Not Break Your OAuth)
description: >-
  A space or an accented character in a URL can break everything. Here's the
  difference between encodeURI and encodeURIComponent, and when to use which.
excerpt: >-
  How to encode a URL properly and not break your OAuth Last month, a client
  called me in a panic: "Jessy, our Google login is down...
keywords:
  - encode url
  - encodeURIComponent
  - percent encoding
  - url encoding
  - oauth redirect uri
  - url space
sourceHash: 6bf54b86ca775f71fab8a4f9
translatedAt: '2026-11-06T07:50:55.359Z'
---
# How to Encode a URL Properly (and Not Break Your OAuth)

Last month, a client called me in a panic: "Jessy, our Google login is down, we have 5,000 users locked out."

I checked the logs. 30 seconds later, I found the bug.

The redirect_uri was: `https://app.com/callback?source=Google Ads`

The space and capital letter broke everything. Google OAuth rejected the request with a cryptic error: `redirect_uri_mismatch`.

**30-second fix, 3 hours of downtime.** All for an improperly encoded space.

## The Problem: URLs and Special Characters

A standard URL can only contain certain characters: letters, numbers, `-`, `_`, `.`, `~`. Everything else must be encoded using **percent-encoding**: a `%` followed by 2 hex characters.

For example:
- Space → `%20` (or `+` in a query string)
- `é` → `%C3%A9`
- `&` → `%26` (otherwise it's treated as a parameter separator)
- `#` → `%23` (otherwise it's treated as an anchor)

## encodeURI vs encodeURIComponent: The CRITICAL Difference

JavaScript has **two functions** for encoding URLs, and they aren't the same thing.

### `encodeURI`: Encodes the entire URL

```javascript
encodeURI("https://app.com/callback?name=Jean Dupont&city=Brazzaville")
// "https://app.com/callback?name=Jean%20Dupont&city=Brazzaville"
```

**What it encodes**: Spaces, accented characters, etc.
**What it leaves alone**: `:`, `/`, `?`, `&`, `=`, `#`

### `encodeURIComponent`: Encodes a parameter value

```javascript
encodeURIComponent("Jean Dupont & cie")
// "Jean%20Dupont%20%26%20cie"
```

**What it encodes**: EVERYTHING, including `&`, `=`, `?`, `#`

### The Classic Trap

```javascript
// ❌ WRONG: encodeURI lets & through, which breaks the query
const url = `https://api.com/search?q=${encodeURI(userInput)}&type=articles`;

// ✅ RIGHT: encodeURIComponent encodes everything, even &
const url = `https://api.com/search?q=${encodeURIComponent(userInput)}&type=articles`;
```

**Golden rule**:
- `encodeURI`: To encode a **complete URL**
- `encodeURIComponent`: To encode a **parameter value**

## The OAuth Case That Cost Me 3 Hours

For Google OAuth, the `redirect_uri` must be **exactly** the same as the one declared in the developer console. No differences, no spaces, no uppercase variations.

```javascript
// ❌ WRONG: URL is encoded but the space remains
const redirectUri = "https://app.com/callback?source=Google Ads";

// ✅ RIGHT: Encode each param value
const params = new URLSearchParams({ source: "Google Ads" });
const redirectUri = `https://app.com/callback?${params}`;
// "https://app.com/callback?source=Google+Ads"

// ✅ EVEN BETTER: Use URLSearchParams
const url = new URL("https://app.com/callback");
url.searchParams.set("source", "Google Ads");
const finalUrl = url.toString();
```

## The 3 Cases Where You MUST Encode

### 1. **Query Param Values**

```javascript
const search = "Node.js & JavaScript";
const url = new URL("https://google.com/search");
url.searchParams.set("q", search);
// https://google.com/search?q=Node.js+%26+JavaScript
```

### 2. **Dynamic Paths**

```javascript
const userId = "user/123";
const url = new URL(`https://api.com/users/${encodeURIComponent(userId)}`);
// https://api.com/users/user%2F123
```

### 3. **OAuth, Callbacks, Redirects**

```javascript
const state = "abc123&hack=true";
const redirectUrl = new URL("https://app.com/callback");
redirectUrl.searchParams.set("state", state);
// "state" will be encoded; the & inside state won't break the query
```

## The Quick Tool to Test

I have a free [URL Encoder](https://jchub.dev/fr/outils/encodeur-url) on JcHub. Paste a URL or string, and you get both `encodeURI` and `encodeURIComponent` encodings in one click. Super handy for debugging an OAuth setup that isn't working.

## The Table Summary

| Character | encodeURI | encodeURIComponent |
|---|---|---|
| `space` | `%20` | `%20` |
| `é` | `%C3%A9` | `%C3%A9` |
| `&` | `&` (❌) | `%26` |
| `=` | `=` (❌) | `%3D` |
| `?` | `?` (❌) | `%3F` |
| `#` | `#` (❌) | `%23` |
| `/` | `/` (❌) | `%2F` |
| `:` | `:` (❌) | `%3A` |

→ `encodeURIComponent` is **safer** by default. Use it unless you have a good reason to use `encodeURI`.

## TL;DR

- `encodeURI` = Complete URL
- `encodeURIComponent` = Parameter value (use this 95% of the time)
- For peace of mind: `new URL()` + `searchParams.set()`
- Free tool: [jchub.dev/fr/outils/encodeur-url](https://jchub.dev/fr/outils/encodeur-url)
- **If your OAuth isn't working, start by checking your encoding** (it's the #1 bug)

---

**Building an API with parameters containing JSON?** My free [JSON Formatter](https://jchub.dev/fr/outils/json-formatter) makes it readable and tells you if it's valid.

And if you have other dev questions, I have 14 free tools on JcHub → [jchub.dev/fr/outils](https://jchub.dev/fr/outils)
