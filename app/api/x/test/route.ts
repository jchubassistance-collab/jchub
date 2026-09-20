import { NextResponse } from 'next/server';
import { getXCurrentUser } from '@/lib/x';
import { reportUserError } from '@/lib/user-error';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const authorization = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  try {
    const { response, data } = await getXCurrentUser();
    if (!response.ok) {
      reportUserError();
      return NextResponse.json({ error: 'La connexion X a échoué.' }, { status: response.status });
    }

    return NextResponse.json({ connected: true, user: data.data });
  } catch (error) {
    reportUserError();
    return NextResponse.json({ error: 'Configuration X incomplète ou invalide.' }, { status: 500 });
  }
}
