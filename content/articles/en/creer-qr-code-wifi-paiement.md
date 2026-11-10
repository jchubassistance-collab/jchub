---
slug: create-qr-code-wifi-vcard-mobile-payment
title: 'How to Create a QR Code for WiFi, vCard or Payments'
description: >-
  QR codes aren't just for restaurant menus anymore. Here are 5 practical use
  cases for devs, with free generators.
excerpt: >-
  QR Code: How to Create One for Your WiFi, vCard, or Mobile Payment QR codes
  are everywhere in 2026. But most devs only know they can hold a URL. In
  reality, a QR code can store anything: WiFi, contacts, payments, events, and
  more.
keywords:
  - qr code generator
  - qr code wifi
  - qr code vcard
  - qr code payment
  - cinetpay qr
  - mobile money qr
sourceHash: 86216a670ec508b6e93f7f51
translatedAt: '2026-10-31T07:53:18.371Z'
---
# QR Code: How to Create One for Your WiFi, vCard, or Mobile Payment

QR codes are everywhere in 2026. But most devs only know they can hold a URL. In reality, a QR code can store **anything**: WiFi, contacts, payments, events, you name it.

Here are 5 concrete use cases I've implemented, and how to generate them.

## 1. WiFi QR Code (the simplest, most useful)

You're at someone's place, you ask for the WiFi, they pull up a QR code, you scan it, you're connected. **No more "what's the password again?"**

The WiFi QR code format:

```
WIFI:T:WPA;S:NetworkName;P:Password;H:false;;
```

- `T` : security type (WPA, WEP, or empty)
- `S` : SSID (network name)
- `P` : password
- `H` : hidden network (true/false)

**Concrete example**: for my WiFi "JcHub-Guest" with password "Welcome2026" :

```
WIFI:T:WPA;S:JcHub-Guest;P:Welcome2026;H:false;;
```

Paste that into a generator, and you've got your QR code. Your guests scan → connected.

## 2. vCard QR Code (contact sharing)

You meet someone at a conference, hand them your QR code, they scan it, they've got your full contact. Way faster than spelling out your email.

The vCard format:

```
BEGIN:VCARD
VERSION:3.0
FN:Jean Dupont
ORG:JcHub
TEL:+242069550625
EMAIL:jean@jchub.dev
URL:https://jchub.dev
END:VCARD
```

Put that in a QR code, and the scanner adds the contact straight to their phone.

**Use cases**: networking, email signatures, physical business cards.

## 3. Mobile Payment QR Code (the game changer in Africa)

In Africa, mobile money (MTN MoMo, Airtel Money) is **huge**. And tons of merchants get paid via QR code.

### The USSD format (works everywhere)

```
*150*1*1*number*amount*code#  (MTN MoMo)
*501*1*number*amount#          (Airtel Money)
```

You can generate a QR code containing this USSD code. The customer scans → the payment app opens with the number + amount pre-filled.

### With CinetPay (my recommendation for Congo)

CinetPay lets you generate payment QR codes directly. You create a "payment link", get a QR code, print it, your customers scan and pay.

**Advantage**: the customer doesn't have to type the number, it's pre-filled.

### Crypto payments

```bitcoin
bitcoin:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa?amount=0.01&label=Coffee
```

Bitcoin and other cryptos support URIs in QR codes.

## 4. Event QR Code (calendar)

```
BEGIN:VCALENDAR
BEGIN:VEVENT
DTSTART:20261225T190000Z
DTEND:20261225T230000Z
SUMMARY:JcHub Christmas
LOCATION:Online
URL:https://jchub.dev/noel
END:VEVENT
END:VCALENDAR
```

You scan → the event gets added straight to your calendar.

**Use cases**: conferences, meetups, weddings, birthdays.

## 5. Offline WiFi QR Code

A QR code can store up to **3,000 alphanumeric characters** (version 40). So you can store:
- Long text
- An image in Base64
- A PDF (up to ~3 KB)

This is handy for **offline business cards** or **evacuation docs** (in case of internet outage).

## How to Generate a QR Code

### Online tool (quickest)

I've got a free [QR Code Generator](https://jchub.dev/fr/outils/generateur-de-qr-code) on JcHub. Paste your text/URL, pick the size, download as PNG.

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
qr.add_data('https://jchub.dev')
qr.make(fit=True)
img = qr.make_image(fill_color="black", back_color="white")
img.save("qrcode.png")
```

## Common Mistakes

### 1. **QR code too small**

If you print your QR code and it's under 2 cm, scanners struggle. Rule of thumb: **at least 2 cm wide** to be scanned from a distance.

### 2. **No white margin**

Around the QR code, you need a **quiet zone** (4 modules minimum). If you slap your QR code on a colored background with no margin, it won't scan.

### 3. **Too much data**

If you cram 3000 characters in, the QR code gets super dense and hard to scan. Stick to what's necessary.

### 4. **Dynamic vs static QR codes**

**Static**: the content is baked into the QR code. If you change the URL, you have to reprint everything.
**Dynamic**: the QR code points to a service that redirects. You can change the destination without reprinting.

Dynamic services: bit.ly, qr-code-generator.com (pro), CinetPay for payments.

## TL;DR

- **5 use cases**: WiFi, vCard, payment, event, offline
- **WiFi format**: `WIFI:T:WPA;S:Name;P:Password;;`
- **vCard format**: `BEGIN:VCARD...END:VCARD`
- **Mobile money**: pre-filled USSD or CinetPay
- **Limits**: 3000 chars max, 2 cm minimum width
- **Free tool**: [jchub.dev/fr/outils/generateur-de-qr-code](https://jchub.dev/fr/outils/generateur-de-qr-code)

---

**Building a sharing feature and need dynamic QR codes?** My [QR Code Generator](https://jchub.dev/fr/outils/generateur-de-qr-code) spits out a ready-to-use PNG in one click.

There are 14 free dev tools on JcHub → [jchub.dev/fr/outils](https://jchub.dev/fr/outils)
