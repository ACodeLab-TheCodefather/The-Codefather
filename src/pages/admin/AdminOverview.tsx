import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Bell, Eye, FolderKanban, Mail, Plus } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import type { ActivityLogItem, NotificationItem } from '../../types/cms';
import { getLocalizedText } from '../../utils/i18n';

interface OverviewPayload {
  stats: {
    totalProjects: number;
    publishedProjects: number;
    draftProjects: number;
    totalMessages: number;
    unreadMessages: number;
    totalSkills: number;
    totalEducation: number;
    totalBackups: number;
  };
  recentActivity: ActivityLogItem[];
  recentNotifications: NotificationItem[];
}

export function AdminOverview() {
  const { mode, lang, t } = useAdmin();
  const [data, setData] = useState<OverviewPayload | null>(null);

  useEffect(() => {
    fetch('/api/admin/overview', { credentials: 'include' })
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  const isDark = mode === 'dark';
  const cardBg = isDark ? '#121216' : '#FFFFFF';
  const borderCol = isDark ? '#25252C' : '#E2E2E8';
  const muted = isDark ? '#9E9EA8' : '#646470';
  const gold = isDark ? '#D4AF37' : '#B68914';

  if (!data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl border" style={{ backgroundColor: cardBg, borderColor: borderCol }} />
        ))}
      </div>
    );
  }

  const statCards = [
    { label: t('totalProjects'), value: data.stats.totalProjects, sub: `${t('publishedProjects')}: ${data.stats.publishedProjects} · ${t('draftProjects')}: ${data.stats.draftProjects}`, icon: FolderKanban },
    { label: t('publishedProjects'), value: data.stats.publishedProjects, sub: `${t('draftProjects')}: ${data.stats.draftProjects}`, icon: Eye },
    { label: t('totalMessages'), value: data.stats.totalMessages, sub: `${t('unreadMessages')}: ${data.stats.unreadMessages}`, icon: Mail },
    { label: t('unreadMessages'), value: data.stats.unreadMessages, sub: `${t('navAdminEducation')}: ${data.stats.totalEducation} · ${t('skillsTitle')}: ${data.stats.totalSkills}`, icon: Bell }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold m-0">{t('navOverview')}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/projects"
            className="px-4 py-2 rounded-xl text-xs font-bold no-underline inline-flex items-center gap-1.5"
            style={{ backgroundColor: gold, color: '#111111' }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('navAdminProjects')}</span>
          </Link>
          <Link
            to="/admin/messages"
            className="px-4 py-2 rounded-xl border text-xs font-semibold no-underline inline-flex items-center gap-1.5"
            style={{ borderColor: borderCol, color: 'inherit' }}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>{t('navAdminMessages')}</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((c, idx) => {
          const Icon = c.icon;
          return (
            <div
              key={idx}
              className="rounded-2xl border p-5 space-y-2"
              style={{ backgroundColor: cardBg, borderColor: borderCol }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold" style={{ color: muted }}>
                  {c.label}
                </span>
                <Icon className="w-4 h-4" style={{ color: gold }} />
              </div>
              <div className="font-mono-tabular text-3xl font-bold">{c.value}</div>
              <div className="text-xs" style={{ color: muted }}>
                {c.sub}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section
          className="rounded-2xl border p-5 sm:p-6 space-y-4"
          style={{ backgroundColor: cardBg, borderColor: borderCol }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold m-0 flex items-center gap-2">
              <Activity className="w-4 h-4" style={{ color: gold }} />
              <span>{t('recentActivity')}</span>
            </h2>
            <Link to="/admin/activity" className="text-xs font-semibold no-underline" style={{ color: gold }}>
              {t('all')}
            </Link>
          </div>
          <div className="divide-y" style={{ borderColor: borderCol }}>
            {data.recentActivity.length === 0 ? (
              <p className="text-xs py-4 m-0" style={{ color: muted }}>—</p>
            ) : (
              data.recentActivity.slice(0, 6).map((item) => (
                <div key={item.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <div className="font-bold truncate">{item.action}</div>
                    <div className="truncate" style={{ color: muted }}>
                      {item.adminUsername} · {item.details}
                    </div>
                  </div>
                  <span className="font-mono-tabular shrink-0" style={{ color: muted }}>
                    {new Date(item.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        <section
          className="rounded-2xl border p-5 sm:p-6 space-y-4"
          style={{ backgroundColor: cardBg, borderColor: borderCol }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold m-0 flex items-center gap-2">
              <Bell className="w-4 h-4" style={{ color: gold }} />
              <span>{t('recentNotifications')}</span>
            </h2>
          </div>
          <div className="space-y-2.5">
            {data.recentNotifications.length === 0 ? (
              <p className="text-xs py-4 m-0" style={{ color: muted }}>{t('noNotifications')}</p>
            ) : (
              data.recentNotifications.slice(0, 6).map((n) => (
                <div
                  key={n.id}
                  className="p-3 rounded-xl border text-xs space-y-1"
                  style={{ borderColor: n.isRead ? borderCol : gold }}
                >
                  <div className="font-bold">{getLocalizedText(n.title, lang)}</div>
                  <div style={{ color: muted }}>{getLocalizedText(n.body, lang)}</div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
