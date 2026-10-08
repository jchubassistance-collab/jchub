import 'server-only';

import { randomUUID } from 'node:crypto';
import { readFile, rename, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { updateEnvFile } from '@/lib/linkedin-oauth';

export async function saveLocalEnvValues(values: Record<string, string>): Promise<void> {
  if (process.env.NODE_ENV === 'production') throw new Error('Local environment file updates are disabled in production.');
  const envPath = path.join(process.cwd(), '.env.local');
  const tempPath = `${envPath}.${randomUUID()}.tmp`;
  try {
    const existing = await readFile(envPath, 'utf8');
    await writeFile(tempPath, updateEnvFile(existing, values), { encoding: 'utf8', mode: 0o600, flag: 'wx' });
    await rename(tempPath, envPath);
    for (const [name, value] of Object.entries(values)) process.env[name] = value;
  } catch (error) {
    await rm(tempPath, { force: true }).catch(() => undefined);
    throw error;
  }
}
