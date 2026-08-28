---
title: "QR Code : comment en créer un pour ton WiFi, vCard ou paiement mobile"
description: "Le QR code c'est plus juste pour les menus de resto. Voici 5 usages pratiques pour les devs, avec des générateurs gratuits."
slug: creer-qr-code-wifi-paiement
keywords: ["qr code generator", "qr code wifi", "qr code vcard", "qr code paiement", "cinetpay qr", "mobile money qr"]
author: Jessy Ngnambongo
date: 2026-08-25
category: Productivité
readingTime: 4 min
---

# QR Code : comment en créer un pour ton WiFi, vCard ou paiement mobile

Le QR code est partout en 2026. Mais la plupart des devs savent juste que ça contient une URL. En vrai, un QR code peut stocker **n'importe quoi** : WiFi, contact, paiement, événement, etc.

Voici 5 usages concrets que j'ai mis en place, et comment les générer.

## 1. QR Code WiFi (le plus simple, le plus utile)

Tu vas chez quelqu'un, tu demandes le WiFi, il te sort un QR code, tu scannes, t'es connecté. **Fini le "c'est quoi le mot de passe déjà ?"**

Le format du QR code WiFi :

```
WIFI:T:WPA;S:NomDuReseau;P:MotDePasse;H:false;;
```

- `T` : type de sécurité (WPA, WEP, ou vide)
- `S` : SSID (nom du réseau)
- `P` : mot de passe
- `H` : réseau caché (true/false)

**Exemple concret** : pour mon WiFi "JcHub-Guest" avec mot de passe "Welcome2026" :

```
WIFI:T:WPA;S:JcHub-Guest;P:Welcome2026;H:false;;
```

Tu colles ça dans un générateur, et t'as ton QR code. Tes invités scannent → connectés.

## 2. QR Code vCard (partage de contact)

Tu rencontres quelqu'un en conf, tu lui files ton QR code, il scanne, il a ton contact complet. Plus rapide que d'épeler ton email.

Le format vCard :

```
BEGIN:VCARD
VERSION:3.0
FN:Jean Dupont
ORG:JcHub
TEL:+242069550625
EMAIL:jean@jchub.io
URL:https://jchub.io
END:VCARD
```

Tu mets ça dans un QR code, et le scanner ajoute direct le contact dans le téléphone.

**Cas d'usage** : networking, signatures email, cartes de visite physiques.

## 3. QR Code paiement mobile (le game changer en Afrique)

En Afrique, le mobile money (MTN MoMo, Airtel Money) est **massif**. Et beaucoup de commerçants se font payer via QR code.

### Le format USSD (compatible partout)

```
*150*1*1*numero*montant*code#  (MTN MoMo)
*501*1*numero*montant#          (Airtel Money)
```

Tu peux générer un QR code qui contient ce code USSD. Le client scanne → l'app de paiement s'ouvre avec le numéro + montant pré-remplis.

### Avec CinetPay (ma recommandation pour le Congo)

CinetPay permet de générer des QR codes de paiement directement. Tu crées un "payment link", tu obtiens un QR code, tu l'imprimes, tes clients scannent et paient.

**Avantage** : pas besoin que le client tape le numéro, c'est pré-rempli.

### Paiement crypto

```bitcoin
bitcoin:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa?amount=0.01&label=Coffee
```

Bitcoin et autres cryptos supportent des URI dans les QR codes.

## 4. QR Code événement (calendrier)

```
BEGIN:VCALENDAR
BEGIN:VEVENT
DTSTART:20261225T190000Z
DTEND:20261225T230000Z
SUMMARY:Noël JcHub
LOCATION:En ligne
URL:https://jchub.io/noel
END:VEVENT
END:VCALENDAR
```

Tu scannes → l'événement s'ajoute direct dans ton calendrier.

**Cas d'usage** : confs, meetups, mariages, anniversaires.

## 5. QR Code WiFi sans internet

Le QR code peut stocker jusqu'à **3 000 caractères alphanumériques** (version 40). Tu peux donc stocker :
- Un texte long
- Une image en Base64
- Un PDF (jusqu'à ~3 KB)

C'est utile pour les **cartes de visite offline** ou les **docs d'évacuation** (en cas de coupure internet).

## Comment générer un QR code

### Outil en ligne (le plus rapide)

J'ai un [QR Code Generator gratuit](https://jchub.io/outils/qr-code-generator) sur JcHub. Tu colles ton texte/URL, tu choisis la taille, tu télécharges en PNG.

### En JavaScript (pour ton app)

```bash
npm install qrcode
```

```javascript
const QRCode = require('qrcode');

QRCode.toFile('qrcode.png', 'WIFI:T:WPA;S:JcHub-Guest;P:Welcome2026;;', {
  width: 300,
  margin: 2,
  color: {
    dark: '#000000',
    light: '#FFFFFF'
  }
});
```

### En Python

```python
import qrcode

qr = qrcode.QRCode(version=1, box_size=10, border=5)
qr.add_data('https://jchub.io')
qr.make(fit=True)
img = qr.make_image(fill_color="black", back_color="white")
img.save("qrcode.png")
```

## Les erreurs courantes

### 1. **QR code trop petit**

Si tu imprimes ton QR code et qu'il fait moins de 2 cm, les scanners galèrent. Règle : **au moins 2 cm de large** pour être scanné de loin.

### 2. **Pas de marge blanche**

Autour du QR code, il faut une **zone de silence** (4 modules minimum). Si tu mets ton QR code sur un fond coloré sans marge, ça scanne pas.

### 3. **Trop de données**

Si tu mets 3000 caractères, le QR code devient très dense et dur à scanner. Limite-toi à ce qui est nécessaire.

### 4. **QR code dynamique vs statique**

**Statique** : le contenu est gravé dans le QR code. Si tu changes l'URL, faut tout réimprimer.
**Dynamique** : le QR code pointe vers un service qui redirige. Tu peux changer la destination sans réimprimer.

Services dynamiques : bit.ly, qr-code-generator.com (version pro), CinetPay pour les paiements.

## TL;DR

- **5 usages** : WiFi, vCard, paiement, événement, offline
- **Format WiFi** : `WIFI:T:WPA;S:Nom;P:Password;;`
- **Format vCard** : `BEGIN:VCARD...END:VCARD`
- **Mobile money** : USSD pré-rempli ou CinetPay
- **Limites** : 3000 chars max, 2cm de large minimum
- **Outil gratuit** : [jchub.io/outils/qr-code-generator](https://jchub.io/outils/qr-code-generator)

---

**Tu codes une feature de partage et t'as besoin de QR codes dynamiques ?** Mon [QR Code Generator](https://jchub.io/outils/qr-code-generator) te sort un PNG prêt à utiliser en 1 clic.

Y'a 14 outils dev gratuits sur JcHub → [jchub.io/outils](https://jchub.io/outils)
