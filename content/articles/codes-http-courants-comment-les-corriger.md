---
slug: codes-http-courants-comment-les-corriger
title: Les codes HTTP les plus courants et comment les corriger
description: >-
  400, 401, 403, 404, 429, 500, 502 : ce que veut dire chaque code d’erreur
  HTTP, d’où il vient le plus souvent et comment le corriger, côté client ou
  serveur.
excerpt: >-
  400, 401, 403, 404, 429, 500, 502 : ce que veut dire chaque code d’erreur
  HTTP, d’où il vient le plus souvent et comment le corriger, côté client ou
  serveur.
category: Développement
keywords:
  - codes http
  - erreur 404
  - erreur 500
  - erreur 403
  - erreur 429
  - code de statut http
author: Jessy Ngnambongo
image: >-
  /api/article-cover?title=Les+codes+HTTP+les+plus+courants+et+comment+les+corriger&category=D%C3%A9veloppement
readTime: 4 min
status: scheduled
scheduledFor: '2026-11-17T07:00:00.000Z'
updatedAt: '2026-11-04T14:17:50.068Z'
---
Ton application affiche « Erreur 403 », ton API renvoie un 422 que personne ne comprend, ou ton site tombe sur un 502 au pire moment. Chaque code HTTP est un indice : il dit **qui** s’est trompé, le client ou le serveur, et souvent **pourquoi**. Voici les codes que tu croiseras le plus, et ce qu’il faut vérifier pour chacun.

## Lire un code HTTP en une seconde

Le premier chiffre suffit pour savoir où chercher :

- **2xx** : tout s’est bien passé (200, 201, 204).
- **3xx** : redirection vers une autre adresse (301, 302, 304).
- **4xx** : la **requête** pose problème. C’est au client de la corriger.
- **5xx** : le **serveur** a échoué. La requête était peut-être correcte.

Garde aussi à portée de main notre [aide-mémoire des codes HTTP](/fr/ressources/codes-http), gratuit en PDF.

## Voir le vrai code avant de corriger

Une page d’erreur jolie peut cacher le vrai code. Pour le voir :

- **Dans le navigateur** : ouvre les outils de développement (F12), onglet **Réseau**, recharge la page et clique sur la requête en rouge.
- **En ligne de commande** : `curl -i https://exemple.com/api/produits` affiche le code et les en-têtes de la réponse.

Lis aussi le **corps** de la réponse : beaucoup d’API y expliquent l’erreur en clair. Pour un JSON illisible, passe-le dans le [formateur JSON](/fr/outils/json-formatter).

## 400 Bad Request : la requête est mal formée

**Causes fréquentes** : JSON invalide (une virgule en trop, un guillemet oublié), paramètre obligatoire manquant, mauvais `Content-Type`.

**À vérifier** : le corps de la requête est-il un JSON valide ? L’en-tête `Content-Type: application/json` est-il présent ? Les noms des champs correspondent-ils exactement à la documentation ? Une majuscule suffit à tout casser.

## 401 Unauthorized et 403 Forbidden : la confusion classique

- **401** veut dire « je ne sais pas qui tu es » : jeton absent, expiré ou mal envoyé.
- **403** veut dire « je sais qui tu es, mais tu n’as pas le droit » : rôle insuffisant, ressource d’un autre utilisateur.

**Pour un 401** : vérifie l’en-tête `Authorization: Bearer …`, et surtout la date d’expiration du jeton. Le [décodeur JWT](/fr/outils/decodeur-jwt) te montre son champ `exp` en un clin d’œil.

**Pour un 403** : le problème n’est pas le jeton mais les droits. Regarde le rôle de l’utilisateur et les règles d’accès côté serveur. Se reconnecter ne changera rien.

## 404 Not Found : rien à cette adresse

**Côté site** : lien cassé, page supprimée ou déplacée sans redirection. Si la page a changé d’adresse, mets en place une **redirection 301** vers la nouvelle, pour garder visiteurs et référencement.

**Côté API** : faute de frappe dans l’URL, mauvaise version (`/v1` au lieu de `/v2`), identifiant qui n’existe pas, ou caractère spécial non encodé dans l’adresse. Pour ce dernier cas, l’[encodeur d’URL](/fr/outils/encodeur-url) t’évite les pièges des espaces et des accents.

## 405, 413, 415 : la requête n’est pas acceptée telle quelle

- **405 Method Not Allowed** : bonne adresse, mauvaise méthode. Tu envoies un `POST` là où seul un `GET` est prévu.
- **413 Content Too Large** : le fichier ou le corps est trop lourd. Compresse le fichier, ou augmente la limite du serveur si c’est voulu.
- **415 Unsupported Media Type** : le format envoyé n’est pas accepté. Vérifie le `Content-Type` et l’extension du fichier.

## 422 Unprocessable Content : les données ne passent pas la validation

La requête est bien formée, mais son contenu est refusé : e-mail invalide, date dans le passé, champ trop long. Une bonne API renvoie la liste des champs en erreur dans le corps de la réponse : lis-la et corrige champ par champ.

## 429 Too Many Requests : trop de demandes

Tu dépasses la limite de requêtes autorisée. **La correction** :

- Respecte l’en-tête `Retry-After` quand il est présent.
- Ajoute un délai qui s’allonge entre deux nouvelles tentatives.
- Mets en cache les réponses qui changent peu, pour moins solliciter l’API.

Pour savoir à l’avance si ton trafic tiendra dans la limite, estime ton volume de requêtes avec l’[API Cost Calculator](/fr/tools/api-cost-calculator).

## 500 Internal Server Error : le serveur a planté

C’est une erreur imprévue dans le code du serveur : exception non gérée, variable d’environnement manquante, base de données injoignable. **Le message affiché au visiteur ne t’aidera pas** : la vraie explication est dans les **journaux du serveur**, au moment exact de la requête. Commence toujours par là.

## 502, 503, 504 : un problème entre les serveurs

- **502 Bad Gateway** : un serveur intermédiaire (proxy, répartiteur de charge) a reçu une réponse invalide du serveur suivant. Souvent, l’application derrière a planté ou n’est pas démarrée.
- **503 Service Unavailable** : serveur en maintenance ou surchargé. Le plus souvent temporaire.
- **504 Gateway Timeout** : le serveur suivant a mis trop de temps à répondre. Cherche la requête lente : appel à une API externe, requête de base de données sans index.

## À retenir

- **4xx** : corrige la requête. **5xx** : regarde les journaux du serveur.
- **401** = pas identifié, **403** = identifié mais pas autorisé.
- Lis toujours le corps de la réponse : l’explication y est souvent écrite.
- Une page déplacée mérite une redirection **301**, pas un 404.

Garde l’[aide-mémoire des codes HTTP](/fr/ressources/codes-http) sous la main pour les codes plus rares.
