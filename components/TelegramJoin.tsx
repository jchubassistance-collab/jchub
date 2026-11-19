import { bilingual } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { TELEGRAM_CHANNEL_URL } from '@/lib/telegram-links';


const copy = bilingual({
  title: 'Ne rate aucun nouvel article',
  text: 'Rejoins la chaîne Telegram JcHub : chaque nouvel article et chaque nouvel outil gratuit, directement sur ton téléphone.',
  join: 'Rejoindre la chaîne Telegram',
}, {
  title: 'Never miss a new article',
  text: 'Join the JcHub Telegram channel: every new article and every new free tool, straight to your phone.',
  join: 'Join the Telegram channel',
});

/** Paper plane of the Telegram logo. */
export function TelegramMark({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M20.67 4.23 2.94 11.07c-1.21.49-1.2 1.16-.22 1.46l4.55 1.42 1.74 5.35c.22.6.11.84.75.84.49 0 .71-.22.98-.49l2.2-2.14 4.58 3.38c.84.46 1.45.22 1.66-.78l3-14.16c.31-1.23-.47-1.79-1.51-1.32ZM8.32 13.6l9.9-6.24c.49-.3.95-.14.58.19l-8.48 7.65-.33 3.52-1.67-5.12Z" />
    </svg>
  );
}

/** Invitation to the channel, shown at the end of each article. */
export function TelegramJoinCard({ locale }: { locale: Locale }) {
  const t = copy[locale];
  return (
    <aside className="mt-8 flex flex-col gap-4 rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#229ed9] text-white shadow-[0_6px_16px_rgba(34,158,217,.3)]">
          <TelegramMark className="h-6 w-6" />
        </span>
        <div>
          <p className="font-black text-slate-900">{t.title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">{t.text}</p>
        </div>
      </div>
      <a
        href={TELEGRAM_CHANNEL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#229ed9] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#1b8dc4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
      >
        <TelegramMark className="h-4 w-4" />
        {t.join}
      </a>
    </aside>
  );
}
