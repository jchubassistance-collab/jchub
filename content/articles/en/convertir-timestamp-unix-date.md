---
slug: convert-unix-timestamp-to-date
title: 'Unix Timestamp: How to Convert 1704067200 to a Readable Date (and Vice Versa)'
description: >-
  You receive a 10-digit number from your backend and don't know what it is?
  It's a Unix timestamp. Here's how to decode it in 30 seconds.
excerpt: >-
  Unix Timestamp: How to Convert 1704067200 to a Readable Date The other day, I
  was debugging an API. I received a JSON payload with a field 'created_at': ...
keywords:
  - unix timestamp
  - epoch time
  - convert timestamp
  - javascript date
  - unix timestamp
  - epoch converter
sourceHash: 0c4dc8a91f637a140811600c
translatedAt: '2026-10-30T07:52:57.334Z'
---
# Unix Timestamp: How to Convert 1704067200 to a Readable Date

The other day, I was debugging an API. I received a JSON payload with a field `"created_at": 1704067200`. I scratched my head. What the heck is this?

It's a **Unix timestamp** (also called "epoch time"). It's the number of seconds elapsed since January 1, 1970, at midnight UTC.

And guess what: **1704067200 = January 1, 2024 at 00:00:00 UTC**.

This is the format most backends use because it's simple to store (a number, not a 30-char string) and easy to compare (just a subtraction).

## How to Convert It in 30 Seconds

### Method 1: Online Tool (Fastest)

Go to [JcHub Timestamp Converter](https://jchub.dev/fr/outils/convertisseur-timestamp), paste your number, and you'll get the conversion in:

- **Local Date** (according to your timezone)
- **UTC Date** (universal time)
- **ISO 8601** (standard format: `2024-01-01T00:00:00Z`)
- **Relative Date** ("8 months ago", "in 2 days")

You can also convert in the other direction: type "January 1, 2030" and get the timestamp.

### Method 2: JavaScript (in the Console)

```javascript
// Unix Timestamp → Date
const timestamp = 1704067200;
const date = new Date(timestamp * 1000); // ⚠️ Multiply by 1000 (to ms)
console.log(date.toISOString());
// "2024-01-01T00:00:00.000Z"

// Date → Unix Timestamp
const now = Math.floor(Date.now() / 1000);
console.log(now);
// 1724616000 (for example)
```

⚠️ **The classic pitfall**: JavaScript's `Date()` expects **milliseconds**, not seconds. So you multiply by 1000.

In Python it's the opposite:

```python
import datetime
timestamp = 1704067200
date = datetime.datetime.fromtimestamp(timestamp)
# 2024-01-01 00:00:00
```

### Method 3: Bash (on the Server)

```bash
# Linux/Mac
date -d @1704067200
# Mon Jan  1 00:00:00 UTC 2024

# Mac (BSD date)
date -r 1704067200

# Windows PowerShell
[DateTimeOffset]::FromUnixTimeSeconds(1704067200).DateTime
```

## The 3 Classic Pitfalls with Timestamps

### 1. **Seconds vs Milliseconds**

JavaScript `Date.now()` returns **ms**.
PHP `time()` returns **seconds**.
Python `time.time()` returns **seconds** (but `datetime.now()` returns µs).
APIs often use seconds.

If you mix them up, you get a bug dating back to 1970 or the year 5138. It's fun, but it crashes your app.

### 2. **Timezone**

A Unix timestamp is **always in UTC**. When you convert it to a date, it displays in **your local timezone**.

For example, `1704067200`:
- UTC: January 1, 2024 at 00:00
- Paris (UTC+1): January 1, 2024 at 01:00
- Brazzaville (UTC+1): January 1, 2024 at 01:00
- New York (UTC-5): December 31, 2023 at 19:00

So if you're comparing dates from different countries, **normalize everything to UTC**.

### 3. **2038, It's in 18 Years**

32-bit (signed) timestamps max out at **2,147,483,647** (January 19, 2038, at 03:14:07 UTC). After that, it overflows.

Most modern systems use 64-bit, so no problem. But if you're working on an old embedded system, be careful.

## Why It's So Popular

Unix timestamps have 3 advantages:

1. **Compact**: A number instead of an ISO 8601 string (10 chars vs 25+)
2. **Comparable**: `>` `<` `=` work directly
3. **Universal**: No format issues (MM/DD/YYYY vs DD/MM/YYYY)

That's why databases (PostgreSQL, MySQL, MongoDB) often store dates as timestamps.

## Real-World Use Cases

- **Server logs**: "This error happened at 1704067200" → easy to store
- **Sessions**: "Your session expires in 3600 seconds"
- **JWT**: `exp` (expiration) and `iat` (issued at) are timestamps
- **Cache**: "This cache is valid until X"
- **Git commits**: `git log --format=%ct` returns a timestamp

## TL;DR

- **1704067200** = January 1, 2024 at 00:00 UTC
- To convert: `new Date(timestamp * 1000)` in JS
- Multiply by 1000 in JS (ms), not in Python
- Always in UTC, convert to local on the frontend
- Quick tool: [jchub.dev/fr/outils/convertisseur-timestamp](https://jchub.dev/fr/outils/convertisseur-timestamp)

---

**Working on an API and your dates come in a JWT?** My free [JWT decoder](https://jchub.dev/fr/outils/decodeur-jwt) shows you the token's content, including `exp` and `iat`.

And if you have other dev questions, I have 14 free online tools on JcHub → [jchub.dev/fr/outils](https://jchub.dev/fr/outils)
