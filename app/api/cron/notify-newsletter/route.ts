import { NextRequest, NextResponse } from 'next/server';
import { getPublishedArticles } from '@/lib/blog';
import { notifyBrevoNewContent } from '@/lib/brevo';
import { getPublishedTools } from '@/lib/tools';
import { reportUserError } from '@/lib/user-error';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  try {
    const [articles, tools] = await Promise.all([getPublishedArticles(), getPublishedTools()]);
    const results = await Promise.all([
      ...articles.map((article) => notifyBrevoNewContent({
        type: 'article',
        title: article.title,
        description: article.description,
        slug: article.slug,
        path: `/blog/${article.slug}`,
        image: article.image,
        category: article.category,
        label: `${article.category} · ${article.readTime}`,
      })),
      ...tools.map((tool) => notifyBrevoNewContent({
        type: 'tool',
        title: tool.name,
        description: tool.description,
        slug: tool.slug,
        path: `/outils/${tool.slug}`,
        category: tool.category,
        label: `${tool.category} · Outil JcHub`,
      })),
    ]);
    return NextResponse.json({ checked: results.length, sent: results.filter(Boolean).length });
  } catch (error) {
    reportUserError();
    return NextResponse.json({ error: 'Notification newsletter impossible.' }, { status: 500 });
  }
}

export const POST = GET;