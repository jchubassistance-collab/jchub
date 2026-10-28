import { ArticleEditor } from '@/components/redaction/ArticleEditor';

/** New article; ?date=YYYY-MM-DD, from the editorial calendar, sets its planned day. */
export default async function NewArticlePage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date } = await searchParams;
  return <ArticleEditor initialPlannedFor={date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : ''} />;
}
