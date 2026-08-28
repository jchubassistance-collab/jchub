---
title: "Comment convertir une couleur HEX en RGB et HSL (avec exemples CSS réels)"
description: "Tu reçois un #3B82F6 du designer et tu sais pas comment l'utiliser ? Voici la conversion HEX → RGB → HSL expliquée simplement, avec des exemples Tailwind/CSS."
slug: convertir-couleur-hex-rgb
keywords: ["hex en rgb", "convertisseur couleur", "hsl css", "rgb to hex", "tailwind colors", "color picker"]
author: Jessy Ngnambongo
date: 2026-08-25
category: Frontend
readingTime: 4 min
---

# Comment convertir une couleur HEX en RGB et HSL (avec exemples CSS réels)

Le designer m'envoie une maquette Figma. Je copie une couleur : `#3B82F6`. Cool. Mais je veux l'utiliser dans Tailwind, dans un linear-gradient, et dans une variable CSS.

Sauf que `#3B82F6` c'est du HEX. Tailwind veut souvent du RGB. Et pour faire des variations plus claires/plus sombres, j'ai besoin de HSL.

Voici comment je m'en sors en 30 secondes.

## Les 3 formats que tu rencontres tout le temps

### HEX (le plus courant)

```css
.button {
  background: #3B82F6;
}
```

Format : `#RRGGBB` (Red, Green, Blue en hexa)
- `#FF0000` = rouge pur
- `#00FF00` = vert pur
- `#0000FF` = bleu pur
- `#3B82F6` = le bleu Tailwind `blue-500`

### RGB / RGBA

```css
.button {
  background: rgb(59, 130, 246);
  background: rgba(59, 130, 246, 0.5); /* 50% transparent */
}
```

Format : `rgb(R, G, B)` où chaque valeur est entre 0 et 255.

### HSL / HSLA

```css
.button {
  background: hsl(217, 91%, 60%);
  background: hsla(217, 91%, 60%, 0.5);
}
```

Format : `hsl(Hue, Saturation, Lightness)`
- **Hue** : 0-360 (la couleur sur le cercle chromatique)
- **Saturation** : 0-100% (vive ou terne)
- **Lightness** : 0-100% (sombre ou clair)

## Pourquoi HSL c'est le meilleur pour les variations

Imagine, tu dois faire un design system avec 10 variations de bleu.

**Avec HEX** : tu dois convertir 10 fois et prier pour que le designer accepte tes choix.

**Avec HSL** : tu changes juste la lightness.

```css
/* Toutes ces variations, c'est le même hue (217) */
--blue-50:  hsl(217, 91%, 97%);
--blue-100: hsl(217, 91%, 92%);
--blue-500: hsl(217, 91%, 60%);
--blue-900: hsl(217, 91%, 25%);
```

Tu vois comment Tailwind construit ses palettes ? C'est exactement ça.

## Comment convertir en 30 secondes

### Méthode 1 : Outil en ligne

J'ai un [Color Converter gratuit](https://jchub.io/outils/color-converter) sur JcHub. Tu colles ton HEX, t'as instantanément :
- Le code RGB
- Le code HSL
- Un aperçu visuel de la couleur
- Le nom de la couleur Tailwind équivalente (`blue-500`, etc.)

C'est ce que j'utilise au quotidien.

### Méthode 2 : JavaScript

```javascript
// HEX → RGB
const hex = "#3B82F6";
const r = parseInt(hex.slice(1, 3), 16); // 59
const g = parseInt(hex.slice(3, 5), 16); // 130
const b = parseInt(hex.slice(5, 7), 16); // 246
console.log(`rgb(${r}, ${g}, ${b})`);
// "rgb(59, 130, 246)"

// RGB → HSL (plus complexe, mais y'a des libs)
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatique
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
}
```

### Méthode 3 : CSS natif (depuis 2023)

```css
:root {
  --brand: #3B82F6;
}

/* CSS peut maintenant faire la conversion ! */
.button {
  background: rgb(from var(--brand) r g b);
  background: hsl(from var(--brand) h s l);
}
```

C'est la **relative color syntax**, supportée par Chrome 119+, Safari 16.4+, Firefox 128+. C'est game changer.

## Le truc que personne te dit : les couleurs en accessibilité

Tu prends `#3B82F6` (le bleu Tailwind). Sur fond blanc, le contraste est **4.58:1**. C'est OK pour du texte large, mais juste en-dessous de WCAG AA pour du body text (4.5:1 requis).

Si tu fais du body text, fonce un peu : `#1E40AF` (blue-800) → contraste 8.59:1 ✅

Pour vérifier, utilise l'outil [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/). Tu colles ta couleur de fond + couleur de texte, il te dit si c'est accessible.

## Les couleurs Tailwind = HSL sous le capot

Tailwind stocke ses couleurs en HSL, pas en HEX. C'est pour ça que tu peux utiliser la syntaxe `bg-blue-500/50` (50% d'opacité) aussi facilement.

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          50:  'hsl(217, 91%, 97%)',
          500: 'hsl(217, 91%, 60%)',
          900: 'hsl(217, 91%, 25%)',
        }
      }
    }
  }
}
```

Si tu codes ton design system en HSL, tu peux générer toutes les variations automatiquement.

## TL;DR

- **HEX** : `#{R}{G}{B}` (le plus courant)
- **RGB** : `rgb(R, G, B)` 0-255 (CSS classique)
- **HSL** : `hsl(H, S%, L%)` (le meilleur pour les variations)
- Tailwind stocke en HSL
- Outil rapide : [jchub.io/outils/color-converter](https://jchub.io/outils/color-converter)
- Pense à l'accessibilité (contraste WCAG)

---

**Tu bosses sur un design system et t'as besoin de générer des palettes ?** L'outil [Color Converter](https://jchub.io/outils/color-converter) te montre toutes les conversions + un aperçu live.

Et si t'as d'autres questions frontend, j'ai 14 outils dev gratuits sur JcHub → [jchub.io/outils](https://jchub.io/outils)
