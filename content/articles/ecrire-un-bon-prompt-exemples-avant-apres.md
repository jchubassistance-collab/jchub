---
slug: ecrire-un-bon-prompt-exemples-avant-apres
title: 'Comment écrire un bon prompt : exemples avant/après'
description: >-
  Contexte, tâche précise, format attendu, exemple : la méthode pour obtenir des
  réponses utiles d’une IA, illustrée par quatre prompts réécrits avant/après.
excerpt: >-
  Contexte, tâche précise, format attendu, exemple : la méthode pour obtenir des
  réponses utiles d’une IA, illustrée par quatre prompts réécrits avant/après.
category: IA & Automatisation
keywords:
  - écrire un prompt
  - bon prompt
  - prompt ia exemples
  - chatgpt prompt
  - prompt engineering
author: Jessy Ngnambongo
image: >-
  /api/article-cover?title=Comment+%C3%A9crire+un+bon+prompt+%3A+exemples+avant%2Fapr%C3%A8s&category=IA+%26+Automatisation
readTime: 4 min
status: scheduled
scheduledFor: '2026-12-17T07:00:00.000Z'
updatedAt: '2026-11-04T14:17:53.955Z'
---
Deux personnes posent « la même question » à une IA et obtiennent des réponses très différentes. La différence n’est presque jamais l’outil : c’est la **demande**, le prompt. Bonne nouvelle, écrire un bon prompt n’a rien de magique. Ça tient en cinq ingrédients, que voici, avec quatre exemples réécrits.

## Les cinq ingrédients d’un bon prompt

1. **Le contexte** : qui tu es, pour qui est le résultat, dans quelle situation.
2. **La tâche précise** : un verbe clair (rédige, résume, corrige, compare), pas « parle-moi de ».
3. **Le format attendu** : longueur, structure, ton, langue, tableau ou liste.
4. **Un exemple** : un modèle de ce que tu veux, quand c’est possible.
5. **Les contraintes** : ce qu’il faut éviter, les informations à ne pas inventer.

Tu n’as pas besoin des cinq à chaque fois. Mais quand une réponse te déçoit, c’est presque toujours l’un d’eux qui manque.

## Exemple 1 : répondre à un client mécontent

**Avant**
> « Écris une réponse à un client mécontent. »

L’IA ne sait ni ce qui s’est passé, ni ce que tu peux proposer. Elle écrit une lettre d’excuses générique.

**Après**
> « Je gère une boutique de vêtements en ligne à Brazzaville. Un client a reçu sa commande avec 5 jours de retard et une taille erronée. Rédige une réponse WhatsApp courte (5 lignes maximum), chaleureuse et professionnelle, en le tutoyant. Propose l’échange gratuit de l’article, livraison offerte. N’invente aucune autre compensation. »

Contexte, tâche, format, contrainte : la réponse est utilisable telle quelle.

## Exemple 2 : une requête SQL

**Avant**
> « Comment avoir les meilleurs clients en SQL ? »

**Après**
> « Base PostgreSQL. Table commandes(id, client_id, montant, cree_le) et table clients(id, nom). Écris une requête qui donne les 10 clients ayant dépensé le plus en 2026, avec leur nom et leur total, triés du plus grand au plus petit. Explique la requête en trois phrases. »

En donnant la structure des tables et le système de base de données, tu évites une requête qui ne tournera pas chez toi. Garde notre [aide-mémoire SQL](/fr/ressources/aide-memoire-sql) à côté pour vérifier la syntaxe.

## Exemple 3 : une fiche produit

**Avant**
> « Fais une description pour mon savon. »

**Après**
> « Rédige une fiche produit pour un savon artisanal au karité, fabriqué au Congo, vendu 2 500 FCFA. Public : femmes de 25 à 45 ans, achat sur Facebook. Format : un titre accrocheur, 3 puces sur les bienfaits, une phrase d’appel à l’action. Pas de promesse médicale. Voici une fiche que j’aime, à imiter pour le ton : [colle ta fiche préférée]. »

L’exemple de ton est souvent l’ingrédient le plus puissant : l’IA imite très bien un style qu’on lui montre.

## Exemple 4 : déboguer du code

**Avant**
> « Mon code ne marche pas, aide-moi. »

**Après**
> « Node.js 22, Express. Cette route renvoie une erreur 500 quand le panier est vide. Voici le code de la route et le message d’erreur complet. Donne les causes probables, de la plus à la moins vraisemblable, puis propose une correction qui gère le panier vide sans masquer d’autres erreurs. »

Version, code, message exact, comportement attendu : tout ce qu’un collègue te demanderait avant de t’aider.

## Un modèle à copier

Quand tu ne sais pas par où commencer, remplis simplement ce cadre :

> « Contexte : je suis [qui tu es] et j’ai besoin de [résultat] pour [destinataire]. Tâche : [verbe précis + objet]. Format : [longueur, structure, ton]. Exemple de ce que j’aime : [colle un exemple]. À éviter : [ce que tu ne veux pas]. »

Il n’a rien de magique, mais il t’oblige à donner les informations qui manquent le plus souvent.

## Itérer plutôt que tout réécrire

Un prompt n’est pas un examen en une seule tentative. Si la réponse est presque bonne, **corrige-la dans la conversation** :

- « Plus court, 3 phrases maximum. »
- « Garde la structure mais adopte un ton plus formel. »
- « Remplace l’exemple par un cas en FCFA. »
- « Qu’est-ce que tu as supposé que je ne t’ai pas dit ? »

Cette dernière question est précieuse : elle fait apparaître les suppositions de l’IA, que tu peux alors corriger.

## Les erreurs les plus fréquentes

- **Trop vague** : « parle-moi du marketing » donne une réponse de manuel.
- **Plusieurs tâches à la fois** : découpe en étapes, une demande par message.
- **Croire sans vérifier** : chiffres, dates, citations et commandes doivent être contrôlés.
- **Partager des données sensibles** : pas de mots de passe, de clés d’API ni d’informations personnelles de clients.

Pour des usages concrets côté code, relis aussi [nos cinq façons d’utiliser l’IA quand on est développeur](/fr/blog/5-facons-utiliser-ia-gagner-du-temps-developpeur).

## À retenir

- Contexte, tâche précise, format, exemple, contraintes : cinq ingrédients.
- Un exemple de ce que tu veux vaut mieux qu’une longue explication.
- Corrige dans la conversation au lieu de tout recommencer.
- Vérifie toujours les faits, les chiffres et le code proposés.
