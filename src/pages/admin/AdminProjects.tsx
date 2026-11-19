import React, { useCallback, useEffect, useState } from 'react';
import { Eye, Plus, Search, Trash2, UploadCloud } from 'lucide-react';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { useAdmin } from '../../context/AdminContext';
import type { MediaAsset, ProjectItem, PublishStatus } from '../../types/cms';
import { getLocalizedText, isTranslationMissing } from '../../utils/i18n';

const EMPTY_FORM = {
  id: '',
  code: 'PR',
  titleAr: '',
  titleEn: '',
  shortAr: '',
  shortEn: '',
  fullAr: '',
  fullEn: '',
  categoryAr: 'ويب',
  categoryEn: 'Web',
  technologies: 'React, TypeScript, MySQL',
  year: new Date().getFullYear(),
  imageUrl: '',
  liveUrl: '',
  sourceUrl: '',
  featured: false,
  status: 'draft' as PublishStatus,
  sortOrder: 10
};

export function AdminProjects() {
  const { mode, lang, t, adminFetch, refreshNotifications } = useAdmin();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PublishStatus>('all');
  const [editing, setEditing] = useState<typeof EMPTY_FORM | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProjectItem | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [pRes, mRes] = await Promise.all([
      fetch('/api/admin/projects', { credentials: 'include' }),
      fetch('/api/admin/media', { credentials: 'include' })
    ]);
    if (pRes.ok) setProjects(await pRes.json());
    if (mRes.ok) setMedia(await mRes.json());
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

  const openCreate = () => {
    setIsNew(true);
    setEditing({ ...EMPTY_FORM });
  };

  const openEdit = (p: ProjectItem) => {
    setIsNew(false);
    setEditing({
      id: p.id,
      code: p.code,
      titleAr: p.title.ar,
      titleEn: p.title.en,
      shortAr: p.shortDescription.ar,
      shortEn: p.shortDescription.en,
      fullAr: p.fullDescription.ar,
      fullEn: p.fullDescription.en,
      categoryAr: p.category.ar,
      categoryEn: p.category.en,
      technologies: p.technologies.join(', '),
      year: p.year,
      imageUrl: p.imageUrl,
      liveUrl: p.liveUrl,
      sourceUrl: p.sourceUrl,
      featured: p.featured,
      status: p.status,
      sortOrder: p.sortOrder
    });
  };

  const submitForm = async (publishStatus: PublishStatus) => {
    if (!editing) return;
    setSaving(true);
    const payload = {
      id: editing.id || undefined,
      code: editing.code,
      title: { ar: editing.titleAr, en: editing.titleEn },
      shortDescription: { ar: editing.shortAr, en: editing.shortEn },
      fullDescription: { ar: editing.fullAr, en: editing.fullEn },
      category: { ar: editing.categoryAr, en: editing.categoryEn },
      technologies: editing.technologies
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      year: Number(editing.year),
      imageUrl: editing.imageUrl.trim(),
      gallery: [],
      liveUrl: editing.liveUrl.trim(),
      sourceUrl: editing.sourceUrl.trim(),
      featured: editing.featured,
      status: publishStatus,
      sortOrder: Number(editing.sortOrder)
    };

    const url = isNew ? '/api/admin/projects' : `/api/admin/projects/${encodeURIComponent(editing.id)}`;
    const method = isNew ? 'POST' : 'PUT';
    const res = await adminFetch(url, { method, body: JSON.stringify(payload) });
    setSaving(false);
    if (res.ok) {
      setEditing(null);
      await load();
      await refreshNotifications();
    }
  };

  const togglePublish = async (p: ProjectItem) => {
    const endpoint =
      p.status === 'published'
        ? `/api/admin/projects/${encodeURIComponent(p.id)}/unpublish`
        : `/api/admin/projects/${encodeURIComponent(p.id)}/publish`;
    await adminFetch(endpoint, { method: 'POST' });
    await load();
    await refreshNotifications();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await adminFetch(`/api/admin/projects/${encodeURIComponent(deleteTarget.id)}`, {
      method: 'DELETE'
    });
    setDeleteTarget(null);
    await load();
  };

  const filtered = projects.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.title.ar.toLowerCase().includes(q) ||
      p.title.en.toLowerCase().includes(q) ||
      p.category.en.toLowerCase().includes(q) ||
      p.technologies.join(' ').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold m-0">{t('navAdminProjects')}</h1>
        <div className="flex items-center gap-2">
          <a
            href="/projects?preview=1"
            className="px-4 py-2.5 rounded-xl border text-xs font-semibold no-underline inline-flex items-center gap-1.5"
            style={{ borderColor: borderCol, color: 'inherit' }}
          >
            <Eye className="w-4 h-4" style={{ color: gold }} />
            <span>{t('previewDrafts')}</span>
          </a>
          <button
            type="button"
            onClick={openCreate}
            className="px-4 py-2.5 rounded-xl text-xs font-bold border-0 cursor-pointer inline-flex items-center gap-1.5"
            style={{ backgroundColor: gold, color: '#111111' }}
          >
            <Plus className="w-4 h-4" />
            <span>{t('addNew')}</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3.5 opacity-60" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search')}
            className="w-full ps-10 pe-4 py-2.5 rounded-xl border text-sm"
            style={{ backgroundColor: cardBg, borderColor: borderCol, color: 'inherit' }}
          />
        </div>
        <div className="flex items-center gap-1.5">
          {(['all', 'published', 'draft'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className="px-3.5 py-2 rounded-xl border text-xs font-semibold cursor-pointer"
              style={{
                backgroundColor: statusFilter === st ? gold : cardBg,
                color: statusFilter === st ? '#111111' : 'inherit',
                borderColor: statusFilter === st ? gold : borderCol
              }}
            >
              {st === 'all' ? t('all') : st === 'published' ? t('publishedBadge') : t('draftBadge')}
            </button>
          ))}
        </div>
      </div>

      {/* Editor Modal / Panel */}
      {editing && (
        <div
          className="rounded-2xl border p-5 sm:p-6 space-y-5"
          style={{ backgroundColor: cardBg, borderColor: gold }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold m-0">
              {isNew ? t('addNew') : `${t('edit')}: ${editing.titleEn || editing.titleAr}`}
            </h2>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border cursor-pointer"
              style={{ borderColor: borderCol, backgroundColor: 'transparent', color: muted }}
            >
              {t('cancel')}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Arabic */}
            <div className="space-y-3 p-4 rounded-xl border" style={{ borderColor: borderCol, backgroundColor: pageBg }}>
              <div className="text-xs font-bold" style={{ color: gold }}>{t('arabicContent')}</div>
              <input
                placeholder="العنوان (AR)"
                value={editing.titleAr}
                onChange={(e) => setEditing({ ...editing, titleAr: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ backgroundColor: cardBg, borderColor: borderCol, color: 'inherit' }}
              />
              <input
                placeholder="الفئة (AR)"
                value={editing.categoryAr}
                onChange={(e) => setEditing({ ...editing, categoryAr: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ backgroundColor: cardBg, borderColor: borderCol, color: 'inherit' }}
              />
              <textarea
                rows={2}
                placeholder="وصف مختصر (AR)"
                value={editing.shortAr}
                onChange={(e) => setEditing({ ...editing, shortAr: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ backgroundColor: cardBg, borderColor: borderCol, color: 'inherit' }}
              />
              <textarea
                rows={4}
                placeholder="وصف تفصيلي كامل (AR)"
                value={editing.fullAr}
                onChange={(e) => setEditing({ ...editing, fullAr: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ backgroundColor: cardBg, borderColor: borderCol, color: 'inherit' }}
              />
            </div>

            {/* English */}
            <div className="space-y-3 p-4 rounded-xl border" style={{ borderColor: borderCol, backgroundColor: pageBg }}>
              <div className="text-xs font-bold" style={{ color: gold }}>{t('englishContent')}</div>
              <input
                placeholder="Title (EN)"
                value={editing.titleEn}
                onChange={(e) => setEditing({ ...editing, titleEn: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ backgroundColor: cardBg, borderColor: borderCol, color: 'inherit' }}
              />
              <input
                placeholder="Category (EN)"
                value={editing.categoryEn}
                onChange={(e) => setEditing({ ...editing, categoryEn: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ backgroundColor: cardBg, borderColor: borderCol, color: 'inherit' }}
              />
              <textarea
                rows={2}
                placeholder="Short description (EN)"
                value={editing.shortEn}
                onChange={(e) => setEditing({ ...editing, shortEn: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ backgroundColor: cardBg, borderColor: borderCol, color: 'inherit' }}
              />
              <textarea
                rows={4}
                placeholder="Full description (EN)"
                value={editing.fullEn}
                onChange={(e) => setEditing({ ...editing, fullEn: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ backgroundColor: cardBg, borderColor: borderCol, color: 'inherit' }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <input
              placeholder="Code (e.g. CF)"
              value={editing.code}
              onChange={(e) => setEditing({ ...editing, code: e.target.value })}
              className="px-3 py-2 rounded-lg border text-sm font-mono-tabular"
              style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
            />
            <input
              type="number"
              placeholder="Year"
              value={editing.year}
              onChange={(e) => setEditing({ ...editing, year: Number(e.target.value) })}
              className="px-3 py-2 rounded-lg border text-sm font-mono-tabular"
              style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
            />
            <input
              placeholder="Technologies (comma separated)"
              value={editing.technologies}
              onChange={(e) => setEditing({ ...editing, technologies: e.target.value })}
              className="sm:col-span-2 px-3 py-2 rounded-lg border text-sm"
              style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
            />
            <input
              placeholder="Live URL"
              value={editing.liveUrl}
              onChange={(e) => setEditing({ ...editing, liveUrl: e.target.value })}
              className="px-3 py-2 rounded-lg border text-sm"
              style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
            />
            <input
              placeholder="Source Code URL"
              value={editing.sourceUrl}
              onChange={(e) => setEditing({ ...editing, sourceUrl: e.target.value })}
              className="px-3 py-2 rounded-lg border text-sm"
              style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
            />
            <select
              value={editing.imageUrl}
              onChange={(e) => setEditing({ ...editing, imageUrl: e.target.value })}
              className="sm:col-span-2 px-3 py-2 rounded-lg border text-sm"
              style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
            >
              <option value="">— No image (use code emblem) —</option>
              {media.map((m) => (
                <option key={m.id} value={m.url}>
                  {m.originalName} ({m.url})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={editing.featured}
                onChange={(e) => setEditing({ ...editing, featured: e.target.checked })}
              />
              <span>{t('featuredBadge')}</span>
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => void submitForm('draft')}
                className="px-4 py-2.5 rounded-xl border text-xs font-bold cursor-pointer"
                style={{ borderColor: borderCol, backgroundColor: 'transparent', color: 'inherit' }}
              >
                {t('saveDraft')}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void submitForm('published')}
                className="px-4 py-2.5 rounded-xl text-xs font-bold border-0 cursor-pointer inline-flex items-center gap-1.5"
                style={{ backgroundColor: gold, color: '#111111' }}
              >
                <UploadCloud className="w-4 h-4" />
                <span>{t('publishNow')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Projects Table */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ backgroundColor: cardBg, borderColor: borderCol }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse text-sm">
            <thead>
              <tr className="border-b text-xs" style={{ borderColor: borderCol, color: muted }}>
                <th className="py-3 px-4 text-start font-semibold">{t('navAdminProjects')}</th>
                <th className="py-3 px-4 text-start font-semibold">{t('status')}</th>
                <th className="py-3 px-4 text-start font-semibold">Year</th>
                <th className="py-3 px-4 text-end font-semibold">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: borderCol }}>
              {filtered.map((p) => {
                const missingAr = isTranslationMissing(p.title, 'ar');
                const missingEn = isTranslationMissing(p.title, 'en');
                return (
                  <tr key={p.id}>
                    <td className="py-3 px-4">
                      <div className="font-bold">{getLocalizedText(p.title, lang)}</div>
                      <div className="text-xs" style={{ color: muted }}>
                        {getLocalizedText(p.category, lang)}
                        {(missingAr || missingEn) && (
                          <span className="ms-2 text-amber-400">
                            · {t('missingInLang')} ({missingAr ? 'AR' : 'EN'})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold">
                      <span
                        className={
                          p.status === 'published' ? 'text-emerald-400' : 'text-amber-400'
                        }
                      >
                        {p.status === 'published' ? t('publishedBadge') : t('draftBadge')}
                      </span>
                      {p.featured && (
                        <span className="ms-2" style={{ color: gold }}>
                          · {t('featuredBadge')}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono-tabular text-xs">{p.year}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => void togglePublish(p)}
                          className="px-2.5 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer"
                          style={{ borderColor: borderCol, backgroundColor: 'transparent', color: 'inherit' }}
                        >
                          {p.status === 'published' ? t('unpublish') : t('publishNow')}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(p)}
                          className="px-2.5 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer"
                          style={{ borderColor: borderCol, backgroundColor: 'transparent', color: gold }}
                        >
                          {t('edit')}
                        </button>
                        <button
                          type="button"
                          aria-label={`${t('delete')} ${getLocalizedText(p.title, lang)}`}
                          onClick={() => setDeleteTarget(p)}
                          className="p-1.5 rounded-lg border text-red-400 cursor-pointer"
                          style={{ borderColor: borderCol, backgroundColor: 'transparent' }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={t('confirmDelete')}
        description={
          deleteTarget
            ? `${t('delete')}: ${getLocalizedText(deleteTarget.title, lang)}`
            : ''
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
