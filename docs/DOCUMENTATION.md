# THE CODEFATHER — Platform Documentation

## 1. Project Overview
**THE CODEFATHER** (`THINK • CODE • CREATE`) is a full-stack bilingual (Arabic RTL & English LTR) personal portfolio platform with an integrated CMS, dynamic 20-theme engine, Black & Gold Education Timeline (2006–2026), and hardened 2FA Admin Dashboard.

## 2. Technology Stack
- **Frontend**: React 19, TypeScript, React Router, Tailwind CSS v4, Motion (`motion/react`), Lucide Icons.
- **Backend**: Node.js 22, Express 4, Helmet, cookie-parser, bcryptjs, otpauth (RFC 6238 TOTP), qrcode.
- **Database**: Normalized relational SQL schema (`database/mysql_schema.sql` for MySQL 8.0 production; embedded `node:sqlite` engine in `server/db.ts` for zero-config execution).

## 3. Installation & Environment Configuration
```bash
npm install
cp .env.example .env
# Set SESSION_SECRET and APP_URL (plus MYSQL_* variables for MySQL production)
npm run dev
```

## 4. Database Setup, ERD & Migrations
- See `database/ERD.md` for the full Mermaid Entity Relationship Diagram and table specifications.
- Apply `database/mysql_schema.sql` on MySQL 8.0 (`mysql -u root -p < database/mysql_schema.sql`).
- Embedded SQL migrations execute automatically on server startup via `runMigrations()` in `server/db.ts`.

## 5. Initial Administrator Setup & 2FA
1. Navigate directly to `/admin/login`.
2. When no administrator exists yet, the **Secure First-Admin Setup Wizard** is shown (no hardcoded default password exists).
3. Enter username, email, and password (minimum 8 characters).
4. Scan the generated QR code with any TOTP authenticator app (Google Authenticator, Authy, 1Password) and safely store the **10 single-use Recovery Codes**.
5. Once the first administrator is created, `/api/admin/auth/setup` permanently locks (`HTTP 403`).

## 6. Theme Management (20 Official Themes)
- Defined in `src/utils/themes.ts` with exact official HEX palettes (`Dark Techn` default).
- Theme switches apply instantly via CSS custom properties and persist in `localStorage`.
- Admin Dashboard appearance mode (`Dark` Black/Gold vs `Light` White/Gold) operates independently from the public theme.

## 7. Arabic / English Content & Publishing Workflows
- Public site defaults to Arabic (`dir="rtl"`) and switches seamlessly to English (`dir="ltr"`) while preserving the active route.
- **Draft vs Instant Publish**: Projects and Education events saved as `draft` are strictly filtered out of public endpoints (`/api/public/*`).
- **Draft Preview**: Administrators can inspect drafts inside the real public layout via `/?preview=1` (authenticated by session cookie).

## 8. Media Uploads, Backups & Restore
- Media uploads verify image magic bytes (`PNG`, `JPEG`, `WebP`) and size limits before writing to `public/uploads/`.
- Manual and scheduled (`daily` / `weekly`) backups are saved to `/backups/` (never exposed publicly), checksummed with SHA-256, pruned by retention policy, and restorable via transaction.

## 9. Testing & Production Deployment
- Run unit tests: `npx --yes tsx --test src/utils/themeEngine.test.ts src/utils/i18n.test.ts server/security.test.ts`
- Build & run production:
  ```bash
  npm run build
  NODE_ENV=production npm start
  ```
