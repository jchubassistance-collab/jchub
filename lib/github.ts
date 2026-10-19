import 'server-only';

/** Minimal GitHub REST client for the admin tool generator (no git binary on Vercel). */
export type GithubConfig = { token: string; owner: string; repo: string; base: string };

export class GithubError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'GithubError';
    this.status = status;
  }
}

/**
 * Same GITHUB_OWNER / GITHUB_REPOSITORY (repository name only) / GITHUB_TOKEN settings as the
 * social publishing and insights features. GITHUB_TOOLS_TOKEN can hold a narrower token
 * (Contents and Pull requests write, Deployments read) dedicated to the tool generator.
 */
export function getGithubConfig(): GithubConfig | null {
  const token = (process.env.GITHUB_TOOLS_TOKEN || process.env.GITHUB_TOKEN)?.trim();
  const repository = process.env.GITHUB_REPOSITORY?.trim() || 'jchub';
  const [owner, repo] = repository.includes('/')
    ? repository.split('/')
    : [process.env.GITHUB_OWNER?.trim() || 'jchubassistance-collab', repository];
  if (!token || !/^[A-Za-z0-9_.-]+$/.test(owner || '') || !/^[A-Za-z0-9_.-]+$/.test(repo || '')) return null;
  return { token, owner, repo, base: process.env.GITHUB_BASE_BRANCH?.trim() || 'main' };
}

async function github<T>(config: GithubConfig, path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const response = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}${path}`, {
    method: init.method || 'GET',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'jchub-admin',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
  });
  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => null) as { message?: string } | null;
  if (!response.ok) throw new GithubError(`GitHub ${response.status} : ${String(data?.message || 'erreur inconnue').slice(0, 200)}`, response.status);
  return data as T;
}

export async function getBaseSha(config: GithubConfig): Promise<string> {
  const ref = await github<{ object: { sha: string } }>(config, `/git/ref/heads/${config.base}`);
  return ref.object.sha;
}

export async function readRepoFile(config: GithubConfig, filePath: string, ref: string): Promise<string> {
  const data = await github<{ content?: string; encoding?: string }>(config, `/contents/${filePath}?ref=${encodeURIComponent(ref)}`);
  if (data.encoding !== 'base64' || typeof data.content !== 'string') throw new Error(`Fichier illisible sur GitHub : ${filePath}`);
  return Buffer.from(data.content, 'base64').toString('utf8');
}

/** Points `branch` at one new commit on top of `baseSha` containing `files` (force-moves an existing branch). */
export async function commitFilesOnBranch(
  config: GithubConfig,
  branch: string,
  baseSha: string,
  files: Array<{ path: string; content: string }>,
  message: string,
): Promise<string> {
  const baseCommit = await github<{ tree: { sha: string } }>(config, `/git/commits/${baseSha}`);
  const tree = await github<{ sha: string }>(config, '/git/trees', {
    method: 'POST',
    body: { base_tree: baseCommit.tree.sha, tree: files.map((file) => ({ path: file.path, mode: '100644', type: 'blob', content: file.content })) },
  });
  const commit = await github<{ sha: string }>(config, '/git/commits', { method: 'POST', body: { message, tree: tree.sha, parents: [baseSha] } });
  try {
    await github(config, '/git/refs', { method: 'POST', body: { ref: `refs/heads/${branch}`, sha: commit.sha } });
  } catch (error) {
    if (!(error instanceof GithubError) || error.status !== 422) throw error;
    await github(config, `/git/refs/heads/${branch}`, { method: 'PATCH', body: { sha: commit.sha, force: true } });
  }
  return commit.sha;
}

/** Entries of a repository folder with their Git object id; empty when the folder does not exist. */
export async function listRepoDirectory(config: GithubConfig, directory: string, ref: string): Promise<Array<{ type: string; path: string; sha: string }>> {
  try {
    const entries = await github<Array<{ type: string; path: string; sha: string }>>(config, `/contents/${directory}?ref=${encodeURIComponent(ref)}`);
    return Array.isArray(entries) ? entries : [];
  } catch (error) {
    if (error instanceof GithubError && error.status === 404) return [];
    throw error;
  }
}

/**
 * Adds one commit on top of the base branch; a null content removes the file. Never forces:
 * when another commit lands in the meantime, it starts again from the new head.
 */
export async function commitFilesOnBase(config: GithubConfig, files: Array<{ path: string; content: string | null }>, message: string): Promise<string> {
  for (let attempt = 1; ; attempt += 1) {
    const baseSha = await getBaseSha(config);
    const baseCommit = await github<{ tree: { sha: string } }>(config, `/git/commits/${baseSha}`);
    const tree = await github<{ sha: string }>(config, '/git/trees', {
      method: 'POST',
      body: { base_tree: baseCommit.tree.sha, tree: files.map((file) => ({ path: file.path, mode: '100644', type: 'blob', ...(file.content === null ? { sha: null } : { content: file.content }) })) },
    });
    const commit = await github<{ sha: string }>(config, '/git/commits', { method: 'POST', body: { message, tree: tree.sha, parents: [baseSha] } });
    try {
      await github(config, `/git/refs/heads/${config.base}`, { method: 'PATCH', body: { sha: commit.sha, force: false } });
      return commit.sha;
    } catch (error) {
      if (!(error instanceof GithubError) || error.status !== 422 || attempt >= 3) throw error;
    }
  }
}

export type PullRequest = {
  number: number;
  html_url: string;
  state: 'open' | 'closed';
  merged: boolean;
  mergeable_state: string;
  head: { sha: string; ref: string };
};

export function openPullRequest(config: GithubConfig, branch: string, title: string, body: string) {
  return github<PullRequest>(config, '/pulls', { method: 'POST', body: { title, head: branch, base: config.base, body } });
}

export function getPullRequest(config: GithubConfig, number: number) {
  return github<PullRequest>(config, `/pulls/${number}`);
}

/** Merges exactly the reviewed commit: GitHub refuses if the branch moved since. */
export function mergePullRequest(config: GithubConfig, number: number, sha: string, title: string) {
  return github<{ merged: boolean; sha: string }>(config, `/pulls/${number}/merge`, { method: 'PUT', body: { sha, merge_method: 'squash', commit_title: title } });
}

export function closePullRequest(config: GithubConfig, number: number) {
  return github<PullRequest>(config, `/pulls/${number}`, { method: 'PATCH', body: { state: 'closed' } });
}

export async function deleteBranch(config: GithubConfig, branch: string) {
  try {
    await github(config, `/git/refs/heads/${branch}`, { method: 'DELETE' });
  } catch (error) {
    if (!(error instanceof GithubError) || ![404, 422].includes(error.status)) throw error;
  }
}

export type PreviewState = { state: 'pending' | 'ready' | 'failed'; url?: string; logUrl?: string };

/** Vercel's GitHub integration reports each preview build as a GitHub deployment of the commit. */
export async function getPreviewDeployment(config: GithubConfig, sha: string): Promise<PreviewState> {
  const deployments = await github<Array<{ id: number; environment: string }>>(config, `/deployments?sha=${sha}&per_page=10`);
  const preview = deployments.find((deployment) => !/production/i.test(deployment.environment));
  if (!preview) return { state: 'pending' };
  const [latest] = await github<Array<{ state: string; environment_url?: string; target_url?: string; log_url?: string }>>(config, `/deployments/${preview.id}/statuses?per_page=1`);
  if (!latest) return { state: 'pending' };
  const logUrl = latest.log_url || latest.target_url;
  if (latest.state === 'success') return { state: 'ready', url: latest.environment_url || latest.target_url, logUrl };
  if (latest.state === 'failure' || latest.state === 'error') return { state: 'failed', logUrl };
  return { state: 'pending', logUrl };
}
