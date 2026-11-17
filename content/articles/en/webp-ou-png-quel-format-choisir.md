---
slug: webp-or-png-which-format-to-choose
title: 'WebP or PNG: which image format should your site use?'
description: >-
  Photo, logo, screenshot, transparent image: when to use WebP, PNG, JPEG or SVG
  on your website, with a simple table to decide in ten seconds.
excerpt: >-
  Photo, logo, screenshot, transparent image: when to use WebP, PNG, JPEG or SVG
  on your website, with a simple table to decide in ten seconds.
keywords:
  - webp or png
  - web image format
  - webp vs png
  - png or jpeg
  - svg
  - website images
sourceHash: 97156f968c20e8ae31114ac5
translatedAt: '2026-11-04T14:17:51.276Z'
---
Your site loads slowly, and someone told you “just switch everything to WebP”. Good advice… most of the time. Each format was designed for a kind of image, and the wrong choice gives you either files that are too heavy or damaged images. Here’s how to choose, image by image.

## What each format does

**PNG** compresses **losslessly**: the image is kept pixel for pixel. It supports **transparency**. Perfect for a screenshot, a diagram or a visual with text, but far too heavy for a photo.

**JPEG** compresses **with loss**: it throws away details the eye barely notices. Ideal for photos, but it has no transparency, and it creates small smudges around text and sharp edges.

**WebP** does **both**: lossy or lossless, with transparency, and even animation. According to figures published by Google, which created it, a lossless WebP is about **26% smaller** than a PNG, and a lossy WebP **25 to 34% smaller** than a JPEG of comparable quality.

**SVG** isn’t a pixel image but a **vector drawing**: shapes described as text. It stays sharp at any size and is often tiny for a logo or an icon.

## What about compatibility?

It’s no longer an issue: WebP is supported by every current browser, Chrome, Edge, Firefox and Safari, including on iPhone since iOS 14. Only very old devices that were never updated have trouble. For a public website, you can use it without hesitation.

## The table to decide

| Your image | Best choice | Why |
|---|---|---|
| Product, landscape or team photo | **Lossy WebP** | Lightest for a photo, with no visible difference |
| Logo, icon, pictogram | **SVG** | Sharp at any size, very light |
| Logo only available as an image | **Lossless WebP** or **PNG** | Sharp edges and transparency |
| Screenshot, diagram, text on a plain background | **Lossless WebP** or **PNG** | No smudges around the text |
| Image with a transparent background | **WebP** or **PNG** | JPEG has no transparency |
| File to send for printing or editing | **PNG** | Universal and lossless |

In short: **WebP for the website**, **PNG when you need a universal lossless file**, **SVG for logos and icons**.

## What about AVIF, the newcomer?

You may come across **AVIF**, a newer format that often compresses even better than WebP, especially for photos. Current browsers read it, but it’s slower to create, and fewer tools and CMSs handle it well. For a small site, WebP remains the simplest and safest choice; AVIF becomes worthwhile when you have thousands of photos and an automated image pipeline.

## Traps to avoid

- **Converting a JPEG to PNG to “improve quality”**: impossible. The details lost by JPEG don’t come back, and the file gets much heavier.
- **Saving a photo as PNG**: it can weigh five to ten times more than in WebP, for the same look on screen.
- **Forgetting the dimensions**: a 4,000-pixel-wide photo shown in a 600-pixel frame stays heavy, even in WebP. Resize to the display size first, planning double for high-resolution screens.
- **Compressing too hard**: below a certain quality, faces and gradients fall apart. For a photo, a quality around 75 to 85 is a good starting point.

## Take action

1. Find the heaviest images on your home page: in the developer tools (F12), **Network** tab, filter on **Img** and sort by size.
2. Resize them to their display size with the [image resizer](/en/tools/social-image-resizer-cropper).
3. Convert them to WebP, or PNG if needed, with the [WebP / PNG optimizer and converter](/en/tools/webp-png-image-optimizer), adjusting the quality.
4. Replace the files on your site and reload the page to compare the total weight.

To go further on compression settings, read our guide: [how to optimize WebP and PNG images to speed up a website](/en/blog/optimize-webp-png-images-speed-up-website).

## Key takeaways

- **WebP** is the best default for a website, for photos and visuals alike.
- **PNG** is still useful for a lossless file to share or print.
- **SVG** for logos and icons, when you have the vector version.
- Resizing matters as much as picking the right format.
