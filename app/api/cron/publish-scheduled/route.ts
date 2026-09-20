import { NextRequest, NextResponse } from 'next/server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { notifyBrevoNewArticle } from '@/lib/brevo';
import { reportUserError } from '@/lib/user-error';

export async function POST(request: NextRequest) {
  const authorization = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }
  if (!hasFirebaseAdminConfig()) return NextResponse.json({ error: 'Firebase indisponible.' }, { status: 503 });

  try {
    const now = Timestamp.now();
    const snapshot = await getAdminDb().collection('articles')
      .where('status', '==', 'scheduled')
      .get();
    const articles: string[] = [];
    for (const document of snapshot.docs) {
      const article = document.data();
      const scheduledFor = article.scheduledFor;
      if (!scheduledFor || typeof scheduledFor.toMillis !== 'function' || scheduledFor.toMillis() > now.toMillis()) {
        continue;
      }
      await document.ref.update({ status: 'published', publishedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
      const image = String(article.image || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://jchub.dev'}/blog/default.svg`);
      const imageUrl = image.startsWith('http') ? image : `${process.env.NEXT_PUBLIC_SITE_URL || 'https://jchub.dev'}${image.startsWith('/') ? '' : '/'}${image}`;
      const brevoNotified = await notifyBrevoNewArticle({
        title: String(article.title || document.id),
        description: String(article.description || article.excerpt || ''),
        slug: String(article.slug || document.id),
        image: imageUrl,
        readingTime: String(article.readingTime || article.readTime || '5 min'),
        category: String(article.category || 'Développement'),
      });
      articles.push(document.id);
    }
    return NextResponse.json({ published: articles.length, articles });
  } catch (error) {
    reportUserError();
    return NextResponse.json({ error: 'Publication impossible.' }, { status: 500 });
  }
}

export const GET = POST;
