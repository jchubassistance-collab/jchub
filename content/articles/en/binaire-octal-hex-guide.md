---
slug: binary-octal-decimal-hexadecimal-guide
title: 'Binary, Octal, Decimal, Hexadecimal: The Guide to Never Confuse Them Again'
description: >-
  Still mixing up binary and hex? Here's a simple explanation with concrete
  examples (CSS colors, memory addresses, ASCII).
excerpt: >-
  Binary, Octal, Decimal, Hexadecimal: The Guide to Never Confuse Them Again My
  first computer science class, the teacher writes 0b1010 on the board. I'm
  lost. Another student whispers: 'That's 10 in binary'.
keywords:
  - binary
  - hexadecimal
  - octal
  - binary conversion
  - binary number
  - ascii table
  - base 2 8 16
sourceHash: 919c996bb0c58091685aee57
translatedAt: '2026-11-02T07:51:47.218Z'
---
# Binary, Octal, Decimal, Hexadecimal: The Guide to Never Confuse Them Again

My first computer science class, the teacher writes `0b1010` on the board. I'm lost. Another student whispers: "That's 10 in binary."

10 in binary? But `1010` is 10 characters, how does that equal 10?!

It took me 6 months to really understand. Here's the explanation I wish I had.

## The Basics: It's Just a Counting Convention

We all count in **base 10** (decimal) because we have 10 fingers. But the computer has 2 fingers (0 or 1). So it counts in **base 2** (binary).

A "base" is just **how many different digits** you use for counting:

| Base | Name | Digits Used |
|---|---|---|
| 2 | Binary | 0, 1 |
| 8 | Octal | 0-7 |
| 10 | Decimal | 0-9 |
| 16 | Hexadecimal | 0-9, A-F |

**The value** of a number is the same. It's just the **representation** that changes.

```
Decimal:  10
Binary:  1010
Octal:    12
Hex:     A
```

→ All of these represent the **same quantity**: ten.

## How to Convert (The Simple Method)

### Decimal → Binary (division by 2)

```
10 in decimal:
10 ÷ 2 = 5 remainder 0
5 ÷ 2 = 2 remainder 1
2 ÷ 2 = 1 remainder 0
1 ÷ 2 = 0 remainder 1

→ Read from bottom to top: 1010
```

### Decimal → Hex (division by 16)

```
255 in decimal:
255 ÷ 16 = 15 remainder 15 (= F)
15 ÷ 16 = 0 remainder 15 (= F)

→ Read from bottom to top: FF
```

### Binary → Hex (by groups of 4)

This is the most useful conversion. Every group of 4 bits = 1 hex digit.

```
1010 1111 (binary)
↓     ↓
A     F    (hex)
```

So `10101111` (binary) = `AF` (hex) = `175` (decimal).

### Hex → Binary (reverse)

```
A    F    (hex)
↓    ↓
1010 1111 (binary)
```

Easy, right?

## Why Hexadecimal is So Popular in Computing

**1 hex character = 4 bits = 1 nibble**

So 2 hex characters = 8 bits = 1 byte (1 byte). This is the perfect size for representing:

### 1. **CSS Colors**

```css
.red-pure { color: #FF0000; }  /* R=FF, G=00, B=00 */
.green-pure  { color: #00FF00; }  /* R=00, G=FF, B=00 */
.blue-pure  { color: #0000FF; }  /* R=00, G=00, B=FF */
```

`#FF0000` = 3 bytes = 24 bits = 16,777,216 possible colors.

### 2. **Memory Addresses**

```
0x7ffeeb2bd000  (stack address)
0x00000000      (null address)
0xDEADBEEF      (debug pattern)
```

### 3. **ASCII Characters**

```
'A' = 0x41 = 65 = 0b01000001
'Z' = 0x5A = 90
'0' = 0x30 = 48
```

The ASCII table is super clean in hex. Each character takes up 2 digits.

### 4. **Hashes**

```javascript
// SHA-256
const hash = "a3f5b8c9d2e1...";  // 64 hex characters = 256 bits
```

## The Conversion Table to Memorize by Heart

| Decimal | Binary | Hex |
|---|---|---|
| 0 | 0000 | 0 |
| 1 | 0001 | 1 |
| 2 | 0010 | 2 |
| 3 | 0011 | 3 |
| 4 | 0100 | 4 |
| 5 | 0101 | 5 |
| 6 | 0110 | 6 |
| 7 | 0111 | 7 |
| 8 | 1000 | 8 |
| 9 | 1001 | 9 |
| 10 | 1010 | A |
| 11 | 1011 | B |
| 12 | 1100 | C |
| 13 | 1101 | D |
| 14 | 1110 | E |
| 15 | 1111 | F |
| 16 | 0001 0000 | 10 |
| 32 | 0010 0000 | 20 |
| 64 | 0100 0000 | 40 |
| 128 | 1000 0000 | 80 |
| 255 | 1111 1111 | FF |

Memorize at least 0-15. The rest, you can figure out.

## How to Convert Quickly

### In JavaScript

```javascript
// Decimal → Hex
const dec = 255;
const hex = dec.toString(16);  // "ff"
const hexUpper = dec.toString(16).toUpperCase();  // "FF"

// Hex → Decimal
const hex = "FF";
const dec = parseInt(hex, 16);  // 255

// Decimal → Binary
const dec = 10;
const bin = dec.toString(2);  // "1010"

// Binary → Decimal
const bin = "1010";
const dec = parseInt(bin, 2);  // 10
```

### In Python

```python
# Decimal → Hex
hex(255)        # '0xff'
hex(255)[2:]    # 'ff'

# Hex → Decimal
int("FF", 16)   # 255

# Decimal → Binary
bin(10)         # '0b1010'
bin(10)[2:]     # '1010'

# Binary → Decimal
int("1010", 2)  # 10

# Octal
oct(8)          # '0o10'
int("10", 8)    # 8
```

### Online Tool

My [Number Base Converter](https://jchub-tools.com/number-base-converter) does instant conversion between all 4 bases. Very useful for debugging bit shifts.

## Common Pitfalls

### 1. **Confusing Binary and Hex**

```javascript
parseInt("1010", 2)   // 10 (binary)
parseInt("1010", 10)  // 1010 (decimal)
parseInt("1010", 16)  // 4112 (hex)

⚠️ Always specify the base in parseInt!
```

### 2. **Forgetting the Prefix**

```javascript
// In JS, "0x" = hex, "0b" = binary, "0o" = octal
0xFF    // 255
0b1010  // 10
0o10    // 8
```

### 3. **Number Sign**

An unsigned byte: 0 to 255.
A signed byte: -128 to 127.

This is the basis of the **sign bit** (the leftmost bit).

### 4. **Endianness**

`0x1234` can be stored as:
- **Big-endian**: `0x12 0x34` (network)
- **Little-endian**: `0x34 0x12` (x86, ARM)

If you're reading raw bytes from a file or network, this is crucial.

## TL;DR

- **Base** = counting convention (2, 8, 10, 16)
- **1 hex digit** = 4 bits = 1 nibble
- **2 hex digits** = 8 bits = 1 byte
- **Used for**: CSS colors, memory addresses, ASCII, hashes
- **Quick conversion**: binary ↔ hex = groups of 4 bits
- **Free tool**: [jchub.dev/fr/outils/convertisseur-de-bases](https://jchub.dev/fr/outils/convertisseur-de-bases)

---

**Debugging a binary payload and need quick conversion?** My [Number Base Converter](https://jchub.dev/fr/outils/convertisseur-de-bases) does all 4 conversions in real-time.

There are 14 free dev tools on JcHub → [jchub.dev/fr/outils](https://jchub.dev/fr/outils)
