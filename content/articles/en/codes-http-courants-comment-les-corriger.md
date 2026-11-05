---
slug: common-http-status-codes-and-how-to-fix-them
title: The most common HTTP status codes and how to fix them
description: >-
  400, 401, 403, 404, 429, 500, 502: what each HTTP error code means, where it
  usually comes from and how to fix it, on the client or the server.
excerpt: >-
  400, 401, 403, 404, 429, 500, 502: what each HTTP error code means, where it
  usually comes from and how to fix it, on the client or the server.
keywords:
  - http status codes
  - 404 error
  - 500 error
  - 403 error
  - 429 error
  - http error codes
sourceHash: 55d32a2314eb9e28ef65b4c8
translatedAt: '2026-11-04T14:17:50.068Z'
---
Your app shows “Error 403”, your API returns a 422 nobody understands, or your site hits a 502 at the worst possible moment. Every HTTP code is a clue: it tells you **who** got it wrong, the client or the server, and often **why**. Here are the codes you will meet most often, and what to check for each one.

## Read an HTTP code in one second

The first digit is enough to know where to look:

- **2xx**: everything went fine (200, 201, 204).
- **3xx**: redirect to another address (301, 302, 304).
- **4xx**: the **request** is the problem. The client has to fix it.
- **5xx**: the **server** failed. The request may well have been correct.

Keep our [HTTP status codes cheat sheet](/en/resources/http-status-codes) at hand too, free as a PDF.

## See the real code before fixing anything

A nice error page can hide the real code. To see it:

- **In the browser**: open the developer tools (F12), **Network** tab, reload the page and click the request shown in red.
- **From the command line**: `curl -i https://example.com/api/products` prints the code and the response headers.

Read the response **body** too: many APIs explain the error in plain words there. If the JSON is unreadable, paste it into the [JSON formatter](/en/tools/json-formatter).

## 400 Bad Request: the request is malformed

**Usual causes**: invalid JSON (an extra comma, a missing quote), a required parameter left out, the wrong `Content-Type`.

**Check**: is the body valid JSON? Is the `Content-Type: application/json` header there? Do the field names match the documentation exactly? One capital letter is enough to break everything.

## 401 Unauthorized vs 403 Forbidden: the classic mix-up

- **401** means “I don’t know who you are”: token missing, expired or badly sent.
- **403** means “I know who you are, but you’re not allowed”: insufficient role, resource belonging to another user.

**For a 401**: check the `Authorization: Bearer …` header and, above all, the token’s expiry date. The [JWT decoder](/en/tools/jwt-decoder) shows its `exp` field at a glance.

**For a 403**: the problem is not the token but the permissions. Look at the user’s role and the server’s access rules. Signing in again won’t change a thing.

## 404 Not Found: nothing at this address

**On a website**: broken link, page deleted or moved without a redirect. If the page moved, set up a **301 redirect** to the new address to keep both visitors and search rankings.

**On an API**: a typo in the URL, the wrong version (`/v1` instead of `/v2`), an ID that doesn’t exist, or a special character not encoded in the address. For the last one, the [URL encoder](/en/tools/url-encoder) saves you from the traps of spaces and accents.

## 405, 413, 415: the request isn’t accepted as is

- **405 Method Not Allowed**: right address, wrong method. You send a `POST` where only a `GET` is expected.
- **413 Content Too Large**: the file or body is too heavy. Compress the file, or raise the server limit if that’s intended.
- **415 Unsupported Media Type**: the format sent isn’t accepted. Check the `Content-Type` and the file extension.

## 422 Unprocessable Content: the data fails validation

The request is well formed, but its content is rejected: invalid email, a date in the past, a field too long. A good API returns the list of fields in error in the response body: read it and fix them one by one.

## 429 Too Many Requests: too many calls

You are over the allowed request limit. **The fix**:

- Respect the `Retry-After` header when it’s present.
- Add a growing delay between retries.
- Cache responses that rarely change, to call the API less often.

To know in advance whether your traffic will fit within the limit, estimate your request volume with the [API Cost Calculator](/en/tools/api-cost-calculator).

## 500 Internal Server Error: the server crashed

It’s an unexpected error in the server code: an unhandled exception, a missing environment variable, an unreachable database. **The message shown to the visitor won’t help you**: the real explanation is in the **server logs**, at the exact time of the request. Always start there.

## 502, 503, 504: a problem between servers

- **502 Bad Gateway**: a server in between (proxy, load balancer) got an invalid response from the next server. Often the application behind it crashed or isn’t running.
- **503 Service Unavailable**: server under maintenance or overloaded. Usually temporary.
- **504 Gateway Timeout**: the next server took too long to answer. Look for the slow call: an external API, a database query without an index.

## Key takeaways

- **4xx**: fix the request. **5xx**: read the server logs.
- **401** = not identified, **403** = identified but not allowed.
- Always read the response body: the explanation is often written there.
- A moved page deserves a **301** redirect, not a 404.

Keep the [HTTP status codes cheat sheet](/en/resources/http-status-codes) handy for the rarer codes.
