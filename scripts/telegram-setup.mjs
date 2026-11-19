/**
 * Registers @jchub_bot with Telegram: webhook address and secret, command menu, descriptions.
 * Run once after deploying the webhook, and again whenever the token or the commands change:
 *   npm run telegram:setup
 * Reads TELEGRAM_BOT_TOKEN (and NEXT_PUBLIC_SITE_URL, https://jchub.dev by default) from .env.
 */
import { webhookSecret } from '../lib/telegram-bot.ts';

const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
if (!token) { console.error('TELEGRAM_BOT_TOKEN manquant dans .env.'); process.exit(1); }
const site = (process.env.TELEGRAM_WEBHOOK_SITE?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://jchub.dev').replace(/\/$/, '');
if (!site.startsWith('https://') || /localhost|127\.0\.0\.1/.test(site)) { console.error(`Telegram exige une adresse HTTPS publique (reçu : ${site}). Utilise TELEGRAM_WEBHOOK_SITE=https://jchub.dev.`); process.exit(1); }

async function call(method, body) {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json();
  if (!data.ok) throw new Error(`${method} : ${data.description}`);
  console.log(`✓ ${method}`);
  return data.result;
}

const commands = {
  fr: [
    { command: 'start', description: 'Menu principal' },
    { command: 'outils', description: 'Nos outils gratuits' },
    { command: 'blog', description: 'Les derniers articles' },
    { command: 'recherche', description: 'Trouver un outil ou un article' },
    { command: 'aide', description: 'Écrire à l’équipe JcHub' },
  ],
  en: [
    { command: 'start', description: 'Main menu' },
    { command: 'tools', description: 'Our free tools' },
    { command: 'blog', description: 'Latest articles' },
    { command: 'search', description: 'Find a tool or an article' },
    { command: 'help', description: 'Write to the JcHub team' },
  ],
};

await call('setWebhook', {
  url: `${site}/api/telegram/webhook`,
  secret_token: webhookSecret(token),
  allowed_updates: ['message', 'callback_query'],
  drop_pending_updates: true,
  max_connections: 10,
});
await call('setMyCommands', { commands: commands.fr });
await call('setMyCommands', { commands: commands.fr, language_code: 'fr' });
await call('setMyCommands', { commands: commands.en, language_code: 'en' });
await call('setMyDescription', { description: 'Bienvenue sur JcHub ! Des outils gratuits et des guides pratiques pour tes projets numériques. Appuie sur Démarrer pour ouvrir le menu.' });
await call('setMyDescription', { description: 'Welcome to JcHub! Free tools and practical guides for your digital projects. Press Start to open the menu.', language_code: 'en' });
await call('setMyShortDescription', { short_description: 'Outils gratuits et guides pratiques JcHub · jchub.dev' });
await call('setMyShortDescription', { short_description: 'Free JcHub tools and practical guides · jchub.dev', language_code: 'en' });
const info = await call('getWebhookInfo', {});
console.log(`Webhook : ${info.url}${info.last_error_message ? ` (dernière erreur : ${info.last_error_message})` : ''}`);
