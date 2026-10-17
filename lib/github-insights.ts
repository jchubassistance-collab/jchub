export type GitHubInsightsReport = {
  repository: string;
  stars: number;
  forks: number;
  watchers: number;
  openItems: number;
  updatedAt: string | null;
  fetchedAt: string;
};

type RepositoryResponse = {
  full_name?: string;
  stargazers_count?: number;
  forks_count?: number;
  subscribers_count?: number;
  open_issues_count?: number;
  updated_at?: string;
};

type Dependencies = { fetcher?: typeof fetch; now?: Date };

export class GitHubInsightsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GitHubInsightsError';
  }
}

export async function getGitHubInsights(
  env: NodeJS.ProcessEnv = process.env,
  dependencies: Dependencies = {},
): Promise<GitHubInsightsReport> {
  const token = env.GITHUB_TOKEN?.trim();
  const owner = env.GITHUB_OWNER?.trim() || 'jchubassistance-collab';
  const repository = env.GITHUB_REPOSITORY?.trim() || 'jchub';
  if (!token) throw new GitHubInsightsError('Configure GITHUB_TOKEN dans les variables secrètes serveur.');
  if (!/^[A-Za-z0-9_.-]+$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(repository)) {
    throw new GitHubInsightsError('GITHUB_OWNER ou GITHUB_REPOSITORY est invalide.');
  }

  const version = env.GITHUB_API_VERSION?.trim() || '2026-03-10';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(version)) throw new GitHubInsightsError('GITHUB_API_VERSION est invalide.');

  let response: Response;
  try {
    response = await (dependencies.fetcher || fetch)(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'X-GitHub-Api-Version': version,
        },
        cache: 'no-store',
        redirect: 'error',
        signal: AbortSignal.timeout(12_000),
      },
    );
  } catch {
    throw new GitHubInsightsError('Connexion à GitHub impossible. Réessaie dans quelques instants.');
  }

  if (!response.ok) {
    if (response.status === 401) throw new GitHubInsightsError('Le token GitHub est invalide ou expiré.');
    if (response.status === 403) throw new GitHubInsightsError('GitHub refuse l’accès au dépôt ou limite les requêtes. Vérifie le token et ses permissions.');
    if (response.status === 404) throw new GitHubInsightsError('Dépôt GitHub introuvable ou inaccessible avec ce token.');
    throw new GitHubInsightsError(`Impossible de récupérer les statistiques GitHub (HTTP ${response.status}).`);
  }

  let data: RepositoryResponse;
  try {
    data = await response.json() as RepositoryResponse;
  } catch {
    throw new GitHubInsightsError('GitHub a renvoyé une réponse de statistiques invalide.');
  }
  if (
    typeof data.full_name !== 'string'
    || typeof data.stargazers_count !== 'number'
    || !Number.isFinite(data.stargazers_count)
    || typeof data.forks_count !== 'number'
    || !Number.isFinite(data.forks_count)
    || typeof data.subscribers_count !== 'number'
    || !Number.isFinite(data.subscribers_count)
    || typeof data.open_issues_count !== 'number'
    || !Number.isFinite(data.open_issues_count)
  ) {
    throw new GitHubInsightsError('GitHub a renvoyé des statistiques de dépôt incomplètes.');
  }

  return {
    repository: data.full_name,
    stars: data.stargazers_count,
    forks: data.forks_count,
    watchers: data.subscribers_count,
    openItems: data.open_issues_count,
    updatedAt: typeof data.updated_at === 'string' ? data.updated_at : null,
    fetchedAt: (dependencies.now || new Date()).toISOString(),
  };
}
