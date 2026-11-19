import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { AdminUser, Language, NotificationItem } from '../types/cms';
import { UI_STRINGS, type UiKey } from '../utils/i18n';

const LS_ADMIN_MODE = 'cf-admin-mode';
const LS_ADMIN_LANG = 'cf-admin-lang';

export type AdminThemeMode = 'dark' | 'light';

interface AdminAuthState {
  loading: boolean;
  setupRequired: boolean;
  authenticated: boolean;
  csrfToken: string | null;
  admin: AdminUser | null;
}

interface AdminContextValue extends AdminAuthState {
  mode: AdminThemeMode;
  toggleMode: () => void;
  lang: Language;
  dir: 'rtl' | 'ltr';
  toggleLang: () => void;
  t: (key: UiKey) => string;
  notifications: NotificationItem[];
  unreadNotifsCount: number;
  refreshAuth: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  adminFetch: (input: string, init?: RequestInit) => Promise<Response>;
  logout: () => Promise<void>;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<AdminThemeMode>(() => {
    const saved = localStorage.getItem(LS_ADMIN_MODE);
    return saved === 'light' ? 'light' : 'dark';
  });

  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem(LS_ADMIN_LANG);
    return saved === 'en' ? 'en' : 'ar';
  });

  const [auth, setAuth] = useState<AdminAuthState>({
    loading: true,
    setupRequired: false,
    authenticated: false,
    csrfToken: null,
    admin: null
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const refreshAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/auth/status', { credentials: 'include' });
      const data = await res.json();
      setAuth({
        loading: false,
        setupRequired: Boolean(data.setupRequired),
        authenticated: Boolean(data.authenticated),
        csrfToken: data.csrfToken ?? null,
        admin: data.admin ?? null
      });
    } catch {
      setAuth((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  const adminFetch = useCallback(
    async (input: string, init: RequestInit = {}) => {
      const headers = new Headers(init.headers);
      if (auth.csrfToken && init.method && init.method !== 'GET') {
        headers.set('x-csrf-token', auth.csrfToken);
      }
      if (init.body && typeof init.body === 'string' && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      return fetch(input, { ...init, credentials: 'include', headers });
    },
    [auth.csrfToken]
  );

  const refreshNotifications = useCallback(async () => {
    if (!auth.authenticated) return;
    try {
      const res = await fetch('/api/admin/notifications', { credentials: 'include' });
      if (res.ok) {
        setNotifications(await res.json());
      }
    } catch {
      // silent
    }
  }, [auth.authenticated]);

  useEffect(() => {
    void refreshAuth();
  }, [refreshAuth]);

  useEffect(() => {
    if (auth.authenticated) {
      void refreshNotifications();
    }
  }, [auth.authenticated, refreshNotifications]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  useEffect(() => {
    document.documentElement.classList.toggle('admin-dark', mode === 'dark');
    return () => {
      document.documentElement.classList.remove('admin-dark');
    };
  }, [mode]);

  const toggleMode = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem(LS_ADMIN_MODE, next);
      return next;
    });
  }, []);

  const toggleLang = useCallback(() => {
    setLang((prev) => {
      const next = prev === 'ar' ? 'en' : 'ar';
      localStorage.setItem(LS_ADMIN_LANG, next);
      return next;
    });
  }, []);

  const logout = useCallback(async () => {
    await adminFetch('/api/admin/auth/logout', { method: 'POST' });
    await refreshAuth();
  }, [adminFetch, refreshAuth]);

  const t = useCallback(
    (key: UiKey) => UI_STRINGS[lang][key] ?? UI_STRINGS.en[key],
    [lang]
  );

  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AdminContext.Provider
      value={{
        ...auth,
        mode,
        toggleMode,
        lang,
        dir: lang === 'ar' ? 'rtl' : 'ltr',
        toggleLang,
        t,
        notifications,
        unreadNotifsCount,
        refreshAuth,
        refreshNotifications,
        adminFetch,
        logout
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used inside AdminProvider');
  return ctx;
}
