import { after, NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { isListedAdminEmail, requireAdmin } from '@/lib/admin-auth';
import { isPublicArticleStatus } from '@/lib/article-files';
import { logSyncError, syncArticleFiles } from '@/lib/article-repository';
import { getAdminAuth, getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

/** Functions an administrator gives from this page: writing space or CM space. */
const MANAGED_ROLES = ['writer', 'cm'] as const;
type ManagedRole = (typeof MANAGED_ROLES)[number];

const email = z.string().trim().toLowerCase().email().max(254);
const displayName = z.string().trim().min(2).max(80);
const uid = z.string().min(1).max(128);
const role = z.enum(MANAGED_ROLES);

const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('create'), email, displayName, role }).strict(),
  z.object({ action: z.literal('grant-role'), email, displayName: displayName.optional(), role }).strict(),
  z.object({ action: z.literal('rename'), uid, displayName }).strict(),
  z.object({ action: z.literal('disable'), uid }).strict(),
  z.object({ action: z.literal('enable'), uid }).strict(),
  z.object({ action: z.literal('revoke'), uid }).strict(),
  z.object({ action: z.literal('remove-role'), uid }).strict(),
]);

/** The writer's name signed on their articles is a claim: the account itself cannot change it. */
function roleClaims(claims: Record<string, unknown> | undefined, nextRole: ManagedRole, name: string) {
  const { authorName: _authorName, ...others } = claims || {};
  return nextRole === 'writer' ? { ...others, role: nextRole, authorName: name } : { ...others, role: nextRole };
}

function errorResponse(error: unknown) {
  const code = error instanceof Error ? error.message : '';
  const firebaseCode = (error as { code?: string } | null)?.code || '';
  if (code === 'FORBIDDEN') return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
  if (code === 'UNAUTHORIZED') return NextResponse.json({ error: 'Accès administrateur requis.' }, { status: 401 });
  if (firebaseCode === 'auth/email-already-exists') return NextResponse.json({ error: 'Un compte existe déjà avec cette adresse. Coche « Ce compte existe déjà » pour lui donner la fonction.' }, { status: 409 });
  if (firebaseCode === 'auth/user-not-found') return NextResponse.json({ error: 'Aucun compte n’utilise cette adresse. Décoche « Ce compte existe déjà » pour le créer.' }, { status: 404 });
  if (firebaseCode === 'auth/invalid-email') return NextResponse.json({ error: 'Adresse e-mail invalide.' }, { status: 400 });
  return NextResponse.json({ error: 'Opération impossible pour le moment.' }, { status: 500 });
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    if (!hasFirebaseAdminConfig()) return NextResponse.json({ error: 'Firebase indisponible.' }, { status: 503 });
    const db = getAdminDb();
    const snapshot = await db.collection('users').get();
    const managedIds = snapshot.docs.filter((document) => (MANAGED_ROLES as readonly string[]).includes(String(document.data().role))).map((document) => document.id);
    // Accounts with a function also show whether they can sign in and, for writers, their articles.
    const accounts = new Map<string, { disabled: boolean; lastSignIn: string | null }>();
    for (let start = 0; start < managedIds.length; start += 100) {
      const { users } = await getAdminAuth().getUsers(managedIds.slice(start, start + 100).map((id) => ({ uid: id })));
      users.forEach((user) => accounts.set(user.uid, { disabled: user.disabled, lastSignIn: user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toISOString() : null }));
    }
    const articleCounts = new Map<string, { total: number; published: number }>();
    for (let start = 0; start < managedIds.length; start += 30) {
      const articles = await db.collection('articles').where('authorUid', 'in', managedIds.slice(start, start + 30)).select('authorUid', 'status').get();
      articles.docs.forEach((article) => {
        const author = String(article.data().authorUid);
        const count = articleCounts.get(author) || { total: 0, published: 0 };
        count.total += 1;
        if (article.data().status === 'published') count.published += 1;
        articleCounts.set(author, count);
      });
    }
    const users = snapshot.docs.map((document) => {
      const data = document.data();
      const account = accounts.get(document.id);
      return {
        uid: document.id,
        email: String(data.email || ''),
        displayName: String(data.displayName || ''),
        role: String(data.role || 'user'),
        provider: String(data.provider || ''),
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        disabled: account?.disabled ?? false,
        lastSignIn: account?.lastSignIn ?? null,
        articles: articleCounts.get(document.id) || null,
      };
    }).sort((first, second) => (second.createdAt || '').localeCompare(first.createdAt || ''));
    return NextResponse.json({ users }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'INTERNAL_ERROR';
    return NextResponse.json({ error: code === 'FORBIDDEN' ? 'Accès refusé.' : 'Accès administrateur requis.' }, { status: code === 'FORBIDDEN' ? 403 : 401 });
  }
}

/**
 * Creates an account with a function, or gives one to an existing account, then manages it.
 * No e-mail is sent: creation returns a link to choose a password, which the admin passes on.
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    if (!hasFirebaseAdminConfig()) return NextResponse.json({ error: 'Firebase indisponible.' }, { status: 503 });
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Vérifie le nom (2 caractères minimum), l’adresse e-mail et la fonction.' }, { status: 400 });
    const input = parsed.data;
    const auth = getAdminAuth();
    const users = getAdminDb().collection('users');

    if (input.action === 'create') {
      const user = await auth.createUser({ email: input.email, displayName: input.displayName, emailVerified: false, disabled: false });
      await auth.setCustomUserClaims(user.uid, roleClaims(undefined, input.role, input.displayName));
      await users.doc(user.uid).set({ uid: user.uid, email: input.email, displayName: input.displayName, role: input.role, provider: 'email', createdAt: FieldValue.serverTimestamp() }, { merge: true });
      const passwordResetLink = await auth.generatePasswordResetLink(input.email);
      return NextResponse.json({ uid: user.uid, passwordResetLink }, { status: 201 });
    }

    if (input.action === 'grant-role') {
      const user = await auth.getUserByEmail(input.email);
      const profile = await users.doc(user.uid).get();
      if (user.customClaims?.admin === true || user.customClaims?.role === 'admin' || profile.data()?.role === 'admin' || isListedAdminEmail(user.email)) {
        return NextResponse.json({ error: 'Ce compte est administrateur : sa fonction ne se change pas ici.' }, { status: 409 });
      }
      if (user.disabled) return NextResponse.json({ error: 'Le compte est désactivé. Réactive-le avant de lui donner une fonction.' }, { status: 409 });
      const name = input.displayName || user.displayName || input.email.split('@')[0];
      if (input.displayName && input.displayName !== user.displayName) await auth.updateUser(user.uid, { displayName: input.displayName });
      await auth.setCustomUserClaims(user.uid, roleClaims(user.customClaims, input.role, name));
      await users.doc(user.uid).set({ uid: user.uid, email: input.email, displayName: name, role: input.role }, { merge: true });
      return NextResponse.json({ uid: user.uid, role: input.role });
    }

    const user = await auth.getUser(input.uid);
    const currentRole = user.customClaims?.role;
    if (!(MANAGED_ROLES as readonly unknown[]).includes(currentRole)) {
      return NextResponse.json({ error: 'Ce compte n’a pas de fonction gérée depuis cette page.' }, { status: 403 });
    }
    if (input.action === 'rename') {
      await auth.updateUser(input.uid, { displayName: input.displayName });
      await auth.setCustomUserClaims(input.uid, roleClaims(user.customClaims, currentRole as ManagedRole, input.displayName));
      await users.doc(input.uid).set({ displayName: input.displayName }, { merge: true });
      // The writer's articles are signed with the new name, online ones included.
      const articles = await getAdminDb().collection('articles').where('authorUid', '==', input.uid).get();
      if (!articles.empty) {
        const batch = getAdminDb().batch();
        articles.docs.forEach((article) => batch.update(article.ref, { author: input.displayName }));
        await batch.commit();
        const online = articles.docs.filter((article) => isPublicArticleStatus(article.data().status)).map((article) => article.id);
        if (online.length) after(() => syncArticleFiles(online).then(() => undefined, logSyncError));
      }
    }
    if (input.action === 'disable') await auth.updateUser(input.uid, { disabled: true });
    if (input.action === 'enable') await auth.updateUser(input.uid, { disabled: false });
    if (input.action === 'remove-role') {
      const { role: _role, authorName: _authorName, ...claims } = user.customClaims || {};
      await auth.setCustomUserClaims(input.uid, Object.keys(claims).length ? claims : null);
      await users.doc(input.uid).set({ role: 'user' }, { merge: true });
    }
    // Open sessions end at once: the session cookie is checked against revoked tokens.
    if (input.action === 'revoke' || input.action === 'disable' || input.action === 'remove-role') await auth.revokeRefreshTokens(input.uid);
    return NextResponse.json({ updated: true });
  } catch (error) {
    return errorResponse(error);
  }
}
