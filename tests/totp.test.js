import test from 'node:test';
import assert from 'node:assert/strict';
import {
  base32Decode,
  base32Encode,
  generateRecoveryCodes,
  generateTotpSecret,
  hashRecoveryCode,
  matchTotp,
  normalizeRecoveryCode,
  otpauthUri,
  totpCode,
  totpStep,
} from '../lib/totp.ts';

// Vecteurs de la RFC 6238 (annexe B), clé ASCII "12345678901234567890", 8 derniers chiffres tronqués à 6.
const RFC_SECRET = base32Encode(Buffer.from('12345678901234567890'));

test('codes TOTP conformes à la RFC 6238', () => {
  assert.equal(totpCode(RFC_SECRET, totpStep(59_000)), '287082');
  assert.equal(totpCode(RFC_SECRET, totpStep(1_111_111_109_000)), '081804');
  assert.equal(totpCode(RFC_SECRET, totpStep(1_234_567_890_000)), '005924');
  assert.equal(totpCode(RFC_SECRET, totpStep(2_000_000_000_000)), '279037');
});

test('base32 aller-retour', () => {
  const bytes = Buffer.from([0, 1, 2, 250, 251, 252, 253, 254, 255]);
  assert.deepEqual(base32Decode(base32Encode(bytes)), bytes);
  assert.equal(generateTotpSecret().length, 32);
});

test('un code est accepté à un pas près, pas au-delà', () => {
  const secret = generateTotpSecret();
  const now = 1_700_000_000_000;
  const step = totpStep(now);
  assert.equal(matchTotp(secret, totpCode(secret, step), now), step);
  assert.equal(matchTotp(secret, totpCode(secret, step - 1), now), step - 1);
  assert.equal(matchTotp(secret, totpCode(secret, step + 1), now), step + 1);
  assert.equal(matchTotp(secret, totpCode(secret, step - 3), now), null);
  assert.equal(matchTotp(secret, 'abcdef', now), null);
  assert.equal(matchTotp(secret, '12345', now), null);
});

test('codes de secours : format, unicité, saisie tolérante', () => {
  const codes = generateRecoveryCodes();
  assert.equal(codes.length, 10);
  assert.equal(new Set(codes).size, 10);
  for (const code of codes) assert.match(code, /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
  const [first] = codes;
  assert.equal(normalizeRecoveryCode(first.toLowerCase().replace('-', ' ')), first);
  assert.equal(hashRecoveryCode(first.toLowerCase().replace('-', '')), hashRecoveryCode(first));
  assert.equal(normalizeRecoveryCode('123456'), '');
});

test('URI otpauth lisible par les applis', () => {
  const uri = otpauthUri('ABCDEF', 'admin@jchub.dev');
  assert.match(uri, /^otpauth:\/\/totp\/JcHub%20Admin%3Aadmin%40jchub\.dev\?/);
  assert.match(uri, /secret=ABCDEF/);
  assert.match(uri, /issuer=JcHub\+Admin/);
});
