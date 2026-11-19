import React, { useCallback, useEffect, useState } from 'react';
import { Database, KeyRound, RefreshCw, Save, Shield, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { useAdmin } from '../../context/AdminContext';
import type { AdminUser, BackupRecord, SiteSettings } from '../../types/cms';
import { OFFICIAL_THEMES } from '../../utils/themes';

type SettingsTab = 'general' | 'seo' | 'notifications' | 'security' | 'backups';

export function AdminSettings() {
  const { mode, lang, t, adminFetch } = useAdmin();
  const [tab, setTab] = useState<SettingsTab>('general');
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [unusedRecoveryCodes, setUnusedRecoveryCodes] = useState(0);
  const [newRecoveryCodes, setNewRecoveryCodes] = useState<string[] | null>(null);
  const [qrEnrollment, setQrEnrollment] = useState<{ secret: string; qrDataUrl: string } | null>(null);
  const [totpVerifyCode, setTotpVerifyCode] = useState('');
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [newAdminForm, setNewAdminForm] = useState({ username: '', email: '', password: '', role: 'editor' as 'editor' | 'super_admin' });
  const [restoreTarget, setRestoreTarget] = useState<BackupRecord | null>(null);
  const [deleteBackupTarget, setDeleteBackupTarget] = useState<BackupRecord | null>(null);
  const [banner, setBanner] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const load = useCallback(async () => {
    const [sRes, bRes, secRes] = await Promise.all([
      fetch('/api/admin/settings', { credentials: 'include' }),
      fetch('/api/admin/backups', { credentials: 'include' }),
      fetch('/api/admin/account/security', { credentials: 'include' })
    ]);
    if (sRes.ok) setSettings(await sRes.json());
    if (bRes.ok) setBackups(await bRes.json());
    if (secRes.ok) {
      const sec = await secRes.json();
      setAdmins(sec.admins);
      setUnusedRecoveryCodes(sec.unusedRecoveryCodes);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const isDark = mode === 'dark';
  const cardBg = isDark ? '#121216' : '#FFFFFF';
  const pageBg = isDark ? '#09090B' : '#F4F4F6';
  const borderCol = isDark ? '#25252C' : '#E2E2E8';
  const muted = isDark ? '#9E9EA8' : '#646470';
  const gold = isDark ? '#D4AF37' : '#B68914';

  const saveSettingsForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    const res = await adminFetch('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
    if (res.ok) {
      setSettings(await res.json());
      setBanner({ type: 'ok', text: t('settingsSaved') });
      setTimeout(() => setBanner(null), 3000);
    }
  };

  const createBackupNow = async () => {
    const res = await adminFetch('/api/admin/backups/create', { method: 'POST' });
    if (res.ok) {
      setBackups(await res.json());
      setBanner({
        type: 'ok',
        text: lang === 'ar' ? 'تم إنشاء النسخة الاحتياطية بنجاح' : 'Backup snapshot created & verified.'
      });
    }
  };

  const confirmRestore = async () => {
    if (!restoreTarget) return;
    const res = await adminFetch(`/api/admin/backups/${encodeURIComponent(restoreTarget.id)}/restore`, {
      method: 'POST'
    });
    const json = await res.json();
    setRestoreTarget(null);
    if (res.ok) {
      setBanner({
        type: 'ok',
        text: lang === 'ar' ? 'تمت استعادة قاعدة البيانات بنجاح' : 'Database restored from backup.'
      });
      await load();
    } else {
      setBanner({ type: 'err', text: json.error || 'Restore failed.' });
    }
  };

  const confirmDeleteBackup = async () => {
    if (!deleteBackupTarget) return;
    const res = await adminFetch(`/api/admin/backups/${encodeURIComponent(deleteBackupTarget.id)}`, {
      method: 'DELETE'
    });
    setDeleteBackupTarget(null);
    if (res.ok) setBackups(await res.json());
  };

  const regenerateCodes = async () => {
    const res = await adminFetch('/api/admin/account/recovery-codes/regenerate', { method: 'POST' });
    if (res.ok) {
      const json = await res.json();
      setNewRecoveryCodes(json.recoveryCodes);
      await load();
    }
  };

  const start2faEnroll = async () => {
    const res = await adminFetch('/api/admin/account/2fa/enroll', { method: 'POST' });
    if (res.ok) setQrEnrollment(await res.json());
  };

  const confirm2faEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrEnrollment) return;
    const res = await adminFetch('/api/admin/account/2fa/confirm', {
      method: 'POST',
      body: JSON.stringify({ secret: qrEnrollment.secret, code: totpVerifyCode })
    });
    if (res.ok) {
      setQrEnrollment(null);
      setTotpVerifyCode('');
      setBanner({ type: 'ok', text: lang === 'ar' ? 'تم تحديث المصادقة الثنائية' : '2FA updated.' });
    } else {
      const json = await res.json();
      setBanner({ type: 'err', text: json.error || 'Invalid TOTP code.' });
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await adminFetch('/api/admin/account/password', {
      method: 'POST',
      body: JSON.stringify(passwordForm)
    });
    const json = await res.json();
    if (res.ok) {
      setPasswordForm({ currentPassword: '', newPassword: '' });
      setBanner({ type: 'ok', text: lang === 'ar' ? 'تم تغيير كلمة المرور' : 'Password changed.' });
    } else {
      setBanner({ type: 'err', text: json.error || 'Failed to change password.' });
    }
  };

  const addAdminAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await adminFetch('/api/admin/account/admins', {
      method: 'POST',
      body: JSON.stringify(newAdminForm)
    });
    const json = await res.json();
    if (res.ok) {
      setAdmins(json);
      setNewAdminForm({ username: '', email: '', password: '', role: 'editor' });
      setBanner({ type: 'ok', text: lang === 'ar' ? 'تمت إضافة المسؤول' : 'Administrator added.' });
    } else {
      setBanner({ type: 'err', text: json.error || 'Failed to add administrator.' });
    }
  };

  if (!settings) return null;

  const tabs: Array<{ id: SettingsTab; label: string }> = [
    { id: 'general', label: lang === 'ar' ? 'العام والثيم واللغة' : 'General, Theme & Language' },
    { id: 'seo', label: 'SEO' },
    { id: 'notifications', label: lang === 'ar' ? 'الإشعارات والتواصل' : 'Notifications & Contact' },
    { id: 'security', label: lang === 'ar' ? 'الأمان و 2FA' : 'Security & 2FA' },
    { id: 'backups', label: t('backupsTitle') }
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl sm:text-3xl font-bold m-0">{t('navAdminSettings')}</h1>

      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className="px-4 py-2 rounded-xl border text-xs font-bold cursor-pointer"
            style={{
              backgroundColor: tab === item.id ? gold : cardBg,
              color: tab === item.id ? '#111111' : 'inherit',
              borderColor: tab === item.id ? gold : borderCol
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {banner && (
        <div
          className={`p-3 rounded-xl border text-xs font-semibold ${
            banner.type === 'ok'
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
              : 'border-red-500/40 bg-red-500/10 text-red-400'
          }`}
        >
          {banner.text}
        </div>
      )}

      {(tab === 'general' || tab === 'seo' || tab === 'notifications') && (
        <form
          onSubmit={saveSettingsForm}
          className="rounded-2xl border p-6 space-y-5"
          style={{ backgroundColor: cardBg, borderColor: borderCol }}
        >
          {tab === 'general' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold block">{lang === 'ar' ? 'الثيم الافتراضي للموقع' : 'Default Public Theme'}</label>
                <select
                  value={settings.defaultTheme}
                  onChange={(e) => setSettings({ ...settings, defaultTheme: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm"
                  style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
                >
                  {OFFICIAL_THEMES.map((th) => (
                    <option key={th.id} value={th.id}>
                      {th.name} ({th.colors.join(' / ')})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold block">{lang === 'ar' ? 'اللغة الافتراضية' : 'Default Public Language'}</label>
                <select
                  value={settings.defaultLanguage}
                  onChange={(e) => setSettings({ ...settings, defaultLanguage: e.target.value as 'ar' | 'en' })}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm"
                  style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
                >
                  <option value="ar">العربية (RTL)</option>
                  <option value="en">English (LTR)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold block">Tagline</label>
                <input
                  value={settings.tagline}
                  onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm"
                  style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold block">Max Upload Size (MB)</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={settings.maxUploadMb}
                  onChange={(e) => setSettings({ ...settings, maxUploadMb: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm font-mono-tabular"
                  style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
                />
              </div>
            </div>
          )}

          {tab === 'seo' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  placeholder="SEO Title (AR)"
                  value={settings.seoTitle.ar}
                  onChange={(e) => setSettings({ ...settings, seoTitle: { ...settings.seoTitle, ar: e.target.value } })}
                  className="px-3 py-2.5 rounded-xl border text-sm"
                  style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
                />
                <input
                  placeholder="SEO Title (EN)"
                  value={settings.seoTitle.en}
                  onChange={(e) => setSettings({ ...settings, seoTitle: { ...settings.seoTitle, en: e.target.value } })}
                  className="px-3 py-2.5 rounded-xl border text-sm"
                  style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
                />
                <textarea
                  rows={3}
                  placeholder="Meta Description (AR)"
                  value={settings.seoDescription.ar}
                  onChange={(e) => setSettings({ ...settings, seoDescription: { ...settings.seoDescription, ar: e.target.value } })}
                  className="px-3 py-2.5 rounded-xl border text-sm"
                  style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
                />
                <textarea
                  rows={3}
                  placeholder="Meta Description (EN)"
                  value={settings.seoDescription.en}
                  onChange={(e) => setSettings({ ...settings, seoDescription: { ...settings.seoDescription, en: e.target.value } })}
                  className="px-3 py-2.5 rounded-xl border text-sm"
                  style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  placeholder="Canonical Base URL"
                  value={settings.canonicalBaseUrl}
                  onChange={(e) => setSettings({ ...settings, canonicalBaseUrl: e.target.value })}
                  className="px-3 py-2.5 rounded-xl border text-sm"
                  style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
                />
                <input
                  placeholder="OG Image URL"
                  value={settings.ogImage}
                  onChange={(e) => setSettings({ ...settings, ogImage: e.target.value })}
                  className="px-3 py-2.5 rounded-xl border text-sm"
                  style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
                />
              </div>
              <div className="text-xs flex gap-4" style={{ color: muted }}>
                <a href="/sitemap.xml" target="_blank" rel="noreferrer" style={{ color: gold }}>/sitemap.xml</a>
                <a href="/robots.txt" target="_blank" rel="noreferrer" style={{ color: gold }}>/robots.txt</a>
              </div>
            </div>
          )}

          {tab === 'notifications' && (
            <div className="space-y-4">
              <input
                type="email"
                placeholder="Notification Email"
                value={settings.contactNotificationEmail}
                onChange={(e) => setSettings({ ...settings, contactNotificationEmail: e.target.value })}
                className="w-full sm:w-96 px-3 py-2.5 rounded-xl border text-sm"
                style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifyOnMessage}
                    onChange={(e) => setSettings({ ...settings, notifyOnMessage: e.target.checked })}
                  />
                  <span>{lang === 'ar' ? 'إشعار عند وصول رسالة جديدة' : 'Notify on new contact message'}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifyOnPublish}
                    onChange={(e) => setSettings({ ...settings, notifyOnPublish: e.target.checked })}
                  />
                  <span>{lang === 'ar' ? 'إشعار عند نشر محتوى' : 'Notify on content publish'}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifyOnBackup}
                    onChange={(e) => setSettings({ ...settings, notifyOnBackup: e.target.checked })}
                  />
                  <span>{lang === 'ar' ? 'إشعار عند النسخ الاحتياطي' : 'Notify on backup completion'}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifyOnSecurity}
                    onChange={(e) => setSettings({ ...settings, notifyOnSecurity: e.target.checked })}
                  />
                  <span>{lang === 'ar' ? 'إشعار للأحداث الأمنية' : 'Notify on security events'}</span>
                </label>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl text-xs font-bold border-0 cursor-pointer inline-flex items-center gap-2"
            style={{ backgroundColor: gold, color: '#111111' }}
          >
            <Save className="w-4 h-4" />
            <span>{t('save')}</span>
          </button>
        </form>
      )}

      {tab === 'security' && (
        <div className="space-y-6">
          <div className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: cardBg, borderColor: borderCol }}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" style={{ color: gold }} />
                <h2 className="text-base font-bold m-0">2FA & Recovery Codes ({unusedRecoveryCodes} unused)</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void start2faEnroll()}
                  className="px-3.5 py-2 rounded-xl border text-xs font-semibold cursor-pointer"
                  style={{ borderColor: borderCol, backgroundColor: 'transparent', color: 'inherit' }}
                >
                  <KeyRound className="w-3.5 h-3.5 inline me-1" />
                  {lang === 'ar' ? 'إعادة ربط تطبيق 2FA' : 'Rotate 2FA Secret'}
                </button>
                <button
                  type="button"
                  onClick={() => void regenerateCodes()}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold border-0 cursor-pointer"
                  style={{ backgroundColor: gold, color: '#111111' }}
                >
                  {lang === 'ar' ? 'توليد رموز استرداد جديدة' : 'Regenerate Recovery Codes'}
                </button>
              </div>
            </div>

            {qrEnrollment && (
              <form onSubmit={confirm2faEnroll} className="p-4 rounded-xl border space-y-3" style={{ borderColor: gold, backgroundColor: pageBg }}>
                <img src={qrEnrollment.qrDataUrl} alt="2FA QR" className="w-36 h-36 rounded-lg" />
                <div className="text-xs font-mono-tabular" style={{ color: gold }}>{qrEnrollment.secret}</div>
                <div className="flex gap-2">
                  <input
                    required
                    placeholder="6-digit code"
                    value={totpVerifyCode}
                    onChange={(e) => setTotpVerifyCode(e.target.value)}
                    className="px-3 py-2 rounded-lg border text-sm font-mono-tabular"
                    style={{ backgroundColor: cardBg, borderColor: borderCol, color: 'inherit' }}
                  />
                  <button type="submit" className="px-4 py-2 rounded-lg text-xs font-bold border-0 cursor-pointer" style={{ backgroundColor: gold, color: '#111111' }}>
                    Verify
                  </button>
                </div>
              </form>
            )}

            {newRecoveryCodes && (
              <div className="p-4 rounded-xl border space-y-2" style={{ borderColor: gold, backgroundColor: pageBg }}>
                <div className="text-xs font-bold" style={{ color: gold }}>{t('saveRecoveryCodesTitle')}</div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {newRecoveryCodes.map((c) => (
                    <code key={c} className="px-2 py-1 rounded border text-xs font-mono-tabular text-center" style={{ borderColor: borderCol }}>
                      {c}
                    </code>
                  ))}
                </div>
              </div>
            )}
          </div>

          <form onSubmit={changePassword} className="rounded-2xl border p-5 space-y-3" style={{ backgroundColor: cardBg, borderColor: borderCol }}>
            <h2 className="text-base font-bold m-0">{lang === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="password"
                required
                placeholder="Current password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="px-3 py-2 rounded-xl border text-sm"
                style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
              />
              <input
                type="password"
                required
                minLength={8}
                placeholder="New password (8+ chars)"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="px-3 py-2 rounded-xl border text-sm"
                style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
              />
            </div>
            <button type="submit" className="px-4 py-2 rounded-xl text-xs font-bold border-0 cursor-pointer" style={{ backgroundColor: gold, color: '#111111' }}>
              {t('save')}
            </button>
          </form>

          <div className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: cardBg, borderColor: borderCol }}>
            <h2 className="text-base font-bold m-0">{lang === 'ar' ? 'إدارة المسؤولين (RBAC)' : 'Administrator Accounts (RBAC)'}</h2>
            <div className="space-y-2">
              {admins.map((a) => (
                <div key={a.id} className="p-3 rounded-xl border flex items-center justify-between text-xs" style={{ borderColor: borderCol, backgroundColor: pageBg }}>
                  <div>
                    <strong>{a.username}</strong> · {a.email}
                  </div>
                  <span className="font-mono-tabular" style={{ color: gold }}>{a.role}</span>
                </div>
              ))}
            </div>
            <form onSubmit={addAdminAccount} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-2">
              <input
                required
                placeholder="Username"
                value={newAdminForm.username}
                onChange={(e) => setNewAdminForm({ ...newAdminForm, username: e.target.value })}
                className="px-3 py-2 rounded-xl border text-sm"
                style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
              />
              <input
                required
                type="email"
                placeholder="Email"
                value={newAdminForm.email}
                onChange={(e) => setNewAdminForm({ ...newAdminForm, email: e.target.value })}
                className="px-3 py-2 rounded-xl border text-sm"
                style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
              />
              <input
                required
                type="password"
                minLength={8}
                placeholder="Password"
                value={newAdminForm.password}
                onChange={(e) => setNewAdminForm({ ...newAdminForm, password: e.target.value })}
                className="px-3 py-2 rounded-xl border text-sm"
                style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
              />
              <button type="submit" className="px-4 py-2 rounded-xl text-xs font-bold border-0 cursor-pointer" style={{ backgroundColor: gold, color: '#111111' }}>
                + {t('addNew')}
              </button>
            </form>
          </div>
        </div>
      )}

      {tab === 'backups' && (
        <div className="space-y-5">
          <form onSubmit={saveSettingsForm} className="rounded-2xl border p-5 flex flex-wrap items-end justify-between gap-4" style={{ backgroundColor: cardBg, borderColor: borderCol }}>
            <div className="flex flex-wrap gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold block">{lang === 'ar' ? 'جدول النسخ التلقائي' : 'Automatic Schedule'}</label>
                <select
                  value={settings.backupSchedule}
                  onChange={(e) => setSettings({ ...settings, backupSchedule: e.target.value as SiteSettings['backupSchedule'] })}
                  className="px-3 py-2 rounded-xl border text-sm"
                  style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="manual">Manual only</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold block">{lang === 'ar' ? 'الاحتفاظ (أيام)' : 'Retention (Days)'}</label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={settings.backupRetentionDays}
                  onChange={(e) => setSettings({ ...settings, backupRetentionDays: Number(e.target.value) })}
                  className="w-28 px-3 py-2 rounded-xl border text-sm font-mono-tabular"
                  style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
                />
              </div>
              <button type="submit" className="px-4 py-2 rounded-xl border text-xs font-semibold cursor-pointer self-end" style={{ borderColor: borderCol, backgroundColor: 'transparent', color: 'inherit' }}>
                {t('save')}
              </button>
            </div>

            <button
              type="button"
              onClick={() => void createBackupNow()}
              className="px-4 py-2.5 rounded-xl text-xs font-bold border-0 cursor-pointer inline-flex items-center gap-2"
              style={{ backgroundColor: gold, color: '#111111' }}
            >
              <Database className="w-4 h-4" />
              <span>{t('createBackupNow')}</span>
            </button>
          </form>

          <div className="rounded-2xl border divide-y overflow-hidden" style={{ backgroundColor: cardBg, borderColor: borderCol }}>
            {backups.length === 0 ? (
              <div className="p-8 text-center text-sm" style={{ color: muted }}>—</div>
            ) : (
              backups.map((b) => (
                <div key={b.id} className="p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className="space-y-1 min-w-0">
                    <div className="font-bold truncate">{b.filename}</div>
                    <div className="font-mono-tabular truncate" style={{ color: muted }}>
                      {b.triggerType} · {(b.sizeBytes / 1024).toFixed(1)} KB · SHA256: {b.sha256.slice(0, 14)}…
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRestoreTarget(b)}
                      className="px-3 py-1.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                      style={{ borderColor: borderCol, backgroundColor: 'transparent', color: gold }}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{t('restoreBackup')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteBackupTarget(b)}
                      className="p-1.5 rounded-lg border text-red-400 cursor-pointer"
                      style={{ borderColor: borderCol, backgroundColor: 'transparent' }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(restoreTarget)}
        title={t('confirmAction')}
        description={t('restoreConfirmText')}
        confirmLabel={t('restoreBackup')}
        destructive={false}
        onCancel={() => setRestoreTarget(null)}
        onConfirm={() => void confirmRestore()}
      />

      <ConfirmDialog
        open={Boolean(deleteBackupTarget)}
        title={t('confirmDelete')}
        description={deleteBackupTarget ? deleteBackupTarget.filename : ''}
        onCancel={() => setDeleteBackupTarget(null)}
        onConfirm={() => void confirmDeleteBackup()}
      />
    </div>
  );
}
