import 'server-only';

import { getAdminDb } from '@/lib/firebase-admin';
import {
  generateRecoveryCodes,
  generateTotpSecret,
  hashRecoveryCode,
  matchTotp,
  normalizeRecoveryCode,
  otpauthUri,
} from '@/lib/totp';

/**
 * Double authentification des administrateurs. Les clés sont dans adminSecurity/{uid}, une
 * collection que firestore.rules ferme aux navigateurs : seul le serveur (Admin SDK) la lit.
 */
const COLLECTION = 'adminSecurity';
const MAX_FAILURES = 5;
const LOCK_MS = 15 * 60 * 1000;
const PENDING_SECRET_TTL_MS = 15 * 60 * 1000;

type AdminSecurityDoc = {
  totpSecret?: string;
  lastStep?: number;
  recoveryHashes?: string[];
  pendingSecret?: string;
  pendingCreatedAt?: number;
  failures?: number;
  lockedUntil?: number;
  enabledAt?: number;
};

export type SecondFactorResult =
  | { status: 'ok'; recoveryCodes?: string[]; usedRecoveryCode?: boolean; remainingRecoveryCodes?: number }
  | { status: 'required' }
  | { status: 'setup'; secret: string; otpauthUri: string }
  | { status: 'invalid'; setup: boolean }
  | { status: 'locked'; retryAt: number };

/**
 * Sans code : demande le code, ou propose l'activation si le compte n'a pas encore de clé.
 * Avec code : le vérifie (code de l'appli ou code de secours) et compte les échecs.
 */
export async function checkAdminSecondFactor(uid: string, account: string, rawCode?: string): Promise<SecondFactorResult> {
  const db = getAdminDb();
  const ref = db.collection(COLLECTION).doc(uid);
  const code = rawCode?.trim().replace(/\s/g, '') || '';

  return db.runTransaction(async (transaction): Promise<SecondFactorResult> => {
    const data = ((await transaction.get(ref)).data() || {}) as AdminSecurityDoc;
    const now = Date.now();

    if (data.lockedUntil && data.lockedUntil > now) return { status: 'locked', retryAt: data.lockedUntil };

    const pendingValid = Boolean(data.pendingSecret && data.pendingCreatedAt && now - data.pendingCreatedAt < PENDING_SECRET_TTL_MS);

    // Pas encore de clé : on en prépare une, gardée en attente jusqu'au premier code correct.
    if (!data.totpSecret && (!code || !pendingValid)) {
      const secret = pendingValid && data.pendingSecret ? data.pendingSecret : generateTotpSecret();
      transaction.set(ref, { pendingSecret: secret, pendingCreatedAt: pendingValid ? data.pendingCreatedAt : now }, { merge: true });
      return { status: 'setup', secret, otpauthUri: otpauthUri(secret, account) };
    }

    if (!code) return { status: 'required' };

    const fail = (): SecondFactorResult => {
      const failures = (data.failures || 0) + 1;
      if (failures >= MAX_FAILURES) {
        transaction.set(ref, { failures: 0, lockedUntil: now + LOCK_MS }, { merge: true });
        return { status: 'locked', retryAt: now + LOCK_MS };
      }
      transaction.set(ref, { failures }, { merge: true });
      return { status: 'invalid', setup: !data.totpSecret };
    };

    // Activation : le premier code correct confirme que l'appli a bien enregistré la clé.
    if (!data.totpSecret) {
      const step = matchTotp(data.pendingSecret!, code, now);
      if (step === null) return fail();
      const recoveryCodes = generateRecoveryCodes();
      transaction.set(ref, {
        totpSecret: data.pendingSecret,
        lastStep: step,
        recoveryHashes: recoveryCodes.map(hashRecoveryCode),
        pendingSecret: null,
        pendingCreatedAt: null,
        failures: 0,
        lockedUntil: null,
        enabledAt: now,
      }, { merge: true });
      return { status: 'ok', recoveryCodes };
    }

    const step = matchTotp(data.totpSecret, code, now);
    if (step !== null) {
      // Un code déjà utilisé ne sert pas deux fois (vol par-dessus l'épaule, phishing en direct).
      if (data.lastStep !== undefined && step <= data.lastStep) return fail();
      transaction.set(ref, { lastStep: step, failures: 0, lockedUntil: null }, { merge: true });
      return { status: 'ok' };
    }

    if (normalizeRecoveryCode(code)) {
      const hash = hashRecoveryCode(code);
      const hashes = data.recoveryHashes || [];
      if (hashes.includes(hash)) {
        const remaining = hashes.filter((value) => value !== hash);
        transaction.set(ref, { recoveryHashes: remaining, failures: 0, lockedUntil: null }, { merge: true });
        return { status: 'ok', usedRecoveryCode: true, remainingRecoveryCodes: remaining.length };
      }
    }

    return fail();
  });
}
