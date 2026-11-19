import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import {
  Activity,
  Bell,
  ChevronLeft,
  ChevronRight,
  Cpu,
  ExternalLink,
  Eye,
  FolderKanban,
  Globe,
  GraduationCap,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Moon,
  Settings,
  Sun,
  UserCog,
  X
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { getLocalizedText } from '../../utils/i18n';

export function AdminLayout() {
  const {
    loading,
    authenticated,
    admin,
    mode,
    toggleMode,
    lang,
    dir,
    toggleLang,
    t,
    notifications,
    unreadNotifsCount,
    refreshNotifications,
    adminFetch,
    logout
  } = useAdmin();

  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMobileOpen(false);
    setNotifOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (notifOpen && notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    window.addEventListener('mousedown', onPointerDown);
    return () => window.removeEventListener('mousedown', onPointerDown);
  }, [notifOpen]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#09090B] text-[#F5F5F7]">
        <div className="text-sm font-mono-tabular">Loading THE CODEFATHER Admin...</div>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  const isDark = mode === 'dark';
  const bgPage = isDark ? '#09090B' : '#F4F4F6';
  const bgSurface = isDark ? '#121216' : '#FFFFFF';
  const borderCol = isDark ? '#25252C' : '#E2E2E8';
  const textPrimary = isDark ? '#F5F5F7' : '#111115';
  const textMuted = isDark ? '#9E9EA8' : '#646470';
  const gold = isDark ? '#D4AF37' : '#B68914';

  const navItems = [
    { to: '/admin', label: t('navOverview'), icon: LayoutDashboard, exact: true },
    { to: '/admin/projects', label: t('navAdminProjects'), icon: FolderKanban },
    { to: '/admin/skills', label: t('navAdminSkills'), icon: Cpu },
    { to: '/admin/education', label: t('navAdminEducation'), icon: GraduationCap },
    { to: '/admin/messages', label: t('navAdminMessages'), icon: Mail },
    { to: '/admin/media', label: t('navAdminMedia'), icon: ImageIcon },
    { to: '/admin/profile', label: t('navAdminProfile'), icon: UserCog },
    { to: '/admin/settings', label: t('navAdminSettings'), icon: Settings },
    { to: '/admin/activity', label: t('navAdminActivity'), icon: Activity }
  ];

  const isRouteActive = (to: string, exact?: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  const CollapseIcon =
    dir === 'rtl'
      ? collapsed
        ? ChevronLeft
        : ChevronRight
      : collapsed
        ? ChevronRight
        : ChevronLeft;

  const markNotifRead = async (id: string) => {
    await adminFetch(`/api/admin/notifications/${id}/read`, { method: 'PATCH' });
    await refreshNotifications();
  };

  const markAllRead = async () => {
    await adminFetch('/api/admin/notifications/read-all', { method: 'POST' });
    await refreshNotifications();
  };

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="h-full flex flex-col">
      <div
        className="h-16 px-4 flex items-center justify-between gap-2 border-b shrink-0"
        style={{ borderColor: borderCol }}
      >
        <Link to="/admin" className="flex items-center gap-2.5 no-underline overflow-hidden" style={{ color: textPrimary }}>
          <img
            src="/assets/aistudio/logo-mark_5d783479.png"
            alt=""
            className="w-7 h-6 object-contain shrink-0"
          />
          {(!collapsed || isMobile) && (
            <span className="font-display font-bold text-sm tracking-wider truncate">
              CODEFATHER
            </span>
          )}
        </Link>

        {isMobile ? (
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label={t('close')}
            className="w-9 h-9 rounded-lg border grid place-items-center cursor-pointer"
            style={{ borderColor: borderCol, color: textPrimary, backgroundColor: 'transparent' }}
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label="Toggle sidebar"
            className="w-8 h-8 rounded-lg border grid place-items-center cursor-pointer shrink-0"
            style={{ borderColor: borderCol, color: textMuted, backgroundColor: 'transparent' }}
          >
            <CollapseIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = isRouteActive(item.to, item.exact);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              title={collapsed && !isMobile ? item.label : undefined}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium no-underline transition-colors"
              style={{
                backgroundColor: active ? 'rgba(212, 175, 55, 0.16)' : 'transparent',
                color: active ? gold : textMuted
              }}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {(!collapsed || isMobile) && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t space-y-2 shrink-0" style={{ borderColor: borderCol }}>
        {(!collapsed || isMobile) && admin && (
          <div className="px-3 py-2 rounded-xl text-xs" style={{ backgroundColor: bgPage }}>
            <div className="font-bold truncate">{admin.username}</div>
            <div className="truncate" style={{ color: textMuted }}>
              {admin.role}
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => void logout()}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer"
          style={{
            borderColor: borderCol,
            backgroundColor: 'transparent',
            color: textMuted
          }}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {(!collapsed || isMobile) && <span>{t('logout')}</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div
      className="min-h-screen flex transition-colors duration-200"
      style={{ backgroundColor: bgPage, color: textPrimary }}
    >
      {/* Desktop Collapsible Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 border-e transition-all duration-200 ${
          collapsed ? 'w-[76px]' : 'w-64'
        }`}
        style={{ backgroundColor: bgSurface, borderColor: borderCol }}
      >
        <div className="sticky top-0 h-screen">
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside
            className="fixed top-0 bottom-0 start-0 w-72 border-e shadow-2xl"
            style={{ backgroundColor: bgSurface, borderColor: borderCol }}
          >
            <SidebarContent isMobile />
          </aside>
        </div>
      )}

      {/* Main Column */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header
          className="sticky top-0 z-30 h-16 px-4 sm:px-6 border-b flex items-center justify-between gap-3"
          style={{ backgroundColor: bgSurface, borderColor: borderCol }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label={t('menu')}
              className="lg:hidden w-9 h-9 rounded-xl border grid place-items-center cursor-pointer"
              style={{ borderColor: borderCol, backgroundColor: 'transparent', color: textPrimary }}
            >
              <Menu className="w-4 h-4" />
            </button>
            <span className="font-display font-bold text-sm sm:text-base truncate" style={{ color: gold }}>
              {t('adminTitle')}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/?preview=1"
              className="h-9 px-3 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 no-underline whitespace-nowrap"
              style={{ borderColor: borderCol, color: textPrimary }}
            >
              <Eye className="w-3.5 h-3.5" style={{ color: gold }} />
              <span className="hidden sm:inline">{t('previewDrafts')}</span>
            </Link>

            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 px-3 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 no-underline whitespace-nowrap"
              style={{ borderColor: borderCol, color: textPrimary }}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{t('viewPublicSite')}</span>
            </a>

            {/* Notifications Popover */}
            <div ref={notifRef} className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((o) => !o)}
                aria-label={t('notifications')}
                className="h-9 w-9 rounded-xl border grid place-items-center relative cursor-pointer"
                style={{ borderColor: borderCol, backgroundColor: 'transparent', color: textPrimary }}
              >
                <Bell className="w-4 h-4" />
                {unreadNotifsCount > 0 && (
                  <span
                    className="absolute -top-1 -end-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold font-mono-tabular grid place-items-center"
                    style={{ backgroundColor: gold, color: '#111111' }}
                  >
                    {unreadNotifsCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div
                  className="absolute top-[calc(100%+10px)] end-0 w-[min(360px,90vw)] rounded-2xl border p-4 shadow-2xl z-40"
                  style={{ backgroundColor: bgSurface, borderColor: borderCol }}
                >
                  <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b" style={{ borderColor: borderCol }}>
                    <strong className="text-sm">{t('notifications')}</strong>
                    {unreadNotifsCount > 0 && (
                      <button
                        type="button"
                        onClick={() => void markAllRead()}
                        className="text-xs font-semibold bg-transparent border-0 cursor-pointer"
                        style={{ color: gold }}
                      >
                        {t('markAllRead')}
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-center py-4 m-0" style={{ color: textMuted }}>
                        {t('noNotifications')}
                      </p>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => void markNotifRead(n.id)}
                          className="w-full text-start p-2.5 rounded-xl border cursor-pointer block"
                          style={{
                            borderColor: n.isRead ? borderCol : gold,
                            backgroundColor: bgPage,
                            opacity: n.isRead ? 0.72 : 1,
                            color: textPrimary
                          }}
                        >
                          <div className="text-xs font-bold">{getLocalizedText(n.title, lang)}</div>
                          <div className="text-xs mt-0.5" style={{ color: textMuted }}>
                            {getLocalizedText(n.body, lang)}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={toggleMode}
              aria-label={isDark ? t('adminLightMode') : t('adminDarkMode')}
              className="h-9 px-2.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              style={{ borderColor: borderCol, backgroundColor: 'transparent', color: textPrimary }}
            >
              {isDark ? <Sun className="w-3.5 h-3.5" style={{ color: gold }} /> : <Moon className="w-3.5 h-3.5" style={{ color: gold }} />}
              <span className="hidden sm:inline">{isDark ? t('adminLightMode') : t('adminDarkMode')}</span>
            </button>

            <button
              type="button"
              onClick={toggleLang}
              className="h-9 px-2.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              style={{ borderColor: borderCol, backgroundColor: 'transparent', color: textPrimary }}
            >
              <Globe className="w-3.5 h-3.5" style={{ color: gold }} />
              <span>{t('langSwitch')}</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
