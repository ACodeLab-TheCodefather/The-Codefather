-- ============================================================================
-- THE CODEFATHER — MySQL 8.0 Production Database Schema & Initial Migration
-- Charset: utf8mb4 / Collation: utf8mb4_unicode_ci
-- ============================================================================

CREATE DATABASE IF NOT EXISTS the_codefather
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE the_codefather;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(64) PRIMARY KEY,
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS admins (
  id CHAR(36) PRIMARY KEY,
  username VARCHAR(64) NOT NULL UNIQUE,
  email VARCHAR(191) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('super_admin', 'editor') NOT NULL DEFAULT 'super_admin',
  totp_secret VARCHAR(128) NULL,
  totp_enabled TINYINT(1) NOT NULL DEFAULT 0,
  last_login_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS admin_sessions (
  id CHAR(36) PRIMARY KEY,
  admin_id CHAR(36) NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  csrf_token CHAR(64) NOT NULL,
  ip_address VARCHAR(64) NOT NULL DEFAULT '',
  user_agent VARCHAR(255) NOT NULL DEFAULT '',
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sessions_admin FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
  INDEX idx_sessions_expires (expires_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS admin_recovery_codes (
  id CHAR(36) PRIMARY KEY,
  admin_id CHAR(36) NOT NULL,
  code_hash VARCHAR(255) NOT NULL,
  used_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_recovery_admin FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
  INDEX idx_recovery_admin (admin_id, used_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS site_profile (
  id INT PRIMARY KEY DEFAULT 1,
  name_ar VARCHAR(160) NOT NULL,
  name_en VARCHAR(160) NOT NULL,
  role_ar VARCHAR(200) NOT NULL,
  role_en VARCHAR(200) NOT NULL,
  intro_ar TEXT NOT NULL,
  intro_en TEXT NOT NULL,
  about_ar_json JSON NOT NULL,
  about_en_json JSON NOT NULL,
  email VARCHAR(191) NOT NULL,
  location_ar VARCHAR(160) NOT NULL DEFAULT '',
  location_en VARCHAR(160) NOT NULL DEFAULT '',
  availability_ar VARCHAR(160) NOT NULL DEFAULT '',
  availability_en VARCHAR(160) NOT NULL DEFAULT '',
  github_url VARCHAR(512) NOT NULL DEFAULT '',
  linkedin_url VARCHAR(512) NOT NULL DEFAULT '',
  x_url VARCHAR(512) NOT NULL DEFAULT '',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS skill_categories (
  id CHAR(36) PRIMARY KEY,
  name_ar VARCHAR(120) NOT NULL,
  name_en VARCHAR(120) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS skills (
  id CHAR(36) PRIMARY KEY,
  category_id CHAR(36) NOT NULL,
  name VARCHAR(120) NOT NULL,
  code VARCHAR(8) NOT NULL,
  level TINYINT UNSIGNED NOT NULL DEFAULT 75,
  desc_ar VARCHAR(255) NOT NULL DEFAULT '',
  desc_en VARCHAR(255) NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_skills_category FOREIGN KEY (category_id) REFERENCES skill_categories(id) ON DELETE CASCADE,
  INDEX idx_skills_category (category_id, sort_order)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(120) PRIMARY KEY,
  code VARCHAR(8) NOT NULL,
  title_ar VARCHAR(200) NOT NULL,
  title_en VARCHAR(200) NOT NULL,
  short_ar TEXT NOT NULL,
  short_en TEXT NOT NULL,
  full_ar MEDIUMTEXT NOT NULL,
  full_en MEDIUMTEXT NOT NULL,
  category_ar VARCHAR(100) NOT NULL,
  category_en VARCHAR(100) NOT NULL,
  technologies_json JSON NOT NULL,
  year SMALLINT UNSIGNED NOT NULL,
  image_url VARCHAR(512) NOT NULL DEFAULT '',
  gallery_json JSON NOT NULL,
  live_url VARCHAR(512) NOT NULL DEFAULT '',
  source_url VARCHAR(512) NOT NULL DEFAULT '',
  featured TINYINT(1) NOT NULL DEFAULT 0,
  status ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
  sort_order INT NOT NULL DEFAULT 0,
  published_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_projects_status_featured (status, featured, sort_order)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS education_events (
  id CHAR(36) PRIMARY KEY,
  year SMALLINT UNSIGNED NOT NULL,
  sort_order INT NOT NULL DEFAULT 1,
  title_ar VARCHAR(200) NOT NULL,
  title_en VARCHAR(200) NOT NULL,
  institution_ar VARCHAR(200) NOT NULL DEFAULT '',
  institution_en VARCHAR(200) NOT NULL DEFAULT '',
  desc_ar TEXT NOT NULL,
  desc_en TEXT NOT NULL,
  image_url VARCHAR(512) NOT NULL DEFAULT '',
  status ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_edu_year_order (status, year, sort_order)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS contact_messages (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  email VARCHAR(191) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('unread', 'read', 'archived') NOT NULL DEFAULT 'unread',
  ip_address VARCHAR(64) NOT NULL DEFAULT '',
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_messages_status_created (status, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS media_assets (
  id CHAR(36) PRIMARY KEY,
  filename VARCHAR(255) NOT NULL UNIQUE,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes INT UNSIGNED NOT NULL,
  url VARCHAR(512) NOT NULL,
  alt_ar VARCHAR(255) NOT NULL DEFAULT '',
  alt_en VARCHAR(255) NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS site_settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value MEDIUMTEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
  id CHAR(36) PRIMARY KEY,
  type ENUM('message', 'publish', 'backup', 'security', 'system') NOT NULL,
  title_ar VARCHAR(255) NOT NULL,
  title_en VARCHAR(255) NOT NULL,
  body_ar TEXT NOT NULL,
  body_en TEXT NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notifications_read_created (is_read, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS activity_logs (
  id CHAR(36) PRIMARY KEY,
  admin_id CHAR(36) NULL,
  admin_username VARCHAR(64) NOT NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(80) NOT NULL,
  resource_id VARCHAR(120) NOT NULL DEFAULT '',
  details TEXT NOT NULL,
  ip_address VARCHAR(64) NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_activity_created (created_at),
  INDEX idx_activity_action (action)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS backups (
  id CHAR(36) PRIMARY KEY,
  filename VARCHAR(255) NOT NULL UNIQUE,
  trigger_type ENUM('manual', 'daily', 'weekly') NOT NULL DEFAULT 'manual',
  status ENUM('completed', 'failed') NOT NULL DEFAULT 'completed',
  size_bytes INT UNSIGNED NOT NULL DEFAULT 0,
  sha256 CHAR(64) NOT NULL,
  created_by VARCHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_backups_created (created_at)
) ENGINE=InnoDB;
