import React, { useEffect, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import type { SiteProfile } from '../../types/cms';

export function AdminProfile() {
  const { mode, lang, t, adminFetch } = useAdmin();
  const [profile, setProfile] = useState<SiteProfile | null>(null);
  const [savedBanner, setSavedBanner] = useState(false);

  useEffect(() => {
    fetch('/api/admin/profile', { credentials: 'include' })
      .then((r) => r.json())
      .then(setProfile)
      .catch(() => {});
  }, []);

  const isDark = mode === 'dark';
  const cardBg = isDark ? '#121216' : '#FFFFFF';
  const pageBg = isDark ? '#09090B' : '#F4F4F6';
  const borderCol = isDark ? '#25252C' : '#E2E2E8';
  const gold = isDark ? '#D4AF37' : '#B68914';

  if (!profile) return null;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await adminFetch('/api/admin/profile', {
      method: 'PUT',
      body: JSON.stringify(profile)
    });
    if (res.ok) {
      setProfile(await res.json());
      setSavedBanner(true);
      setTimeout(() => setSavedBanner(false), 3000);
    }
  };

  return (
    <form onSubmit={save} className="space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold m-0">{t('navAdminProfile')}</h1>
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl text-xs font-bold border-0 cursor-pointer inline-flex items-center gap-2"
          style={{ backgroundColor: gold, color: '#111111' }}
        >
          <Save className="w-4 h-4" />
          <span>{t('save')}</span>
        </button>
      </div>

      {savedBanner && (
        <div className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
          {t('settingsSaved')}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border p-5 space-y-3" style={{ backgroundColor: cardBg, borderColor: borderCol }}>
          <div className="text-xs font-bold" style={{ color: gold }}>{t('arabicContent')}</div>
          <input
            placeholder="الاسم"
            value={profile.name.ar}
            onChange={(e) => setProfile({ ...profile, name: { ...profile.name, ar: e.target.value } })}
            className="w-full px-3 py-2 rounded-xl border text-sm"
            style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
          />
          <input
            placeholder="المسمى المهني"
            value={profile.role.ar}
            onChange={(e) => setProfile({ ...profile, role: { ...profile.role, ar: e.target.value } })}
            className="w-full px-3 py-2 rounded-xl border text-sm"
            style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
          />
          <textarea
            rows={3}
            placeholder="المقدمة المختصرة (Hero)"
            value={profile.intro.ar}
            onChange={(e) => setProfile({ ...profile, intro: { ...profile.intro, ar: e.target.value } })}
            className="w-full px-3 py-2 rounded-xl border text-sm"
            style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
          />
          <input
            placeholder="الموقع"
            value={profile.location.ar}
            onChange={(e) => setProfile({ ...profile, location: { ...profile.location, ar: e.target.value } })}
            className="w-full px-3 py-2 rounded-xl border text-sm"
            style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
          />
          <input
            placeholder="حالة التفرغ"
            value={profile.availability.ar}
            onChange={(e) => setProfile({ ...profile, availability: { ...profile.availability, ar: e.target.value } })}
            className="w-full px-3 py-2 rounded-xl border text-sm"
            style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
          />
        </div>

        <div className="rounded-2xl border p-5 space-y-3" style={{ backgroundColor: cardBg, borderColor: borderCol }}>
          <div className="text-xs font-bold" style={{ color: gold }}>{t('englishContent')}</div>
          <input
            placeholder="Name"
            value={profile.name.en}
            onChange={(e) => setProfile({ ...profile, name: { ...profile.name, en: e.target.value } })}
            className="w-full px-3 py-2 rounded-xl border text-sm"
            style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
          />
          <input
            placeholder="Role"
            value={profile.role.en}
            onChange={(e) => setProfile({ ...profile, role: { ...profile.role, en: e.target.value } })}
            className="w-full px-3 py-2 rounded-xl border text-sm"
            style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
          />
          <textarea
            rows={3}
            placeholder="Hero Intro"
            value={profile.intro.en}
            onChange={(e) => setProfile({ ...profile, intro: { ...profile.intro, en: e.target.value } })}
            className="w-full px-3 py-2 rounded-xl border text-sm"
            style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
          />
          <input
            placeholder="Location"
            value={profile.location.en}
            onChange={(e) => setProfile({ ...profile, location: { ...profile.location, en: e.target.value } })}
            className="w-full px-3 py-2 rounded-xl border text-sm"
            style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
          />
          <input
            placeholder="Availability"
            value={profile.availability.en}
            onChange={(e) => setProfile({ ...profile, availability: { ...profile.availability, en: e.target.value } })}
            className="w-full px-3 py-2 rounded-xl border text-sm"
            style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
          />
        </div>
      </div>

      <div className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: cardBg, borderColor: borderCol }}>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold m-0">{t('aboutTitle')}</h2>
          <button
            type="button"
            onClick={() =>
              setProfile({
                ...profile,
                aboutParagraphs: [...profile.aboutParagraphs, { ar: '', en: '' }]
              })
            }
            className="px-3 py-1.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
            style={{ borderColor: borderCol, backgroundColor: 'transparent', color: gold }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'إضافة فقرة' : 'Add Paragraph'}</span>
          </button>
        </div>

        {profile.aboutParagraphs.map((para, idx) => (
          <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
            <textarea
              rows={2}
              placeholder="الفقرة بالعربية"
              value={para.ar}
              onChange={(e) => {
                const next = [...profile.aboutParagraphs];
                next[idx] = { ...next[idx], ar: e.target.value };
                setProfile({ ...profile, aboutParagraphs: next });
              }}
              className="md:col-span-5 px-3 py-2 rounded-xl border text-sm"
              style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
            />
            <textarea
              rows={2}
              placeholder="Paragraph in English"
              value={para.en}
              onChange={(e) => {
                const next = [...profile.aboutParagraphs];
                next[idx] = { ...next[idx], en: e.target.value };
                setProfile({ ...profile, aboutParagraphs: next });
              }}
              className="md:col-span-6 px-3 py-2 rounded-xl border text-sm"
              style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
            />
            <button
              type="button"
              onClick={() =>
                setProfile({
                  ...profile,
                  aboutParagraphs: profile.aboutParagraphs.filter((_, i) => i !== idx)
                })
              }
              className="md:col-span-1 p-2 rounded-xl border text-red-400 cursor-pointer"
              style={{ borderColor: borderCol, backgroundColor: 'transparent' }}
            >
              <Trash2 className="w-4 h-4 mx-auto" />
            </button>
          </div>
        ))}

        <div className="pt-3 border-t grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ borderColor: borderCol }}>
          <input
            type="email"
            placeholder="Contact Email"
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            className="px-3 py-2 rounded-xl border text-sm"
            style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
          />
          <input
            placeholder="GitHub URL"
            value={profile.githubUrl}
            onChange={(e) => setProfile({ ...profile, githubUrl: e.target.value })}
            className="px-3 py-2 rounded-xl border text-sm"
            style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
          />
        </div>
      </div>
    </form>
  );
}
