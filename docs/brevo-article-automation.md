# Envoi Brevo : nouvel article

## Configuration

Ajoute dans l'environnement de production :

```env
BREVO_API_KEY=...
BREVO_NEWSLETTER_LIST_ID=5
BREVO_SENDER_EMAIL=hello@jchub.dev
BREVO_SENDER_NAME=JcHub
```

Le site n'utilise pas de webhook Brevo. Après publication, il crée puis envoie
directement une campagne à la liste `Newsletter JcHub`. L'email contient
`title`, `description`, `slug`, `image`, `readingTime` et `category`, avec un
bouton vers `https://jchub.dev/blog/{slug}`.

L'envoi est déclenché par `POST /api/cron/publish-scheduled` quand l'article
passe de `scheduled` à `published`.