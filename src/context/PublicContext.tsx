import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Language, PublicBootstrapPayload } from '../types/cms';
import { UI_STRINGS, getLocalizedText, type UiKey } from '../utils/i18n';
import {
  DEFAULT_THEME_ID,
  OFFICIAL_THEMES,
  applyThemeToDocument,
  type ThemeTokens
} from '../utils/themes';

const LS_LANG = 'cf-public-lang';
const LS_THEME = 'cf-public-theme';

interface PublicContextValue {
  data: PublicBootstrapPayload | null;
  loading: boolean;
  error: string | null;
  lang: Language;
  dir: 'rtl' | 'ltr';
  themeId: string;
  tokens: ThemeTokens;
  isPreview: boolean;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  setThemeId: (id: string) => void;
  resetTheme: () => void;
  t: (key: UiKey) => string;
  reload: () => Promise<void>;
}

const PublicContext = createContext<PublicContextValue | null>(null);

export function PublicProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<PublicBootstrapPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem(LS_LANG);
    return saved === 'en' || saved === 'ar' ? saved : 'ar';
  });

  const [themeId, setThemeIdState] = useState<string>(() => {
    const saved = localStorage.getItem(LS_THEME);
    if (saved && OFFICIAL_THEMES.some((t) => t.id === saved)) return saved;
    return DEFAULT_THEME_ID;
  });

  const isPreview = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('preview') === '1';
  }, []);

  const tokens = useMemo(() => applyThemeToDocument(themeId), [themeId]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = isPreview ? '/api/admin/preview' : '/api/public/bootstrap';
      const res = await fetch(endpoint, { credentials: 'include' });
      if (isPreview && res.status === 401) {
        // Fallback safely to public published data if unauthenticated
        const pubRes = await fetch('/api/public/bootstrap');
        const pubJson = (await pubRes.json()) as PublicBootstrapPayload;
        setData(pubJson);
        return;
      }
      if (!res.ok) throw new Error('Failed to load site data.');
      const json = (await res.json()) as PublicBootstrapPayload;
      setData(json);

      // Respect configured default language & theme when user has no local override
      if (!localStorage.getItem(LS_LANG) && json.settings?.defaultLanguage) {
        setLangState(json.settings.defaultLanguage);
      }
      if (
        !localStorage.getItem(LS_THEME) &&
        json.settings?.defaultTheme &&
        OFFICIAL_THEMES.some((t) => t.id === json.settings.defaultTheme)
      ) {
        setThemeIdState(json.settings.defaultTheme);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load website content.');
    } finally {
      setLoading(false);
    }
  }, [isPreview]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    applyThemeToDocument(themeId);
    window.dispatchEvent(new CustomEvent('cf-theme-change', { detail: themeId }));
  }, [themeId]);

  useEffect(() => {
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;

    if (data) {
      const title = getLocalizedText(data.settings.seoTitle, lang) || 'THE CODEFATHER';
      const desc = getLocalizedText(data.settings.seoDescription, lang);
      document.title = title;
      document.querySelector('meta[name="description"]')?.setAttribute('content', desc);
      document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
      document.querySelector('meta[property="og:description"]')?.setAttribute('content', desc);
      document.querySelector('meta[property="og:image"]')?.setAttribute('content', data.settings.ogImage || '/assets/aistudio/og-banner_5b1263c1.jpg');

      const canonicalUrl = window.location.origin + window.location.pathname;
      let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.rel = 'canonical';
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.href = canonicalUrl;
    }
  }, [lang, data]);

  const setLang = useCallback((next: Language) => {
    localStorage.setItem(LS_LANG, next);
    setLangState(next);
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === 'ar' ? 'en' : 'ar');
  }, [lang, setLang]);

  const setThemeId = useCallback((id: string) => {
    if (!OFFICIAL_THEMES.some((t) => t.id === id)) return;
    localStorage.setItem(LS_THEME, id);
    setThemeIdState(id);
  }, []);

  const resetTheme = useCallback(() => {
    const target = data?.settings?.defaultTheme || DEFAULT_THEME_ID;
    localStorage.setItem(LS_THEME, target);
    setThemeIdState(target);
  }, [data]);

  const t = useCallback(
    (key: UiKey) => UI_STRINGS[lang][key] ?? UI_STRINGS.en[key],
    [lang]
  );

  const value: PublicContextValue = {
    data,
    loading,
    error,
    lang,
    dir: lang === 'ar' ? 'rtl' : 'ltr',
    themeId,
    tokens,
    isPreview: Boolean(data?.isPreview),
    setLang,
    toggleLang,
    setThemeId,
    resetTheme,
    t,
    reload
  };

  return <PublicContext.Provider value={value}>{children}</PublicContext.Provider>;
}

export function usePublic(): PublicContextValue {
  const ctx = useContext(PublicContext);
  if (!ctx) throw new Error('usePublic must be used inside PublicProvider');
  return ctx;
}
