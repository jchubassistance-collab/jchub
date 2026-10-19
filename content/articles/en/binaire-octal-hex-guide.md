---
slug: binary-octal-decimal-hexadecimal-guide
title: 'Binary, octal, decimal, hexadecimal: the guide to never mix them up again'
description: "Still mixing up binary and hex? Here's a simple explanation with concrete examples (CSS colors, memory addresses, ASCII)."
excerpt: 'Binary, octal, decimal, hexadecimal: the guide to never mix them up again. In my first computer science class, the teacher wrote 0b1010 on the board. I was lost...'
keywords:
  - binary
  - hexadecimal
  - octal
  - binary conversion
  - binary number
  - ascii table
  - base 2 8 16
sourceHash: 469715f85919b72af44b0ac9
translatedAt: '2026-10-19T07:57:41.809Z'
---
# Binary, octal, decimal, hexadecimal: the guide to never mix them up again

In my first computer science class, the teacher wrote `0b1010` on the board. I was lost. Another student whispered: "It's 10 in binary."

10 in binary? But `1010` is 4 characters long, how does that make 10?!

It took me 6 months to really get it. Here's the explanation I wish I'd had.

## A base is just a counting convention

We all count in **base 10** (decimal) because we have 10 fingers. But a computer has 2 fingers (0 or 1). So it counts in **base 2** (binary).

A "base" is just **how many different digits** you use to count:

| Base | Name | Digits used |
|---|---|---|
| 2 | Binary | 0, 1 |
| 8 | Octal | 0-7 |
| 10 | Decimal | 0-9 |
| 16 | Hexadecimal | 0-9, A-F |

**The value** of a number stays the same. Only the **representation** changes.

```
Decimal:  10
Binary:   1010
Octal:    12
Hex:      A
```

→ All of these represent the **same quantity**: ten.

## How to convert (the simple method)

### Decimal → Binary (divide by 2)

```
10 in decimal:
10 ÷ 2 = 5 remainder 0
5 ÷ 2 = 2 remainder 1
2 ÷ 2 = 1 remainder 0
1 ÷ 2 = 0 remainder 1

→ Read from bottom to top: 1010
```

### Decimal → Hex (divide by 16)

```
255 in decimal:
255 ÷ 16 = 15 remainder 15 (= F)
15 ÷ 16 = 0 remainder 15 (= F)

→ Read from bottom to top: FF
```

### Binary → Hex (in groups of 4)

This is the most useful conversion. Each group of 4 bits = 1 hex digit.

```
1010 1111 (binary)
↓     ↓
A     F    (hex)
```

So `10101111` (binary) = `AF` (hex) = `175` (decimal).

### Hex → Binary (the reverse)

```
A    F    (hex)
↓    ↓
1010 1111 (binary)
```

Easy, right?

## Why hex is used so much in computing

**1 hex character = 4 bits = 1 nibble**

So 2 hex characters = 8 bits = 1 byte. That's the perfect size to represent:

### 1. **CSS colors**

```css
.pure-red   { color: #FF0000; }  /* R=FF, G=00, B=00 */
.pure-green { color: #00FF00; }  /* R=00, G=FF, B=00 */
.pure-blue  { color: #0000FF; }  /* R=00, G=00, B=FF */
```

`#FF0000` = 3 bytes = 24 bits = 16,777,216 possible colors.

### 2. **Memory addresses**

```
0x7ffeeb2bd000  (stack address)
0x00000000      (null address)
0xDEADBEEF      (debug pattern)
```

### 3. **ASCII characters**

```
'A' = 0x41 = 65 = 0b01000001
'Z' = 0x5A = 90
'0' = 0x30 = 48
```

The ASCII table is super clean in hex. Each character fits in 2 digits.

### 4. **Hashes**

```javascript
// SHA-256
const hash = "a3f5b8c9d2e1...";  // 64 hex characters = 256 bits
```

## The conversion table to know by heart

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

Memorize at least 0-15. You can work out the rest.

## How to convert quickly

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

### Online tool

My [Number Base Converter](https://jchub-tools.com/number-base-converter) converts instantly across all 4 bases. Really handy to debug a bit shift.

## The classic traps

### 1. **Mixing up binary and hex**

```javascript
parseInt("1010", 2)   // 10 (binary)
parseInt("1010", 10)  // 1010 (decimal)
parseInt("1010", 16)  // 4112 (hex)

⚠️ Always specify the base in parseInt!
```

### 2. **Forgetting the prefix**

```javascript
// In JS, "0x" = hex, "0b" = binary, "0o" = octal
0xFF    // 255
0b1010  // 10
0o10    // 8
```

### 3. **Signed numbers**

An unsigned byte: 0 to 255.
A signed byte: -128 to 127.

That's what the **sign bit** (the leftmost bit) is about.

### 4. **Endianness**

`0x1234` can be stored as:
- **Big-endian**: `0x12 0x34` (network)
- **Little-endian**: `0x34 0x12` (x86, ARM)

If you read raw bytes from a file or the network, this is crucial.

## TL;DR

- **Base** = counting convention (2, 8, 10, 16)
- **1 hex digit** = 4 bits = 1 nibble
- **2 hex digits** = 8 bits = 1 byte
- **Used for**: CSS colors, memory addresses, ASCII, hashes
- **Quick conversion**: binary ↔ hex = groups of 4 bits
- **Free tool**: [jchub.io/outils/number-base-converter](https://jchub.io/outils/number-base-converter)

---

**Debugging a binary payload and need a quick conversion?** My [Number Base Converter](https://jchub.io/outils/number-base-converter) does all 4 conversions in real time.

There are 14 free dev tools on JcHub → [jchub.io/outils](https://jchub.io/outils)

