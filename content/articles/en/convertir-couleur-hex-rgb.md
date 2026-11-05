---
slug: convert-hex-color-to-rgb-hsl
title: How to Convert HEX to RGB and HSL (with Real CSS Examples)
description: >-
  Got a #3B82F6 from your designer and not sure what to do with it? Here's the
  HEX → RGB → HSL conversion explained simply, with Tailwind/CSS examples.
excerpt: >-
  How to convert HEX to RGB and HSL with real CSS examples The designer sends me
  a Figma mockup. I copy a color: 3B82F6. Cool...
keywords:
  - hex to rgb
  - color converter
  - css hsl
  - rgb to hex
  - tailwind colors
  - color picker
sourceHash: 6114f985e17120ac7d6d383b
translatedAt: '2026-11-05T07:51:39.457Z'
---
# How to Convert HEX to RGB and HSL (with Real CSS Examples)

The designer sends me a Figma mockup. I copy a color: `#3B82F6`. Cool. But I want to use it in Tailwind, in a linear-gradient, and in a CSS variable.

Except that `#3B82F6` is in HEX. Tailwind often expects RGB. And to make lighter or darker variations, I need HSL.

Here is how I sort this out in 30 seconds.

## The 3 Formats You Encounter All the Time

### HEX (The Most Common)

```css
.button {
  background: #3B82F6;
}
```

Format: `#RRGGBB` (Red, Green, Blue in hexadecimal)
- `#FF0000` = pure red
- `#00FF00` = pure green
- `#0000FF` = pure blue
- `#3B82F6` = the Tailwind blue `blue-500`

### RGB / RGBA

```css
.button {
  background: rgb(59, 130, 246);
  background: rgba(59, 130, 246, 0.5); /* 50% transparent */
}
```

Format: `rgb(R, G, B)` where each value is between 0 and 255.

### HSL / HSLA

```css
.button {
  background: hsl(217, 91%, 60%);
  background: hsla(217, 91%, 60%, 0.5);
}
```

Format: `hsl(Hue, Saturation, Lightness)`
- **Hue**: 0-360 (the color on the color wheel)
- **Saturation**: 0-100% (vibrant or dull)
- **Lightness**: 0-100% (dark or light)

## Why HSL Is the Best for Variations

Imagine you need to build a design system with 10 variations of blue.

**With HEX**: you have to convert it 10 times and pray the designer approves your choices.

**With HSL**: you just change the lightness.

```css
/* All these variations share the same hue (217) */
--blue-50:  hsl(217, 91%, 97%);
--blue-100: hsl(217, 91%, 92%);
--blue-500: hsl(217, 91%, 60%);
--blue-900: hsl(217, 91%, 25%);
```

See how Tailwind builds its palettes? That's exactly it.

## How to Convert in 30 Seconds

### Method 1: Online Tool

I have a free [Color Converter](https://jchub.dev/fr/outils/convertisseur-couleurs) on JcHub. You paste your HEX code, and instantly get:
- The RGB code
- The HSL code
- A visual preview of the color
- The equivalent Tailwind color name (`blue-500`, etc.)

This is what I use every day.

### Method 2: JavaScript

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

### Method 3: Native CSS (Since 2023)

```css
:root {
  --brand: #3B82F6;
}

/* CSS can now handle the conversion! */
.button {
  background: rgb(from var(--brand) r g b);
  background: hsl(from var(--brand) h s l);
}
```

This is the **relative color syntax**, supported by Chrome 119+, Safari 16.4+, and Firefox 128+. It is an absolute game-changer.

## The Thing Nobody Tells You: Color Accessibility

Take `#3B82F6` (the Tailwind blue). On a white background, the contrast is **4.58:1**. This is fine for large text, but just below WCAG AA standards for body text (4.5:1 required).

If you're using it for body text, darken it a bit: `#1E40AF` (blue-800) → contrast 8.59:1 ✅

To check your colors, use the [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) tool. Paste your background and text colors, and it will tell you if it's accessible.

## Tailwind Colors = HSL Under the Hood

Tailwind stores its colors in HSL, not HEX. That's why you can use the `bg-blue-500/50` syntax (50% opacity) so easily.

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

If you code your design system in HSL, you can generate all the variations automatically.

## TL;DR

- **HEX**: `#{R}{G}{B}` (the most common)
- **RGB**: `rgb(R, G, B)` 0-255 (classic CSS)
- **HSL**: `hsl(H, S%, L%)` (best for variations)
- Tailwind stores colors in HSL
- Quick tool: [jchub.dev/fr/outils/convertisseur-couleurs](https://jchub.dev/fr/outils/convertisseur-couleurs)
- Keep accessibility in mind (WCAG contrast)

---

**Working on a design system and need to generate palettes?** The [Color Converter](https://jchub.dev/fr/outils/convertisseur-couleurs) tool shows you all conversions along with a live preview.

And if you have other frontend questions, I have 14 free dev tools on JcHub → [jchub.dev/fr/outils](https://jchub.dev/fr/outils)
