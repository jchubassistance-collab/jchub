import { ArticleEditor } from '@/components/redaction/ArticleEditor';

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ArticleEditor key={id} id={id} />;
}
