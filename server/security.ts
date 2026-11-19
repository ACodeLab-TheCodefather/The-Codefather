import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';

const BCRYPT_ROUNDS = 10;

export function getSessionSecret(): string {
  return (
    process.env.SESSION_SECRET ||
    crypto.createHash('sha256').update(process.cwd() + ':the-codefather-v5').digest('hex')
  );
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (!plain || !hash) return false;
  return bcrypt.compare(plain, hash);
}

export function generateTotpSetup(username: string): {
  secret: string;
  otpauthUrl: string;
} {
  const secret = new OTPAuth.Secret({ size: 20 });
  const totp = new OTPAuth.TOTP({
    issuer: 'THE CODEFATHER',
    label: username,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret
  });
  return {
    secret: secret.base32,
    otpauthUrl: totp.toString()
  };
}

export async function generateQrDataUrl(otpauthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpauthUrl, {
    width: 220,
    margin: 2,
    color: { dark: '#111111', light: '#FFFFFF' }
  });
}

export function verifyTotpToken(secretBase32: string, token: string): boolean {
  const cleaned = token.replace(/\s+/g, '');
  if (!/^\d{6}$/.test(cleaned)) return false;
  const totp = new OTPAuth.TOTP({
    issuer: 'THE CODEFATHER',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secretBase32)
  });
  const delta = totp.validate({ token: cleaned, window: 1 });
  return delta !== null;
}

export function generateRecoveryCodes(count = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const raw = crypto.randomBytes(5).toString('hex').toUpperCase();
    codes.push(`${raw.slice(0, 5)}-${raw.slice(5, 10)}`);
  }
  return codes;
}

export async function hashRecoveryCode(code: string): Promise<string> {
  const normalized = code.trim().toUpperCase();
  return bcrypt.hash(normalized, BCRYPT_ROUNDS);
}

export async function verifyRecoveryCode(code: string, hash: string): Promise<boolean> {
  const normalized = code.trim().toUpperCase();
  if (!normalized || !hash) return false;
  return bcrypt.compare(normalized, hash);
}

export function sha256Hex(value: string | Buffer): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function signChallengeToken(adminId: string, ttlMs = 5 * 60 * 1000): string {
  const exp = Date.now() + ttlMs;
  const payload = Buffer.from(JSON.stringify({ adminId, exp })).toString('base64url');
  const sig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyChallengeToken(token: string): { adminId: string } | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = crypto
    .createHmac('sha256', getSessionSecret())
    .update(payload)
    .digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      adminId: string;
      exp: number;
    };
    if (!decoded.adminId || typeof decoded.exp !== 'number' || decoded.exp < Date.now()) {
      return null;
    }
    return { adminId: decoded.adminId };
  } catch {
    return null;
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
}

export function createRateLimiter(maxRequests: number, windowMs: number) {
  const buckets = new Map<string, number[]>();

  return {
    check(key: string, now = Date.now()): RateLimitResult {
      const cutoff = now - windowMs;
      const entries = (buckets.get(key) ?? []).filter((ts) => ts > cutoff);
      if (entries.length >= maxRequests) {
        const oldest = entries[0];
        const retryAfterSec = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
        buckets.set(key, entries);
        return { allowed: false, remaining: 0, retryAfterSec };
      }
      entries.push(now);
      buckets.set(key, entries);
      return {
        allowed: true,
        remaining: Math.max(0, maxRequests - entries.length),
        retryAfterSec: 0
      };
    },
    reset(key: string) {
      buckets.delete(key);
    }
  };
}

export function validateContactSubmission(input: {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  website?: string;
}): { valid: boolean; errors: Record<string, string>; isSpam: boolean } {
  if (input.website && input.website.trim().length > 0) {
    return { valid: false, errors: {}, isSpam: true };
  }
  const errors: Record<string, string> = {};
  const name = (input.name ?? '').trim();
  const email = (input.email ?? '').trim();
  const message = (input.message ?? '').trim();

  if (name.length < 2 || name.length > 160) {
    errors.name = 'Name must be between 2 and 160 characters.';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 191) {
    errors.email = 'A valid email address is required.';
  }
  if (message.length < 10 || message.length > 5000) {
    errors.message = 'Message must be between 10 and 5000 characters.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    isSpam: false
  };
}

export function validateImageBuffer(
  buffer: Buffer,
  declaredMime: string,
  maxBytes: number
): { valid: boolean; ext?: string; mime?: string; reason?: string } {
  if (buffer.length === 0) {
    return { valid: false, reason: 'Empty file.' };
  }
  if (buffer.length > maxBytes) {
    return { valid: false, reason: `File exceeds limit of ${Math.round(maxBytes / (1024 * 1024))} MB.` };
  }

  // Magic-byte validation to block executables disguised as images
  const isPng =
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47;
  const isJpeg =
    buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isWebp =
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP';

  if (isPng && declaredMime === 'image/png') return { valid: true, ext: 'png', mime: 'image/png' };
  if (isJpeg && (declaredMime === 'image/jpeg' || declaredMime === 'image/jpg')) {
    return { valid: true, ext: 'jpg', mime: 'image/jpeg' };
  }
  if (isWebp && declaredMime === 'image/webp') return { valid: true, ext: 'webp', mime: 'image/webp' };

  return { valid: false, reason: 'Only verified PNG, JPEG, or WebP images are permitted.' };
}
