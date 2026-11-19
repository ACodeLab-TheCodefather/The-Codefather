import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { useAdmin } from '../../context/AdminContext';
import type { SkillCategory, SkillItem } from '../../types/cms';
import { getLocalizedText } from '../../utils/i18n';

export function AdminSkills() {
  const { mode, lang, t, adminFetch } = useAdmin();
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [newCatAr, setNewCatAr] = useState('');
  const [newCatEn, setNewCatEn] = useState('');
  const [skillForm, setSkillForm] = useState({
    categoryId: '',
    name: '',
    code: 'SK',
    level: 80,
    descAr: '',
    descEn: ''
  });
  const [deleteSkill, setDeleteSkill] = useState<SkillItem | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/skills', { credentials: 'include' });
    if (res.ok) {
      const json = await res.json();
      setCategories(json.categories);
      setSkills(json.skills);
      if (json.categories.length > 0 && !skillForm.categoryId) {
        setSkillForm((f) => ({ ...f, categoryId: json.categories[0].id }));
      }
    }
  }, [skillForm.categoryId]);

  useEffect(() => {
    void load();
  }, [load]);

  const isDark = mode === 'dark';
  const cardBg = isDark ? '#121216' : '#FFFFFF';
  const pageBg = isDark ? '#09090B' : '#F4F4F6';
  const borderCol = isDark ? '#25252C' : '#E2E2E8';
  const muted = isDark ? '#9E9EA8' : '#646470';
  const gold = isDark ? '#D4AF37' : '#B68914';

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatAr.trim() && !newCatEn.trim()) return;
    await adminFetch('/api/admin/skill-categories', {
      method: 'POST',
      body: JSON.stringify({ name: { ar: newCatAr.trim(), en: newCatEn.trim() }, sortOrder: categories.length + 1 })
    });
    setNewCatAr('');
    setNewCatEn('');
    await load();
  };

  const addSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillForm.name.trim() || !skillForm.categoryId) return;
    await adminFetch('/api/admin/skills', {
      method: 'POST',
      body: JSON.stringify({
        categoryId: skillForm.categoryId,
        name: skillForm.name.trim(),
        code: skillForm.code.trim(),
        level: Number(skillForm.level),
        description: { ar: skillForm.descAr.trim(), en: skillForm.descEn.trim() },
        sortOrder: skills.length + 1
      })
    });
    setSkillForm((f) => ({ ...f, name: '', code: 'SK', level: 80, descAr: '', descEn: '' }));
    await load();
  };

  const confirmDeleteSkill = async () => {
    if (!deleteSkill) return;
    await adminFetch(`/api/admin/skills/${encodeURIComponent(deleteSkill.id)}`, {
      method: 'DELETE'
    });
    setDeleteSkill(null);
    await load();
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl sm:text-3xl font-bold m-0">{t('navAdminSkills')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form
          onSubmit={addCategory}
          className="rounded-2xl border p-5 space-y-3"
          style={{ backgroundColor: cardBg, borderColor: borderCol }}
        >
          <h2 className="text-base font-bold m-0">
            {lang === 'ar' ? 'إضافة فئة مهارات' : 'Add Skill Category'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              placeholder="اسم الفئة (AR)"
              value={newCatAr}
              onChange={(e) => setNewCatAr(e.target.value)}
              className="px-3 py-2 rounded-xl border text-sm"
              style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
            />
            <input
              placeholder="Category Name (EN)"
              value={newCatEn}
              onChange={(e) => setNewCatEn(e.target.value)}
              className="px-3 py-2 rounded-xl border text-sm"
              style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-xs font-bold border-0 cursor-pointer inline-flex items-center gap-1.5"
            style={{ backgroundColor: gold, color: '#111111' }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('addNew')}</span>
          </button>
        </form>

        <form
          onSubmit={addSkill}
          className="rounded-2xl border p-5 space-y-3"
          style={{ backgroundColor: cardBg, borderColor: borderCol }}
        >
          <h2 className="text-base font-bold m-0">
            {lang === 'ar' ? 'إضافة مهارة جديدة' : 'Add Skill'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <select
              value={skillForm.categoryId}
              onChange={(e) => setSkillForm({ ...skillForm, categoryId: e.target.value })}
              className="px-3 py-2 rounded-xl border text-sm"
              style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {getLocalizedText(c.name, lang)}
                </option>
              ))}
            </select>
            <input
              placeholder="Skill Name"
              required
              value={skillForm.name}
              onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })}
              className="px-3 py-2 rounded-xl border text-sm"
              style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
            />
            <div className="flex gap-2">
              <input
                placeholder="Code"
                maxLength={4}
                value={skillForm.code}
                onChange={(e) => setSkillForm({ ...skillForm, code: e.target.value })}
                className="w-1/2 px-3 py-2 rounded-xl border text-sm font-mono-tabular"
                style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
              />
              <input
                type="number"
                min={0}
                max={100}
                value={skillForm.level}
                onChange={(e) => setSkillForm({ ...skillForm, level: Number(e.target.value) })}
                className="w-1/2 px-3 py-2 rounded-xl border text-sm font-mono-tabular"
                style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <input
              placeholder="الوصف (AR)"
              value={skillForm.descAr}
              onChange={(e) => setSkillForm({ ...skillForm, descAr: e.target.value })}
              className="px-3 py-2 rounded-xl border text-sm"
              style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
            />
            <input
              placeholder="Description (EN)"
              value={skillForm.descEn}
              onChange={(e) => setSkillForm({ ...skillForm, descEn: e.target.value })}
              className="px-3 py-2 rounded-xl border text-sm"
              style={{ backgroundColor: pageBg, borderColor: borderCol, color: 'inherit' }}
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-xs font-bold border-0 cursor-pointer inline-flex items-center gap-1.5"
            style={{ backgroundColor: gold, color: '#111111' }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('addNew')}</span>
          </button>
        </form>
      </div>

      <div className="space-y-4">
        {categories.map((cat) => {
          const items = skills.filter((s) => s.categoryId === cat.id);
          return (
            <div
              key={cat.id}
              className="rounded-2xl border p-5 space-y-3"
              style={{ backgroundColor: cardBg, borderColor: borderCol }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold m-0" style={{ color: gold }}>
                  {getLocalizedText(cat.name, lang)}
                </h3>
                <span className="text-xs font-mono-tabular" style={{ color: muted }}>
                  {items.length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((sk) => (
                  <div
                    key={sk.id}
                    className="p-3 rounded-xl border flex items-center justify-between gap-3"
                    style={{ backgroundColor: pageBg, borderColor: borderCol }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="w-9 h-9 rounded-lg grid place-items-center text-xs font-bold font-mono-tabular shrink-0"
                        style={{ backgroundColor: gold, color: '#111111' }}
                      >
                        {sk.code}
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-bold truncate">
                          {sk.name} <span className="font-mono-tabular text-xs opacity-70">{sk.level}%</span>
                        </div>
                        <div className="text-xs truncate" style={{ color: muted }}>
                          {getLocalizedText(sk.description, lang)}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label={`${t('delete')} ${sk.name}`}
                      onClick={() => setDeleteSkill(sk)}
                      className="p-1.5 rounded-lg border text-red-400 cursor-pointer shrink-0"
                      style={{ borderColor: borderCol, backgroundColor: 'transparent' }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={Boolean(deleteSkill)}
        title={t('confirmDelete')}
        description={deleteSkill ? `${t('delete')}: ${deleteSkill.name}` : ''}
        onCancel={() => setDeleteSkill(null)}
        onConfirm={() => void confirmDeleteSkill()}
      />
    </div>
  );
}
