import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type {
  ActivityLogItem,
  AdminUser,
  BackupRecord,
  ContactMessage,
  EducationEvent,
  MediaAsset,
  MessageStatus,
  NotificationItem,
  ProjectItem,
  PublicBootstrapPayload,
  SiteProfile,
  SiteSettings,
  SkillCategory,
  SkillItem
} from '../src/types/cms.ts';
import { sha256Hex } from './security.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const BACKUPS_DIR = path.resolve(process.cwd(), 'backups');
const UPLOADS_DIR = path.resolve(process.cwd(), 'public', 'uploads');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(BACKUPS_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

export const DB_FILE_PATH = path.join(DATA_DIR, 'codefather.db');
export const BACKUP_FOLDER_PATH = BACKUPS_DIR;
export const UPLOAD_FOLDER_PATH = UPLOADS_DIR;

export const db = new DatabaseSync(DB_FILE_PATH);
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

export function runMigrations(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'super_admin' CHECK (role IN ('super_admin', 'editor')),
      totp_secret TEXT,
      totp_enabled INTEGER NOT NULL DEFAULT 0,
      last_login_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS admin_sessions (
      id TEXT PRIMARY KEY,
      admin_id TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      csrf_token TEXT NOT NULL,
      ip_address TEXT NOT NULL DEFAULT '',
      user_agent TEXT NOT NULL DEFAULT '',
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS admin_recovery_codes (
      id TEXT PRIMARY KEY,
      admin_id TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      used_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS site_profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      name_ar TEXT NOT NULL,
      name_en TEXT NOT NULL,
      role_ar TEXT NOT NULL,
      role_en TEXT NOT NULL,
      intro_ar TEXT NOT NULL,
      intro_en TEXT NOT NULL,
      about_ar_json TEXT NOT NULL,
      about_en_json TEXT NOT NULL,
      email TEXT NOT NULL,
      location_ar TEXT NOT NULL DEFAULT '',
      location_en TEXT NOT NULL DEFAULT '',
      availability_ar TEXT NOT NULL DEFAULT '',
      availability_en TEXT NOT NULL DEFAULT '',
      github_url TEXT NOT NULL DEFAULT '',
      linkedin_url TEXT NOT NULL DEFAULT '',
      x_url TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS skill_categories (
      id TEXT PRIMARY KEY,
      name_ar TEXT NOT NULL,
      name_en TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS skills (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      level INTEGER NOT NULL DEFAULT 75,
      desc_ar TEXT NOT NULL DEFAULT '',
      desc_en TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES skill_categories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      title_ar TEXT NOT NULL,
      title_en TEXT NOT NULL,
      short_ar TEXT NOT NULL,
      short_en TEXT NOT NULL,
      full_ar TEXT NOT NULL,
      full_en TEXT NOT NULL,
      category_ar TEXT NOT NULL,
      category_en TEXT NOT NULL,
      technologies_json TEXT NOT NULL,
      year INTEGER NOT NULL,
      image_url TEXT NOT NULL DEFAULT '',
      gallery_json TEXT NOT NULL DEFAULT '[]',
      live_url TEXT NOT NULL DEFAULT '',
      source_url TEXT NOT NULL DEFAULT '',
      featured INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
      sort_order INTEGER NOT NULL DEFAULT 0,
      published_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS education_events (
      id TEXT PRIMARY KEY,
      year INTEGER NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 1,
      title_ar TEXT NOT NULL,
      title_en TEXT NOT NULL,
      institution_ar TEXT NOT NULL DEFAULT '',
      institution_en TEXT NOT NULL DEFAULT '',
      desc_ar TEXT NOT NULL,
      desc_en TEXT NOT NULL,
      image_url TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
      ip_address TEXT NOT NULL DEFAULT '',
      read_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS media_assets (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      url TEXT NOT NULL,
      alt_ar TEXT NOT NULL DEFAULT '',
      alt_en TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      setting_key TEXT PRIMARY KEY,
      setting_value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK (type IN ('message', 'publish', 'backup', 'security', 'system')),
      title_ar TEXT NOT NULL,
      title_en TEXT NOT NULL,
      body_ar TEXT NOT NULL,
      body_en TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      admin_id TEXT,
      admin_username TEXT NOT NULL,
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT NOT NULL DEFAULT '',
      details TEXT NOT NULL,
      ip_address TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS backups (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      trigger_type TEXT NOT NULL CHECK (trigger_type IN ('manual', 'daily', 'weekly')),
      status TEXT NOT NULL CHECK (status IN ('completed', 'failed')),
      size_bytes INTEGER NOT NULL DEFAULT 0,
      sha256 TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status, featured, sort_order);
    CREATE INDEX IF NOT EXISTS idx_edu_status ON education_events(status, year, sort_order);
    CREATE INDEX IF NOT EXISTS idx_msg_status ON contact_messages(status, created_at);
    CREATE INDEX IF NOT EXISTS idx_act_created ON activity_logs(created_at);
  `);

  db.prepare('INSERT OR IGNORE INTO schema_migrations (version) VALUES (?)').run('2026_11_18_001_v5_init');
}

const DEFAULT_SETTINGS: SiteSettings = {
  defaultTheme: 'dark-techn',
  defaultLanguage: 'ar',
  dashboardDefaultMode: 'dark',
  siteTitle: { ar: 'THE CODEFATHER', en: 'THE CODEFATHER' },
  tagline: 'THINK • CODE • CREATE',
  seoTitle: {
    ar: 'THE CODEFATHER — THINK • CODE • CREATE',
    en: 'THE CODEFATHER — THINK • CODE • CREATE'
  },
  seoDescription: {
    ar: 'بوابة أعمال وهندسة برمجيات متكاملة تحت هوية THE CODEFATHER — مشاريع، مسار دراسي، ونظام إدارة محتوى.',
    en: 'Personal software engineering portfolio and integrated CMS under THE CODEFATHER identity.'
  },
  ogImage: '/assets/aistudio/og-banner_5b1263c1.jpg',
  canonicalBaseUrl: 'http://localhost:3000',
  contactEmailEnabled: true,
  contactNotificationEmail: 'alyaman.alnokare99@gmail.com',
  notifyOnMessage: true,
  notifyOnPublish: true,
  notifyOnBackup: true,
  notifyOnSecurity: true,
  backupSchedule: 'daily',
  backupRetentionDays: 30,
  maxUploadMb: 5
};

export function seedInitialData(): void {
  const existingProfile = db.prepare('SELECT id FROM site_profile WHERE id = 1').get();
  if (!existingProfile) {
    db.prepare(`
      INSERT INTO site_profile (
        id, name_ar, name_en, role_ar, role_en, intro_ar, intro_en,
        about_ar_json, about_en_json, email, location_ar, location_en,
        availability_ar, availability_en, github_url, linkedin_url, x_url
      ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'اليمان',
      'Alyaman',
      'مهندس برمجيات ومصمّم أنظمة رقمية',
      'Software Engineer & Digital Systems Architect',
      'أصمّم وأبني أنظمة ويب متكاملة تجمع بين دقة الهندسة البرمجية ووضوح التجربة البصرية.',
      'I engineer full-stack web systems that unite structural code discipline with crisp visual clarity.',
      JSON.stringify([
        'أعمل في تطوير تطبيقات الويب، قواعد البيانات العلائقية، والأنظمة التفاعلية ثنائية اللغة.',
        'أؤمن بأن البساطة الحقيقية تنبع من بنية برمجية متينة وتفاصيل تصميمية مدروسة بعناية.'
      ]),
      JSON.stringify([
        'I focus on full-stack web applications, relational database architecture, and bilingual interactive interfaces.',
        'I believe lasting simplicity comes from disciplined backend architecture paired with deliberate interface craft.'
      ]),
      'alyaman.alnokare99@gmail.com',
      'دمشق / عن بُعد',
      'Remote / Global',
      'متاح للمشاريع المختارة والاستشارات التقنية',
      'Available for select engineering builds & architecture consulting',
      'https://github.com',
      'https://linkedin.com',
      'https://x.com'
    );
  }

  const catCount = (db.prepare('SELECT COUNT(*) as c FROM skill_categories').get() as { c: number }).c;
  if (catCount === 0) {
    const insertCat = db.prepare('INSERT INTO skill_categories (id, name_ar, name_en, sort_order) VALUES (?, ?, ?, ?)');
    const insertSkill = db.prepare('INSERT INTO skills (id, category_id, name, code, level, desc_ar, desc_en, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

    insertCat.run('cat-lang', 'لغات البرمجة', 'Programming Languages', 1);
    insertCat.run('cat-web', 'تطوير الويب والواجهات', 'Web & Interface Engineering', 2);
    insertCat.run('cat-data', 'قواعد البيانات والبنية التحتية', 'Databases & Infrastructure', 3);

    insertSkill.run('sk-java', 'cat-lang', 'Java', 'JV', 88, 'تطبيقات المؤسسات والأنظمة الموزعة', 'Enterprise systems & OOP architecture', 1);
    insertSkill.run('sk-ts', 'cat-lang', 'TypeScript / JS', 'TS', 86, 'تطبيقات الويب المتقدمة والواجهات التفاعلية', 'Type-safe full-stack web engineering', 2);
    insertSkill.run('sk-py', 'cat-lang', 'Python', 'PY', 78, 'الأتمتة، السكربتات، وتحليل البيانات', 'Automation, scripting & data pipelines', 3);

    insertSkill.run('sk-react', 'cat-web', 'React & Next.js', 'RX', 85, 'بناء واجهات سريعة وتجارب RTL/LTR كاملة', 'High-craft interfaces with full RTL/LTR support', 1);
    insertSkill.run('sk-css', 'cat-web', 'HTML5 & Tailwind', 'TW', 92, 'أنظمة تصميم مرنة وعالية التباين', 'Responsive design systems & accessibility', 2);
    insertSkill.run('sk-node', 'cat-web', 'Node.js & Express', 'ND', 84, 'واجهات API آمنة وإدارة الجلسات', 'Secure REST APIs, auth & session control', 3);

    insertSkill.run('sk-mysql', 'cat-data', 'MySQL & SQL', 'SQ', 86, 'نمذجة الجداول، الفهارس، والنسخ الاحتياطي', 'Relational modeling, indexing & backups', 1);
    insertSkill.run('sk-git', 'cat-data', 'Git & Linux', 'GT', 82, 'إدارة الإصدارات والنشر الإنتاجي', 'Version control, CI & production deployment', 2);
  }

  const projCount = (db.prepare('SELECT COUNT(*) as c FROM projects').get() as { c: number }).c;
  if (projCount === 0) {
    const insProj = db.prepare(`
      INSERT INTO projects (
        id, code, title_ar, title_en, short_ar, short_en, full_ar, full_en,
        category_ar, category_en, technologies_json, year, image_url, gallery_json,
        live_url, source_url, featured, status, sort_order, published_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    insProj.run(
      'codefather-cms',
      'CF',
      'منصة THE CODEFATHER المتكاملة',
      'THE CODEFATHER Core Platform',
      'منصة شخصية متكاملة تضم ٢٠ ثيماً رسمياً، لوحة تحكم آمنة، ونظام نشر ثنائي اللغة.',
      'A complete bilingual portfolio & CMS with 20 official themes, 2FA dashboard, and draft/publish control.',
      'تم تطوير منصة THE CODEFATHER لتكون بيئة رقمية متكاملة تجمع بين واجهة عرض متجاوبة تدعم ٢٠ ثيماً معتمداً واللغتين العربية والإنجليزية (RTL/LTR)، وبين لوحة تحكم محمية بمصادقة ثنائية TOTP ورموز استرداد ونظام نسخ احتياطي وسجل نشاط دقيق.',
      'THE CODEFATHER was engineered as an integrated digital platform uniting a responsive 20-theme public showcase (full Arabic RTL & English LTR) with a hardened admin dashboard featuring TOTP 2FA, one-time recovery codes, draft/publish previews, and automated database backups.',
      'ويب وأنظمة',
      'Web Systems',
      JSON.stringify(['React 19', 'TypeScript', 'Node.js', 'Express', 'SQL', 'Tailwind CSS']),
      2026,
      '/src/assets/images/project_codefather_platform_1795014445653.jpg',
      JSON.stringify(['/assets/aistudio/og-banner_5b1263c1.jpg']),
      'https://github.com',
      'https://github.com',
      1,
      'published',
      1
    );

    insProj.run(
      'task-orchestrator',
      'TO',
      'منسّق المهام والعمليات',
      'Task & Sprint Orchestrator',
      'نظام لإدارة تدفق المهام البرمجية وتتبع الأداء اليومي مع تقارير لحظية.',
      'A streamlined engineering workflow orchestrator with sprint velocity tracking and modular views.',
      'تطبيق ويب يركّز على الوضوح والسرعة في إدارة المهام الهندسية، مع فلاتر فورية ولوحة قياس مبنية بأرقام جدولية دقيقة وحالة حفظ فورية في قاعدة البيانات.',
      'An engineering task orchestrator focused on clarity and execution velocity, featuring instant filtering, tabular telemetry figures, and persistent relational storage.',
      'تطبيقات الإنتاجية',
      'Productivity Apps',
      JSON.stringify(['TypeScript', 'React', 'MySQL', 'REST API']),
      2025,
      '/src/assets/images/project_task_orchestrator_1795014446456.jpg',
      JSON.stringify([]),
      'https://github.com',
      'https://github.com',
      1,
      'published',
      2
    );

    insProj.run(
      'java-inventory-core',
      'IC',
      'نواة إدارة المخزون بجافا',
      'Java Enterprise Inventory Core',
      'نظام مؤسسي لإدارة المستودعات وتتبع حركة الأصناف وتوليد تقارير التدقيق.',
      'An enterprise warehouse & inventory core with audit trails, transactional stock movements, and SQL reporting.',
      'منظومة برمجية مبنية بلغة Java وقاعدة بيانات MySQL تضمن سلامة المعاملات المخزنية عبر قيود علائقية صارمة وسجل تدقيق غير قابل للتلاعب.',
      'Built in Java backed by MySQL, ensuring transactional stock integrity through strict relational constraints, multi-warehouse indexing, and immutable movement ledgers.',
      'الأنظمة الخلفية',
      'Backend Systems',
      JSON.stringify(['Java', 'MySQL', 'JDBC', 'Architecture']),
      2024,
      '/src/assets/images/project_inventory_core_1795014449705.jpg',
      JSON.stringify([]),
      '',
      'https://github.com',
      1,
      'published',
      3
    );

    db.prepare(`
      INSERT INTO projects (
        id, code, title_ar, title_en, short_ar, short_en, full_ar, full_en,
        category_ar, category_en, technologies_json, year, image_url, gallery_json,
        live_url, source_url, featured, status, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)
    `).run(
      'cloud-telemetry-draft',
      'CT',
      'مراقب الأنظمة السحابية (مسودة)',
      'Cloud Telemetry Console (Draft)',
      'مشروع قيد التطوير لا يظهر للعامة حتى يتم نشره من لوحة التحكم.',
      'Work-in-progress telemetry console hidden from public APIs until explicitly published.',
      'هذه مسودة توضح آلية فصل المسودات في قاعدة البيانات، بحيث لا تظهر في الواجهة العامة إلا بعد النشر الصريح أو عبر وضع المعاينة الإدارية.',
      'This draft entry demonstrates strict server-side draft isolation: it never appears on public pages until published or viewed through authenticated Admin Preview.',
      'الأنظمة الخلفية',
      'Backend Systems',
      JSON.stringify(['Node.js', 'MySQL', 'Docker']),
      2026,
      '',
      JSON.stringify([]),
      '',
      '',
      0,
      4
    );
  }

  const eduCount = (db.prepare('SELECT COUNT(*) as c FROM education_events').get() as { c: number }).c;
  if (eduCount === 0) {
    const insEdu = db.prepare(`
      INSERT INTO education_events (
        id, year, sort_order, title_ar, title_en, institution_ar, institution_en,
        desc_ar, desc_en, image_url, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published')
    `);

    insEdu.run(
      'edu-2006',
      2006,
      1,
      'الخطوة الأولى في عالم الحاسوب',
      'First Steps in Computing',
      'البدايات التأسيسية',
      'Foundational Years',
      'التعرّف المبكر على مبادئ الحاسوب وأنظمة التشغيل، وبداية الشغف باستكشاف كيفية عمل البرمجيات.',
      'Early exploration of computer fundamentals and operating systems, sparking curiosity in how software works under the hood.',
      '',
    );

    insEdu.run(
      'edu-2014-a',
      2014,
      1,
      'بداية كتابة الأكواد البرمجية',
      'Writing First Production Code',
      'مختبر البرمجة والتطبيق',
      'Programming & Logic Lab',
      'الانتقال من الاستخدام إلى البناء الفعلي عبر تعلّم أساسيات الخوارزميات وهياكل البيانات ولغة Java.',
      'Transitioned from user to builder by mastering algorithms, structured logic, and core Java programming.',
      '/src/assets/images/education_milestone_coding_1795014449115.jpg',
    );

    insEdu.run(
      'edu-2014-b',
      2014,
      2,
      'تأسيس هندسة قواعد البيانات العلائقية',
      'Relational Database Foundations',
      'مسار قواعد البيانات',
      'Data Architecture Track',
      'إتقان تصميم المخططات العلائقية ERD وكتابة استعلامات SQL المحسّنة وتطبيق قواعد التطبيع.',
      'Mastered relational schema modeling, ERD design, SQL query optimization, and database normalization.',
      '/assets/aistudio/og-banner_5b1263c1.jpg',
    );

    insEdu.run(
      'edu-2020',
      2020,
      1,
      'هندسة تطبيقات الويب الكاملة',
      'Full-Stack Web Architecture',
      'التخصّص الهندسي',
      'Engineering Specialization',
      'التركيز على تطوير واجهات الويب الحديثة وبناء الخوادم الآمنة وربطها بقواعد بيانات عالية الاعتمادية.',
      'Focused on modern interactive web interfaces, secure backend APIs, and resilient relational persistence.',
      '/src/assets/images/project_codefather_platform_1795014445653.jpg',
    );

    insEdu.run(
      'edu-2026',
      2026,
      1,
      'إطلاق الهوية التقنية THE CODEFATHER',
      'Launching THE CODEFATHER Brand',
      'الاستوديو الشخصي',
      'Independent Studio',
      'توحيد الخبرات البرمجية والتصميمية في علامة شخصية متكاملة قائمة على مبدأ THINK • CODE • CREATE.',
      'Unifying software architecture and visual craft under one flagship technology brand: THINK • CODE • CREATE.',
      '/src/assets/images/education_milestone_coding_1795014449115.jpg',
    );
  }

  const mediaCount = (db.prepare('SELECT COUNT(*) as c FROM media_assets').get() as { c: number }).c;
  if (mediaCount === 0) {
    const insMedia = db.prepare(`
      INSERT INTO media_assets (id, filename, original_name, mime_type, size_bytes, url, alt_ar, alt_en)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insMedia.run('med-logo', 'logo-mark_5d783479.png', 'logo-mark.png', 'image/png', 48200, '/assets/aistudio/logo-mark_5d783479.png', 'شعار THE CODEFATHER', 'THE CODEFATHER Emblem');
    insMedia.run('med-og', 'og-banner_5b1263c1.jpg', 'og-banner.jpg', 'image/jpeg', 142000, '/assets/aistudio/og-banner_5b1263c1.jpg', 'بانر العلامة الرسمي', 'Official Brand Banner');
    insMedia.run('med-p1', 'project_codefather_platform.jpg', 'project_codefather_platform.jpg', 'image/jpeg', 210000, '/src/assets/images/project_codefather_platform_1795014445653.jpg', 'معاينة منصة THE CODEFATHER', 'THE CODEFATHER Platform Preview');
    insMedia.run('med-p2', 'project_task_orchestrator.jpg', 'project_task_orchestrator.jpg', 'image/jpeg', 195000, '/src/assets/images/project_task_orchestrator_1795014446456.jpg', 'معاينة منسق المهام', 'Task Orchestrator Preview');
    insMedia.run('med-p3', 'project_inventory_core.jpg', 'project_inventory_core.jpg', 'image/jpeg', 205000, '/src/assets/images/project_inventory_core_1795014449705.jpg', 'معمارية نظام المخزون', 'Inventory Architecture Diagram');
    insMedia.run('med-edu', 'education_milestone_coding.jpg', 'education_milestone_coding.jpg', 'image/jpeg', 180000, '/src/assets/images/education_milestone_coding_1795014449115.jpg', 'مكتب الهندسة البرمجية', 'Engineering Desk Milestone');
  }

  const settingExists = db.prepare('SELECT setting_key FROM site_settings WHERE setting_key = ?').get('config');
  if (!settingExists) {
    db.prepare('INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?)').run(
      'config',
      JSON.stringify(DEFAULT_SETTINGS)
    );
  }

  const msgCount = (db.prepare('SELECT COUNT(*) as c FROM contact_messages').get() as { c: number }).c;
  if (msgCount === 0) {
    db.prepare(`
      INSERT INTO contact_messages (id, name, email, subject, message, status, ip_address)
      VALUES (?, ?, ?, ?, ?, 'unread', '127.0.0.1')
    `).run(
      crypto.randomUUID(),
      'سارة المنصور',
      'sara@horizon-tech.io',
      'استفسار حول بناء منصة ويب مخصصة',
      'مرحباً اليمان، أعجبني جداً مستوى الهندسة في THE CODEFATHER ونرغب بالتعاون لبناء نظام إدارة محتوى ثنائي اللغة لشركتنا.',
    );

    db.prepare(`
      INSERT INTO contact_messages (id, name, email, subject, message, status, ip_address, read_at)
      VALUES (?, ?, ?, ?, ?, 'read', '127.0.0.1', datetime('now'))
    `).run(
      crypto.randomUUID(),
      'Daniel Mercer',
      'd.mercer@nordiccloud.dev',
      'Architecture Consulting Inquiry',
      'Hello Alyaman, we reviewed your Java & MySQL inventory core work and would love to schedule a brief architecture review call next week.',
    );
  }

  const notifCount = (db.prepare('SELECT COUNT(*) as c FROM notifications').get() as { c: number }).c;
  if (notifCount === 0) {
    db.prepare(`
      INSERT INTO notifications (id, type, title_ar, title_en, body_ar, body_en, is_read)
      VALUES (?, 'system', ?, ?, ?, ?, 0)
    `).run(
      crypto.randomUUID(),
      'تمت تهيئة قاعدة البيانات والمنصة',
      'Platform & Database Initialized',
      'تم ترحيل الجداول وتجهيز بيئة THE CODEFATHER للعمل الإنتاجي.',
      'Database migrations applied and THE CODEFATHER CMS is ready for production.'
    );
  }
}

export function getSettings(): SiteSettings {
  const row = db.prepare('SELECT setting_value FROM site_settings WHERE setting_key = ?').get('config') as
    | { setting_value: string }
    | undefined;
  if (!row) return { ...DEFAULT_SETTINGS };
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(row.setting_value) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(next: Partial<SiteSettings>): SiteSettings {
  const merged = { ...getSettings(), ...next };
  db.prepare(`
    INSERT INTO site_settings (setting_key, setting_value, updated_at)
    VALUES ('config', ?, datetime('now'))
    ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value, updated_at = datetime('now')
  `).run(JSON.stringify(merged));
  return merged;
}

export function getProfile(): SiteProfile {
  const row = db.prepare('SELECT * FROM site_profile WHERE id = 1').get() as Record<string, unknown>;
  const aboutAr: string[] = JSON.parse(String(row.about_ar_json || '[]'));
  const aboutEn: string[] = JSON.parse(String(row.about_en_json || '[]'));
  const maxLen = Math.max(aboutAr.length, aboutEn.length);
  const aboutParagraphs = Array.from({ length: maxLen }, (_, idx) => ({
    ar: aboutAr[idx] ?? '',
    en: aboutEn[idx] ?? ''
  }));

  return {
    id: 1,
    name: { ar: String(row.name_ar), en: String(row.name_en) },
    role: { ar: String(row.role_ar), en: String(row.role_en) },
    intro: { ar: String(row.intro_ar), en: String(row.intro_en) },
    aboutParagraphs,
    email: String(row.email),
    location: { ar: String(row.location_ar || ''), en: String(row.location_en || '') },
    availability: { ar: String(row.availability_ar || ''), en: String(row.availability_en || '') },
    githubUrl: String(row.github_url || ''),
    linkedinUrl: String(row.linkedin_url || ''),
    xUrl: String(row.x_url || ''),
    updatedAt: String(row.updated_at)
  };
}

export function getSkillCategories(): SkillCategory[] {
  const rows = db.prepare('SELECT * FROM skill_categories ORDER BY sort_order ASC, created_at ASC').all() as Array<Record<string, unknown>>;
  return rows.map((r) => ({
    id: String(r.id),
    name: { ar: String(r.name_ar), en: String(r.name_en) },
    sortOrder: Number(r.sort_order)
  }));
}

export function getSkills(): SkillItem[] {
  const rows = db.prepare('SELECT * FROM skills ORDER BY sort_order ASC, created_at ASC').all() as Array<Record<string, unknown>>;
  return rows.map((r) => ({
    id: String(r.id),
    categoryId: String(r.category_id),
    name: String(r.name),
    code: String(r.code),
    level: Number(r.level),
    description: { ar: String(r.desc_ar), en: String(r.desc_en) },
    sortOrder: Number(r.sort_order)
  }));
}

function mapProjectRow(r: Record<string, unknown>): ProjectItem {
  return {
    id: String(r.id),
    code: String(r.code),
    title: { ar: String(r.title_ar), en: String(r.title_en) },
    shortDescription: { ar: String(r.short_ar), en: String(r.short_en) },
    fullDescription: { ar: String(r.full_ar), en: String(r.full_en) },
    category: { ar: String(r.category_ar), en: String(r.category_en) },
    technologies: JSON.parse(String(r.technologies_json || '[]')),
    year: Number(r.year),
    imageUrl: String(r.image_url || ''),
    gallery: JSON.parse(String(r.gallery_json || '[]')),
    liveUrl: String(r.live_url || ''),
    sourceUrl: String(r.source_url || ''),
    featured: Boolean(r.featured),
    status: r.status === 'published' ? 'published' : 'draft',
    sortOrder: Number(r.sort_order),
    publishedAt: r.published_at ? String(r.published_at) : null,
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at)
  };
}

export function getProjects(includeDrafts: boolean): ProjectItem[] {
  const sql = includeDrafts
    ? 'SELECT * FROM projects ORDER BY sort_order ASC, year DESC, created_at DESC'
    : "SELECT * FROM projects WHERE status = 'published' ORDER BY sort_order ASC, year DESC, created_at DESC";
  const rows = db.prepare(sql).all() as Array<Record<string, unknown>>;
  return rows.map(mapProjectRow);
}

export function getProjectById(id: string, includeDrafts: boolean): ProjectItem | null {
  const sql = includeDrafts
    ? 'SELECT * FROM projects WHERE id = ?'
    : "SELECT * FROM projects WHERE id = ? AND status = 'published'";
  const row = db.prepare(sql).get(id) as Record<string, unknown> | undefined;
  return row ? mapProjectRow(row) : null;
}

function mapEducationRow(r: Record<string, unknown>): EducationEvent {
  return {
    id: String(r.id),
    year: Number(r.year),
    sortOrder: Number(r.sort_order),
    title: { ar: String(r.title_ar), en: String(r.title_en) },
    institution: { ar: String(r.institution_ar || ''), en: String(r.institution_en || '') },
    description: { ar: String(r.desc_ar), en: String(r.desc_en) },
    imageUrl: String(r.image_url || ''),
    status: r.status === 'published' ? 'published' : 'draft',
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at)
  };
}

export function getEducationEvents(includeDrafts: boolean): EducationEvent[] {
  const sql = includeDrafts
    ? 'SELECT * FROM education_events ORDER BY year ASC, sort_order ASC'
    : "SELECT * FROM education_events WHERE status = 'published' ORDER BY year ASC, sort_order ASC";
  const rows = db.prepare(sql).all() as Array<Record<string, unknown>>;
  return rows.map(mapEducationRow);
}

export function getPublicBootstrap(includeDrafts = false): PublicBootstrapPayload {
  const settings = getSettings();
  return {
    profile: getProfile(),
    skillCategories: getSkillCategories(),
    skills: getSkills(),
    projects: getProjects(includeDrafts),
    education: getEducationEvents(includeDrafts),
    settings: {
      defaultTheme: settings.defaultTheme,
      defaultLanguage: settings.defaultLanguage,
      siteTitle: settings.siteTitle,
      tagline: settings.tagline,
      seoTitle: settings.seoTitle,
      seoDescription: settings.seoDescription,
      ogImage: settings.ogImage,
      canonicalBaseUrl: settings.canonicalBaseUrl
    },
    isPreview: includeDrafts
  };
}

export function getMessages(): ContactMessage[] {
  const rows = db.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC').all() as Array<Record<string, unknown>>;
  return rows.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    email: String(r.email),
    subject: String(r.subject),
    message: String(r.message),
    status: r.status as MessageStatus,
    ipAddress: String(r.ip_address || ''),
    createdAt: String(r.created_at),
    readAt: r.read_at ? String(r.read_at) : null
  }));
}

export function getMediaAssets(): MediaAsset[] {
  const rows = db.prepare('SELECT * FROM media_assets ORDER BY created_at DESC').all() as Array<Record<string, unknown>>;
  return rows.map((r) => ({
    id: String(r.id),
    filename: String(r.filename),
    originalName: String(r.original_name),
    mimeType: String(r.mime_type),
    sizeBytes: Number(r.size_bytes),
    url: String(r.url),
    altText: { ar: String(r.alt_ar || ''), en: String(r.alt_en || '') },
    createdAt: String(r.created_at)
  }));
}

export function getNotifications(): NotificationItem[] {
  const rows = db.prepare('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50').all() as Array<Record<string, unknown>>;
  return rows.map((r) => ({
    id: String(r.id),
    type: r.type as NotificationItem['type'],
    title: { ar: String(r.title_ar), en: String(r.title_en) },
    body: { ar: String(r.body_ar), en: String(r.body_en) },
    isRead: Boolean(r.is_read),
    createdAt: String(r.created_at)
  }));
}

export function addNotification(
  type: NotificationItem['type'],
  titleAr: string,
  titleEn: string,
  bodyAr: string,
  bodyEn: string
): void {
  const settings = getSettings();
  if (type === 'message' && !settings.notifyOnMessage) return;
  if (type === 'publish' && !settings.notifyOnPublish) return;
  if (type === 'backup' && !settings.notifyOnBackup) return;
  if (type === 'security' && !settings.notifyOnSecurity) return;

  db.prepare(`
    INSERT INTO notifications (id, type, title_ar, title_en, body_ar, body_en, is_read)
    VALUES (?, ?, ?, ?, ?, ?, 0)
  `).run(crypto.randomUUID(), type, titleAr, titleEn, bodyAr, bodyEn);
}

export function getActivityLogs(limit = 150): ActivityLogItem[] {
  const rows = db.prepare('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT ?').all(limit) as Array<Record<string, unknown>>;
  return rows.map((r) => ({
    id: String(r.id),
    adminId: r.admin_id ? String(r.admin_id) : null,
    adminUsername: String(r.admin_username),
    action: String(r.action),
    resourceType: String(r.resource_type),
    resourceId: String(r.resource_id || ''),
    details: String(r.details || ''),
    ipAddress: String(r.ip_address || ''),
    createdAt: String(r.created_at)
  }));
}

export function recordActivity(
  adminId: string | null,
  adminUsername: string,
  action: string,
  resourceType: string,
  resourceId: string,
  details: string,
  ipAddress = ''
): void {
  db.prepare(`
    INSERT INTO activity_logs (id, admin_id, admin_username, action, resource_type, resource_id, details, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(crypto.randomUUID(), adminId, adminUsername, action, resourceType, resourceId, details, ipAddress);
}

export function listAdmins(): AdminUser[] {
  const rows = db.prepare('SELECT id, username, email, role, totp_enabled, created_at, last_login_at FROM admins ORDER BY created_at ASC').all() as Array<Record<string, unknown>>;
  return rows.map((r) => ({
    id: String(r.id),
    username: String(r.username),
    email: String(r.email),
    role: r.role === 'editor' ? 'editor' : 'super_admin',
    totpEnabled: Boolean(r.totp_enabled),
    createdAt: String(r.created_at),
    lastLoginAt: r.last_login_at ? String(r.last_login_at) : null
  }));
}

export function getBackups(): BackupRecord[] {
  const rows = db.prepare('SELECT * FROM backups ORDER BY created_at DESC').all() as Array<Record<string, unknown>>;
  return rows.map((r) => ({
    id: String(r.id),
    filename: String(r.filename),
    triggerType: r.trigger_type as BackupRecord['triggerType'],
    status: r.status as BackupRecord['status'],
    sizeBytes: Number(r.size_bytes),
    sha256: String(r.sha256),
    createdBy: String(r.created_by),
    createdAt: String(r.created_at)
  }));
}

export function createDatabaseBackup(
  triggerType: 'manual' | 'daily' | 'weekly',
  createdBy: string
): BackupRecord {
  const id = crypto.randomUUID();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `codefather-backup-${triggerType}-${stamp}.json`;
  const filePath = path.join(BACKUPS_DIR, filename);

  const snapshot = {
    version: 'v5',
    createdAt: new Date().toISOString(),
    triggerType,
    tables: {
      site_profile: db.prepare('SELECT * FROM site_profile').all(),
      skill_categories: db.prepare('SELECT * FROM skill_categories').all(),
      skills: db.prepare('SELECT * FROM skills').all(),
      projects: db.prepare('SELECT * FROM projects').all(),
      education_events: db.prepare('SELECT * FROM education_events').all(),
      contact_messages: db.prepare('SELECT * FROM contact_messages').all(),
      media_assets: db.prepare('SELECT * FROM media_assets').all(),
      site_settings: db.prepare('SELECT * FROM site_settings').all()
    }
  };

  const payload = JSON.stringify(snapshot, null, 2);
  fs.writeFileSync(filePath, payload, 'utf8');
  const sizeBytes = Buffer.byteLength(payload, 'utf8');
  const hash = sha256Hex(payload);

  db.prepare(`
    INSERT INTO backups (id, filename, trigger_type, status, size_bytes, sha256, created_by)
    VALUES (?, ?, ?, 'completed', ?, ?, ?)
  `).run(id, filename, triggerType, sizeBytes, hash, createdBy);

  pruneOldBackups();

  addNotification(
    'backup',
    'اكتمل النسخ الاحتياطي',
    'Database Backup Completed',
    `تم إنشاء نسخة احتياطية (${triggerType}) بنجاح والتحقق من بصمة SHA-256.`,
    `A ${triggerType} database backup was created and SHA-256 verified.`
  );

  return {
    id,
    filename,
    triggerType,
    status: 'completed',
    sizeBytes,
    sha256: hash,
    createdBy,
    createdAt: new Date().toISOString()
  };
}

export function pruneOldBackups(): void {
  const settings = getSettings();
  const retentionDays = Math.max(1, settings.backupRetentionDays || 30);
  const cutoffMs = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  const rows = getBackups();
  for (const b of rows) {
    const createdMs = Date.parse(b.createdAt);
    if (!Number.isNaN(createdMs) && createdMs < cutoffMs) {
      const target = path.join(BACKUPS_DIR, b.filename);
      if (fs.existsSync(target)) fs.unlinkSync(target);
      db.prepare('DELETE FROM backups WHERE id = ?').run(b.id);
    }
  }
}

export function restoreDatabaseBackup(backupId: string): { ok: boolean; error?: string } {
  const row = db.prepare('SELECT * FROM backups WHERE id = ?').get(backupId) as
    | { id: string; filename: string; sha256: string }
    | undefined;
  if (!row) return { ok: false, error: 'Backup record not found.' };

  const safePath = path.join(BACKUPS_DIR, path.basename(row.filename));
  if (!fs.existsSync(safePath)) {
    return { ok: false, error: 'Backup file missing from protected storage.' };
  }

  const raw = fs.readFileSync(safePath, 'utf8');
  if (sha256Hex(raw) !== row.sha256) {
    return { ok: false, error: 'Backup SHA-256 integrity verification failed.' };
  }

  const parsed = JSON.parse(raw) as { tables: Record<string, Array<Record<string, unknown>>> };
  if (!parsed.tables) return { ok: false, error: 'Invalid backup structure.' };

  db.exec('BEGIN TRANSACTION;');
  try {
    db.exec('DELETE FROM skills; DELETE FROM skill_categories; DELETE FROM projects; DELETE FROM education_events; DELETE FROM contact_messages; DELETE FROM media_assets; DELETE FROM site_settings; DELETE FROM site_profile;');

    for (const r of parsed.tables.site_profile ?? []) {
      db.prepare(`
        INSERT INTO site_profile (id, name_ar, name_en, role_ar, role_en, intro_ar, intro_en, about_ar_json, about_en_json, email, location_ar, location_en, availability_ar, availability_en, github_url, linkedin_url, x_url, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(r.id as number, r.name_ar as string, r.name_en as string, r.role_ar as string, r.role_en as string, r.intro_ar as string, r.intro_en as string, r.about_ar_json as string, r.about_en_json as string, r.email as string, r.location_ar as string, r.location_en as string, r.availability_ar as string, r.availability_en as string, r.github_url as string, r.linkedin_url as string, r.x_url as string, r.updated_at as string);
    }

    for (const r of parsed.tables.skill_categories ?? []) {
      db.prepare('INSERT INTO skill_categories (id, name_ar, name_en, sort_order, created_at) VALUES (?, ?, ?, ?, ?)').run(
        r.id as string, r.name_ar as string, r.name_en as string, r.sort_order as number, r.created_at as string
      );
    }

    for (const r of parsed.tables.skills ?? []) {
      db.prepare('INSERT INTO skills (id, category_id, name, code, level, desc_ar, desc_en, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
        r.id as string, r.category_id as string, r.name as string, r.code as string, r.level as number, r.desc_ar as string, r.desc_en as string, r.sort_order as number, r.created_at as string
      );
    }

    for (const r of parsed.tables.projects ?? []) {
      db.prepare(`
        INSERT INTO projects (id, code, title_ar, title_en, short_ar, short_en, full_ar, full_en, category_ar, category_en, technologies_json, year, image_url, gallery_json, live_url, source_url, featured, status, sort_order, published_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        r.id as string, r.code as string, r.title_ar as string, r.title_en as string, r.short_ar as string, r.short_en as string, r.full_ar as string, r.full_en as string, r.category_ar as string, r.category_en as string, r.technologies_json as string, r.year as number, r.image_url as string, r.gallery_json as string, r.live_url as string, r.source_url as string, r.featured as number, r.status as string, r.sort_order as number, (r.published_at as string) ?? null, r.created_at as string, r.updated_at as string
      );
    }

    for (const r of parsed.tables.education_events ?? []) {
      db.prepare(`
        INSERT INTO education_events (id, year, sort_order, title_ar, title_en, institution_ar, institution_en, desc_ar, desc_en, image_url, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        r.id as string, r.year as number, r.sort_order as number, r.title_ar as string, r.title_en as string, r.institution_ar as string, r.institution_en as string, r.desc_ar as string, r.desc_en as string, r.image_url as string, r.status as string, r.created_at as string, r.updated_at as string
      );
    }

    for (const r of parsed.tables.contact_messages ?? []) {
      db.prepare(`
        INSERT INTO contact_messages (id, name, email, subject, message, status, ip_address, read_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        r.id as string, r.name as string, r.email as string, r.subject as string, r.message as string, r.status as string, r.ip_address as string, (r.read_at as string) ?? null, r.created_at as string
      );
    }

    for (const r of parsed.tables.media_assets ?? []) {
      db.prepare(`
        INSERT INTO media_assets (id, filename, original_name, mime_type, size_bytes, url, alt_ar, alt_en, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        r.id as string, r.filename as string, r.original_name as string, r.mime_type as string, r.size_bytes as number, r.url as string, r.alt_ar as string, r.alt_en as string, r.created_at as string
      );
    }

    for (const r of parsed.tables.site_settings ?? []) {
      db.prepare('INSERT INTO site_settings (setting_key, setting_value, updated_at) VALUES (?, ?, ?)').run(
        r.setting_key as string, r.setting_value as string, r.updated_at as string
      );
    }

    db.exec('COMMIT;');
    return { ok: true };
  } catch (err) {
    db.exec('ROLLBACK;');
    return { ok: false, error: err instanceof Error ? err.message : 'Restore transaction failed.' };
  }
}

runMigrations();
seedInitialData();
