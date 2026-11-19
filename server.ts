import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import cookieParser from 'cookie-parser';
import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import { createServer as createViteServer } from 'vite';
import {
  BACKUP_FOLDER_PATH,
  UPLOAD_FOLDER_PATH,
  addNotification,
  createDatabaseBackup,
  db,
  getActivityLogs,
  getBackups,
  getEducationEvents,
  getMediaAssets,
  getMessages,
  getNotifications,
  getProfile,
  getProjectById,
  getProjects,
  getPublicBootstrap,
  getSettings,
  getSkillCategories,
  getSkills,
  listAdmins,
  recordActivity,
  restoreDatabaseBackup,
  saveSettings
} from './server/db.ts';
import {
  createRateLimiter,
  generateQrDataUrl,
  generateRecoveryCodes,
  generateTotpSetup,
  hashPassword,
  hashRecoveryCode,
  sha256Hex,
  signChallengeToken,
  validateContactSubmission,
  validateImageBuffer,
  verifyChallengeToken,
  verifyPassword,
  verifyRecoveryCode,
  verifyTotpToken
} from './server/security.ts';

interface AuthenticatedAdmin {
  id: string;
  username: string;
  email: string;
  role: 'super_admin' | 'editor';
  totpEnabled: boolean;
  csrfToken: string;
}

interface AdminRequest extends Request {
  admin?: AuthenticatedAdmin;
}

const SESSION_COOKIE = 'cf_admin_session';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

const loginLimiter = createRateLimiter(8, 15 * 60 * 1000);
const setupLimiter = createRateLimiter(5, 15 * 60 * 1000);
const contactLimiter = createRateLimiter(6, 10 * 60 * 1000);

function getClientIp(req: Request): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) {
    return fwd.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

function getActiveSession(req: Request): AuthenticatedAdmin | null {
  const rawToken = req.cookies?.[SESSION_COOKIE];
  if (!rawToken || typeof rawToken !== 'string') return null;
  const tokenHash = sha256Hex(rawToken);
  const row = db
    .prepare(
      `SELECT s.csrf_token, s.expires_at, a.id, a.username, a.email, a.role, a.totp_enabled
       FROM admin_sessions s
       JOIN admins a ON a.id = s.admin_id
       WHERE s.token_hash = ?`
    )
    .get(tokenHash) as
    | {
        csrf_token: string;
        expires_at: string;
        id: string;
        username: string;
        email: string;
        role: 'super_admin' | 'editor';
        totp_enabled: number;
      }
    | undefined;

  if (!row) return null;
  if (Date.parse(row.expires_at) < Date.now()) {
    db.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').run(tokenHash);
    return null;
  }

  return {
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role,
    totpEnabled: Boolean(row.totp_enabled),
    csrfToken: row.csrf_token
  };
}

function createSessionForAdmin(req: Request, res: Response, adminId: string): string {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = sha256Hex(rawToken);
  const csrfToken = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  db.prepare(
    `INSERT INTO admin_sessions (id, admin_id, token_hash, csrf_token, ip_address, user_agent, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    crypto.randomUUID(),
    adminId,
    tokenHash,
    csrfToken,
    getClientIp(req),
    String(req.headers['user-agent'] || '').slice(0, 255),
    expiresAt
  );

  res.cookie(SESSION_COOKIE, rawToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production' && req.protocol === 'https',
    maxAge: SESSION_TTL_MS,
    path: '/'
  });

  return csrfToken;
}

function requireAdmin(req: AdminRequest, res: Response, next: NextFunction): void {
  const admin = getActiveSession(req);
  if (!admin) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const headerCsrf = req.headers['x-csrf-token'];
    if (typeof headerCsrf !== 'string' || headerCsrf !== admin.csrfToken) {
      res.status(403).json({ error: 'Invalid or missing CSRF token.' });
      return;
    }
  }

  req.admin = admin;
  next();
}

function slugifyId(input: string): string {
  const clean = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return clean || `proj-${crypto.randomBytes(4).toString('hex')}`;
}

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false
    })
  );
  app.use(cookieParser());
  app.use(express.json({ limit: '10mb' }));

  // Serve validated uploaded media and attached aistudio assets cleanly
  app.use('/uploads', express.static(UPLOAD_FOLDER_PATH, { maxAge: '7d' }));

  // ==================== PUBLIC SEO ENDPOINTS ====================
  app.get('/robots.txt', (req, res) => {
    const settings = getSettings();
    const base = settings.canonicalBaseUrl || `${req.protocol}://${req.get('host')}`;
    res.type('text/plain').send(
      [
        'User-agent: *',
        'Allow: /',
        'Disallow: /admin',
        'Disallow: /api/admin',
        `Sitemap: ${base.replace(/\/$/, '')}/sitemap.xml`
      ].join('\n')
    );
  });

  app.get('/sitemap.xml', (req, res) => {
    const settings = getSettings();
    const base = (settings.canonicalBaseUrl || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
    const publishedProjects = getProjects(false);
    const urls = [
      { loc: `${base}/`, priority: '1.0' },
      { loc: `${base}/about`, priority: '0.8' },
      { loc: `${base}/projects`, priority: '0.9' },
      { loc: `${base}/contact`, priority: '0.7' },
      ...publishedProjects.map((p) => ({
        loc: `${base}/projects/${encodeURIComponent(p.id)}`,
        priority: '0.8'
      }))
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;
    res.type('application/xml').send(xml);
  });

  // ==================== PUBLIC API (PUBLISHED ONLY) ====================
  app.get('/api/public/bootstrap', (_req, res) => {
    res.json(getPublicBootstrap(false));
  });

  app.get('/api/public/projects/:id', (req, res) => {
    const project = getProjectById(req.params.id, false);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }
    const allPublished = getProjects(false);
    const related = allPublished
      .filter((p) => p.id !== project.id && (p.category.en === project.category.en || p.category.ar === project.category.ar))
      .slice(0, 2);
    res.json({ project, related });
  });

  app.post('/api/contact', (req, res) => {
    const ip = getClientIp(req);
    const limit = contactLimiter.check(ip);
    if (!limit.allowed) {
      res.status(429).json({
        error: `Too many requests. Please try again in ${limit.retryAfterSec}s.`
      });
      return;
    }

    const body = req.body as {
      name?: string;
      email?: string;
      subject?: string;
      message?: string;
      website?: string;
    };

    const validation = validateContactSubmission(body);
    if (validation.isSpam) {
      // Silently succeed for honeypot bots without persisting
      res.status(200).json({ ok: true });
      return;
    }
    if (!validation.valid) {
      res.status(400).json({ error: 'Validation failed.', fields: validation.errors });
      return;
    }

    const id = crypto.randomUUID();
    const name = body.name!.trim();
    const email = body.email!.trim();
    const subject = (body.subject || 'Website Inquiry').trim().slice(0, 255);
    const message = body.message!.trim();

    db.prepare(
      `INSERT INTO contact_messages (id, name, email, subject, message, status, ip_address)
       VALUES (?, ?, ?, ?, ?, 'unread', ?)`
    ).run(id, name, email, subject, message, ip);

    addNotification(
      'message',
      `رسالة جديدة من ${name}`,
      `New message from ${name}`,
      `الموضوع: ${subject}`,
      `Subject: ${subject}`
    );

    res.status(201).json({ ok: true, id });
  });

  // ==================== ADMIN AUTH & INITIAL SETUP ====================
  app.get('/api/admin/auth/status', (req, res) => {
    const adminCount = (db.prepare('SELECT COUNT(*) as c FROM admins').get() as { c: number }).c;
    const session = getActiveSession(req);
    res.json({
      setupRequired: adminCount === 0,
      authenticated: Boolean(session),
      csrfToken: session?.csrfToken || null,
      admin: session
        ? {
            id: session.id,
            username: session.username,
            email: session.email,
            role: session.role,
            totpEnabled: session.totpEnabled
          }
        : null
    });
  });

  app.post('/api/admin/auth/setup', async (req, res) => {
    const ip = getClientIp(req);
    const limit = setupLimiter.check(ip);
    if (!limit.allowed) {
      res.status(429).json({ error: 'Rate limit exceeded.' });
      return;
    }

    const adminCount = (db.prepare('SELECT COUNT(*) as c FROM admins').get() as { c: number }).c;
    if (adminCount > 0) {
      res.status(403).json({ error: 'Initial administrator setup is permanently locked.' });
      return;
    }

    const { username, email, password } = req.body as {
      username?: string;
      email?: string;
      password?: string;
    };

    if (!username || username.trim().length < 3 || username.trim().length > 64) {
      res.status(400).json({ error: 'Username must be between 3 and 64 characters.' });
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      res.status(400).json({ error: 'Valid email address is required.' });
      return;
    }
    if (!password || password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters.' });
      return;
    }

    const adminId = crypto.randomUUID();
    const passwordHash = await hashPassword(password);
    const totp = generateTotpSetup(username.trim());
    const qrDataUrl = await generateQrDataUrl(totp.otpauthUrl);
    const recoveryCodes = generateRecoveryCodes(10);

    db.exec('BEGIN TRANSACTION;');
    try {
      db.prepare(
        `INSERT INTO admins (id, username, email, password_hash, role, totp_secret, totp_enabled, last_login_at)
         VALUES (?, ?, ?, ?, 'super_admin', ?, 1, datetime('now'))`
      ).run(adminId, username.trim(), email.trim().toLowerCase(), passwordHash, totp.secret);

      const insCode = db.prepare(
        'INSERT INTO admin_recovery_codes (id, admin_id, code_hash) VALUES (?, ?, ?)'
      );
      for (const code of recoveryCodes) {
        insCode.run(crypto.randomUUID(), adminId, await hashRecoveryCode(code));
      }
      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      res.status(500).json({ error: err instanceof Error ? err.message : 'Setup failed.' });
      return;
    }

    const csrfToken = createSessionForAdmin(req, res, adminId);
    recordActivity(adminId, username.trim(), 'ADMIN_INITIAL_SETUP', 'admin', adminId, 'Created first super_admin and enrolled 2FA.', ip);
    addNotification(
      'security',
      'تم تفعيل حساب المسؤول الأول',
      'First Administrator Enrolled',
      'تم إنشاء حساب المسؤول وتفعيل المصادقة الثنائية وقفل الإعداد المبدئي.',
      'Primary administrator created with 2FA enabled; initial setup locked.'
    );

    res.status(201).json({
      ok: true,
      csrfToken,
      totpSecret: totp.secret,
      qrDataUrl,
      recoveryCodes,
      admin: {
        id: adminId,
        username: username.trim(),
        email: email.trim().toLowerCase(),
        role: 'super_admin',
        totpEnabled: true
      }
    });
  });

  app.post('/api/admin/auth/login', async (req, res) => {
    const ip = getClientIp(req);
    const limit = loginLimiter.check(ip);
    if (!limit.allowed) {
      res.status(429).json({
        error: `Too many login attempts. Retry in ${limit.retryAfterSec}s.`
      });
      return;
    }

    const { identifier, password } = req.body as { identifier?: string; password?: string };
    if (!identifier || !password) {
      res.status(400).json({ error: 'Username/email and password are required.' });
      return;
    }

    const cleanId = identifier.trim();
    const admin = db
      .prepare('SELECT * FROM admins WHERE username = ? OR email = ?')
      .get(cleanId, cleanId.toLowerCase()) as
      | {
          id: string;
          username: string;
          email: string;
          password_hash: string;
          role: 'super_admin' | 'editor';
          totp_secret: string | null;
          totp_enabled: number;
        }
      | undefined;

    if (!admin || !(await verifyPassword(password, admin.password_hash))) {
      recordActivity(null, cleanId, 'LOGIN_FAILED', 'auth', '', 'Invalid credentials.', ip);
      res.status(401).json({ error: 'Invalid credentials.' });
      return;
    }

    if (admin.totp_enabled && admin.totp_secret) {
      const challengeToken = signChallengeToken(admin.id);
      res.json({
        requires2fa: true,
        challengeToken
      });
      return;
    }

    db.prepare("UPDATE admins SET last_login_at = datetime('now') WHERE id = ?").run(admin.id);
    const csrfToken = createSessionForAdmin(req, res, admin.id);
    loginLimiter.reset(ip);
    recordActivity(admin.id, admin.username, 'LOGIN_SUCCESS', 'auth', admin.id, 'Signed in.', ip);

    res.json({
      requires2fa: false,
      csrfToken,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        totpEnabled: Boolean(admin.totp_enabled)
      }
    });
  });

  app.post('/api/admin/auth/verify-2fa', async (req, res) => {
    const ip = getClientIp(req);
    const limit = loginLimiter.check(ip);
    if (!limit.allowed) {
      res.status(429).json({ error: `Rate limit exceeded. Retry in ${limit.retryAfterSec}s.` });
      return;
    }

    const { challengeToken, code, mode } = req.body as {
      challengeToken?: string;
      code?: string;
      mode?: 'totp' | 'recovery';
    };

    if (!challengeToken || !code) {
      res.status(400).json({ error: 'Challenge token and verification code are required.' });
      return;
    }

    const verifiedChallenge = verifyChallengeToken(challengeToken);
    if (!verifiedChallenge) {
      res.status(401).json({ error: 'Verification challenge expired. Please sign in again.' });
      return;
    }

    const admin = db
      .prepare('SELECT * FROM admins WHERE id = ?')
      .get(verifiedChallenge.adminId) as
      | {
          id: string;
          username: string;
          email: string;
          role: 'super_admin' | 'editor';
          totp_secret: string | null;
          totp_enabled: number;
        }
      | undefined;

    if (!admin) {
      res.status(401).json({ error: 'Administrator account not found.' });
      return;
    }

    let ok = false;
    if (mode === 'recovery') {
      const unusedCodes = db
        .prepare('SELECT id, code_hash FROM admin_recovery_codes WHERE admin_id = ? AND used_at IS NULL')
        .all(admin.id) as Array<{ id: string; code_hash: string }>;

      for (const rc of unusedCodes) {
        if (await verifyRecoveryCode(code, rc.code_hash)) {
          db.prepare("UPDATE admin_recovery_codes SET used_at = datetime('now') WHERE id = ?").run(rc.id);
          ok = true;
          recordActivity(admin.id, admin.username, 'RECOVERY_CODE_USED', 'auth', rc.id, 'Used single-use recovery code during 2FA.', ip);
          addNotification(
            'security',
            'تم استخدام رمز استرداد',
            'Recovery Code Used',
            `تم استخدام أحد رموز الاسترداد لتسجيل دخول ${admin.username}.`,
            `A one-time recovery code was used to sign in as ${admin.username}.`
          );
          break;
        }
      }
    } else if (admin.totp_secret) {
      ok = verifyTotpToken(admin.totp_secret, code);
    }

    if (!ok) {
      recordActivity(admin.id, admin.username, 'LOGIN_2FA_FAILED', 'auth', admin.id, 'Invalid 2FA or recovery code.', ip);
      res.status(401).json({ error: 'Invalid verification code.' });
      return;
    }

    db.prepare("UPDATE admins SET last_login_at = datetime('now') WHERE id = ?").run(admin.id);
    const csrfToken = createSessionForAdmin(req, res, admin.id);
    loginLimiter.reset(ip);
    recordActivity(admin.id, admin.username, 'LOGIN_SUCCESS', 'auth', admin.id, 'Completed 2FA sign in.', ip);

    res.json({
      ok: true,
      csrfToken,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        totpEnabled: Boolean(admin.totp_enabled)
      }
    });
  });

  app.post('/api/admin/auth/recover-password', async (req, res) => {
    const ip = getClientIp(req);
    const limit = loginLimiter.check(ip);
    if (!limit.allowed) {
      res.status(429).json({ error: `Too many attempts. Retry in ${limit.retryAfterSec}s.` });
      return;
    }

    const { identifier, recoveryCode, newPassword } = req.body as {
      identifier?: string;
      recoveryCode?: string;
      newPassword?: string;
    };

    if (!identifier || !recoveryCode || !newPassword || newPassword.length < 8) {
      res.status(400).json({ error: 'Valid identifier, recovery code, and 8+ char password are required.' });
      return;
    }

    const cleanId = identifier.trim();
    const admin = db
      .prepare('SELECT id, username FROM admins WHERE username = ? OR email = ?')
      .get(cleanId, cleanId.toLowerCase()) as { id: string; username: string } | undefined;

    if (!admin) {
      res.status(401).json({ error: 'Invalid recovery credentials.' });
      return;
    }

    const unusedCodes = db
      .prepare('SELECT id, code_hash FROM admin_recovery_codes WHERE admin_id = ? AND used_at IS NULL')
      .all(admin.id) as Array<{ id: string; code_hash: string }>;

    let matchedId: string | null = null;
    for (const rc of unusedCodes) {
      if (await verifyRecoveryCode(recoveryCode, rc.code_hash)) {
        matchedId = rc.id;
        break;
      }
    }

    if (!matchedId) {
      recordActivity(admin.id, admin.username, 'PASSWORD_RECOVERY_FAILED', 'auth', admin.id, 'Invalid recovery code.', ip);
      res.status(401).json({ error: 'Invalid or already used recovery code.' });
      return;
    }

    const nextHash = await hashPassword(newPassword);
    db.exec('BEGIN TRANSACTION;');
    try {
      db.prepare("UPDATE admin_recovery_codes SET used_at = datetime('now') WHERE id = ?").run(matchedId);
      db.prepare("UPDATE admins SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").run(nextHash, admin.id);
      db.prepare('DELETE FROM admin_sessions WHERE admin_id = ?').run(admin.id);
      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      res.status(500).json({ error: err instanceof Error ? err.message : 'Recovery failed.' });
      return;
    }

    recordActivity(admin.id, admin.username, 'PASSWORD_RECOVERED', 'auth', admin.id, 'Password reset via one-time recovery code.', ip);
    addNotification(
      'security',
      'تمت استعادة كلمة المرور',
      'Administrator Password Reset',
      `تمت إعادة تعيين كلمة مرور ${admin.username} باستخدام رمز استرداد.`,
      `Password was reset for ${admin.username} using a recovery code.`
    );

    res.json({ ok: true });
  });

  app.post('/api/admin/auth/logout', (req, res) => {
    const session = getActiveSession(req);
    const rawToken = req.cookies?.[SESSION_COOKIE];
    if (rawToken) {
      db.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').run(sha256Hex(rawToken));
    }
    if (session) {
      recordActivity(session.id, session.username, 'LOGOUT', 'auth', session.id, 'Signed out.', getClientIp(req));
    }
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    res.json({ ok: true });
  });

  // ==================== PROTECTED ADMIN APIs ====================
  app.use('/api/admin', requireAdmin);

  app.get('/api/admin/preview', (_req, res) => {
    res.json(getPublicBootstrap(true));
  });

  app.get('/api/admin/overview', (_req, res) => {
    const projects = getProjects(true);
    const messages = getMessages();
    const education = getEducationEvents(true);
    const skills = getSkills();
    const notifications = getNotifications();
    const activity = getActivityLogs(12);
    const backups = getBackups();

    res.json({
      stats: {
        totalProjects: projects.length,
        publishedProjects: projects.filter((p) => p.status === 'published').length,
        draftProjects: projects.filter((p) => p.status === 'draft').length,
        totalMessages: messages.length,
        unreadMessages: messages.filter((m) => m.status === 'unread').length,
        totalSkills: skills.length,
        totalEducation: education.length,
        totalBackups: backups.length
      },
      recentActivity: activity,
      recentNotifications: notifications.slice(0, 8)
    });
  });

  // Profile
  app.get('/api/admin/profile', (_req, res) => {
    res.json(getProfile());
  });

  app.put('/api/admin/profile', (req: AdminRequest, res) => {
    const b = req.body;
    const aboutAr = Array.isArray(b.aboutParagraphs)
      ? b.aboutParagraphs.map((p: { ar?: string }) => String(p.ar ?? ''))
      : [];
    const aboutEn = Array.isArray(b.aboutParagraphs)
      ? b.aboutParagraphs.map((p: { en?: string }) => String(p.en ?? ''))
      : [];

    db.prepare(
      `UPDATE site_profile SET
        name_ar = ?, name_en = ?, role_ar = ?, role_en = ?,
        intro_ar = ?, intro_en = ?, about_ar_json = ?, about_en_json = ?,
        email = ?, location_ar = ?, location_en = ?, availability_ar = ?, availability_en = ?,
        github_url = ?, linkedin_url = ?, x_url = ?, updated_at = datetime('now')
       WHERE id = 1`
    ).run(
      String(b.name?.ar ?? ''),
      String(b.name?.en ?? ''),
      String(b.role?.ar ?? ''),
      String(b.role?.en ?? ''),
      String(b.intro?.ar ?? ''),
      String(b.intro?.en ?? ''),
      JSON.stringify(aboutAr),
      JSON.stringify(aboutEn),
      String(b.email ?? ''),
      String(b.location?.ar ?? ''),
      String(b.location?.en ?? ''),
      String(b.availability?.ar ?? ''),
      String(b.availability?.en ?? ''),
      String(b.githubUrl ?? ''),
      String(b.linkedinUrl ?? ''),
      String(b.xUrl ?? '')
    );

    recordActivity(req.admin!.id, req.admin!.username, 'PROFILE_UPDATED', 'profile', '1', 'Updated bilingual personal profile.', getClientIp(req));
    res.json(getProfile());
  });

  // Skills & Categories
  app.get('/api/admin/skills', (_req, res) => {
    res.json({ categories: getSkillCategories(), skills: getSkills() });
  });

  app.post('/api/admin/skill-categories', (req: AdminRequest, res) => {
    const id = `cat-${crypto.randomBytes(4).toString('hex')}`;
    const { name, sortOrder } = req.body;
    db.prepare('INSERT INTO skill_categories (id, name_ar, name_en, sort_order) VALUES (?, ?, ?, ?)').run(
      id,
      String(name?.ar ?? ''),
      String(name?.en ?? ''),
      Number(sortOrder ?? 10)
    );
    recordActivity(req.admin!.id, req.admin!.username, 'SKILL_CATEGORY_CREATED', 'skill_category', id, String(name?.en || name?.ar), getClientIp(req));
    res.status(201).json({ categories: getSkillCategories(), skills: getSkills() });
  });

  app.put('/api/admin/skill-categories/:id', (req: AdminRequest, res) => {
    const { name, sortOrder } = req.body;
    db.prepare('UPDATE skill_categories SET name_ar = ?, name_en = ?, sort_order = ? WHERE id = ?').run(
      String(name?.ar ?? ''),
      String(name?.en ?? ''),
      Number(sortOrder ?? 0),
      req.params.id
    );
    recordActivity(req.admin!.id, req.admin!.username, 'SKILL_CATEGORY_UPDATED', 'skill_category', req.params.id, String(name?.en || name?.ar), getClientIp(req));
    res.json({ categories: getSkillCategories(), skills: getSkills() });
  });

  app.delete('/api/admin/skill-categories/:id', (req: AdminRequest, res) => {
    db.prepare('DELETE FROM skill_categories WHERE id = ?').run(req.params.id);
    recordActivity(req.admin!.id, req.admin!.username, 'SKILL_CATEGORY_DELETED', 'skill_category', req.params.id, 'Deleted category and child skills.', getClientIp(req));
    res.json({ categories: getSkillCategories(), skills: getSkills() });
  });

  app.post('/api/admin/skills', (req: AdminRequest, res) => {
    const id = `sk-${crypto.randomBytes(4).toString('hex')}`;
    const b = req.body;
    db.prepare(
      'INSERT INTO skills (id, category_id, name, code, level, desc_ar, desc_en, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(
      id,
      String(b.categoryId),
      String(b.name ?? ''),
      String(b.code ?? 'SK').slice(0, 4).toUpperCase(),
      Math.max(0, Math.min(100, Number(b.level ?? 75))),
      String(b.description?.ar ?? ''),
      String(b.description?.en ?? ''),
      Number(b.sortOrder ?? 10)
    );
    recordActivity(req.admin!.id, req.admin!.username, 'SKILL_CREATED', 'skill', id, String(b.name), getClientIp(req));
    res.status(201).json({ categories: getSkillCategories(), skills: getSkills() });
  });

  app.put('/api/admin/skills/:id', (req: AdminRequest, res) => {
    const b = req.body;
    db.prepare(
      'UPDATE skills SET category_id = ?, name = ?, code = ?, level = ?, desc_ar = ?, desc_en = ?, sort_order = ? WHERE id = ?'
    ).run(
      String(b.categoryId),
      String(b.name ?? ''),
      String(b.code ?? 'SK').slice(0, 4).toUpperCase(),
      Math.max(0, Math.min(100, Number(b.level ?? 75))),
      String(b.description?.ar ?? ''),
      String(b.description?.en ?? ''),
      Number(b.sortOrder ?? 0),
      req.params.id
    );
    recordActivity(req.admin!.id, req.admin!.username, 'SKILL_UPDATED', 'skill', req.params.id, String(b.name), getClientIp(req));
    res.json({ categories: getSkillCategories(), skills: getSkills() });
  });

  app.delete('/api/admin/skills/:id', (req: AdminRequest, res) => {
    db.prepare('DELETE FROM skills WHERE id = ?').run(req.params.id);
    recordActivity(req.admin!.id, req.admin!.username, 'SKILL_DELETED', 'skill', req.params.id, 'Removed skill.', getClientIp(req));
    res.json({ categories: getSkillCategories(), skills: getSkills() });
  });

  // Projects (Instant Publish & Draft)
  app.get('/api/admin/projects', (_req, res) => {
    res.json(getProjects(true));
  });

  app.post('/api/admin/projects', (req: AdminRequest, res) => {
    const b = req.body;
    const baseSlug = slugifyId(b.id || b.title?.en || b.title?.ar || 'project');
    const exists = db.prepare('SELECT id FROM projects WHERE id = ?').get(baseSlug);
    const id = exists ? `${baseSlug}-${crypto.randomBytes(2).toString('hex')}` : baseSlug;
    const status = b.status === 'published' ? 'published' : 'draft';

    db.prepare(
      `INSERT INTO projects (
        id, code, title_ar, title_en, short_ar, short_en, full_ar, full_en,
        category_ar, category_en, technologies_json, year, image_url, gallery_json,
        live_url, source_url, featured, status, sort_order, published_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      String(b.code || 'PR').slice(0, 4).toUpperCase(),
      String(b.title?.ar ?? ''),
      String(b.title?.en ?? ''),
      String(b.shortDescription?.ar ?? ''),
      String(b.shortDescription?.en ?? ''),
      String(b.fullDescription?.ar ?? ''),
      String(b.fullDescription?.en ?? ''),
      String(b.category?.ar ?? ''),
      String(b.category?.en ?? ''),
      JSON.stringify(Array.isArray(b.technologies) ? b.technologies : []),
      Number(b.year ?? new Date().getFullYear()),
      String(b.imageUrl ?? ''),
      JSON.stringify(Array.isArray(b.gallery) ? b.gallery : []),
      String(b.liveUrl ?? ''),
      String(b.sourceUrl ?? ''),
      b.featured ? 1 : 0,
      status,
      Number(b.sortOrder ?? 10),
      status === 'published' ? new Date().toISOString() : null
    );

    recordActivity(req.admin!.id, req.admin!.username, status === 'published' ? 'PROJECT_PUBLISHED' : 'PROJECT_DRAFT_CREATED', 'project', id, String(b.title?.en || b.title?.ar), getClientIp(req));
    if (status === 'published') {
      addNotification(
        'publish',
        `تم نشر المشروع: ${b.title?.ar || b.title?.en}`,
        `Published project: ${b.title?.en || b.title?.ar}`,
        'أصبح المشروع متاحاً الآن على الموقع العام.',
        'The project is now live on the public website.'
      );
    }
    res.status(201).json(getProjectById(id, true));
  });

  app.put('/api/admin/projects/:id', (req: AdminRequest, res) => {
    const b = req.body;
    const status = b.status === 'published' ? 'published' : 'draft';
    const current = getProjectById(req.params.id, true);
    if (!current) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    const publishedAt =
      status === 'published' ? current.publishedAt || new Date().toISOString() : null;

    db.prepare(
      `UPDATE projects SET
        code = ?, title_ar = ?, title_en = ?, short_ar = ?, short_en = ?,
        full_ar = ?, full_en = ?, category_ar = ?, category_en = ?,
        technologies_json = ?, year = ?, image_url = ?, gallery_json = ?,
        live_url = ?, source_url = ?, featured = ?, status = ?, sort_order = ?,
        published_at = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).run(
      String(b.code || current.code).slice(0, 4).toUpperCase(),
      String(b.title?.ar ?? ''),
      String(b.title?.en ?? ''),
      String(b.shortDescription?.ar ?? ''),
      String(b.shortDescription?.en ?? ''),
      String(b.fullDescription?.ar ?? ''),
      String(b.fullDescription?.en ?? ''),
      String(b.category?.ar ?? ''),
      String(b.category?.en ?? ''),
      JSON.stringify(Array.isArray(b.technologies) ? b.technologies : []),
      Number(b.year ?? current.year),
      String(b.imageUrl ?? ''),
      JSON.stringify(Array.isArray(b.gallery) ? b.gallery : []),
      String(b.liveUrl ?? ''),
      String(b.sourceUrl ?? ''),
      b.featured ? 1 : 0,
      status,
      Number(b.sortOrder ?? current.sortOrder),
      publishedAt,
      req.params.id
    );

    recordActivity(req.admin!.id, req.admin!.username, 'PROJECT_UPDATED', 'project', req.params.id, `Status: ${status}`, getClientIp(req));
    if (status === 'published' && current.status !== 'published') {
      addNotification(
        'publish',
        `تم نشر المشروع: ${b.title?.ar || b.title?.en}`,
        `Published project: ${b.title?.en || b.title?.ar}`,
        'تم تحويل المسودة إلى مشروع منشور.',
        'Draft transitioned to published status.'
      );
    }
    res.json(getProjectById(req.params.id, true));
  });

  app.post('/api/admin/projects/:id/publish', (req: AdminRequest, res) => {
    const project = getProjectById(req.params.id, true);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }
    db.prepare(
      "UPDATE projects SET status = 'published', published_at = COALESCE(published_at, datetime('now')), updated_at = datetime('now') WHERE id = ?"
    ).run(req.params.id);
    recordActivity(req.admin!.id, req.admin!.username, 'PROJECT_PUBLISHED', 'project', req.params.id, project.title.en || project.title.ar, getClientIp(req));
    addNotification(
      'publish',
      `تم نشر المشروع: ${project.title.ar || project.title.en}`,
      `Published project: ${project.title.en || project.title.ar}`,
      'أصبح المشروع مرئياً للزوار.',
      'Project is now publicly visible.'
    );
    res.json(getProjectById(req.params.id, true));
  });

  app.post('/api/admin/projects/:id/unpublish', (req: AdminRequest, res) => {
    db.prepare(
      "UPDATE projects SET status = 'draft', updated_at = datetime('now') WHERE id = ?"
    ).run(req.params.id);
    recordActivity(req.admin!.id, req.admin!.username, 'PROJECT_UNPUBLISHED', 'project', req.params.id, 'Moved to draft.', getClientIp(req));
    res.json(getProjectById(req.params.id, true));
  });

  app.delete('/api/admin/projects/:id', (req: AdminRequest, res) => {
    db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
    recordActivity(req.admin!.id, req.admin!.username, 'PROJECT_DELETED', 'project', req.params.id, 'Deleted project.', getClientIp(req));
    res.json({ ok: true });
  });

  // Education Timeline
  app.get('/api/admin/education', (_req, res) => {
    res.json(getEducationEvents(true));
  });

  app.post('/api/admin/education', (req: AdminRequest, res) => {
    const id = `edu-${crypto.randomBytes(4).toString('hex')}`;
    const b = req.body;
    const year = Math.max(2006, Math.min(2026, Number(b.year ?? 2026)));
    const status = b.status === 'published' ? 'published' : 'draft';

    db.prepare(
      `INSERT INTO education_events (
        id, year, sort_order, title_ar, title_en, institution_ar, institution_en,
        desc_ar, desc_en, image_url, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      year,
      Number(b.sortOrder ?? 1),
      String(b.title?.ar ?? ''),
      String(b.title?.en ?? ''),
      String(b.institution?.ar ?? ''),
      String(b.institution?.en ?? ''),
      String(b.description?.ar ?? ''),
      String(b.description?.en ?? ''),
      String(b.imageUrl ?? ''),
      status
    );
    recordActivity(req.admin!.id, req.admin!.username, 'EDUCATION_CREATED', 'education', id, `${year}: ${b.title?.en || b.title?.ar}`, getClientIp(req));
    res.status(201).json(getEducationEvents(true));
  });

  app.put('/api/admin/education/:id', (req: AdminRequest, res) => {
    const b = req.body;
    const year = Math.max(2006, Math.min(2026, Number(b.year ?? 2026)));
    const status = b.status === 'published' ? 'published' : 'draft';

    db.prepare(
      `UPDATE education_events SET
        year = ?, sort_order = ?, title_ar = ?, title_en = ?,
        institution_ar = ?, institution_en = ?, desc_ar = ?, desc_en = ?,
        image_url = ?, status = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).run(
      year,
      Number(b.sortOrder ?? 1),
      String(b.title?.ar ?? ''),
      String(b.title?.en ?? ''),
      String(b.institution?.ar ?? ''),
      String(b.institution?.en ?? ''),
      String(b.description?.ar ?? ''),
      String(b.description?.en ?? ''),
      String(b.imageUrl ?? ''),
      status,
      req.params.id
    );
    recordActivity(req.admin!.id, req.admin!.username, 'EDUCATION_UPDATED', 'education', req.params.id, `${year}: ${b.title?.en || b.title?.ar}`, getClientIp(req));
    res.json(getEducationEvents(true));
  });

  app.delete('/api/admin/education/:id', (req: AdminRequest, res) => {
    db.prepare('DELETE FROM education_events WHERE id = ?').run(req.params.id);
    recordActivity(req.admin!.id, req.admin!.username, 'EDUCATION_DELETED', 'education', req.params.id, 'Removed education milestone.', getClientIp(req));
    res.json(getEducationEvents(true));
  });

  // Messages Hybrid View
  app.get('/api/admin/messages', (_req, res) => {
    res.json(getMessages());
  });

  app.patch('/api/admin/messages/:id', (req: AdminRequest, res) => {
    const { status } = req.body as { status?: 'unread' | 'read' | 'archived' };
    if (!status || !['unread', 'read', 'archived'].includes(status)) {
      res.status(400).json({ error: 'Invalid status.' });
      return;
    }
    db.prepare(
      `UPDATE contact_messages SET
        status = ?,
        read_at = CASE WHEN ? = 'read' AND read_at IS NULL THEN datetime('now') ELSE read_at END
       WHERE id = ?`
    ).run(status, status, req.params.id);
    recordActivity(req.admin!.id, req.admin!.username, 'MESSAGE_STATUS_CHANGED', 'message', req.params.id, `Marked as ${status}`, getClientIp(req));
    res.json(getMessages());
  });

  app.delete('/api/admin/messages/:id', (req: AdminRequest, res) => {
    db.prepare('DELETE FROM contact_messages WHERE id = ?').run(req.params.id);
    recordActivity(req.admin!.id, req.admin!.username, 'MESSAGE_DELETED', 'message', req.params.id, 'Deleted contact message.', getClientIp(req));
    res.json(getMessages());
  });

  // Media Library (Validated Safe Uploads)
  app.get('/api/admin/media', (_req, res) => {
    res.json(getMediaAssets());
  });

  app.post('/api/admin/media/upload', (req: AdminRequest, res) => {
    const { originalName, mimeType, base64Data, altText } = req.body as {
      originalName?: string;
      mimeType?: string;
      base64Data?: string;
      altText?: { ar?: string; en?: string };
    };

    if (!originalName || !mimeType || !base64Data) {
      res.status(400).json({ error: 'Missing file payload.' });
      return;
    }

    const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    const buffer = Buffer.from(cleanBase64, 'base64');
    const settings = getSettings();
    const maxBytes = (settings.maxUploadMb || 5) * 1024 * 1024;
    const check = validateImageBuffer(buffer, mimeType, maxBytes);

    if (!check.valid || !check.ext || !check.mime) {
      res.status(400).json({ error: check.reason || 'Invalid image file.' });
      return;
    }

    const id = crypto.randomUUID();
    const safeFilename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${check.ext}`;
    const dest = path.join(UPLOAD_FOLDER_PATH, safeFilename);
    fs.writeFileSync(dest, buffer);

    const url = `/uploads/${safeFilename}`;
    db.prepare(
      `INSERT INTO media_assets (id, filename, original_name, mime_type, size_bytes, url, alt_ar, alt_en)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      safeFilename,
      originalName.slice(0, 200),
      check.mime,
      buffer.length,
      url,
      String(altText?.ar ?? ''),
      String(altText?.en ?? '')
    );

    recordActivity(req.admin!.id, req.admin!.username, 'MEDIA_UPLOADED', 'media', id, safeFilename, getClientIp(req));
    res.status(201).json(getMediaAssets());
  });

  app.delete('/api/admin/media/:id', (req: AdminRequest, res) => {
    const row = db.prepare('SELECT filename FROM media_assets WHERE id = ?').get(req.params.id) as
      | { filename: string }
      | undefined;
    if (row) {
      const target = path.join(UPLOAD_FOLDER_PATH, path.basename(row.filename));
      if (fs.existsSync(target)) {
        fs.unlinkSync(target);
      }
      db.prepare('DELETE FROM media_assets WHERE id = ?').run(req.params.id);
      recordActivity(req.admin!.id, req.admin!.username, 'MEDIA_DELETED', 'media', req.params.id, row.filename, getClientIp(req));
    }
    res.json(getMediaAssets());
  });

  // Settings
  app.get('/api/admin/settings', (_req, res) => {
    res.json(getSettings());
  });

  app.put('/api/admin/settings', (req: AdminRequest, res) => {
    const saved = saveSettings(req.body);
    recordActivity(req.admin!.id, req.admin!.username, 'SETTINGS_UPDATED', 'settings', 'config', 'Updated system/SEO/theme/backup settings.', getClientIp(req));
    res.json(saved);
  });

  // Notifications
  app.get('/api/admin/notifications', (_req, res) => {
    res.json(getNotifications());
  });

  app.patch('/api/admin/notifications/:id/read', (_req, res) => {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(_req.params.id);
    res.json(getNotifications());
  });

  app.post('/api/admin/notifications/read-all', (_req, res) => {
    db.prepare('UPDATE notifications SET is_read = 1').run();
    res.json(getNotifications());
  });

  // Activity Log (immutable via API)
  app.get('/api/admin/activity', (_req, res) => {
    res.json(getActivityLogs(200));
  });

  // Backups & Restore
  app.get('/api/admin/backups', (_req, res) => {
    res.json(getBackups());
  });

  app.post('/api/admin/backups/create', (req: AdminRequest, res) => {
    const record = createDatabaseBackup('manual', req.admin!.username);
    recordActivity(req.admin!.id, req.admin!.username, 'BACKUP_CREATED', 'backup', record.id, record.filename, getClientIp(req));
    res.status(201).json(getBackups());
  });

  app.post('/api/admin/backups/:id/restore', (req: AdminRequest, res) => {
    const result = restoreDatabaseBackup(req.params.id);
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }
    recordActivity(req.admin!.id, req.admin!.username, 'BACKUP_RESTORED', 'backup', req.params.id, 'Restored database snapshot.', getClientIp(req));
    addNotification(
      'backup',
      'تمت استعادة نسخة احتياطية',
      'Database Backup Restored',
      `تمت استعادة البيانات بواسطة ${req.admin!.username}.`,
      `Database state restored by ${req.admin!.username}.`
    );
    res.json({ ok: true });
  });

  app.delete('/api/admin/backups/:id', (req: AdminRequest, res) => {
    const row = db.prepare('SELECT filename FROM backups WHERE id = ?').get(req.params.id) as
      | { filename: string }
      | undefined;
    if (row) {
      const target = path.join(BACKUP_FOLDER_PATH, path.basename(row.filename));
      if (fs.existsSync(target)) fs.unlinkSync(target);
      db.prepare('DELETE FROM backups WHERE id = ?').run(req.params.id);
      recordActivity(req.admin!.id, req.admin!.username, 'BACKUP_DELETED', 'backup', req.params.id, row.filename, getClientIp(req));
    }
    res.json(getBackups());
  });

  // Account Security, 2FA, Recovery Codes & RBAC Admins
  app.get('/api/admin/account/security', (req: AdminRequest, res) => {
    const unusedCount = (
      db
        .prepare('SELECT COUNT(*) as c FROM admin_recovery_codes WHERE admin_id = ? AND used_at IS NULL')
        .get(req.admin!.id) as { c: number }
    ).c;
    res.json({
      totpEnabled: req.admin!.totpEnabled,
      unusedRecoveryCodes: unusedCount,
      admins: listAdmins()
    });
  });

  app.post('/api/admin/account/2fa/enroll', async (req: AdminRequest, res) => {
    const totp = generateTotpSetup(req.admin!.username);
    const qrDataUrl = await generateQrDataUrl(totp.otpauthUrl);
    res.json({ secret: totp.secret, qrDataUrl });
  });

  app.post('/api/admin/account/2fa/confirm', (req: AdminRequest, res) => {
    const { secret, code } = req.body as { secret?: string; code?: string };
    if (!secret || !code || !verifyTotpToken(secret, code)) {
      res.status(400).json({ error: 'Invalid TOTP verification code.' });
      return;
    }
    db.prepare("UPDATE admins SET totp_secret = ?, totp_enabled = 1, updated_at = datetime('now') WHERE id = ?").run(
      secret,
      req.admin!.id
    );
    recordActivity(req.admin!.id, req.admin!.username, '2FA_REENROLLED', 'admin', req.admin!.id, 'Updated authenticator 2FA secret.', getClientIp(req));
    res.json({ ok: true });
  });

  app.post('/api/admin/account/recovery-codes/regenerate', async (req: AdminRequest, res) => {
    const recoveryCodes = generateRecoveryCodes(10);
    db.exec('BEGIN TRANSACTION;');
    try {
      db.prepare('DELETE FROM admin_recovery_codes WHERE admin_id = ?').run(req.admin!.id);
      const ins = db.prepare('INSERT INTO admin_recovery_codes (id, admin_id, code_hash) VALUES (?, ?, ?)');
      for (const code of recoveryCodes) {
        ins.run(crypto.randomUUID(), req.admin!.id, await hashRecoveryCode(code));
      }
      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      res.status(500).json({ error: err instanceof Error ? err.message : 'Regeneration failed.' });
      return;
    }
    recordActivity(req.admin!.id, req.admin!.username, 'RECOVERY_CODES_REGENERATED', 'admin', req.admin!.id, 'Generated 10 fresh single-use recovery codes.', getClientIp(req));
    res.json({ recoveryCodes });
  });

  app.post('/api/admin/account/password', async (req: AdminRequest, res) => {
    const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
    if (!currentPassword || !newPassword || newPassword.length < 8) {
      res.status(400).json({ error: 'Current password and an 8+ char new password are required.' });
      return;
    }
    const row = db.prepare('SELECT password_hash FROM admins WHERE id = ?').get(req.admin!.id) as {
      password_hash: string;
    };
    if (!(await verifyPassword(currentPassword, row.password_hash))) {
      res.status(401).json({ error: 'Current password is incorrect.' });
      return;
    }
    db.prepare("UPDATE admins SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").run(
      await hashPassword(newPassword),
      req.admin!.id
    );
    recordActivity(req.admin!.id, req.admin!.username, 'PASSWORD_CHANGED', 'admin', req.admin!.id, 'Updated administrator password.', getClientIp(req));
    res.json({ ok: true });
  });

  app.post('/api/admin/account/admins', async (req: AdminRequest, res) => {
    if (req.admin!.role !== 'super_admin') {
      res.status(403).json({ error: 'Only super_admin can provision additional administrators.' });
      return;
    }
    const { username, email, password, role } = req.body as {
      username?: string;
      email?: string;
      password?: string;
      role?: 'super_admin' | 'editor';
    };
    if (!username || username.trim().length < 3 || !email || !password || password.length < 8) {
      res.status(400).json({ error: 'Valid username, email, and 8+ char password required.' });
      return;
    }
    const id = crypto.randomUUID();
    const safeRole = role === 'editor' ? 'editor' : 'super_admin';
    try {
      db.prepare(
        'INSERT INTO admins (id, username, email, password_hash, role, totp_enabled) VALUES (?, ?, ?, ?, ?, 0)'
      ).run(id, username.trim(), email.trim().toLowerCase(), await hashPassword(password), safeRole);
    } catch {
      res.status(409).json({ error: 'Username or email already exists.' });
      return;
    }
    recordActivity(req.admin!.id, req.admin!.username, 'ADMIN_CREATED', 'admin', id, `Created ${safeRole}: ${username.trim()}`, getClientIp(req));
    res.status(201).json(listAdmins());
  });

  // Catch-all for unknown API endpoints
  app.all('/api/*', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  // Scheduled automated backups (checks hourly against configured schedule)
  setInterval(() => {
    try {
      const settings = getSettings();
      if (settings.backupSchedule === 'manual') return;
      const backups = getBackups();
      const latest = backups[0];
      const intervalMs =
        settings.backupSchedule === 'weekly' ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      const lastMs = latest ? Date.parse(latest.createdAt) : 0;
      if (!lastMs || Date.now() - lastMs >= intervalMs) {
        createDatabaseBackup(settings.backupSchedule, 'scheduler');
      }
    } catch {
      // ignore scheduler error so server never crashes
    }
  }, 60 * 60 * 1000);

  // ==================== VITE DEV / STATIC PROD ====================
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (req, res) => {
      const knownPublic =
        req.path === '/' ||
        req.path === '/about' ||
        req.path === '/projects' ||
        req.path.startsWith('/projects/') ||
        req.path === '/contact' ||
        req.path === '/admin' ||
        req.path.startsWith('/admin/');
      if (!knownPublic) {
        res.status(404);
      }
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`THE CODEFATHER server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
