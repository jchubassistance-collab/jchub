import 'server-only';

import fs from 'node:fs';
import path from 'node:path';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { ensureArticleTranslation } from '@/lib/content-translation';
import { reportUserError } from '@/lib/user-error';
import { ARTICLES_DIRECTORY, articleFilePaths, buildArticleFiles, gitBlobSha, isSafeArticleId } from '@/lib/article-files';
import { commitFilesOnBase, getGithubConfig, listRepoDirectory, type GithubConfig } from '@/lib/github';

/**
 * Keeps content/articles in line with Firestore after each change made from the admin, the
 * editorial agent or the crons. In production the files are committed to GitHub with the
 * token of the tool generator (lib/github.ts), which redeploys the site; in development they
 * are written to the local folder.
 */

export type ArticleSyncResult = { status: 'committed' | 'written' | 'unchanged' | 'skipped'; changed: string[]; commit?: string };

/** null removes the file. */
type FileChanges = Map<string, string | null>;

const writesToDisk = () => process.env.NODE_ENV !== 'production';

/** Article files currently in the repository (or on disk), with their Git object id. */
async function existingFiles(config: GithubConfig | null): Promise<Map<string, string>> {
  const files = new Map<string, string>();
  for (const directory of [ARTICLES_DIRECTORY, `${ARTICLES_DIRECTORY}/en`]) {
    if (!config) {
      const absolute = path.join(process.cwd(), directory);
      if (!fs.existsSync(absolute)) continue;
      for (const name of fs.readdirSync(absolute).filter((file) => file.endsWith('.md'))) {
        files.set(`${directory}/${name}`, gitBlobSha(fs.readFileSync(path.join(absolute, name), 'utf8').replace(/\r\n/g, '\n')));
      }
      continue;
    }
    for (const entry of await listRepoDirectory(config, directory, config.base)) {
      if (entry.type === 'file' && entry.path.endsWith('.md')) files.set(entry.path, entry.sha);
    }
  }
  return files;
}

/** Files to write or remove so that the given articles match their wanted files. */
function diff(wanted: Record<string, string>, ids: string[], existing: Map<string, string>): FileChanges {
  const changes: FileChanges = new Map();
  for (const [file, text] of Object.entries(wanted)) {
    if (existing.get(file) !== gitBlobSha(text)) changes.set(file, text);
  }
  for (const id of ids) {
    for (const file of Object.values(articleFilePaths(id))) {
      if (existing.has(file) && !(file in wanted)) changes.set(file, null);
    }
  }
  return changes;
}

function writeToDisk(changes: FileChanges) {
  changes.forEach((text, file) => {
    const absolute = path.join(process.cwd(), file);
    if (text === null) fs.rmSync(absolute, { force: true });
    else {
      fs.mkdirSync(path.dirname(absolute), { recursive: true });
      fs.writeFileSync(absolute, text, 'utf8');
    }
  });
}

function commitMessage(changes: FileChanges): string {
  const ids = Array.from(new Set(Array.from(changes.keys(), (file) => path.posix.basename(file, '.md'))));
  return ids.length === 1 ? `Articles : met à jour ${ids[0]}` : `Articles : met à jour ${ids.length} articles\n\n${ids.map((id) => `- ${id}`).join('\n')}`;
}

/** `removeOthers` also removes the files of every article missing from `wanted`. */
async function apply(wanted: Record<string, string>, ids: string[], removeOthers = false): Promise<ArticleSyncResult> {
  const config = writesToDisk() ? null : getGithubConfig();
  if (!config && !writesToDisk()) {
    console.warn('[articles] GITHUB_TOOLS_TOKEN ou GITHUB_TOKEN manquant : les fichiers des articles ne sont pas mis à jour.');
    return { status: 'skipped', changed: [] };
  }
  const existing = await existingFiles(config);
  const allIds = new Set(ids);
  if (removeOthers) existing.forEach((_sha, file) => allIds.add(path.posix.basename(file, '.md')));
  const changes = diff(wanted, Array.from(allIds), existing);
  if (!changes.size) return { status: 'unchanged', changed: [] };
  if (!config) {
    writeToDisk(changes);
    return { status: 'written', changed: Array.from(changes.keys()) };
  }
  const files = Array.from(changes, ([file, content]) => ({ path: file, content }));
  return { status: 'committed', changed: Array.from(changes.keys()), commit: await commitFilesOnBase(config, files, commitMessage(changes)) };
}

/** Writes the files of these articles from their current Firestore document, or removes them. */
export async function syncArticleFiles(ids: string[]): Promise<ArticleSyncResult> {
  const safeIds = Array.from(new Set(ids)).filter(isSafeArticleId);
  if (!safeIds.length || !hasFirebaseAdminConfig()) return { status: 'skipped', changed: [] };
  const db = getAdminDb();
  const snapshots = await db.getAll(...safeIds.map((id) => db.collection('articles').doc(id)));
  const wanted: Record<string, string> = {};
  for (const snapshot of snapshots) {
    if (snapshot.exists) Object.assign(wanted, buildArticleFiles(snapshot.id, snapshot.data() || {}));
  }
  return apply(wanted, safeIds);
}

/** Daily catch-up: every public article gets its files, and files of articles no longer public go. */
export async function syncAllArticleFiles(): Promise<ArticleSyncResult> {
  if (!hasFirebaseAdminConfig()) return { status: 'skipped', changed: [] };
  const snapshot = await getAdminDb().collection('articles').where('status', 'in', ['published', 'scheduled']).get();
  const wanted: Record<string, string> = {};
  for (const document of snapshot.docs) Object.assign(wanted, buildArticleFiles(document.id, document.data()));
  return apply(wanted, snapshot.docs.map((document) => document.id), true);
}

/**
 * Runs after a change to an article: refreshes its English version when asked, then its files.
 * Meant for after(), so the admin does not wait for the translation or the commit.
 */
export async function refreshArticle(id: string, options: { translate?: boolean; sync?: boolean } = {}): Promise<void> {
  if (options.translate) {
    try { await ensureArticleTranslation(id); }
    catch { reportUserError(); }
  }
  if (options.sync === false) return;
  try { await syncArticleFiles([id]); }
  catch (error) { logSyncError(error); }
}

export function logSyncError(error: unknown) {
  console.error('[articles] Synchronisation des fichiers impossible :', error instanceof Error ? error.message : error);
}
