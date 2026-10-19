---
slug: encode-url-correctly
title: How to encode a URL correctly (and not break your OAuth)
description: "A space or an accent in a URL can break everything. Here's the difference between encodeURI and encodeURIComponent, and when to use which."
excerpt: 'How to encode a URL correctly and not break your OAuth. Last month, a client called me in a panic: "Jessy, our Google login stopped working...'
keywords:
  - encode url
  - encodeURIComponent
  - percent encoding
  - url encoding
  - oauth redirect uri
  - url space
sourceHash: bf2c86145a89e7a3706616cd
translatedAt: '2026-10-19T07:57:58.855Z'
---
# How to encode a URL correctly (and not break your OAuth)

Last month, a client called me in a panic: "Jessy, our Google login stopped working, we have 5,000 users locked out."

I looked at the logs. 30 seconds later, I found the bug.

The redirect_uri was: `https://app.com/callback?source=Google Ads`

The space and the capital letter broke everything. Google OAuth rejected the request with a cryptic error: `redirect_uri_mismatch`.

**30 seconds to fix, 3 hours of downtime.** All because of a badly encoded space.

## The problem: URLs and special characters

A standard URL can only contain certain characters: letters, digits, `-`, `_`, `.`, `~`. Everything else must be encoded with **percent-encoding**: a `%` followed by 2 hex characters.

For example:
- Space → `%20` (or `+` in a query string)
- `é` → `%C3%A9`
- `&` → `%26` (otherwise it's taken as a parameter separator)
- `#` → `%23` (otherwise it's taken as an anchor)

## encodeURI vs encodeURIComponent: the CRUCIAL difference

JavaScript has **two functions** to encode URLs, and they're not the same thing.

### `encodeURI`: encodes the whole URL

```javascript
encodeURI("https://app.com/callback?name=Jean Dupont&city=Brazzaville")
// "https://app.com/callback?name=Jean%20Dupont&city=Brazzaville"
```

**What it encodes**: spaces, accents, etc.
**What it lets through**: `:`, `/`, `?`, `&`, `=`, `#`

### `encodeURIComponent`: encodes a parameter value

```javascript
encodeURIComponent("Jean Dupont & cie")
// "Jean%20Dupont%20%26%20cie"
```

**What it encodes**: EVERYTHING, including `&`, `=`, `?`, `#`

### The classic trap

```javascript
// ❌ WRONG: encodeURI lets the & through, which breaks the query
const url = `https://api.com/search?q=${encodeURI(userInput)}&type=articles`;

// ✅ RIGHT: encodeURIComponent encodes everything, even the &
const url = `https://api.com/search?q=${encodeURIComponent(userInput)}&type=articles`;
```

**Golden rule**:
- `encodeURI`: to encode a **full URL**
- `encodeURIComponent`: to encode a **parameter value**

## The OAuth case that cost me 3 hours

For Google OAuth, the `redirect_uri` must be **exactly** the same as the one declared in the developer console. No differences, no spaces, no capital letters.

```javascript
// ❌ WRONG: the URL is encoded but the space remains
const redirectUri = "https://app.com/callback?source=Google Ads";

// ✅ RIGHT: encode each parameter value
const params = new URLSearchParams({ source: "Google Ads" });
const redirectUri = `https://app.com/callback?${params}`;
// "https://app.com/callback?source=Google+Ads"

// ✅ EVEN BETTER: use URLSearchParams
const url = new URL("https://app.com/callback");
url.searchParams.set("source", "Google Ads");
const finalUrl = url.toString();
```

## The 3 cases where you MUST encode

### 1. **Query param values**

```javascript
const search = "Node.js & JavaScript";
const url = new URL("https://google.com/search");
url.searchParams.set("q", search);
// https://google.com/search?q=Node.js+%26+JavaScript
```

### 2. **Dynamic paths**

```javascript
const userId = "user/123";
const url = new URL(`https://api.com/users/${encodeURIComponent(userId)}`);
// https://api.com/users/user%2F123
```

### 3. **OAuth, callbacks, redirects**

```javascript
const state = "abc123&hack=true";
const redirectUrl = new URL("https://app.com/callback");
redirectUrl.searchParams.set("state", state);
// "state" will be encoded, so the & inside state won't break the query
```

## The quick tool to test

I have a [free URL Encoder](https://jchub.io/outils/url-encoder) on JcHub. Paste a URL or a string and get the `encodeURI` and `encodeURIComponent` encoding in one click. Really handy to debug an OAuth flow that doesn't work.

## The table that sums it all up

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

- `encodeURI` = full URL
- `encodeURIComponent` = parameter value (use this 95% of the time)
- For peace of mind: `new URL()` + `searchParams.set()`
- Free tool: [jchub.io/outils/url-encoder](https://jchub.io/outils/url-encoder)
- **If your OAuth doesn't work, start by checking your encoding** (it's bug #1)

---

**Coding an API and need to test your endpoints?** Check out my free, 100% online [Postman-like API Tester](https://jchub.io/outils/api-tester).

And if you have other dev questions, I have 14 free tools on JcHub → [jchub.io/outils](https://jchub.io/outils)

