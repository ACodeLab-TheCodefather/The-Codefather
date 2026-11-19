import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { useAdmin } from '../../context/AdminContext';
import type { EducationEvent, MediaAsset, PublishStatus } from '../../types/cms';
import { getLocalizedText } from '../../utils/i18n';

const EMPTY_EDU = {
  id: '',
  year: 2026,
  sortOrder: 1,
  titleAr: '',
  titleEn: '',
  instAr: '',
  instEn: '',
  descAr: '',
  descEn: '',
  imageUrl: '',
  status: 'published' as PublishStatus
};

export function AdminEducation() {
  const { mode, lang, t, adminFetch } = useAdmin();
  const [events, setEvents] = useState<EducationEvent[]>([]);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [editing, setEditing] = useState<typeof EMPTY_EDU | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EducationEvent | null>(null);

  const load = useCallback(async () => {
    const [eRes, mRes] = await Promise.all([
      fetch('/api/admin/education', { credentials: 'include' }),
      fetch('/api/admin/media', { credentials: 'include' })
    ]);
    if (eRes.ok) setEvents(await eRes.json());
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

  const save = async (status: PublishStatus) => {
    if (!editing) return;
    const payload = {
      year: Number(editing.year),
      sortOrder: Number(editing.sortOrder),
      title: { ar: editing.titleAr, en: editing.titleEn },
      institution: { ar: editing.instAr, en: editing.instEn },
      description: { ar: editing.descAr, en: editing.descEn },
      imageUrl: editing.imageUrl,
      status
    };
    const url = isNew
      ? '/api/admin/education'
      : `/api/admin/education/${encodeURIComponent(editing.id)}`;
    await adminFetch(url, { method: isNew ? 'POST' : 'PUT', body: JSON.stringify(payload) });
    setEditing(null);
    await load();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await adminFetch(`/api/admin/education/${encodeURIComponent(deleteTarget.id)}`, {
      method: 'DELETE'
    });
    setDeleteTarget(null);
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold m-0">{t('navAdminEducation')}</h1>
        <button
          type="button"
          onClick={() => {
            setIsNew(true);
            setEditing({ ...EMPTY_EDU });
          }}
          className="px-4 py-2.5 rounded-xl text-xs font-bold border-0 cursor-pointer inline-flex items-center gap-1.5"
          style={{ backgroundColor: gold, color: '#111111' }}
        >
          <Plus className="w-4 h-4" />
          <span>{t('addNew')}</span>
        </button>
      </div>

      {editing && (
        <div
          className="rounded-2xl border p-5 sm:p-6 space-y-4"
          style={{ backgroundColor: cardBg, borderColor: gold }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="number"
              min={2006}
              max={2026}
              value={editing.year}
              onChange={(e) => setEditing({ ...editing, year: Number(e.target.value) })}
              placeholder="Year (2006–2026)"
              className="px-3 py-2 rounded-xl border text-sm font-mono-tabular"
              style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
            />
            <input
              type="number"
              min={1}
              value={editing.sortOrder}
              onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })}
              placeholder="Order within year"
              className="px-3 py-2 rounded-xl border text-sm font-mono-tabular"
              style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
            />
            <select
              value={editing.imageUrl}
              onChange={(e) => setEditing({ ...editing, imageUrl: e.target.value })}
              className="px-3 py-2 rounded-xl border text-sm"
              style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
            >
              <option value="">— No image —</option>
              {media.map((m) => (
                <option key={m.id} value={m.url}>
                  {m.originalName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2.5">
              <input
                placeholder="عنوان الحدث (AR)"
                value={editing.titleAr}
                onChange={(e) => setEditing({ ...editing, titleAr: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border text-sm"
                style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
              />
              <input
                placeholder="المؤسسة / المسار (AR)"
                value={editing.instAr}
                onChange={(e) => setEditing({ ...editing, instAr: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border text-sm"
                style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
              />
              <textarea
                rows={3}
                placeholder="التفاصيل (AR)"
                value={editing.descAr}
                onChange={(e) => setEditing({ ...editing, descAr: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border text-sm"
                style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
              />
            </div>
            <div className="space-y-2.5">
              <input
                placeholder="Event Title (EN)"
                value={editing.titleEn}
                onChange={(e) => setEditing({ ...editing, titleEn: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border text-sm"
                style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
              />
              <input
                placeholder="Institution / Track (EN)"
                value={editing.instEn}
                onChange={(e) => setEditing({ ...editing, instEn: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border text-sm"
                style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
              />
              <textarea
                rows={3}
                placeholder="Description (EN)"
                value={editing.descEn}
                onChange={(e) => setEditing({ ...editing, descEn: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border text-sm"
                style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="px-4 py-2 rounded-xl border text-xs font-semibold cursor-pointer"
              style={{ borderColor: borderCol, backgroundColor: 'transparent', color: muted }}
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              onClick={() => void save('draft')}
              className="px-4 py-2 rounded-xl border text-xs font-semibold cursor-pointer"
              style={{ borderColor: borderCol, backgroundColor: 'transparent', color: 'inherit' }}
            >
              {t('saveDraft')}
            </button>
            <button
              type="button"
              onClick={() => void save('published')}
              className="px-4 py-2 rounded-xl text-xs font-bold border-0 cursor-pointer"
              style={{ backgroundColor: gold, color: '#111111' }}
            >
              {t('publishNow')}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {events.map((ev) => (
          <div
            key={ev.id}
            className="rounded-2xl border p-4 flex flex-wrap items-center justify-between gap-4"
            style={{ backgroundColor: cardBg, borderColor: borderCol }}
          >
            <div className="flex items-center gap-4 min-w-0">
              <span
                className="px-3 py-1.5 rounded-xl font-mono-tabular text-sm font-bold shrink-0"
                style={{ backgroundColor: 'rgba(212, 175, 55, 0.16)', color: gold }}
              >
                {ev.year} #{ev.sortOrder}
              </span>
              <div className="min-w-0">
                <div className="font-bold text-sm truncate">{getLocalizedText(ev.title, lang)}</div>
                <div className="text-xs truncate" style={{ color: muted }}>
                  {ev.status === 'published' ? t('publishedBadge') : t('draftBadge')} ·{' '}
                  {getLocalizedText(ev.institution, lang)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsNew(false);
                  setEditing({
                    id: ev.id,
                    year: ev.year,
                    sortOrder: ev.sortOrder,
                    titleAr: ev.title.ar,
                    titleEn: ev.title.en,
                    instAr: ev.institution.ar,
                    instEn: ev.institution.en,
                    descAr: ev.description.ar,
                    descEn: ev.description.en,
                    imageUrl: ev.imageUrl,
                    status: ev.status
                  });
                }}
                className="px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer"
                style={{ borderColor: borderCol, backgroundColor: 'transparent', color: gold }}
              >
                {t('edit')}
              </button>
              <button
                type="button"
                aria-label={`${t('delete')} ${getLocalizedText(ev.title, lang)}`}
                onClick={() => setDeleteTarget(ev)}
                className="p-1.5 rounded-lg border text-red-400 cursor-pointer"
                style={{ borderColor: borderCol, backgroundColor: 'transparent' }}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={t('confirmDelete')}
        description={
          deleteTarget
            ? `${t('delete')}: ${deleteTarget.year} — ${getLocalizedText(deleteTarget.title, lang)}`
            : ''
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
