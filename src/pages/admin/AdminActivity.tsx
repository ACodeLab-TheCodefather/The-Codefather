import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import type { ActivityLogItem } from '../../types/cms';

export function AdminActivity() {
  const { mode, lang, t } = useAdmin();
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  useEffect(() => {
    fetch('/api/admin/activity', { credentials: 'include' })
      .then((r) => r.json())
      .then(setLogs)
      .catch(() => {});
  }, []);

  const isDark = mode === 'dark';
  const cardBg = isDark ? '#121216' : '#FFFFFF';
  const borderCol = isDark ? '#25252C' : '#E2E2E8';
  const muted = isDark ? '#9E9EA8' : '#646470';
  const gold = isDark ? '#D4AF37' : '#B68914';

  const actions = Array.from(new Set(logs.map((l) => l.action)));

  const filtered = logs.filter((l) => {
    if (actionFilter !== 'all' && l.action !== actionFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      l.action.toLowerCase().includes(q) ||
      l.adminUsername.toLowerCase().includes(q) ||
      l.details.toLowerCase().includes(q) ||
      l.resourceType.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold m-0">{t('navAdminActivity')}</h1>

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
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border text-xs font-semibold"
          style={{ backgroundColor: cardBg, borderColor: borderCol, color: 'inherit' }}
        >
          <option value="all">{t('all')}</option>
          {actions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      <div
        className="rounded-2xl border overflow-hidden"
        style={{ backgroundColor: cardBg, borderColor: borderCol }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse text-xs">
            <thead>
              <tr className="border-b" style={{ borderColor: borderCol, color: muted }}>
                <th className="py-3 px-4 text-start font-semibold">Action</th>
                <th className="py-3 px-4 text-start font-semibold">Actor</th>
                <th className="py-3 px-4 text-start font-semibold">Resource</th>
                <th className="py-3 px-4 text-start font-semibold">Details</th>
                <th className="py-3 px-4 text-end font-semibold">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: borderCol }}>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 px-4 font-mono-tabular font-bold" style={{ color: gold }}>
                    {item.action}
                  </td>
                  <td className="py-3 px-4">{item.adminUsername}</td>
                  <td className="py-3 px-4 font-mono-tabular">
                    {item.resourceType}
                    {item.resourceId ? `:${item.resourceId.slice(0, 12)}` : ''}
                  </td>
                  <td className="py-3 px-4" style={{ color: muted }}>
                    {item.details}
                  </td>
                  <td className="py-3 px-4 text-end font-mono-tabular" style={{ color: muted }}>
                    {new Date(item.createdAt).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
