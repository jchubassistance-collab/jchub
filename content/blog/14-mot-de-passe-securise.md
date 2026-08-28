---
title: "Comment créer un mot de passe vraiment sécurisé (et le retenir)"
description: "Tous les conseils habituels sur les mots de passe sont nuls. Voici la vraie stratégie : générateur + gestionnaire + 2FA. Simple, efficace, applicable."
slug: mot-de-passe-securise
keywords: ["mot de passe sécurisé", "générateur password", "password manager", "bitwarden", "2fa", "sécurité compte"]
author: Jessy Ngnambongo
date: 2026-08-25
category: Sécurité
readingTime: 5 min
---

# Comment créer un mot de passe vraiment sécurisé (et le retenir)

Le conseil classique : "Mets des majuscules, des chiffres, des symboles, et change-le tous les 3 mois."

C'est **n'importe quoi**.

Une étude du NIST (2017) a montré que ce genre de règles强制 les gens à utiliser des patterns prévisibles (`Password1!`, `Summer2026!`, etc.) que les attaquants crackent en quelques secondes.

Voici la vraie méthode, utilisée par les pros en sécu.

## Les 3 règles qui marchent vraiment

### 1. **Longueur > complexité**

Un mot de passe de **16 caractères** en minuscules seulement est **beaucoup** plus dur à cracker qu'un `P@ssw0rd!` de 9 caractères.

**Pourquoi** : la force d'un mot de passe se mesure en **entropie** (bits de randomness) :

- 8 chars minuscules (26^8) = 38 bits → crackable en secondes
- 16 chars minuscules (26^16) = 75 bits → 3 millions d'années
- 9 chars avec symboles (90^9) = 59 bits → 1 an

La longueur gagne. Vise **16+ caractères**.

### 2. **Unique par site**

**JAMAIS** le même mot de passe sur 2 sites. Si un site se fait leak (et ça arrive tous les jours), tous tes comptes sont compromis.

### 3. **Pas de mémorisation humaine**

Ton cerveau peut retenir 5-10 mots de passe max. Au-delà, tu vas en réutiliser ou en faire des simples. La solution : un **gestionnaire de mots de passe**.

## Le setup que je recommande (gratuit)

### 1. **Bitwarden** (gestionnaire)

- ✅ Open source
- ✅ Gratuit (la version gratuite suffit)
- ✅ Sync entre tous tes appareils
- ✅ Générateur de mots de passe intégré
- ✅ Audit : te dit quels mots de passe sont faibles/réutilisés

Télécharge : [bitwarden.com](https://bitwarden.com/)

**Setup (5 min)** :
1. Crée un compte Bitwarden avec un **vrai bon mot de passe** (le seul à retenir)
2. Active la 2FA sur ton compte Bitwarden
3. Importe tes mots de passe depuis Chrome/Firefox
4. Bitwarden te dira lesquels sont à changer

### 2. **Un mot de passe maître vraiment fort**

Le seul mot de passe que tu dois retenir par cœur : celui de Bitwarden. Il doit être **très fort** car il déverrouille tous les autres.

**La méthode de la phrase aléatoire** (Diceware) :

```
CorrectHorseBatteryStaple42!
```

Ou utilise mon [générateur de mot de passe](https://jchub.io/outils/generateur-mot-de-passe) sur JcHub. Génère 24+ caractères, copie dans Bitwarden, oublie-le.

### 3. **2FA partout où c'est possible**

La 2FA (Two-Factor Authentication) ajoute une couche de sécurité. Même si ton mot de passe fuite, le mec a besoin de ton téléphone.

**Apps recommandées** :
- **Authy** : sync entre appareils, backup cloud
- **Google Authenticator** : simple, mais pas de backup
- **1Password** : payant mais excellent
- **Bitwarden Authenticator** : gratuit, intégré à Bitwarden

**Évite la 2FA par SMS** : c'est vulnérable au SIM swapping.

## Comment générer un mot de passe fort

### Outil en ligne (le plus rapide)

Mon [Password Generator](https://jchub.io/outils/generateur-mot-de-passe) sur JcHub. Tu choisis :
- La longueur (16+ recommandé)
- Si tu veux des majuscules
- Si tu veux des chiffres
- Si tu veux des symboles
- Tu cliques, t'as ton mot de passe

### En CLI (pour les devs)

```bash
# Linux/Mac avec openssl
openssl rand -base64 24 | tr -d "=+/" | cut -c1-24

# Mac avec pwgen (brew install pwgen)
pwgen -s 24 1

# Linux avec apg (apt install apg)
apg -a 1 -m 24 -x 24 -n 1
```

### Dans Bitwarden

Bitwarden a un générateur intégré. Tape `bitwarden.com/password-generator` (en étant connecté) ou dans l'extension.

## Les erreurs que tout le monde fait

### 1. **Variations prévisibles**

Tu prends "MonMot2passe!" et tu fais :
- Gmail : "MonMot2passe!G"
- Facebook : "MonMot2passe!F"
- Twitter : "MonMot2passe!T"

Les attaquants testent ce genre de patterns en premier. **Vraiment** pas sécurisé.

### 2. **Questions de sécurité**

"Quel est le nom de ton premier animal ?" → info trouvable sur les réseaux sociaux.

**Solution** : génère une **réponse aléatoire** et stocke-la dans Bitwarden. Pour "Nom de ton premier animal", mets `xK9$mP2vQ` et stocke ça dans une note sécurisée.

### 3. **Stockage dans le navigateur**

Chrome et Firefox peuvent stocker tes mots de passe. C'est mieux que rien, mais :
- Pas chiffré de bout en bout
- Accessible à n'importe qui a accès à ton profil
- Pas de partage cross-device sécurisé

**Préfère un vrai gestionnaire** (Bitwarden, 1Password, KeePass).

### 4. **Mails jetables pour "sécurité"**

Utiliser `temp-mail.com` pour créer un compte n'est pas une mesure de sécurité. Au contraire, tu perds l'accès au compte.

Utilise un **alias email** (SimpleLogin, AnonAddy) lié à ta vraie boîte. Tu peux le supprimer si nécessaire sans perdre tes autres comptes.

## La checklist sécurité en 30 minutes

```
□ Installer Bitwarden
□ Importer mes mots de passe existants
□ Vérifier l'audit Bitwarden (mots de passe faibles, réutilisés)
□ Changer les 5 comptes les plus critiques (email, banque, GitHub, Google, Apple)
  → Utiliser le générateur Bitwarden (24+ chars, random)
  → Activer la 2FA
□ Activer la 2FA sur Bitwarden lui-même
□ Backup du code de récupération 2FA (imprimer ou stocker physiquement)
□ Changer le reste progressivement (au fur et à mesure)
```

**Comptes critiques à changer en premier** :
1. Email principal (si quelqu'un y a accès, il reset tous les autres)
2. Banque / mobile money
3. Apple/Google/Microsoft (récupération d'appareil)
4. GitHub (code source de tes projets)
5. Gestionnaire de mots de passe lui-même

## Le cas spécifique des devs

Si t'es dev, t'as des **clés API**, des **tokens JWT**, des **passwords de DB** à gérer. Les pires endroits où les mettre :

- ❌ **En clair dans le code** (Git push = leak public)
- ❌ **En clair dans `.env` commité** (pareil)
- ❌ **En clair dans des variables d'env de prod** (visible par les ops)

**Les bons endroits** :
- ✅ **Vault** (HashiCorp Vault) : pour les secrets d'infrastructure
- ✅ **Doppler / Infisical** : pour les secrets d'app
- ✅ **AWS Secrets Manager / GCP Secret Manager** : pour le cloud
- ✅ **Bitwarden** : pour tes secrets perso (clé SSH, token API perso)
- ✅ **.env en local + .gitignore + variables d'env en prod** (le minimum)

## TL;DR

- **Longueur > complexité** : vise 16+ caractères
- **Unique par site** : 1 password = 1 site, jamais de réutilisation
- **Gestionnaire** : Bitwarden (gratuit, open source)
- **2FA** : partout où c'est possible, app > SMS
- **Pas de questions de sécurité** : génère des réponses random
- **Générateur gratuit** : [jchub.io/outils/generateur-mot-de-passe](https://jchub.io/outils/generateur-mot-de-passe)

---

**Tu veux tester si tes mots de passe actuels sont robustes ?** Mon [Password Generator](https://jchub.io/outils/generateur-mot-de-passe) inclut un indicateur de force en temps réel.

Y'a 14 outils dev gratuits sur JcHub → [jchub.io/outils](https://jchub.io/outils)
