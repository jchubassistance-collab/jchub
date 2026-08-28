---
title: "Binaire, octal, décimal, hexadécimal : le guide pour ne plus rien confondre"
description: "Tu mélanges encore binaire et hexa ? Voici l'explication simple avec des exemples concrets (couleurs CSS, addresses mémoire, ASCII)."
slug: binaire-octal-hex-guide
keywords: ["binaire", "hexadécimal", "octal", "conversion binaire", "nombre binaire", "ascii table", "base 2 8 16"]
author: Jessy Ngnambongo
date: 2026-08-25
category: Informatique
readingTime: 4 min
---

# Binaire, octal, décimal, hexadécimal : le guide pour ne plus rien confondre

Mon premier cours d'info, le prof écrit `0b1010` au tableau. Je suis perdu. Un autre étudiant me souffle : "C'est 10 en binaire".

10 en binaire ? Mais `1010` c'est 10 caractères, comment ça fait 10 ?!

J'ai mis 6 mois à vraiment comprendre. Voici l'explication que j'aurais aimé avoir.

## La base, c'est juste une convention de comptage

On compte tous en **base 10** (décimal) parce qu'on a 10 doigts. Mais l'ordinateur, lui, a 2 doigts (0 ou 1). Donc il compte en **base 2** (binaire).

Une "base", c'est juste **combien de chiffres différents** tu utilises pour compter :

| Base | Nom | Chiffres utilisés |
|---|---|---|
| 2 | Binaire | 0, 1 |
| 8 | Octal | 0-7 |
| 10 | Décimal | 0-9 |
| 16 | Hexadécimal | 0-9, A-F |

**La valeur** d'un nombre, c'est la même. C'est juste la **représentation** qui change.

```
Décimal :  10
Binaire :  1010
Octal :    12
Hexa :     A
```

→ Tous ces trucs représentent la **même quantité** : dix.

## Comment convertir (la méthode simple)

### Décimal → Binaire (division par 2)

```
10 en décimal :
10 ÷ 2 = 5 reste 0
5 ÷ 2 = 2 reste 1
2 ÷ 2 = 1 reste 0
1 ÷ 2 = 0 reste 1

→ On lit de bas en haut : 1010
```

### Décimal → Hexa (division par 16)

```
255 en décimal :
255 ÷ 16 = 15 reste 15 (= F)
15 ÷ 16 = 0 reste 15 (= F)

→ On lit de bas en haut : FF
```

### Binaire → Hexa (par groupe de 4)

C'est la conversion la plus utile. Chaque groupe de 4 bits = 1 chiffre hexa.

```
1010 1111 (binaire)
↓     ↓
A     F    (hexa)
```

Donc `10101111` (binaire) = `AF` (hexa) = `175` (décimal).

### Hexa → Binaire (inverse)

```
A    F    (hexa)
↓    ↓
1010 1111 (binaire)
```

Facile, non ?

## Pourquoi l'hexa est si utilisé en informatique

**1 caractère hexa = 4 bits = 1 nibble**

Donc 2 caractères hexa = 8 bits = 1 octet (1 byte). C'est la taille parfaite pour représenter :

### 1. **Les couleurs CSS**

```css
.rouge-pur { color: #FF0000; }  /* R=FF, G=00, B=00 */
.vert-pur  { color: #00FF00; }  /* R=00, G=FF, B=00 */
.bleu-pur  { color: #0000FF; }  /* R=00, G=00, B=FF */
```

`#FF0000` = 3 bytes = 24 bits = 16 777 216 couleurs possibles.

### 2. **Les adresses mémoire**

```
0x7ffeeb2bd000  (adresse stack)
0x00000000      (adresse nulle)
0xDEADBEEF      (pattern de debug)
```

### 3. **Les caractères ASCII**

```
'A' = 0x41 = 65 = 0b01000001
'Z' = 0x5A = 90
'0' = 0x30 = 48
```

La table ASCII est super clean en hexa. Chaque caractère tient sur 2 digits.

### 4. **Les hashs**

```javascript
// SHA-256
const hash = "a3f5b8c9d2e1...";  // 64 caractères hexa = 256 bits
```

## La table de conversion à connaître par cœur

| Décimal | Binaire | Hexa |
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

Mémorise au moins 0-15. Le reste, tu peux le déduire.

## Comment convertir rapidement

### En JavaScript

```javascript
// Décimal → Hexa
const dec = 255;
const hex = dec.toString(16);  // "ff"
const hexUpper = dec.toString(16).toUpperCase();  // "FF"

// Hexa → Décimal
const hex = "FF";
const dec = parseInt(hex, 16);  // 255

// Décimal → Binaire
const dec = 10;
const bin = dec.toString(2);  // "1010"

// Binaire → Décimal
const bin = "1010";
const dec = parseInt(bin, 2);  // 10
```

### En Python

```python
# Décimal → Hexa
hex(255)        # '0xff'
hex(255)[2:]    # 'ff'

# Hexa → Décimal
int("FF", 16)   # 255

# Décimal → Binaire
bin(10)         # '0b1010'
bin(10)[2:]     # '1010'

# Binaire → Décimal
int("1010", 2)  # 10

# Octal
oct(8)          # '0o10'
int("10", 8)    # 8
```

### Outil en ligne

Mon [Number Base Converter](https://jchub-tools.com/number-base-converter) te fait la conversion instant dans les 4 bases. Très utile pour débugger un décalage de bits.

## Les pièges classiques

### 1. **Confondre binaire et hexa**

```javascript
parseInt("1010", 2)   // 10 (binaire)
parseInt("1010", 10)  // 1010 (décimal)
parseInt("1010", 16)  // 4112 (hexa)

⚠️ Toujours préciser la base dans parseInt !
```

### 2. **Oublier le préfixe**

```javascript
// En JS, "0x" = hexa, "0b" = binaire, "0o" = octal
0xFF    // 255
0b1010  // 10
0o10    // 8
```

### 3. **Signe des nombres**

Un octet non signé : 0 à 255.
Un octet signé : -128 à 127.

C'est la base du **bit de signe** (le bit le plus à gauche).

### 4. **Endianness**

`0x1234` peut être stocké :
- **Big-endian** : `0x12 0x34` (réseau)
- **Little-endian** : `0x34 0x12` (x86, ARM)

Si tu lis des bytes bruts depuis un fichier ou un réseau, c'est crucial.

## TL;DR

- **Base** = convention de comptage (2, 8, 10, 16)
- **1 chiffre hexa** = 4 bits = 1 nibble
- **2 chiffres hexa** = 8 bits = 1 byte
- **Utilisé pour** : couleurs CSS, adresses mémoire, ASCII, hashs
- **Conversion rapide** : binaire ↔ hexa = groupes de 4 bits
- **Outil gratuit** : [jchub.io/outils/number-base-converter](https://jchub.io/outils/number-base-converter)

---

**Tu débugges un payload binaire et t'as besoin de convertir rapidement ?** Mon [Number Base Converter](https://jchub.io/outils/number-base-converter) fait les 4 conversions en temps réel.

Y'a 14 outils dev gratuits sur JcHub → [jchub.io/outils](https://jchub.io/outils)
