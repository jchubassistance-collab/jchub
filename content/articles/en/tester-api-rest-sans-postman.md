---
slug: test-rest-api-without-postman
title: 'How to Test a REST API Without Postman (Free, In Your Browser)'
description: >-
  Tired of Postman's 200 MB install size and mandatory account sign-in? Here are
  3 lightweight alternatives, including one that's 100% free with zero
  installation required.
excerpt: >-
  How to test a REST API without Postman (free, in the browser) I've been using
  Postman since 2017. But in 2024, I decided to stop using it. Why?...
keywords:
  - api tester
  - postman alternative
  - free http client
  - rest client
  - test api
  - http request
  - postman vs insomnia
sourceHash: 8866a73bad40ce7a0f41206e
translatedAt: '2026-11-07T07:52:18.831Z'
---
# How to Test a REST API Without Postman (Free, In Your Browser)

I've been using Postman since 2017. But in 2024, I decided to stop using it. Why?

- A 200 MB install size
- A mandatory account just to sync
- An Electron app that hogs 1.5 GB of RAM
- Premium features hidden behind a paywall

I looked for an alternative. I found 3 worth checking out, plus a tool you already have on your machine.

## The 3 Alternatives to Postman in 2026

### 1. **Insomnia** (the open-source option)

- ✅ Free and open-source
- ✅ Lighter than Postman (~80 MB)
- ❌ Account optional (but syncing is a hassle without one)
- ❌ Quite a few paid features now

**Best for**: Developers who want a native app, not a web tool.

### 2. **Hoppscotch** (the open-source web option)

- ✅ 100% web-based, zero installation
- ✅ Open-source
- ✅ Self-hostable
- ❌ UI can feel a bit cluttered
- ✅ Generates request code for you (cURL, fetch, axios, Python…)

**Best for**: Developers who want a free, open-source, web-based tool.

### 3. **Bruno** (the new challenger)

- ✅ Open-source
- ✅ Stores requests as `.bru` files right inside your repo
- ✅ Version-controlled with Git (no more lost collections)
- ❌ Requires installing a desktop app

**Best for**: Teams looking to version control their API requests alongside their codebase.

## The Bonus: curl, Already Installed

Before installing anything, check your terminal. `curl` comes pre-installed on macOS, Linux, and Windows 10/11.

```bash
curl -i https://jsonplaceholder.typicode.com/todos/1
```

- ✅ Nothing to install, no account required
- ✅ No CORS issues: the request doesn't run in a browser
- ❌ Less convenient for large JSON payloads

**Best for**: Quick tests and shell scripts.

**Known limitation of web tools**: CORS might block certain requests sent from the browser. Hoppscotch offers an extension and a proxy to work around this. Otherwise, fall back to curl.

## How to Test an API in 5 Steps

### Step 1: Choose Your Method

`GET` to read, `POST` to create, `PUT` to update, `DELETE` to delete, `PATCH` for partial updates.

### Step 2: Enter Your URL

```
https://jsonplaceholder.typicode.com/todos/1
```

### Step 3: Add Headers (If Needed)

```javascript
Content-Type: application/json
Authorization: Bearer eyJhbGciOi...
```

### Step 4: Add a Request Body (for POST/PUT)

```json
{
  "title": "Learn how to test an API",
  "completed": false
}
```

### Step 5: Click Send

You get back:
- The **status code** (200 OK, 404 Not Found, 500 Server Error)
- The **response time** (in ms)
- The **size** of the response
- The formatted **body** (pretty-printed JSON)
- The response **headers**

## The 4 HTTP Code Ranges You Need to Know by Heart

| Code | Meaning | Action |
|---|---|---|
| **2xx** | Everything is good | Keep going |
| **3xx** | Redirection | Follow the redirect |
| **4xx** | You messed up | Fix your client code |
| **5xx** | The server messed up | Fix the backend |

**Useful details**:
- `200 OK`: Success
- `201 Created`: Resource created (POST)
- `204 No Content`: Success, but nothing to return (DELETE)
- `400 Bad Request`: Your request is malformed
- `401 Unauthorized`: You're not authenticated
- `403 Forbidden`: You're authenticated, but don't have permission
- `404 Not Found`: Resource doesn't exist
- `429 Too Many Requests`: Rate-limited, slow down and wait
- `500 Internal Server Error`: Server crashed
- `503 Service Unavailable`: Server is down or under maintenance

## How to Debug a 401 Unauthorized

You get a 401 on your protected endpoint. Here's how to diagnose it:

1. **Check your `Authorization` header**: Is the token actually present?
2. **Decode your JWT**: Has it expired? → [JWT Decoder](https://jchub.dev/fr/outils/decodeur-jwt)
3. **Check the scheme**: `Bearer` or `Basic`? What is the backend expecting?
4. **Test with curl**: `curl -H "Authorization: Bearer xxx" https://api.com/me`
5. **Check the server logs**: There's often more detailed info on the backend side

## The Workflow I Use Every Day

```
1. Test locally with Hoppscotch (or curl)
2. Check status, body, and headers
3. Copy generated code (fetch, axios, cURL)
4. Paste into my production code
5. Test in staging
6. Deploy
```

**Pro tip**: For APIs with strict CORS policies, I generate the cURL command, paste it into my terminal, and bypass CORS altogether.

## The Game-Changing Feature: Code Generation

You make a POST request with a JSON body and an Authorization header. Hoppscotch, Insomnia, and Bruno can all generate the corresponding code:

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

You copy, paste it into your project, and you're good to go. No syntax guessing required.

## TL;DR

- **3 Postman alternatives**: Insomnia (native), Hoppscotch (web), Bruno (file-based requests)
- **Zero-install option**: curl, straight from your terminal
- **HTTP status codes**: 2xx = all good, 4xx = you messed up, 5xx = server messed up
- **Code generation**: Direct copy-paste into your codebase
- **For CORS issues**: Generate cURL and test in your terminal

---

**Getting a 401?** Paste your token into my [JWT decoder](https://jchub.dev/fr/outils/decodeur-jwt) to check if it's expired.

Find more free developer tools on JcHub → [jchub.dev/fr/outils](https://jchub.dev/fr/outils)
