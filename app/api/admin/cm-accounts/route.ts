import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { cmError, requireSameOrigin } from '@/lib/cm-server';

const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('create'), email: z.string().email().max(254), displayName: z.string().trim().min(1).max(100) }).strict(),
  z.object({ action: z.literal('grant-role'), email: z.string().email().max(254) }).strict(),
  z.object({ action: z.literal('disable'), uid: z.string().min(1).max(128) }).strict(),
  z.object({ action: z.literal('enable'), uid: z.string().min(1).max(128) }).strict(),
  z.object({ action: z.literal('revoke'), uid: z.string().min(1).max(128) }).strict(),
  z.object({ action: z.literal('remove-role'), uid: z.string().min(1).max(128) }).strict(),
]);

export async function POST(request: NextRequest) {
  try {
    const actor = await requireAdmin(request); requireSameOrigin(request);
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Demande invalide.' }, { status: 400 });
    const auth = getAdminAuth(); const db = getAdminDb(); const input = parsed.data;
    if (input.action === 'create') {
      const user = await auth.createUser({ email: input.email.trim().toLowerCase(), displayName: input.displayName, emailVerified: false, disabled: false });
      await auth.setCustomUserClaims(user.uid, { role: 'cm' });
      await db.collection('users').doc(user.uid).set({ uid: user.uid, email: user.email, displayName: user.displayName, role: 'cm', createdAt: FieldValue.serverTimestamp() }, { merge: true });
      const passwordResetLink = await auth.generatePasswordResetLink(user.email!);
      await db.collection('cmActivity').add({ uid: actor.uid, action: 'account.created', itemId: user.uid, createdAt: FieldValue.serverTimestamp() });
      return NextResponse.json({ uid: user.uid, passwordResetLink }, { status: 201 });
    }
    if (input.action === 'grant-role') {
      const user = await auth.getUserByEmail(input.email.trim().toLowerCase());
      if (user.disabled) return NextResponse.json({ error: 'Le compte est désactivé. Réactive-le avant d’attribuer le rôle.' }, { status: 409 });
      await auth.setCustomUserClaims(user.uid, { ...user.customClaims, role: 'cm' });
      await db.collection('users').doc(user.uid).set({ uid: user.uid, email: user.email, role: 'cm' }, { merge: true });
      await db.collection('cmActivity').add({ uid: actor.uid, action: 'account.role-granted', itemId: user.uid, createdAt: FieldValue.serverTimestamp() });
      return NextResponse.json({ uid: user.uid, role: 'cm' });
    }
    const user = await auth.getUser(input.uid);
    if (user.customClaims?.role !== 'cm') return NextResponse.json({ error: 'Le compte ciblé ne possède pas le rôle CM.' }, { status: 403 });
    const claims = { ...user.customClaims };
    if (input.action === 'disable') await auth.updateUser(input.uid, { disabled: true });
    if (input.action === 'enable') await auth.updateUser(input.uid, { disabled: false });
    if (input.action === 'revoke' || input.action === 'disable') await auth.revokeRefreshTokens(input.uid);
    if (input.action === 'remove-role') {
      delete claims.role;
      if (Object.keys(claims).length) await auth.setCustomUserClaims(input.uid, claims); else await auth.setCustomUserClaims(input.uid, null);
      await db.collection('users').doc(input.uid).set({ role: 'user' }, { merge: true });
      await auth.revokeRefreshTokens(input.uid);
    }
    await db.collection('cmActivity').add({ uid: actor.uid, action: `account.${input.action}`, itemId: input.uid, createdAt: FieldValue.serverTimestamp() });
    return NextResponse.json({ updated: true });
  } catch (error) { return cmError(error); }
}
