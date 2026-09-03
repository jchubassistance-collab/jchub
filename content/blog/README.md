# 📝 JcHub Blog — 14 articles SEO prêts à publier

**14 articles complets** (700-1000 mots chacun) avec images OG, frontmatter SEO, et CTA vers tes outils. Ton total : **~12 000 mots** de contenu original.

## 📁 Structure

```
jchub-blog/
├── README.md                          ← ce fichier
├── 01-decoder-jwt-sans-postman.md
├── 02-hasher-mot-de-passe.md
├── 03-convertir-timestamp-unix.md
├── 04-encoder-url-correctement.md
├── 05-convertir-couleur-hex-rgb.md
├── 06-tester-api-rest-sans-postman.md
├── 07-formater-deboguer-json.md
├── 08-regex-email-5-patterns.md
├── 09-creer-qr-code-wifi-paiement.md
├── 10-markdown-guide-debutant.md
├── 11-uuid-base-donnees-v4-v7.md
├── 12-encoder-image-base64.md
├── 13-binaire-octal-hex-guide.md
├── 14-mot-de-passe-securise.md
└── images/                            ← 14 images OG branded
    ├── 01-jwt-decoder.svg
    ├── 02-hash-generator.svg
    ├── ... (14 total)
```

## 🚀 Comment les publier

### Option 1 : Directement dans ton projet Next.js

```bash
# Copie les articles dans ton app
mkdir -p jchub-starter/content/blog
cp jchub-blog/*.md jchub-starter/content/blog/

# Copie les images
mkdir -p jchub-starter/public/blog
cp jchub-blog/images/*.svg jchub-starter/public/blog/
```

### Option 2 : Utilise un CMS headless (Sanity, Contentlayer, etc.)

Le frontmatter est déjà au format compatible Contentlayer / MDX.

### Option 3 : Hashnode / dev.to

Copie-colle le contenu de chaque `.md` (sans le frontmatter) directement dans l'éditeur.

## 🎨 Charte graphique des images

Toutes les images OG respectent :
- **Format** : 1200x630 (Open Graph standard)
- **Fond** : Dark gradient (#0d1117 → #1a2332)
- **Accent** : Vert JcHub (#22c55e)
- **Grid pattern** subtil en arrière-plan
- **Glow effect** en haut à droite
- **Logo watermark** "J jchub.io/outils/[slug]"

Tu peux les remplacer par des visuels custom plus tard si tu veux.

## 📊 Mots-clés SEO ciblés (par article)

| # | Sujet | Mot-clé principal | Volume estimé |
|---|---|---|---|
| 01 | JWT Decoder | décoder jwt | 5K/mois |
| 02 | Hash Generator | hasher mot de passe | 3K/mois |
| 03 | Timestamp Converter | timestamp unix | 8K/mois |
| 04 | URL Encoder | encoder url | 4K/mois |
| 05 | Color Converter | hex en rgb | 12K/mois |
| 06 | API Tester | postman alternative | 15K/mois |
| 07 | JSON Formatter | json formatter | 20K/mois |
| 08 | Regex Tester | regex email | 6K/mois |
| 09 | QR Code | qr code generator | 25K/mois |
| 10 | Markdown | apprendre markdown | 10K/mois |
| 11 | UUID | uuid v4 | 8K/mois |
| 12 | Base64 | encoder base64 | 15K/mois |
| 13 | Number Base | binaire en hex | 5K/mois |
| 14 | Password Generator | mot de passe sécurisé | 12K/mois |

**Total potentiel** : ~150K recherches/mois en cumulé

## ✍️ Style éditorial

Chaque article a été écrit avec :
- **Ton décontracté** : "du coup", "en vrai", "bref", "genre"
- **Anecdotes perso** : histoires vécues par l'auteur (avec dates, contexte)
- **Contexte africain** : Brazzaville, Congo, mobile money
- **Code blocks** avec exemples concrets et commentés
- **Cas d'usage réels** : OAuth qui marche pas, debug API, fuite de données
- **CTAs contextuels** vers le bon outil JcHub pour chaque sujet
- **TL;DR** en fin d'article pour les pressés

## 📅 Plan de publication suggéré

| Semaine | Articles à publier |
|---|---|
| **S1** | 01, 02, 03 |
| **S2** | 04, 05, 06 |
| **S3** | 07, 08, 09 |
| **S4** | 10, 11, 12 |
| **S5** | 13, 14 |

**Rythme** : 3 articles/semaine pendant 5 semaines.

## 🔗 Cross-posting (backlinks gratuits)

Pour chaque article, publie aussi sur :
- **dev.to** (3 min/article, gros SEO boost)
- **Hashnode** (5 min, domaine custom possible)
- **Medium** (3 min, large audience)
- **LinkedIn** (version courte en commentaire)

**Astuce** : le cross-post sur dev.to et Hashnode doit être fait **après** publication sur ton site, pour pas être considéré comme du duplicate content par Google.

## 📈 Métriques à suivre

Dans Google Search Console :
- Impressions par article
- Position moyenne par mot-clé
- CTR (click-through rate)
- Backlinks reçus

Objectif M3 : 200-500 visiteurs organiques/jour grâce à ces 14 articles.

## 🔥 Bonus : 3 articles "story" (phase 2)

Après les 14 articles techniques, écris (ou demande à l'AI) :
1. **"J'ai créé 14 outils dev gratuits en 7 jours (voici comment)"**
2. **"Comment je construis un SaaS solo au Congo"**
3. **"Pourquoi tous mes outils sont gratuits (et comment je compte gagner)"**

Ces articles-là, **écris-les toi-même** — c'est ta voix, ta marque.

## ✅ TL;DR

1. **14 articles** prêts à publier (~12K mots)
2. **14 images OG** branded JcHub
3. **Frontmatter SEO** complet (title, description, keywords)
4. **CTAs** vers tes outils partout
5. **Ton décontracté** : pas de bullshit, anecdotes perso
6. **150K recherches/mois** potentielles en cumulé

**Publie le 1er article ce soir.** Cross-poste sur dev.to demain. Dans 3 mois, t'auras du trafic organique gratuit.
