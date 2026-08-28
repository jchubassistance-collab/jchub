---
title: "Markdown en 5 minutes : le guide de survie pour devs juniors"
description: "T'es nouveau sur GitHub et tu comprends pas la syntaxe du README ? Voici tout ce qu'il faut savoir sur Markdown en 5 minutes, avec des exemples."
slug: markdown-guide-debutant
keywords: ["apprendre markdown", "syntaxe markdown", "guide markdown", "markdown basics", "github markdown", "readme"]
author: Jessy Ngnambongo
date: 2026-08-25
category: Développement
readingTime: 5 min
---

# Markdown en 5 minutes : le guide de survie pour devs juniors

Mon premier GitHub, j'ai regardé un README. J'ai vu des `#`, `**`, `[]()`. J'ai compris **rien**. J'ai fermé l'onglet.

3 mois plus tard, j'ai compris que Markdown c'est juste du **texte formaté** avec une syntaxe super simple. Une fois que tu connais, tu peux plus t'en passer.

Voici tout ce qu'il faut savoir.

## C'est quoi Markdown ?

Markdown c'est un langage de **balisage léger** créé en 2004. Le principe : tu écris du texte normal, tu ajoutes quelques caractères spéciaux, et ça devient du HTML formaté.

**Exemple** :

```markdown
# Mon titre

Ceci est un **paragraphe** avec du *texte en italique*.

- Item 1
- Item 2
- Item 3

[Un lien](https://jchub.io)
```

Ça donne :

```html
<h1>Mon titre</h1>
<p>Ceci est un <strong>paragraphe</strong> avec du <em>texte en italique</em>.</p>
<ul>
  <li>Item 1</li>
  <li>Item 2</li>
  <li>Item 3</li>
</ul>
<p><a href="https://jchub.io">Un lien</a></p>
```

Le but : un texte lisible **même sans être rendu**, et qui se transforme en HTML joli.

## La syntaxe essentielle (à connaître par cœur)

### Titres

```markdown
# H1 - Titre principal
## H2 - Sous-titre
### H3 - Sous-sous-titre
#### H4 - Sous-sous-sous-titre
```

**Règle** : un seul `#` par document (le titre principal). Les autres titres sont `##`, `###`, etc.

### Gras et italique

```markdown
**Texte en gras**
*Texte en italique*
***Texte en gras et italique***
~~Texte barré~~
```

### Listes

```markdown
- Item 1
- Item 2
  - Sous-item 2.1
  - Sous-item 2.2
- Item 3

1. Premier
2. Deuxième
3. Troisième
```

⚠️ L'indentation compte : 2 espaces pour les sous-items.

### Liens

```markdown
[Texte du lien](https://url.com)
[Lien avec titre](https://url.com "Titre au survol")
```

### Images

```markdown
![Texte alternatif](url-image.png)
![Logo](https://jchub.io/logo.png "Mon logo")
```

⚠️ La différence avec un lien : le `!` devant.

### Code

**Inline** (dans une phrase) :

```markdown
Utilise `npm install` pour installer les dépendances.
```

**Bloc** (multiligne) :

````markdown
```javascript
function hello(name) {
  return `Hello ${name}!`;
}
```
````

Le `javascript` après les ``` c'est pour la **coloration syntaxique**. Tu peux mettre `python`, `bash`, `json`, etc.

### Citations

```markdown
> La vie est un long fleuve tranquille.
> - Proverbe africain
```

### Tableaux

```markdown
| Nom  | Âge | Ville       |
|------|-----|-------------|
| Jean | 25  | Brazzaville |
| Marie| 30  | Paris       |
| Paul | 28  | Kinshasa    |
```

### Lignes horizontales

```markdown
---
```

3 tirets = une ligne horizontale.

### Cases à cocher (GitHub only)

```markdown
- [x] Tâche faite
- [ ] Tâche à faire
- [ ] Autre tâche
```

Très utile pour les issues et les PRs.

## Le Markdown enrichi (GitHub flavored)

GitHub ajoute des extensions au Markdown standard. Voici ce qui est spécifique à GitHub :

### Mentions et issues

```markdown
@jessy-username           → mentionne un user
#1234                     → lie à une issue/PR
gh-user:jessy             → carte profil GitHub
```

### Emoji

```markdown
:rocket: :fire: :heart:
```

→ 🚀 🔥 ❤️

Liste complète : [github.com/ikatyang/emoji-cheat-sheet](https://github.com/ikatyang/emoji-cheat-sheet)

### Alerts (nouveau en 2024)

```markdown
> [!NOTE]
> Informations utiles.

> [!WARNING]
> Attention, truc important.

> [!TIP]
> Astuce pratique.
```

→ Rend des boîtes d'alerte stylées sur GitHub.

## Les pièges classiques

### 1. **Listes numérotées qui recommencent**

Si tu fais :

```markdown
1. Item
1. Item
1. Item
```

Markdown va quand même incrémenter. C'est normal.

### 2. **Lignes vides**

Une ligne vide = un nouveau paragraphe. Si t'oublies, tout est collé.

### 3. **Échappement des caractères**

```markdown
\*Ce texte ne sera pas en italique\*
```

Pour afficher un `*`, `_`, `` ` ``, etc., mets un `\` devant.

### 4. **HTML inline**

Markdown accepte le HTML inline :

```markdown
<details>
<summary>Clique pour expand</summary>

Contenu caché.
</details>
```

## Mon workflow pour les README

```markdown
# Nom du projet

> Description courte (1 phrase)

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

C'est la structure que j'utilise pour **tous** mes projets. Lisible, complète, professionnelle.

## Comment tester ton Markdown en temps réel

Mon outil gratuit : [Markdown Preview](https://jchub.io/outils/markdown-preview). Tu tapes à gauche, tu vois le rendu à droite. Très utile quand tu débutes et que tu veux voir si ta syntaxe marche.

**Bonus** : ça marche aussi pour rédiger des articles de blog, de la doc, ou des emails stylés.

## TL;DR

- **Markdown** = texte formaté avec symboles simples
- **À connaître** : `#` titre, `**gras**`, `*italique*`, `[lien](url)`, `![image](url)`, listes, code blocks
- **GitHub** ajoute : mentions, alerts, emoji, tâches
- **Outil gratuit** : [jchub.io/outils/markdown-preview](https://jchub.io/outils/markdown-preview)
- **1h d'apprentissage** pour les bases, **1 jour** pour être à l'aise

---

**Tu rédiges un README et t'as besoin d'aide ?** Mon [Markdown Preview](https://jchub.io/outils/markdown-preview) te montre le rendu en temps réel.

Y'a 14 outils dev gratuits sur JcHub → [jchub.io/outils](https://jchub.io/outils)
