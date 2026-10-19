---
slug: format-debug-minified-json
title: "Minified JSON = 5,000 characters on one line? Here's how to format it"
description: "Getting JSON on a single line and can't read anything? Here's how to format it, debug it and validate it in 10 seconds."
excerpt: "Minified JSON = 5,000 characters on one line? Here's how to format it. 3 days ago, I was debugging an API. I opened the Chrome console and saw this..."
keywords:
  - json formatter
  - format json
  - json validator
  - json pretty print
  - online json
  - minified json
sourceHash: b8911bcb38a297f2eb1b90cc
translatedAt: '2026-10-19T07:58:02.240Z'
---
# Minified JSON = 5,000 characters on one line? Here's how to format it

3 days ago, I was debugging an API. I opened the Chrome console and saw this:

```json
{"id":12345,"name":"Jean Dupont","email":"jean@example.com","address":{"street":"123 Rue de la Paix","city":"Brazzaville","country":"CG","zip":""},"orders":[{"id":1,"total":99.99,"items":[{"productId":"abc","qty":2,"price":49.99}]},{"id":2,"total":149.50,"items":[{"productId":"def","qty":1,"price":149.50}]}],"preferences":{"theme":"dark","language":"fr","notifications":true,"newsletter":false}}
```

5,000 characters on one line. My eyes hurt just reading it.

10 seconds later, I had the readable version:

```json
{
  "id": 12345,
  "name": "Jean Dupont",
  "email": "jean@example.com",
  "address": {
    "street": "123 Rue de la Paix",
    "city": "Brazzaville",
    "country": "CG",
    "zip": ""
  },
  "orders": [
    {
      "id": 1,
      "total": 99.99,
      "items": [
        { "productId": "abc", "qty": 2, "price": 49.99 }
      ]
    },
    {
      "id": 2,
      "total": 149.50,
      "items": [
        { "productId": "def", "qty": 1, "price": 149.50 }
      ]
    }
  ],
  "preferences": {
    "theme": "dark",
    "language": "fr",
    "notifications": true,
    "newsletter": false
  }
}
```

Here's how I do it.

## 4 ways to format JSON

### 1. **Chrome DevTools (already open)**

In the Network tab → Preview, Chrome formats JSON automatically. But that doesn't work if you pasted the JSON into the console.

In the console, just type:

```javascript
const data = {"id":12345,"name":"Jean Dupont", /* ... */};
console.log(JSON.stringify(JSON.parse(data), null, 2));
```

The `2` is the indentation (number of spaces).

### 2. **VS Code (my favorite for code)**

Paste your minified JSON, then:
- **Shift + Alt + F** (Windows/Linux) or **Shift + Option + F** (Mac) to format
- Or right-click → "Format Document"

VS Code automatically detects that it's JSON and indents it cleanly.

### 3. **jq (the CLI champion)**

```bash
# Installation
brew install jq        # Mac
apt install jq         # Linux
choco install jq       # Windows

# Usage
echo '{"id":12345,"name":"Jean"}' | jq .
# {
#   "id": 12345,
#   "name": "Jean"
# }

# Advanced filters
curl -s https://api.github.com/users/jchub | jq '.name, .bio, .public_repos'
# "JcHub"
# "Smart Learning & Career Ecosystem"
# 42
```

`jq` is the best CLI tool to manipulate JSON. Learn it, it'll save you hours.

### 4. **Online tool (for non-devs or when you're in a rush)**

I have a [free JSON Formatter](https://jchub.io/outils/json-formatter) on JcHub. Paste, click, and you get the formatted version. Bonus: it tells you whether your JSON is valid (parsing errors).

## How to debug invalid JSON

You paste your JSON into a parser and get:

```
SyntaxError: Unexpected token } at position 245
```

Here are the 5 most common mistakes:

### 1. **Trailing comma**

```json
{
  "name": "Jean",  ← trailing comma
}
```

### 2. **Missing quotes**

```json
{
  name: "Jean"  ← name must be in quotes
}
```

### 3. **Single quotes instead of double quotes**

```json
{
  'name': 'Jean'  ← JSON wants double quotes, not single
}
```

### 4. **JSON comment (impossible)**

```json
{
  // comment  ← JSON does NOT support comments
  "name": "Jean"
}
```

If you need comments, use **JSON5** or **JSONC** (VS Code supports them).

### 5. **Forgotten escape character**

```json
{
  "message": "He said \"Hello\""  ← OK, correct escaping
  "message": "He said "Hello""    ← ❌ broken
}
```

## The trick nobody tells you: JSON Schema

If you work with an API that returns complex JSON, **generate a JSON Schema**. It's a file that describes the expected structure.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "id": { "type": "number" },
    "name": { "type": "string" },
    "email": { "type": "string", "format": "email" },
    "preferences": {
      "type": "object",
      "properties": {
        "theme": { "type": "string", "enum": ["light", "dark"] }
      }
    }
  },
  "required": ["id", "name", "email"]
}
```

Then validate your JSON against the schema. If the API changes and returns something unexpected, you'll know right away.

Tools to generate a schema from JSON:
- [jsonschema.net](https://www.jsonschema.net/)
- VS Code with the "JSON to JSON Schema" extension

## The workflow I use

```
1. The API returns JSON → I copy it
2. I paste it into my JSON Formatter
3. I check that it's valid
4. I copy the formatted version
5. I paste it into VS Code to analyze it
6. I code my parser/consumer
```

If the JSON comes up often, I generate a JSON Schema and use it to validate every response.

## TL;DR

- **Badly formatted JSON** = guaranteed sore eyes
- **VS Code**: Shift+Alt+F to format
- **Chrome console**: `JSON.stringify(JSON.parse(data), null, 2)`
- **jq** on the CLI for advanced filters
- **Quick tool**: [jchub.io/outils/json-formatter](https://jchub.io/outils/json-formatter)
- **5 common mistakes**: trailing comma, missing quotes, single quotes, comments, escaping

---

**Working on an API and need to test it quickly?** My [API Tester](https://jchub.io/outils/api-tester) formats JSON responses automatically. Combined with the JSON Formatter, you're all set.

There are 14 free dev tools on JcHub → [jchub.io/outils](https://jchub.io/outils)

