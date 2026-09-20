import { NextResponse } from 'next/server';
import { publishXTweet } from '@/lib/x';
import { reportUserError } from '@/lib/user-error';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const authorization = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    if (!text || text.length > 280) {
      return NextResponse.json({ error: 'Le texte doit contenir entre 1 et 280 caractères.' }, { status: 400 });
    }

    const { response, data } = await publishXTweet(text);
    if (!response.ok) {
      reportUserError();
      return NextResponse.json({ error: 'La publication X a échoué.' }, { status: response.status });
    }

    return NextResponse.json({ published: true, post: data.data });
  } catch (error) {
    reportUserError();
    return NextResponse.json({ error: 'Requête de publication invalide.' }, { status: 400 });
  }
}