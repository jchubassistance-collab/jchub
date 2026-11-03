import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Mail } from 'lucide-react';
import { NewsletterConfirmation } from '@/components/NewsletterConfirmation';
import { bilingual } from '@/i18n/copy';
import { isLocale } from '@/i18n/routing';

const copy = bilingual({
  metaTitle: 'Confirmation de l’inscription à la newsletter',
  title: 'Confirme ton inscription',
  text: 'Un clic suffit pour recevoir les nouveaux outils et articles de JcHub par e-mail. Tu pourras te désinscrire à tout moment depuis chaque newsletter.',
}, {
  metaTitle: 'Newsletter subscription confirmation',
  title: 'Confirm your subscription',
  text: 'One click and you will get JcHub’s new tools and articles by email. You can unsubscribe at any time from any newsletter.',
});

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  // A personal link: kept out of search engines.
  return { title: copy[locale].metaTitle, robots: { index: false, follow: false } };
}

/** Page of the link mailed by /api/newsletter (double opt-in, see lib/newsletter.ts). */
export default async function NewsletterConfirmationPage({ params, searchParams }: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { token } = await searchParams;
  const t = copy[locale];
  return (
    <main className="min-h-[70vh] bg-[#eff6ff] px-4 py-16 text-[#0f172a]">
      <div className="mx-auto max-w-xl rounded-2xl border border-blue-100 bg-white p-8 shadow-sm">
        <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Mail className="h-6 w-6" /></div>
        <h1 className="text-3xl font-extrabold tracking-tight">{t.title}</h1>
        <p className="mt-3 mb-6 text-slate-600">{t.text}</p>
        <NewsletterConfirmation token={typeof token === 'string' ? token : ''} />
      </div>
    </main>
  );
}
