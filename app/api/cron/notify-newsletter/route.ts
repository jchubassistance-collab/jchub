import { NextRequest, NextResponse } from 'next/server';
import { getPublishedArticlesByLocale } from '@/lib/blog';
import { notifyBrevoNewContent, wasNotified } from '@/lib/brevo';
import { getPublishedTools, localizeTool, toolPath } from '@/lib/tools';
import { reportUserError } from '@/lib/user-error';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  try {
    const [{ fr: articles, en: englishArticles }, tools] = await Promise.all([getPublishedArticlesByLocale(), getPublishedTools()]);
    const englishById = new Map(englishArticles.map((article) => [article.id, article]));
    const results = await Promise.all([
      ...articles.map(async (article) => {
        // English subscribers only hear about content that is new for French ones too,
        // so creating the English list never mails them the whole back catalog.
        const isNew = !(await wasNotified('article', article.slug, 'fr'));
        const sent = await notifyBrevoNewContent({
          type: 'article',
          title: article.title,
          description: article.description,
          slug: article.slug,
          path: `/blog/${article.slug}`,
          image: article.image,
          category: article.category,
          label: `${article.category} · ${article.readTime}`,
        });
        const english = englishById.get(article.id);
        if (isNew && english?.translated) {
          await notifyBrevoNewContent({
            type: 'article',
            title: english.title,
            description: english.description,
            slug: article.slug,
            path: `/en/blog/${english.slug}`,
            image: english.image,
            category: english.category,
            label: `${english.category} · ${english.readTime}`,
          }, 'en');
        }
        return sent;
      }),
      ...tools.map(async (tool) => {
        const isNew = !(await wasNotified('tool', tool.slug, 'fr'));
        const sent = await notifyBrevoNewContent({
          type: 'tool',
          title: tool.name,
          description: tool.description,
          slug: tool.slug,
          path: `/outils/${tool.slug}`,
          category: tool.category,
          label: `${tool.category} · Outil JcHub`,
        });
        if (isNew && tool.translations?.en) {
          const english = localizeTool(tool, 'en');
          await notifyBrevoNewContent({
            type: 'tool',
            title: english.name,
            description: english.description,
            slug: tool.slug,
            path: toolPath(tool, 'en'),
            category: english.category,
            label: `${english.category} · JcHub tool`,
          }, 'en');
        }
        return sent;
      }),
    ]);
    return NextResponse.json({ checked: results.length, sent: results.filter(Boolean).length });
  } catch (error) {
    reportUserError();
    return NextResponse.json({ error: 'Notification newsletter impossible.' }, { status: 500 });
  }
}

export const POST = GET;
