---
slug: markdown-beginner-guide
title: "Markdown in 5 minutes: the survival guide for junior devs"
description: "New to GitHub and don't understand the README syntax? Here's everything you need to know about Markdown in 5 minutes, with examples."
excerpt: "Markdown in 5 minutes: the survival guide for junior devs. On my first GitHub, I looked at a README. I saw #, **, []()... I understood nothing..."
keywords: ["learn markdown","markdown syntax","markdown guide","markdown basics","github markdown","readme"]
---
# Markdown in 5 minutes: the survival guide for junior devs

On my first GitHub, I looked at a README. I saw `#`, `**`, `[]()`. I understood **nothing**. I closed the tab.

3 months later, I realized that Markdown is just **formatted text** with a super simple syntax. Once you know it, you can't do without it.

Here's everything you need to know.

## What is Markdown?

Markdown is a **lightweight markup** language created in 2004. The idea: you write normal text, add a few special characters, and it becomes formatted HTML.

**Example**:

```markdown
# My title

This is a **paragraph** with some *italic text*.

- Item 1
- Item 2
- Item 3

[A link](https://jchub.io)
```

Which gives:

```html
<h1>My title</h1>
<p>This is a <strong>paragraph</strong> with some <em>italic text</em>.</p>
<ul>
  <li>Item 1</li>
  <li>Item 2</li>
  <li>Item 3</li>
</ul>
<p><a href="https://jchub.io">A link</a></p>
```

The goal: text that's readable **even without being rendered**, and that turns into nice HTML.

## The essential syntax (to know by heart)

### Headings

```markdown
# H1 - Main title
## H2 - Subtitle
### H3 - Sub-subtitle
#### H4 - Sub-sub-subtitle
```

**Rule**: only one `#` per document (the main title). The other headings are `##`, `###`, etc.

### Bold and italic

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
[Link with a title](https://url.com "Title on hover")
```

### Images

```markdown
![Alt text](url-image.png)
![Logo](https://jchub.io/logo.png "My logo")
```

⚠️ The difference from a link: the `!` in front.

### Code

**Inline** (in a sentence):

```markdown
Use `npm install` to install the dependencies.
```

**Block** (multiline):

````markdown
```javascript
function hello(name) {
  return `Hello ${name}!`;
}
```
````

The `javascript` after the ``` is for **syntax highlighting**. You can use `python`, `bash`, `json`, etc.

### Quotes

```markdown
> Life is a long, quiet river.
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

### Horizontal rules

```markdown
---
```

3 dashes = a horizontal rule.

### Checkboxes (GitHub only)

```markdown
- [x] Task done
- [ ] Task to do
- [ ] Another task
```

Really useful for issues and PRs.

## Enhanced Markdown (GitHub flavored)

GitHub adds extensions to standard Markdown. Here's what's specific to GitHub:

### Mentions and issues

```markdown
@jessy-username           → mentions a user
#1234                     → links to an issue/PR
gh-user:jessy             → GitHub profile card
```

### Emoji

```markdown
:rocket: :fire: :heart:
```

→ 🚀 🔥 ❤️

Full list: [github.com/ikatyang/emoji-cheat-sheet](https://github.com/ikatyang/emoji-cheat-sheet)

### Alerts (new in 2024)

```markdown
> [!NOTE]
> Useful information.

> [!WARNING]
> Careful, important stuff.

> [!TIP]
> Practical tip.
```

→ Renders stylish alert boxes on GitHub.

## The classic traps

### 1. **Numbered lists that start over**

If you write:

```markdown
1. Item
1. Item
1. Item
```

Markdown will still increment the numbers. That's normal.

### 2. **Blank lines**

A blank line = a new paragraph. If you forget it, everything gets stuck together.

### 3. **Escaping characters**

```markdown
\*This text won't be italic\*
```

To display a `*`, `_`, `` ` ``, etc., put a `\` in front.

### 4. **Inline HTML**

Markdown accepts inline HTML:

```markdown
<details>
<summary>Click to expand</summary>

Hidden content.
</details>
```

## My workflow for READMEs

```markdown
# Project name

> Short description (1 sentence)

![Demo](demo.gif)

## 🎯 Features
- Feature 1
- Feature 2

## 📦 Installation
```bash
npm install my-package
```

## 🚀 Usage
```javascript
const result = myPackage.doStuff();
```

## 🤝 Contributing
PRs welcome!

## 📄 License
MIT
```

That's the structure I use for **all** my projects. Readable, complete, professional.

## How to test your Markdown in real time

My free tool: [Markdown Preview](https://jchub.io/outils/markdown-preview). You type on the left and see the rendering on the right. Really handy when you're starting out and want to check that your syntax works.

**Bonus**: it also works for writing blog posts, documentation or nicely formatted emails.

## TL;DR

- **Markdown** = formatted text with simple symbols
- **To know**: `#` heading, `**bold**`, `*italic*`, `[link](url)`, `![image](url)`, lists, code blocks
- **GitHub** adds: mentions, alerts, emoji, tasks
- **Free tool**: [jchub.io/outils/markdown-preview](https://jchub.io/outils/markdown-preview)
- **1 hour of learning** for the basics, **1 day** to be comfortable

---

**Writing a README and need help?** My [Markdown Preview](https://jchub.io/outils/markdown-preview) shows you the rendering in real time.

There are 14 free dev tools on JcHub → [jchub.io/outils](https://jchub.io/outils)
