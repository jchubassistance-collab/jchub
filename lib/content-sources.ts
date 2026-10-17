import { reportUserError } from '@/lib/user-error';

export type TrendCandidate = {
  title: string;
  url: string;
  source: 'hackernews' | 'github' | 'devto';
  score: number;
  summary: string;
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, cache: 'no-store', signal: init?.signal || AbortSignal.timeout(12_000) });
  if (!response.ok) throw new Error(`Source indisponible (${response.status}): ${url}`);
  return response.json() as Promise<T>;
}

async function collectHackerNews(): Promise<TrendCandidate[]> {
  const ids = await fetchJson<number[]>('https://hacker-news.firebaseio.com/v0/topstories.json');
  const stories = await Promise.all(ids.slice(0, 12).map((id) => fetchJson<{ title?: string; url?: string; score?: number; text?: string }>(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)));
  return stories.filter((story): story is { title: string; url: string; score?: number; text?: string } => Boolean(story.title && story.url)).slice(0, 6).map((story) => ({ title: story.title, url: story.url, source: 'hackernews', score: story.score || 0, summary: story.text?.replace(/<[^>]+>/g, '').slice(0, 300) || 'Sujet populaire sur Hacker News.' }));
}

async function collectDevTo(): Promise<TrendCandidate[]> {
  const articles = await fetchJson<Array<{ title?: string; url?: string; positive_reactions_count?: number; description?: string }>>('https://dev.to/api/articles?top=7&per_page=6');
  return articles.filter((article): article is { title: string; url: string; positive_reactions_count?: number; description?: string } => Boolean(article.title && article.url)).map((article) => ({ title: article.title, url: article.url, source: 'devto', score: article.positive_reactions_count || 0, summary: article.description || 'Article populaire sur Dev.to.' }));
}

async function collectGitHub(): Promise<TrendCandidate[]> {
  const headers: HeadersInit = { Accept: 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const data = await fetchJson<{ items?: Array<{ name?: string; html_url?: string; stargazers_count?: number; description?: string }> }>(`https://api.github.com/search/repositories?q=created:%3E${since}&sort=stars&order=desc&per_page=6`, { headers });
  return (data.items || []).filter((repository): repository is { name: string; html_url: string; stargazers_count?: number; description?: string } => Boolean(repository.name && repository.html_url)).map((repository) => ({ title: repository.name, url: repository.html_url, source: 'github', score: repository.stargazers_count || 0, summary: repository.description || 'Projet récemment populaire sur GitHub.' }));
}

export async function collectTrends(): Promise<TrendCandidate[]> {
  const results = await Promise.allSettled([collectHackerNews(), collectGitHub(), collectDevTo()]);
  const collected = results.filter((result): result is PromiseFulfilledResult<TrendCandidate[]> => result.status === 'fulfilled').flatMap((result) => result.value);
  const failedSources = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected').length;
  if (failedSources > 0) reportUserError();
  if (!collected.length) {
    throw new Error(`Aucune source de tendances n’est disponible (${failedSources} source(s) en échec).`);
  }
  return collected.sort((first, second) => second.score - first.score).slice(0, 12);
}