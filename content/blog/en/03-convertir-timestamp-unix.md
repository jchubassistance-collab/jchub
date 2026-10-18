---
slug: convert-unix-timestamp-to-date
title: "Unix timestamp: how to convert 1704067200 into a readable date (and back)"
description: "Getting a 10-digit number from your backend and no idea what it is? It's a Unix timestamp. Here's how to decode it in 30 seconds."
excerpt: "Unix timestamp: how to convert 1704067200 into a readable date. The other day, I was debugging an API. I got a JSON payload with a \"created_at\" field..."
keywords: ["unix timestamp","epoch time","convert timestamp","javascript date","unix time","epoch converter"]
---
# Unix timestamp: how to convert 1704067200 into a readable date

The other day, I was debugging an API. I got a JSON payload with a `"created_at": 1704067200` field. I scratched my head. What on earth is that?

It's a **Unix timestamp** (also called "epoch time"). It's the number of seconds elapsed since January 1, 1970 at midnight UTC.

And guess what: **1704067200 = January 1, 2024 at 00:00:00 UTC**.

It's the format most backends use because it's simple to store (a number, not a 30-character string) and easy to compare (just a subtraction).

## How to convert it in 30 seconds

### Method 1: Online tool (the fastest)

Go to the [JcHub Timestamp Converter](https://jchub.io/outils/timestamp-converter), paste your number, and you get the conversion as:

- **Local date** (based on your time zone)
- **UTC date** (universal time)
- **ISO 8601** (standard format: `2024-01-01T00:00:00Z`)
- **Relative date** ("8 months ago", "in 2 days")

You can also convert the other way: type "January 1, 2030" and you get the timestamp.

### Method 2: JavaScript (in the console)

```javascript
// Unix timestamp → Date
const timestamp = 1704067200;
const date = new Date(timestamp * 1000); // ⚠️ Multiply by 1000 (in ms)
console.log(date.toISOString());
// "2024-01-01T00:00:00.000Z"

// Date → Unix timestamp
const now = Math.floor(Date.now() / 1000);
console.log(now);
// 1724616000 (for example)
```

⚠️ **The classic trap**: `Date()` in JavaScript expects **milliseconds**, not seconds. So you multiply by 1000.

In Python it's the opposite:

```python
import datetime
timestamp = 1704067200
date = datetime.datetime.fromtimestamp(timestamp)
# 2024-01-01 00:00:00
```

### Method 3: Bash (on the server)

```bash
# Linux/Mac
date -d @1704067200
# Mon Jan  1 00:00:00 UTC 2024

# Mac (BSD date)
date -r 1704067200

# Windows PowerShell
[DateTimeOffset]::FromUnixTimeSeconds(1704067200).DateTime
```

## The 3 classic timestamp traps

### 1. **Seconds vs milliseconds**

JavaScript `Date.now()` returns **ms**.
PHP `time()` returns **seconds**.
Python `time.time()` returns **seconds** (but `datetime.now()` has µs precision).
APIs often use seconds.

Mix the two up and you get a bug dated 1970 or the year 5138. It's funny, but it crashes your app.

### 2. **Time zone**

A Unix timestamp is **always in UTC**. When you convert it to a date, it's displayed in **your local time zone**.

For example, `1704067200`:
- UTC: January 1, 2024 at 00:00
- Paris (UTC+1): January 1, 2024 at 01:00
- Brazzaville (UTC+1): January 1, 2024 at 01:00
- New York (UTC-5): December 31, 2023 at 19:00

So if you compare dates from different countries, **normalize everything to UTC**.

### 3. **2038 is only 18 years away**

32-bit (signed) timestamps max out at **2,147,483,647** (January 19, 2038 at 03:14:07 UTC). After that, they overflow.

Most modern systems use 64 bits, so no problem there. But if you work on an old embedded system, watch out.

## Why it's used so much

Unix timestamps have 3 advantages:

1. **Compact**: a number instead of an ISO 8601 string (10 chars vs 25+)
2. **Comparable**: `>` `<` `=` work right away
3. **Universal**: no format issues (MM/DD/YYYY vs DD/MM/YYYY)

That's why databases (PostgreSQL, MySQL, MongoDB) often store dates as timestamps.

## Real use cases

- **Server logs**: "this error happened at 1704067200" → easy to store
- **Sessions**: "your session expires in 3600 seconds"
- **JWT**: `exp` (expiration) and `iat` (issued at) are timestamps
- **Cache**: "this cache is valid until X"
- **Git commits**: `git log --format=%ct` returns a timestamp

## TL;DR

- **1704067200** = January 1, 2024 at 00:00 UTC
- To convert: `new Date(timestamp * 1000)` in JS
- Multiply by 1000 in JS (ms), not in Python
- Always UTC, local conversion on the frontend
- Quick tool: [jchub.io/outils/timestamp-converter](https://jchub.io/outils/timestamp-converter)

---

**Working on an API and need to test your dates?** I also have a [free API Tester](https://jchub.io/outils/api-tester) to send your HTTP requests without Postman.

And if you have other dev questions, I have 14 free online tools on JcHub → [jchub.io/outils](https://jchub.io/outils)
