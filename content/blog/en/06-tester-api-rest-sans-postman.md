---
slug: test-rest-api-without-postman
title: "How to test a REST API without Postman (free, in the browser)"
description: "Fed up with Postman's 200 MB install and mandatory account? Here are 3 lightweight alternatives, including one that's 100% free and needs no install."
excerpt: "How to test a REST API without Postman, free, in the browser. I've been using Postman since 2017. But in 2024, I decided to stop. Why..."
keywords: ["api tester","postman alternative","free http client","rest client","test api","http request","postman vs insomnia"]
---
# How to test a REST API without Postman (free, in the browser)

I've been using Postman since 2017. But in 2024, I decided to stop. Why?

- A 200 MB install
- A mandatory account to sync
- The Electron app that eats 1.5 GB of RAM
- Premium features hidden behind a paywall

I looked for an alternative. I found 3 that are worth it. And I built one too (more on that below).

## The 3 alternatives to Postman in 2026

### 1. **Insomnia** (the open source one)

- ✅ Free and open source
- ✅ Lighter than Postman (~80 MB)
- ❌ Optional account (but syncing is a pain without one)
- ❌ Quite a few paid features now

**For whom**: devs who want a native app, not a web tool.

### 2. **Hoppscotch** (the open source web one)

- ✅ 100% web, nothing to install
- ✅ Open source
- ✅ Self-hostable
- ❌ Somewhat cluttered UI
- ❌ No native code generation

**For whom**: devs who want something web-based, free and open source.

### 3. **Bruno** (the new challenger)

- ✅ Open source
- ✅ Stores requests as `.bru` files in your repo
- ✅ Versioned with Git (no more lost collections)
- ❌ CLI-only at first, the desktop app is young

**For whom**: teams that want to version their API requests alongside the code.

## And my tool: JcHub API Tester

I built a 100% free HTTP client that runs in the browser. No install, no account, no ads.

**[JcHub API Tester](https://jchub.io/outils/api-tester)**

Why I use it every day:

- **29 KB** vs 200 MB for Postman
- **No install**: open the tab and it's ready
- **No account**: everything stays in localStorage
- **Code generation**: cURL, fetch, axios, Python requests
- **History**: the last 20 requests
- **Saving**: my favorite requests stay put

**Known limit**: CORS can block some requests from the browser. To get around it, use a Chrome "Allow CORS" extension (at your own risk).

## How to test an API in 5 steps

### Step 1: Choose your method

`GET` to read, `POST` to create, `PUT` to update, `DELETE` to delete, `PATCH` for a partial update.

### Step 2: Type your URL

```
https://jsonplaceholder.typicode.com/todos/1
```

### Step 3: Add headers (if needed)

```javascript
Content-Type: application/json
Authorization: Bearer eyJhbGciOi...
```

### Step 4: Add a body (for POST/PUT)

```json
{
  "title": "Learn how to test an API",
  "completed": false
}
```

### Step 5: Click Send

You get:
- The **status code** (200 OK, 404 Not Found, 500 Server Error)
- The **response time** (in ms)
- The **size** of the response
- The formatted **body** (JSON pretty-print)
- The response **headers**

## The 4 HTTP code families you need to know by heart

| Code | Meaning | Action |
|---|---|---|
| **2xx** | All good | Carry on |
| **3xx** | Redirection | Follow the redirect |
| **4xx** | You messed up | Fix your client code |
| **5xx** | The server messed up | Fix the backend |

**Useful details**:
- `200 OK`: success
- `201 Created`: resource created (POST)
- `204 No Content`: success but nothing to return (DELETE)
- `400 Bad Request`: your request is malformed
- `401 Unauthorized`: you're not authenticated
- `403 Forbidden`: you're authenticated but not allowed
- `404 Not Found`: the resource doesn't exist
- `429 Too Many Requests`: rate limit, wait
- `500 Internal Server Error`: the server crashed
- `503 Service Unavailable`: the server is down or under maintenance

## How to debug a 401 Unauthorized

You get a 401 on your protected endpoint. Here's how to diagnose it:

1. **Check your `Authorization` header**: is the token actually there?
2. **Decode your JWT**: has it expired? → [JWT Decoder](https://jchub.io/outils/jwt-decoder)
3. **Check the scheme**: `Bearer` or `Basic`? What does the backend expect?
4. **Test with curl**: `curl -H "Authorization: Bearer xxx" https://api.com/me`
5. **Look at the server logs**: there's often more info on the backend side

## The workflow I use every day

```
1. Test locally with my API Tester
2. Check the status, the body, the headers
3. Copy the generated code (fetch, axios, cURL)
4. Paste it into my production code
5. Test in staging
6. Deploy
```

**Tip**: for APIs with restrictive CORS, I generate the cURL code, paste it into my terminal, and the CORS issue goes away.

## The feature that changes everything: code generation

You make a POST request with a JSON body and an Authorization header, then click "Code". The tool gives you:

```javascript
// fetch
const response = await fetch('https://api.com/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbG...'
  },
  body: JSON.stringify({ name: 'Jean', email: 'jean@example.com' })
});
const data = await response.json();
```

```python
# Python requests
import requests
response = requests.post(
    'https://api.com/users',
    headers={'Authorization': 'Bearer eyJhbG...'},
    json={'name': 'Jean', 'email': 'jean@example.com'}
)
```

```bash
# cURL
curl -X POST 'https://api.com/users' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbG...' \
  -d '{"name": "Jean", "email": "jean@example.com"}'
```

Copy it, paste it into your project, and you're done. No guessing the syntax.

## TL;DR

- **3 alternatives to Postman**: Insomnia (native), Hoppscotch (web), Bruno (CLI + files)
- **My free tool**: [jchub.io/outils/api-tester](https://jchub.io/outils/api-tester) (29 KB, in the browser)
- **HTTP codes**: 2xx = OK, 4xx = you messed up, 5xx = the server messed up
- **Code generation**: copy-paste straight into your project
- **For CORS**: generate the cURL and test in the terminal

---

**Want to try it?** Go to [JcHub API Tester](https://jchub.io/outils/api-tester), paste any URL, and see.

There are also 13 other free dev tools on JcHub → [jchub.io/outils](https://jchub.io/outils)
