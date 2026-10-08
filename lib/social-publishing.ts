import 'server-only';

export type SocialPublishResult = {
  network: 'devto';
  status: 'published' | 'skipped' | 'failed';
  id?: string;
  url?: string;
  message?: string;
};

export type SocialNetwork = 'devto';

export async function publishDevToArticle(input: {
  title: string;
  body: string;
  description: string;
  canonicalUrl?: string;
  tags?: string[];
}): Promise<SocialPublishResult> {
  const apiKey = process.env.DEVTO_API_KEY?.trim();
  if (!apiKey) return { network: 'devto', status: 'skipped', message: 'DEVTO_API_KEY manquant.' };

  const tags = Array.from(new Set((input.tags || []).map((tag) => tag.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30)).filter((tag) => tag.length >= 2))).slice(0, 4);
  const response = await fetch('https://dev.to/api/articles', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ article: {
      title: input.title.slice(0, 128),
      body_markdown: input.body,
      published: true,
      description: input.description.slice(0, 160),
      ...(input.canonicalUrl ? { canonical_url: input.canonicalUrl } : {}),
      tags,
    } }),
    cache: 'no-store',
  });
  const data = await response.json() as { id?: number; url?: string; error?: string };
  if (!response.ok || !data.id) return { network: 'devto', status: 'failed', message: data.error || `Dev.to ${response.status}.` };
  return { network: 'devto', status: 'published', id: String(data.id), url: data.url };
}
