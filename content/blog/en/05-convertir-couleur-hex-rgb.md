---
slug: convert-hex-color-to-rgb-hsl
title: "How to convert a HEX color to RGB and HSL (with real CSS examples)"
description: "Got a #3B82F6 from the designer and don't know how to use it? Here's the HEX → RGB → HSL conversion explained simply, with Tailwind/CSS examples."
excerpt: "How to convert a HEX color to RGB and HSL with real CSS examples. The designer sends me a Figma mockup. I copy a color: 3B82F6. Cool..."
keywords: ["hex to rgb","color converter","hsl css","rgb to hex","tailwind colors","color picker"]
---
# How to convert a HEX color to RGB and HSL (with real CSS examples)

The designer sends me a Figma mockup. I copy a color: `#3B82F6`. Cool. But I want to use it in Tailwind, in a linear-gradient, and in a CSS variable.

Except `#3B82F6` is HEX. Tailwind often wants RGB. And to make lighter/darker variations, I need HSL.

Here's how I handle it in 30 seconds.

## The 3 formats you run into all the time

### HEX (the most common)

```css
.button {
  background: #3B82F6;
}
```

Format: `#RRGGBB` (Red, Green, Blue in hex)
- `#FF0000` = pure red
- `#00FF00` = pure green
- `#0000FF` = pure blue
- `#3B82F6` = Tailwind blue `blue-500`

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
- **Saturation**: 0-100% (vivid or dull)
- **Lightness**: 0-100% (dark or light)

## Why HSL is the best for variations

Imagine you have to build a design system with 10 shades of blue.

**With HEX**: you have to convert 10 times and pray the designer accepts your choices.

**With HSL**: you just change the lightness.

```css
/* All these shades share the same hue (217) */
--blue-50:  hsl(217, 91%, 97%);
--blue-100: hsl(217, 91%, 92%);
--blue-500: hsl(217, 91%, 60%);
--blue-900: hsl(217, 91%, 25%);
```

See how Tailwind builds its palettes? That's exactly it.

## How to convert in 30 seconds

### Method 1: Online tool

I have a [free Color Converter](https://jchub.io/outils/color-converter) on JcHub. Paste your HEX and you instantly get:
- The RGB code
- The HSL code
- A visual preview of the color
- The name of the equivalent Tailwind color (`blue-500`, etc.)

It's what I use every day.

### Method 2: JavaScript

```javascript
// HEX → RGB
const hex = "#3B82F6";
const r = parseInt(hex.slice(1, 3), 16); // 59
const g = parseInt(hex.slice(3, 5), 16); // 130
const b = parseInt(hex.slice(5, 7), 16); // 246
console.log(`rgb(${r}, ${g}, ${b})`);
// "rgb(59, 130, 246)"

// RGB → HSL (more complex, but there are libs)
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
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

### Method 3: Native CSS (since 2023)

```css
:root {
  --brand: #3B82F6;
}

/* CSS can now do the conversion! */
.button {
  background: rgb(from var(--brand) r g b);
  background: hsl(from var(--brand) h s l);
}
```

This is the **relative color syntax**, supported by Chrome 119+, Safari 16.4+ and Firefox 128+. It's a game changer.

## What nobody tells you: colors and accessibility

Take `#3B82F6` (Tailwind blue). On a white background, the contrast is **4.58:1**. That's OK for large text, but just below WCAG AA for body text (4.5:1 required).

If it's body text, go a bit darker: `#1E40AF` (blue-800) → 8.59:1 contrast ✅

To check, use the [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/). Paste your background color + text color and it tells you whether it's accessible.

## Tailwind colors = HSL under the hood

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

If you code your design system in HSL, you can generate every variation automatically.

## TL;DR

- **HEX**: `#{R}{G}{B}` (the most common)
- **RGB**: `rgb(R, G, B)` 0-255 (classic CSS)
- **HSL**: `hsl(H, S%, L%)` (the best for variations)
- Tailwind stores colors in HSL
- Quick tool: [jchub.io/outils/color-converter](https://jchub.io/outils/color-converter)
- Think about accessibility (WCAG contrast)

---

**Working on a design system and need to generate palettes?** The [Color Converter](https://jchub.io/outils/color-converter) tool shows you every conversion + a live preview.

And if you have other frontend questions, I have 14 free dev tools on JcHub → [jchub.io/outils](https://jchub.io/outils)
