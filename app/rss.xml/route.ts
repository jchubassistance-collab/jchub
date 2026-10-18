import { rssResponse } from '@/lib/rss';

export const dynamic = 'force-dynamic';

export function GET() {
  return rssResponse('fr');
}
