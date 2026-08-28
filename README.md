# Blog JcHub

Les articles sources sont dans `content/blog/`. Le script importe les 5 premiers en `published` et programme les 9 suivants sur quatre semaines :

```bash
npm run import-articles
```

Le script est idempotent : un slug déjà présent dans Firestore (`articles`) est ignoré. Pour ajouter un article programmé, ajoute un fichier Markdown avec un frontmatter contenant au minimum `title`, `description`, `slug`, `category`, `author` et `keywords`, puis lance l’import.

Le cron `/api/cron/publish-scheduled` est exécuté chaque jour à 07:00 UTC (09:00 en Europe/Paris) par Vercel. En local, il peut être testé avec :

```bash
curl -X POST http://localhost:3000/api/cron/publish-scheduled -H "Authorization: Bearer $CRON_SECRET"
```

Les pages publiques ne chargent que les documents `published`. Le sitemap est disponible sur `/sitemap.xml` et le flux RSS sur `/rss.xml`. Le compteur de vues utilise `blog_articles/{slug}` dans Firestore.

Pour activer les commentaires Giscus, configure `NEXT_PUBLIC_GISCUS_REPOSITORY`, `NEXT_PUBLIC_GISCUS_REPOSITORY_ID`, `NEXT_PUBLIC_GISCUS_CATEGORY` et `NEXT_PUBLIC_GISCUS_CATEGORY_ID` dans l’environnement de déploiement.
# JcHub — Starter Kit 🇨🇬

> L'écosystème d'apprentissage intelligent pour les développeurs.

Stack : Next.js 14 · TypeScript · Tailwind · Firebase · **CinetPay (MTN MoMo + Airtel Money)** · Azure TTS

## 🇨🇬 Adapté pour le Congo Brazzaville

- **Paiements** : CinetPay (MTN Mobile Money + Airtel Money) au lieu de Stripe
- **Devise** : FCFA (XAF) au lieu d'euros
- **Numéros** : format 242XXXXXXXX

## 🚀 Démarrage rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Copier le fichier d'environnement
cp .env.exemple .env.local
# Remplir les variables Firebase + CinetPay

# 3. Lancer en dev
npm run dev

# 4. Ouvrir
open http://localhost:3000
```

## 💳 Configuration CinetPay

1. Crée un compte sur [cinetpay.com](https://cinetpay.com)
2. Récupère ton `API_KEY`, `SITE_ID` et `SECRET_KEY` (sandbox d'abord)
3. Mets-les dans `.env.local`
4. Teste avec un numéro sandbox avant de passer en production

## 📁 Structure

```
jchub-starter/
├── app/
│   ├── page.tsx               # Page d'accueil
│   ├── layout.tsx
│   ├── globals.css
│   ├── outils/                # Outils devs
│   ├── livres/                # Catalogue audio
│   │   ├── page.tsx
│   │   └── [slug]/page.tsx
│   ├── pricing/               # Tarifs (FCFA)
│   ├── compte/                # Login/Register
│   └── api/
│       ├── checkout/          # Initie paiement CinetPay
│       └── webhooks/
│           └── cinetpay/      # Webhook notifications
│
├── components/
│   └── layout/Header.tsx + Footer.tsx
│
├── lib/
│   ├── books.ts               # Catalogue (8 livres issus de ta liste)
│   ├── tools.ts               # 5 outils
│   ├── pricing.ts             # Tarifs en FCFA
│   ├── payment.ts             # Wrapper CinetPay
│   ├── firebase.ts            # Client Firebase
│   └── firebase-admin.ts      # Admin SDK
│
├── public/
└── .env.exemple
```

## 💰 Tarification

| Plan | Prix | Pour qui |
|---|---|---|
| Free | 0 FCFA | Découvrir |
| JcHub+ mensuel | 999 FCFA/mois | Apprentissage régulier |
| JcHub+ annuel | 8 999 FCFA/an | Économise 25% |

**Livres audio** (prix selon nombre de pages) :
- Petit (< 100 pages) : 499 FCFA
- Moyen (100-250 pages) : 999 FCFA
- Large (> 250 pages) : 1 999 FCFA

## 📊 Catalogue

**Premium (commercialisable) :**
- La circulation de la vie (domaine public) — 999 FCFA
- Cours de Réseaux (CC BY-SA) — 499 FCFA
- Débuter en Cybersécurité (CC BY-SA) — 499 FCFA

**Accès libre (CC BY-NC-SA) :**
- Les réseaux de zéro
- Apprenez à programmer en Java

**À venir :**
- Data Science (CC BY-SA)
- Apprendre Python (CC BY-SA)
- Sécurité Informatique (CC BY-SA)

## 🔜 Prochaines étapes

- [ ] Setup Firebase (Auth + Firestore)
- [ ] Créer compte CinetPay (sandbox)
- [ ] Tester un paiement test MTN MoMo
- [ ] Implémenter les 5 outils
- [ ] Setup conversion PDF → Audio
- [ ] Setup Brevo pour emails
- [ ] Lancer 🚀

## 📞 Support

Questions → `tech@jchub.dev`
