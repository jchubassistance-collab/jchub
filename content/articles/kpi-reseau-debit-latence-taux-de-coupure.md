---
slug: kpi-reseau-debit-latence-taux-de-coupure
title: 'C’est quoi un KPI réseau ? Débit, latence, coupures expliqués'
description: >-
  Débit, latence, gigue, perte de paquets, taux de coupure, force du signal :
  les indicateurs qui mesurent la qualité d’un réseau mobile, expliqués avec des
  ordres de grandeur.
excerpt: >-
  Débit, latence, gigue, perte de paquets, taux de coupure, force du signal :
  les indicateurs qui mesurent la qualité d’un réseau mobile, expliqués avec des
  ordres de grandeur.
category: Réseau & Télécom
keywords:
  - kpi réseau
  - débit internet
  - latence
  - ping
  - taux de coupure
  - qualité réseau mobile
  - rsrp
author: Jessy Ngnambongo
image: >-
  /api/article-cover?title=C%E2%80%99est+quoi+un+KPI+r%C3%A9seau+%3F+D%C3%A9bit%2C+latence%2C+coupures+expliqu%C3%A9s&category=R%C3%A9seau+%26+T%C3%A9l%C3%A9com
readTime: 4 min
status: scheduled
scheduledFor: '2026-12-15T07:00:00.000Z'
updatedAt: '2026-11-04T14:17:53.301Z'
---
« Le réseau est mauvais. » Tout le monde l’a déjà dit, mais mauvais comment ? Lent à charger une vidéo, saccadé en appel, ou carrément coupé ? Les ingénieurs télécom mesurent la qualité d’un réseau avec des **KPI** (Key Performance Indicators, indicateurs clés de performance). Les connaître t’aide à décrire précisément un problème, à comparer des offres et à comprendre un test de débit.

## Le débit : la quantité de données par seconde

Le **débit** mesure combien de données passent chaque seconde, en **mégabits par seconde** (Mbit/s). On distingue :

- le **débit descendant** : ce que tu reçois (une vidéo, une page web, un téléchargement) ;
- le **débit montant** : ce que tu envoies (une photo publiée, ta vidéo en visioconférence).

Le montant est presque toujours plus faible que le descendant, d’où les visios où les autres te voient flou alors que tu les vois très bien.

**Attention aux unités** : un débit s’exprime en **bits**, un fichier en **octets**. Un octet vaut 8 bits. À 40 Mbit/s, tu télécharges donc environ 5 Mo par seconde, pas 40.

**Ordres de grandeur** : une vidéo en haute définition demande quelques Mbit/s ; un appel vidéo, 1 à 3 Mbit/s dans chaque sens.

## La latence : le temps de réaction

La **latence** est le temps d’un aller-retour entre ton appareil et un serveur, en **millisecondes** (ms). C’est le « ping » des tests de débit. Elle ne dit rien de la quantité de données, seulement de la **réactivité**.

Un réseau peut avoir un très bon débit et une mauvaise latence : la vidéo se charge bien, mais un jeu en ligne ou un appel vidéo réagit en retard.

**Ordres de grandeur** : en dessous de 30 ms, c’est excellent ; une connexion 4G tourne souvent entre 30 et 60 ms ; au-delà de 100 ms, la conversation vidéo commence à souffrir. La distance compte : un serveur sur un autre continent ajoute à lui seul plusieurs dizaines de millisecondes.

## La gigue et la perte de paquets : la régularité

Deux indicateurs moins connus expliquent beaucoup de « mauvais appels » :

- la **gigue** (jitter) : la variation de la latence d’un instant à l’autre. Une latence stable à 60 ms passe mieux qu’une latence qui saute de 20 à 200 ms ;
- la **perte de paquets** : la part des données qui n’arrivent jamais. Au-delà de 1 à 2 %, la voix hache et l’image se fige.

Un appel WhatsApp qui « robotise » ta voix, c’est presque toujours de la gigue ou de la perte de paquets, rarement un problème de débit.

## Le taux de coupure et l’accessibilité

Côté opérateur, deux KPI comptent énormément :

- le **taux d’accessibilité** : la part des appels ou des connexions qui **réussissent à s’établir**. Un appel qui ne passe pas du tout fait baisser ce chiffre ;
- le **taux de coupure** (drop rate) : la part des appels qui **s’interrompent en cours de route**, souvent lors d’un changement d’antenne mal géré ou dans une zone mal couverte.

Les opérateurs suivent ces chiffres cellule par cellule. Une antenne dont le taux de coupure grimpe signale un problème : panne, surcharge ou interférence.

## La force du signal : RSRP, RSRQ et SINR

Les barres de ton téléphone simplifient une mesure plus fine. En 4G, les techniciens regardent surtout :

- le **RSRP** : la puissance du signal reçu, en dBm (une valeur négative). Plus elle est proche de zéro, mieux c’est. Repère courant : meilleur que -80 dBm, excellent ; entre -90 et -100 dBm, moyen ; en dessous de -110 dBm, très faible ;
- le **RSRQ** et le **SINR** : la **qualité** du signal, c’est-à-dire à quel point il est brouillé par les autres antennes et le bruit.

On peut avoir un signal fort mais de mauvaise qualité, par exemple près de plusieurs antennes qui se gênent. Sur Android, ces valeurs apparaissent souvent dans les informations sur l’état du téléphone, ou dans des applications de mesure réseau.

## Mesurer correctement ta connexion

Un seul test de débit ne prouve pas grand-chose. Pour un diagnostic sérieux :

1. **Teste à plusieurs moments** : le soir, quand tout le quartier est connecté, le débit chute souvent.
2. **Note les trois chiffres** : débit descendant, débit montant et latence.
3. **Teste au même endroit**, téléphone immobile : un mètre près d’une fenêtre peut tout changer.
4. **Compare avec un autre appareil** pour écarter un problème de téléphone.

Avec ces chiffres, tu peux dire à ton opérateur « 2 Mbit/s et 150 ms de latence tous les soirs entre 19 h et 22 h » plutôt que « ça rame ». C’est bien plus utile pour obtenir une réponse.

## À retenir

- **Débit** = quantité de données par seconde ; **latence** = temps de réaction.
- 1 octet = 8 bits : divise un débit en Mbit/s par 8 pour l’avoir en Mo/s.
- La **gigue** et la **perte de paquets** expliquent la plupart des appels hachés.
- Les opérateurs suivent l’**accessibilité** et le **taux de coupure** de chaque antenne.

Pour comprendre d’où viennent ces chiffres, relis notre article sur [le fonctionnement d’un réseau mobile](/fr/blog/comment-fonctionne-un-reseau-mobile).
