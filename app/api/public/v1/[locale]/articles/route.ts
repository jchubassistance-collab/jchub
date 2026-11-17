import { NextResponse } from 'next/server';
import { isLocale, routing } from '@/i18n/routing';
import { publicArticles, publicJson } from '@/lib/public-api';

// Built once and refreshed at most every hour, like the RSS feed.
export const revalidate = 3600;
export const generateStaticParams = () => routing.locales.map((locale) => ({ locale }));

/** Latest blog articles, without their body: /api/public/v1/fr/articles and /api/public/v1/en/articles. */
export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return NextResponse.json({ error: 'Unknown locale' }, { status: 404 });
  return publicJson(locale, 'articles', await publicArticles(locale));
}
