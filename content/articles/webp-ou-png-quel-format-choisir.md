---
slug: webp-ou-png-quel-format-choisir
title: 'WebP ou PNG : quel format choisir pour ton site ?'
description: >-
  Photo, logo, capture d’écran, image transparente : quand utiliser WebP, PNG,
  JPEG ou SVG sur ton site, avec un tableau simple pour décider en dix secondes.
excerpt: >-
  Photo, logo, capture d’écran, image transparente : quand utiliser WebP, PNG,
  JPEG ou SVG sur ton site, avec un tableau simple pour décider en dix secondes.
category: Développement
keywords:
  - webp ou png
  - format image web
  - webp vs png
  - png ou jpeg
  - svg
  - image site web
author: Jessy Ngnambongo
image: >-
  /api/article-cover?title=WebP+ou+PNG+%3A+quel+format+choisir+pour+ton+site+%3F&category=D%C3%A9veloppement
readTime: 4 min
status: scheduled
scheduledFor: '2026-12-01T07:00:00.000Z'
updatedAt: '2026-11-04T14:17:51.276Z'
---
Ton site charge lentement, et quelqu’un t’a dit « passe tout en WebP ». Bon conseil… la plupart du temps. Car chaque format a été pensé pour un type d’image, et le mauvais choix donne soit des fichiers trop lourds, soit des images abîmées. Voici comment choisir, image par image.

## Ce que chaque format sait faire

**PNG** compresse **sans perte** : l’image est conservée au pixel près. Il gère la **transparence**. C’est parfait pour une capture d’écran, un schéma ou un visuel avec du texte, mais beaucoup trop lourd pour une photo.

**JPEG** compresse **avec perte** : il jette des détails que l’œil remarque peu. Idéal pour les photos, mais il ne gère pas la transparence, et il crée des petites taches autour des textes et des contours nets.

**WebP** sait faire **les deux** : avec ou sans perte, avec transparence, et même en animation. Selon les mesures publiées par Google, qui l’a créé, un WebP sans perte est environ **26 % plus léger** qu’un PNG, et un WebP avec perte **25 à 34 % plus léger** qu’un JPEG de qualité comparable.

**SVG** n’est pas une image en pixels mais un **dessin vectoriel** : des formes décrites en texte. Il reste net à toutes les tailles, et il est souvent minuscule pour un logo ou une icône.

## Et la compatibilité ?

Ce n’est plus un frein : WebP est lu par tous les navigateurs actuels, Chrome, Edge, Firefox et Safari, y compris sur iPhone depuis iOS 14. Seuls de très vieux appareils jamais mis à jour posent problème. Pour un site grand public, tu peux l’utiliser sans hésiter.

## Le tableau pour décider

| Ton image | Le meilleur choix | Pourquoi |
|---|---|---|
| Photo de produit, de paysage, d’équipe | **WebP avec perte** | Le plus léger pour une photo, sans différence visible |
| Logo, icône, pictogramme | **SVG** | Net à toutes les tailles, très léger |
| Logo seulement disponible en image | **WebP sans perte** ou **PNG** | Contours nets et transparence |
| Capture d’écran, schéma, texte sur fond uni | **WebP sans perte** ou **PNG** | Pas de taches autour du texte |
| Image avec fond transparent | **WebP** ou **PNG** | JPEG ne gère pas la transparence |
| Fichier à envoyer pour impression ou retouche | **PNG** | Universel et sans perte |

En résumé : **WebP pour le site**, **PNG quand on a besoin d’un fichier sans perte universel**, **SVG pour les logos et icônes**.

## Et AVIF, le petit dernier ?

Tu croiseras peut-être **AVIF**, un format plus récent qui compresse souvent encore mieux que WebP, surtout pour les photos. Les navigateurs actuels le lisent, mais il est plus lent à créer, et moins d’outils et de CMS le gèrent bien. Pour un petit site, WebP reste le choix le plus simple et le plus sûr ; AVIF devient intéressant quand tu as des milliers de photos et une chaîne d’images automatisée.

## Les pièges à éviter

- **Convertir un JPEG en PNG pour « améliorer la qualité »** : impossible. Les détails perdus par le JPEG ne reviennent pas, et le fichier devient bien plus lourd.
- **Mettre une photo en PNG** : elle peut peser cinq à dix fois plus qu’en WebP, pour un rendu identique à l’écran.
- **Oublier la taille** : une photo de 4 000 pixels de large affichée dans un cadre de 600 pixels reste lourde, même en WebP. Redimensionne d’abord à la taille d’affichage, en prévoyant le double pour les écrans haute définition.
- **Compresser trop fort** : en dessous d’une certaine qualité, les visages et les dégradés se dégradent. Pour une photo, une qualité autour de 75 à 85 est un bon point de départ.

## Passer à l’action

1. Repère les images les plus lourdes de ta page d’accueil : dans les outils de développement (F12), onglet **Réseau**, filtre sur **Img** et trie par taille.
2. Redimensionne-les à leur taille d’affichage avec le [redimensionneur d’images](/fr/outils/redimensionneur-recadreur-images).
3. Convertis-les en WebP, ou en PNG si besoin, avec l’[optimiseur et convertisseur WebP / PNG](/fr/outils/optimiseur-convertisseur-webp-png), en réglant la qualité.
4. Remplace les fichiers sur ton site et recharge la page pour comparer le poids total.

Pour aller plus loin sur les réglages de compression, lis notre guide : [comment optimiser ses images WebP et PNG pour accélérer un site](/fr/blog/optimiser-convertir-images-webp-png-guide-pratique).

## À retenir

- **WebP** est le meilleur choix par défaut pour un site, photos comme visuels.
- **PNG** reste utile pour un fichier sans perte à partager ou à imprimer.
- **SVG** pour les logos et les icônes, quand tu as la version vectorielle.
- Redimensionner compte autant que bien choisir le format.
