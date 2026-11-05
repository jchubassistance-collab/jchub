---
slug: site-lent-5-verifications-avant-de-toucher-au-code
title: 'Mon site est lent : 5 vérifications avant de toucher au code'
description: >-
  Avant de tout refaire, mesure : poids des images, nombre de requêtes,
  hébergement, scripts tiers, cache. Cinq vérifications simples pour trouver ce
  qui ralentit ton site.
excerpt: >-
  Avant de tout refaire, mesure : poids des images, nombre de requêtes,
  hébergement, scripts tiers, cache. Cinq vérifications simples pour trouver ce
  qui ralentit ton site.
category: Outils & Astuces
keywords:
  - site lent
  - accélérer site web
  - vitesse site
  - pagespeed insights
  - poids des images
  - performance web
author: Jessy Ngnambongo
image: >-
  /api/article-cover?title=Mon+site+est+lent+%3A+5+v%C3%A9rifications+avant+de+toucher+au+code&category=Outils+%26+Astuces
readTime: 4 min
status: scheduled
scheduledFor: '2026-12-31T07:00:00.000Z'
updatedAt: '2026-11-04T14:17:56.659Z'
---
Ton site met des secondes à s’afficher sur téléphone, et la tentation est grande de tout refaire, de changer de thème ou de réécrire le code. Avant ça, prends vingt minutes pour **mesurer**. Dans la grande majorité des cas, la lenteur vient d’une poignée de causes simples, que tu peux corriger sans toucher à une ligne de code. Voici les cinq vérifications à faire, dans l’ordre.

## Avant tout : mesurer, pas deviner

Ouvre **PageSpeed Insights** (pagespeed.web.dev), gratuit, et entre l’adresse de ta page d’accueil. Regarde surtout le résultat **mobile** : c’est là que sont tes visiteurs, et c’est le plus sévère. Note le score et les principaux indicateurs, pour comparer après tes corrections.

Ouvre aussi les outils de développement de ton navigateur (F12), onglet **Réseau**, et recharge la page. En bas, tu vois le **nombre de requêtes** et le **poids total transféré**. Ces deux chiffres guident tout le reste.

## Vérification 1 : le poids des images

C’est la cause numéro un. Dans l’onglet **Réseau**, filtre sur **Img** et trie par taille. Méfie-toi de chaque image de plus de 200 à 300 Ko.

Les erreurs classiques :

- une photo de téléphone de 4 Mo affichée en vignette ;
- une image de 4 000 pixels de large dans un cadre de 600 pixels ;
- des photos enregistrées en PNG au lieu de WebP ou JPEG.

**La correction** : redimensionne chaque image à sa taille d’affichage (le double pour les écrans haute définition) avec le [redimensionneur d’images](/fr/outils/redimensionneur-recadreur-images), puis convertis-la en WebP avec l’[optimiseur WebP / PNG](/fr/outils/optimiseur-convertisseur-webp-png). Gagner 80 % du poids d’une page est courant. Pour savoir quel format choisir, lis [WebP ou PNG : quel format pour ton site](/fr/blog/webp-ou-png-quel-format-choisir).

Vérifie aussi que les images situées plus bas dans la page sont en **chargement différé** (`loading="lazy"`) : elles ne se téléchargent que lorsque le visiteur s’en approche.

## Vérification 2 : le nombre de requêtes et les extensions

Une page qui fait plus de 100 requêtes a souvent un problème. Regarde d’où elles viennent :

- **sur WordPress**, chaque extension ajoute souvent ses propres fichiers CSS et JavaScript, même sur les pages où elle ne sert pas. Désactive celles que tu n’utilises plus, une par une, en mesurant à chaque fois ;
- **les polices** : quatre graisses de deux polices différentes, c’est huit fichiers. Deux graisses d’une seule police suffisent souvent ;
- **les sliders et animations** sur l’accueil coûtent cher pour un bénéfice souvent faible.

## Vérification 3 : les scripts tiers

Chat en direct, vidéos intégrées, boutons de partage, pixels publicitaires, outils de statistiques : chacun charge du code depuis un autre serveur, que tu ne contrôles pas.

Dans l’onglet **Réseau**, repère les domaines qui ne sont pas le tien. Pour chacun, demande-toi : est-ce que je m’en sers vraiment ? Une vidéo YouTube peut être remplacée par une simple image cliquable qui ne charge le lecteur qu’au clic. Un widget de chat peut souvent être remplacé par un lien WhatsApp.

## Vérification 4 : l’hébergement et le temps de réponse

Regarde dans l’onglet **Réseau** la toute première requête, celle de la page elle-même. Si le serveur met **plus d’une seconde** à commencer à répondre, le problème n’est pas dans ta page mais derrière :

- un hébergement mutualisé très bas de gamme et surchargé ;
- un serveur très loin de tes visiteurs ;
- une base de données lente, ou une page reconstruite entièrement à chaque visite.

Dans ce cas, aucune optimisation d’image ne suffira : il faut un meilleur hébergement, ou un **cache de pages**.

## Vérification 5 : le cache et la compression

Deux réglages côté serveur font une grande différence :

- **le cache du navigateur** : les fichiers qui ne changent pas (images, CSS, JavaScript) doivent être gardés par le navigateur, pour que la deuxième visite soit quasi instantanée ;
- **la compression** (gzip ou Brotli) des fichiers texte, qui réduit fortement leur poids.

PageSpeed Insights signale explicitement leur absence. Sur WordPress, une extension de cache bien configurée règle souvent les deux d’un coup.

## Corriger dans le bon ordre

1. Images : le plus gros gain, le plus facile.
2. Scripts tiers et extensions inutiles : supprimer coûte zéro.
3. Cache et compression : souvent une simple option à activer.
4. Hébergement : seulement si le serveur répond lentement.
5. Et seulement ensuite, si besoin, le code.

Mesure de nouveau après chaque étape : tu sauras exactement ce qui a fonctionné.

## À retenir

- Mesure d’abord, en mobile, avec PageSpeed Insights et l’onglet Réseau.
- Les images trop lourdes sont la première cause de lenteur.
- Chaque script tiers et chaque extension a un coût : garde l’indispensable.
- Un serveur qui répond lentement ne se corrige pas en optimisant les images.
