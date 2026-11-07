---
slug: markdown-beginner-guide
title: 'Markdown in 5 Minutes: The Survival Guide for Junior Devs'
description: >-
  New to GitHub and confused by README syntax? Here's everything you need to
  know about Markdown in 5 minutes, complete with examples.
excerpt: >-
  Markdown in 5 Minutes: The Survival Guide for Junior Devs The first time I
  used GitHub, I looked at a README. I saw `#`, `**`, `[]()`. I understood
  nothing. I...
keywords:
  - learn markdown
  - markdown syntax
  - markdown guide
  - markdown basics
  - github markdown
  - readme
sourceHash: c2d0e456ed9c55b882ee695a
translatedAt: '2026-11-07T07:50:24.730Z'
---
# Markdown in 5 Minutes: The Survival Guide for Junior Devs

The first time I used GitHub, I looked at a README. I saw `#`, `**`, `[]()`. I understood **nothing**. I closed the tab.

3 months later, I realized that Markdown is just **formatted text** with a super simple syntax. Once you get the hang of it, you can't live without it.

Here's everything you need to know.

## What Is Markdown?

Markdown is a **lightweight markup language** created in 2004. The core idea: you write plain text, add a few special characters, and it turns into formatted HTML.

**Example**:

```markdown
# My title

This is a **paragraph** with *italic text*.

- Item 1
- Item 2
- Item 3

[A link](https://jchub.dev)
```

Output:

```html
<h1>My title</h1>
<p>This is a <strong>paragraph</strong> with <em>italic text</em>.</p>
<ul>
  <li>Item 1</li>
  <li>Item 2</li>
  <li>Item 3</li>
</ul>
<p><a href="https://jchub.dev">A link</a></p>
```

The goal: text that is readable **even without being rendered**, and converts into clean HTML.

## Essential Syntax (To Know by Heart)

### Headings

```markdown
# H1 - Main title
## H2 - Subtitle
### H3 - Sub-subtitle
#### H4 - Sub-sub-subtitle
```

**Rule**: only one `#` per document (the main title). Subsequent headings use `##`, `###`, etc.

### Bold and Italic

```markdown
**Bold text**
*Italic text*
***Bold and italic text***
~~Strikethrough text~~
```

### Lists

```markdown
- Item 1
- Item 2
  - Sub-item 2.1
  - Sub-item 2.2
- Item 3

1. First
2. Second
3. Third
```

⚠️ Indentation matters: 2 spaces for sub-items.

### Links

```markdown
[Link text](https://url.com)
[Link with title](https://url.com "Hover title")
```

### Images

```markdown
![Alt text](url-image.png)
![Logo](https://jchub.dev/logo.png "My logo")
```

⚠️ The difference from a link: the leading `!`.

### Code

**Inline** (inside a sentence):

```markdown
Use `npm install` to install dependencies.
```

**Block** (multiline):

````markdown
```javascript
function hello(name) {
  return `Hello ${name}!`;
}
```
````

Adding `javascript` right after ``` is for **syntax highlighting**. You can use `python`, `bash`, `json`, etc.

### Blockquotes

```markdown
> Life is a long quiet river.
> - African proverb
```

### Tables

```markdown
| Name | Age | City        |
|------|-----|-------------|
| Jean | 25  | Brazzaville |
| Marie| 30  | Paris       |
| Paul | 28  | Kinshasa    |
```

### Horizontal Rules

```markdown
---
```

3 dashes = a horizontal rule.

### Checkboxes (GitHub only)

```markdown
- [x] Task done
- [ ] Task to do
- [ ] Other task
```

Super useful for issues and PRs.

## GitHub-Flavored Markdown

GitHub adds extensions to standard Markdown. Here's what's specific to GitHub:

### Mentions and Issues

```markdown
@jessy-username           → mentions a user
#1234                     → links to an issue/PR
gh-user:jessy             → GitHub profile card
```

### Emojis

```markdown
:rocket: :fire: :heart:
```

→ 🚀 🔥 ❤️

Full list: [github.com/ikatyang/emoji-cheat-sheet](https://github.com/ikatyang/emoji-cheat-sheet)

### Alerts (New in 2024)

```markdown
> [!NOTE]
> Useful information.

> [!WARNING]
> Watch out, important stuff.

> [!TIP]
> Practical tip.
```

→ Renders stylish alert callouts on GitHub.

## Common Pitfalls

### 1. **Numbered lists repeating numbers**

If you write:

```markdown
1. Item
1. Item
1. Item
```

Markdown will still increment the numbers automatically. That's normal.

### 2. **Empty lines**

An empty line = a new paragraph. If you forget it, everything gets mashed together.

### 3. **Escaping characters**

```markdown
\*This text will not be in italics\*
```

To display a `*`, `_`, `` ` ``, etc., put a `\` in front of it.

### 4. **Inline HTML**

Markdown supports inline HTML:

```markdown
<details>
<summary>Click to expand</summary>

Hidden content.
</details>
```

## My README Workflow

```markdown
# Project Name

> Short description (1 sentence)

![Demo](demo.gif)

## 🎯 Features
- Feature 1
- Feature 2

## 📦 Installation
```bash
npm install mon-package
```

## 🚀 Usage
```javascript
const result = monPackage.doStuff();
```

## 🤝 Contributing
PRs welcome!

## 📄 License
MIT
```

This is the structure I use for **all** my projects. Readable, complete, professional.

## How to Test Your Markdown in Real Time

My free tool: [Markdown Preview](https://jchub.dev/fr/outils/apercu-markdown). You type on the left, you see the preview on the right. Super handy when starting out and wanting to verify your syntax.

**Bonus**: it also works for writing blog posts, docs, or stylish emails.

## TL;DR

- **Markdown** = formatted text using simple symbols
- **Must-know**: `#` headings, `**bold**`, `*italic*`, `[link](url)`, `![image](url)`, lists, code blocks
- **GitHub** adds: mentions, alerts, emojis, tasks
- **Free tool**: [jchub.dev/fr/outils/apercu-markdown](https://jchub.dev/fr/outils/apercu-markdown)
- **1 hour of learning** for the basics, **1 day** to get comfortable

---

**Writing a README and need help?** My [Markdown Preview](https://jchub.dev/fr/outils/apercu-markdown) shows you the live preview in real time.

There are 14 free dev tools on JcHub → [jchub.dev/fr/outils](https://jchub.dev/fr/outils)
