---
slug: slow-website-5-checks-before-touching-the-code
title: 'My website is slow: 5 checks before touching the code'
description: >-
  Before rebuilding everything, measure: image weight, number of requests,
  hosting, third-party scripts, caching. Five simple checks to find what slows
  your site down.
excerpt: >-
  Before rebuilding everything, measure: image weight, number of requests,
  hosting, third-party scripts, caching. Five simple checks to find what slows
  your site down.
keywords:
  - slow website
  - speed up website
  - website speed
  - pagespeed insights
  - image size
  - web performance
sourceHash: 92c0b668aa7df3ddbc71c22c
translatedAt: '2026-11-04T14:17:56.659Z'
---
Your site takes seconds to show on a phone, and the temptation is strong to redo everything, change the theme or rewrite the code. Before that, take twenty minutes to **measure**. In the vast majority of cases, slowness comes from a handful of simple causes you can fix without touching a line of code. Here are the five checks to run, in order.

## First: measure, don’t guess

Open **PageSpeed Insights** (pagespeed.web.dev), which is free, and enter your home page’s address. Look mostly at the **mobile** result: that’s where your visitors are, and it’s the strictest. Note the score and the main indicators, to compare after your fixes.

Also open your browser’s developer tools (F12), **Network** tab, and reload the page. At the bottom you see the **number of requests** and the **total transferred size**. Those two figures guide everything else.

## Check 1: image weight

It’s the number one cause. In the **Network** tab, filter on **Img** and sort by size. Be wary of any image over 200 to 300 KB.

The classic mistakes:

- a 4 MB phone photo shown as a thumbnail;
- a 4,000-pixel-wide image in a 600-pixel frame;
- photos saved as PNG instead of WebP or JPEG.

**The fix**: resize each image to its display size (double for high-resolution screens) with the [image resizer](/en/tools/social-image-resizer-cropper), then convert it to WebP with the [WebP / PNG optimizer](/en/tools/webp-png-image-optimizer). Cutting 80% of a page’s weight is common. To know which format to choose, read [WebP or PNG: which format for your site](/en/blog/webp-or-png-which-format-to-choose).

Also check that images further down the page use **lazy loading** (`loading="lazy"`): they only download when the visitor gets close to them.

## Check 2: number of requests and plugins

A page making more than 100 requests often has a problem. Look at where they come from:

- **on WordPress**, each plugin often adds its own CSS and JavaScript files, even on pages where it isn’t used. Disable the ones you no longer use, one at a time, measuring each time;
- **fonts**: four weights of two different fonts make eight files. Two weights of a single font are often enough;
- **sliders and animations** on the home page cost a lot for little benefit.

## Check 3: third-party scripts

Live chat, embedded videos, share buttons, ad pixels, analytics tools: each one loads code from another server you don’t control.

In the **Network** tab, spot the domains that aren’t yours. For each one, ask yourself: do I really use it? A YouTube video can be replaced by a simple clickable image that loads the player only on click. A chat widget can often be replaced by a WhatsApp link.

## Check 4: hosting and response time

In the **Network** tab, look at the very first request, the page itself. If the server takes **more than a second** to start answering, the problem isn’t in your page but behind it:

- very low-end, overloaded shared hosting;
- a server very far from your visitors;
- a slow database, or a page rebuilt entirely on every visit.

In that case, no image optimization will be enough: you need better hosting, or a **page cache**.

## Check 5: caching and compression

Two server-side settings make a big difference:

- **browser caching**: files that don’t change (images, CSS, JavaScript) should be kept by the browser, so the second visit is nearly instant;
- **compression** (gzip or Brotli) of text files, which greatly reduces their size.

PageSpeed Insights explicitly flags when they’re missing. On WordPress, a well-configured caching plugin often fixes both at once.

## Fix in the right order

1. Images: the biggest gain, the easiest.
2. Third-party scripts and unused plugins: removing costs nothing.
3. Caching and compression: often just an option to turn on.
4. Hosting: only if the server answers slowly.
5. And only then, if needed, the code.

Measure again after each step: you’ll know exactly what worked.

## Key takeaways

- Measure first, on mobile, with PageSpeed Insights and the Network tab.
- Heavy images are the first cause of slowness.
- Every third-party script and plugin has a cost: keep only what’s essential.
- A slow server response isn’t fixed by optimizing images.
