---
slug: create-qr-code-wifi-vcard-mobile-payment
title: 'QR codes: how to create one for your WiFi, vCard or mobile payment'
description: "QR codes aren't just for restaurant menus anymore. Here are 5 practical uses for developers, with free generators."
excerpt: 'QR codes: how to create one for your WiFi, vCard or mobile payment. QR codes are everywhere in 2026. But most developers only know they contain...'
keywords:
  - qr code generator
  - wifi qr code
  - vcard qr code
  - payment qr code
  - cinetpay qr
  - mobile money qr
sourceHash: ff0ccc58ac1d39422ab9894a
translatedAt: '2026-10-19T07:57:46.931Z'
---
# QR codes: how to create one for your WiFi, vCard or mobile payment

QR codes are everywhere in 2026. But most developers only know they contain a URL. In reality, a QR code can store **anything**: WiFi, contact details, payments, events, and more.

Here are 5 concrete uses I've set up, and how to generate them.

## 1. WiFi QR code (the simplest, the most useful)

You visit someone, ask for the WiFi, they show you a QR code, you scan it, you're connected. **No more "what was the password again?"**

The WiFi QR code format:

```
WIFI:T:WPA;S:NetworkName;P:Password;H:false;;
```

- `T`: security type (WPA, WEP, or empty)
- `S`: SSID (network name)
- `P`: password
- `H`: hidden network (true/false)

**Concrete example**: for my "JcHub-Guest" WiFi with the password "Welcome2026":

```
WIFI:T:WPA;S:JcHub-Guest;P:Welcome2026;H:false;;
```

Paste that into a generator and you have your QR code. Your guests scan it → connected.

## 2. vCard QR code (sharing contact details)

You meet someone at a conference, hand them your QR code, they scan it, and they have your full contact. Faster than spelling out your email.

The vCard format:

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

Put that in a QR code, and the scanner adds the contact straight to the phone.

**Use cases**: networking, email signatures, physical business cards.

## 3. Mobile payment QR code (the game changer in Africa)

In Africa, mobile money (MTN MoMo, Airtel Money) is **huge**. And many merchants get paid via QR code.

### The USSD format (works everywhere)

```
*150*1*1*number*amount*code#  (MTN MoMo)
*501*1*number*amount#          (Airtel Money)
```

You can generate a QR code containing this USSD code. The customer scans it → the payment app opens with the number + amount pre-filled.

### With CinetPay (my recommendation for Congo)

CinetPay lets you generate payment QR codes directly. You create a "payment link", get a QR code, print it, and your customers scan and pay.

**Advantage**: the customer doesn't need to type the number, it's pre-filled.

### Crypto payment

```bitcoin
bitcoin:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa?amount=0.01&label=Coffee
```

Bitcoin and other cryptos support URIs in QR codes.

## 4. Event QR code (calendar)

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

You scan it → the event is added straight to your calendar.

**Use cases**: conferences, meetups, weddings, birthdays.

## 5. WiFi QR code without internet

A QR code can store up to **3,000 alphanumeric characters** (version 40). So you can store:
- A long text
- A Base64 image
- A PDF (up to ~3 KB)

It's useful for **offline business cards** or **evacuation documents** (in case the internet goes down).

## How to generate a QR code

### Online tool (the fastest)

I have a [free QR Code Generator](https://jchub.io/outils/qr-code-generator) on JcHub. Paste your text/URL, choose the size, and download it as a PNG.

### In JavaScript (for your app)

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

### In Python

```python
import qrcode

qr = qrcode.QRCode(version=1, box_size=10, border=5)
qr.add_data('https://jchub.io')
qr.make(fit=True)
img = qr.make_image(fill_color="black", back_color="white")
img.save("qrcode.png")
```

## Common mistakes

### 1. **QR code too small**

If you print your QR code and it's less than 2 cm wide, scanners struggle. Rule: **at least 2 cm wide** to be scanned from a distance.

### 2. **No white margin**

Around the QR code, you need a **quiet zone** (4 modules minimum). If you put your QR code on a colored background with no margin, it won't scan.

### 3. **Too much data**

If you put 3,000 characters in it, the QR code becomes very dense and hard to scan. Stick to what's necessary.

### 4. **Dynamic vs static QR codes**

**Static**: the content is baked into the QR code. If you change the URL, you have to reprint everything.
**Dynamic**: the QR code points to a service that redirects. You can change the destination without reprinting.

Dynamic services: bit.ly, qr-code-generator.com (pro version), CinetPay for payments.

## TL;DR

- **5 uses**: WiFi, vCard, payment, event, offline
- **WiFi format**: `WIFI:T:WPA;S:Name;P:Password;;`
- **vCard format**: `BEGIN:VCARD...END:VCARD`
- **Mobile money**: pre-filled USSD or CinetPay
- **Limits**: 3,000 chars max, at least 2 cm wide
- **Free tool**: [jchub.io/outils/qr-code-generator](https://jchub.io/outils/qr-code-generator)

---

**Coding a sharing feature and need dynamic QR codes?** My [QR Code Generator](https://jchub.io/outils/qr-code-generator) gives you a ready-to-use PNG in 1 click.

There are 14 free dev tools on JcHub → [jchub.io/outils](https://jchub.io/outils)

