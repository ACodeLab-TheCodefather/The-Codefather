export type Language = 'ar' | 'en';
export type PublishStatus = 'draft' | 'published';

export interface BilingualText {
  ar: string;
  en: string;
}

export interface SiteProfile {
  id: number;
  name: BilingualText;
  role: BilingualText;
  intro: BilingualText;
  aboutParagraphs: BilingualText[];
  email: string;
  location: BilingualText;
  availability: BilingualText;
  githubUrl: string;
  linkedinUrl: string;
  xUrl: string;
  updatedAt: string;
}

export interface SkillCategory {
  id: string;
  name: BilingualText;
  sortOrder: number;
}

export interface SkillItem {
  id: string;
  categoryId: string;
  name: string;
  code: string;
  level: number;
  description: BilingualText;
  sortOrder: number;
}

export interface ProjectItem {
  id: string;
  code: string;
  title: BilingualText;
  shortDescription: BilingualText;
  fullDescription: BilingualText;
  category: BilingualText;
  technologies: string[];
  year: number;
  imageUrl: string;
  gallery: string[];
  liveUrl: string;
  sourceUrl: string;
  featured: boolean;
  status: PublishStatus;
  sortOrder: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EducationEvent {
  id: string;
  year: number;
  sortOrder: number;
  title: BilingualText;
  institution: BilingualText;
  description: BilingualText;
  imageUrl: string;
  status: PublishStatus;
  createdAt: string;
  updatedAt: string;
}

export type MessageStatus = 'unread' | 'read' | 'archived';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: MessageStatus;
  ipAddress: string;
  createdAt: string;
  readAt: string | null;
}

export interface MediaAsset {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  altText: BilingualText;
  createdAt: string;
}

export interface SiteSettings {
  defaultTheme: string;
  defaultLanguage: Language;
  dashboardDefaultMode: 'dark' | 'light';
  siteTitle: BilingualText;
  tagline: string;
  seoTitle: BilingualText;
  seoDescription: BilingualText;
  ogImage: string;
  canonicalBaseUrl: string;
  contactEmailEnabled: boolean;
  contactNotificationEmail: string;
  notifyOnMessage: boolean;
  notifyOnPublish: boolean;
  notifyOnBackup: boolean;
  notifyOnSecurity: boolean;
  backupSchedule: 'manual' | 'daily' | 'weekly';
  backupRetentionDays: number;
  maxUploadMb: number;
}

export interface NotificationItem {
  id: string;
  type: 'message' | 'publish' | 'backup' | 'security' | 'system';
  title: BilingualText;
  body: BilingualText;
  isRead: boolean;
  createdAt: string;
}

export interface ActivityLogItem {
  id: string;
  adminId: string | null;
  adminUsername: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details: string;
  ipAddress: string;
  createdAt: string;
}

export interface BackupRecord {
  id: string;
  filename: string;
  triggerType: 'manual' | 'daily' | 'weekly';
  status: 'completed' | 'failed';
  sizeBytes: number;
  sha256: string;
  createdBy: string;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'super_admin' | 'editor';
  totpEnabled: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface PublicBootstrapPayload {
  profile: SiteProfile;
  skillCategories: SkillCategory[];
  skills: SkillItem[];
  projects: ProjectItem[];
  education: EducationEvent[];
  settings: Pick<
    SiteSettings,
    | 'defaultTheme'
    | 'defaultLanguage'
    | 'siteTitle'
    | 'tagline'
    | 'seoTitle'
    | 'seoDescription'
    | 'ogImage'
    | 'canonicalBaseUrl'
  >;
  isPreview?: boolean;
}
