import 'server-only';

import { publishXTweet } from '@/lib/x';

export type SocialPublishResult = {
  network: 'x' | 'linkedin' | 'devto';
  status: 'published' | 'skipped' | 'failed';
  id?: string;
  message?: string;
};

export type SocialNetwork = SocialPublishResult['network'];

function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://jchub.dev').replace(/\/$/, '');
}

async function publishLinkedIn(text: string, url: string): Promise<SocialPublishResult> {
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN?.trim();
  const authorUrn = process.env.LINKEDIN_AUTHOR_URN?.trim();
  if (!accessToken || !authorUrn) {
    return { network: 'linkedin', status: 'skipped', message: 'LINKEDIN_ACCESS_TOKEN ou LINKEDIN_AUTHOR_URN manquant.' };
  }

  const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'X-Restli-Protocol-Version': '2.0.0' },
    body: JSON.stringify({
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: `${text}\n\n${url}` },
          shareMediaCategory: 'ARTICLE',
          media: [{ status: 'READY', originalUrl: url, title: { text: 'JcHub' } }],
        },
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    }),
    cache: 'no-store',
  });
  const data = await response.json() as { id?: string; message?: string; serviceErrorCode?: number };
  if (!response.ok || !data.id) return { network: 'linkedin', status: 'failed', message: data.message || `LinkedIn ${response.status}.` };
  return { network: 'linkedin', status: 'published', id: data.id };
}

async function publishDevTo(title: string, body: string, description: string, url: string, tags: string[]): Promise<SocialPublishResult> {
  const apiKey = process.env.DEVTO_API_KEY?.trim();
  if (!apiKey) return { network: 'devto', status: 'skipped', message: 'DEVTO_API_KEY manquant.' };

  const response = await fetch('https://dev.to/api/articles', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ article: { title, body_markdown: body, published: true, description, canonical_url: url, tags: tags.slice(0, 4) } }),
    cache: 'no-store',
  });
  const data = await response.json() as { id?: number; url?: string; error?: string };
  if (!response.ok || !data.id) return { network: 'devto', status: 'failed', message: data.error || `Dev.to ${response.status}.` };
  return { network: 'devto', status: 'published', id: String(data.id) };
}

export async function publishToNetwork(network: SocialNetwork, input: { title: string; description: string; article: string; xText?: string; linkedinText?: string; devtoText?: string; slug: string; keywords?: string[] }): Promise<SocialPublishResult> {
  const url = `${getSiteUrl()}/blog/${encodeURIComponent(input.slug)}`;
  if (network === 'x') {
    if (!process.env.X_API_KEY || !process.env.X_API_SECRET || !process.env.X_ACCESS_TOKEN || !process.env.X_ACCESS_TOKEN_SECRET) return { network, status: 'skipped', message: 'Clés X manquantes.' };
    const result = await publishXTweet(`${input.xText || input.description}\n\n${url}`);
    return result.response.ok && result.data?.data?.id ? { network, status: 'published', id: String(result.data.data.id) } : { network, status: 'failed', message: result.data?.detail || `X ${result.response.status}.` };
  }
  if (network === 'linkedin') return publishLinkedIn(input.linkedinText || input.description, url);
  return publishDevTo(input.title, `${input.devtoText || input.description}\n\n${input.article}`, input.description, url, input.keywords || []);
}

export async function publishToSocialNetworks(input: { title: string; description: string; article: string; xText?: string; linkedinText?: string; devtoText?: string; slug: string; keywords?: string[] }) {
  const results = await Promise.all((['x', 'linkedin', 'devto'] as SocialNetwork[]).map(async (network) => {
    try { return await publishToNetwork(network, input); } catch (error) { return { network, status: 'failed' as const, message: error instanceof Error ? error.message : `Erreur ${network}.` }; }
  }));
  return results;
}
