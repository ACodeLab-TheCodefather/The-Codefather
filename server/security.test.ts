import test from 'node:test';
import assert from 'node:assert/strict';
import * as OTPAuth from 'otpauth';
import {
  createRateLimiter,
  generateRecoveryCodes,
  generateTotpSetup,
  hashPassword,
  hashRecoveryCode,
  signChallengeToken,
  validateContactSubmission,
  validateImageBuffer,
  verifyChallengeToken,
  verifyPassword,
  verifyRecoveryCode,
  verifyTotpToken
} from './security.ts';

test('Password hashing never stores plaintext and verifies accurately', async () => {
  const hash = await hashPassword('StrongPass!2026');
  assert.notEqual(hash, 'StrongPass!2026');
  assert.equal(await verifyPassword('StrongPass!2026', hash), true);
  assert.equal(await verifyPassword('WrongPass', hash), false);
});

test('TOTP 2FA secret generates valid 6-digit tokens and rejects invalid ones', () => {
  const setup = generateTotpSetup('codefather_admin');
  const totp = new OTPAuth.TOTP({
    issuer: 'THE CODEFATHER',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(setup.secret)
  });
  const currentCode = totp.generate();
  assert.equal(verifyTotpToken(setup.secret, currentCode), true);
  assert.equal(verifyTotpToken(setup.secret, '000000'), false);
});

test('Recovery codes are generated, hashed, and verified case-insensitively', async () => {
  const codes = generateRecoveryCodes(10);
  assert.equal(codes.length, 10);
  assert.equal(new Set(codes).size, 10);
  const hash = await hashRecoveryCode(codes[0]);
  assert.notEqual(hash, codes[0]);
  assert.equal(await verifyRecoveryCode(codes[0].toLowerCase(), hash), true);
  assert.equal(await verifyRecoveryCode('WRONG-CODE1', hash), false);
});

test('Signed 2FA challenge tokens verify and reject tampering', () => {
  const token = signChallengeToken('admin-123', 60_000);
  assert.deepEqual(verifyChallengeToken(token), { adminId: 'admin-123' });
  assert.equal(verifyChallengeToken(token + 'tampered'), null);
});

test('Rate limiter blocks after max requests in window', () => {
  const limiter = createRateLimiter(2, 10_000);
  assert.equal(limiter.check('1.1.1.1', 1000).allowed, true);
  assert.equal(limiter.check('1.1.1.1', 2000).allowed, true);
  const third = limiter.check('1.1.1.1', 3000);
  assert.equal(third.allowed, false);
  assert.ok(third.retryAfterSec >= 1);
});

test('Contact validation catches honeypot bots and short messages', () => {
  const spam = validateContactSubmission({
    name: 'Bot',
    email: 'bot@spam.com',
    message: 'Buy crypto now',
    website: 'http://spam.example'
  });
  assert.equal(spam.isSpam, true);

  const invalid = validateContactSubmission({
    name: 'A',
    email: 'bad-email',
    message: 'hi'
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.name);
  assert.ok(invalid.errors.email);
  assert.ok(invalid.errors.message);
});

test('Image upload magic-byte validator rejects spoofed executable bytes', () => {
  const fakePng = Buffer.from('#!/bin/sh\nrm -rf /', 'utf8');
  assert.equal(validateImageBuffer(fakePng, 'image/png', 1024 * 1024).valid, false);

  const validPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.equal(validateImageBuffer(validPng, 'image/png', 1024 * 1024).valid, true);
});
