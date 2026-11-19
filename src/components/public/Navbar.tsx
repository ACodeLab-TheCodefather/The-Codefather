import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Check, Globe, Menu, Palette, RotateCcw, X } from 'lucide-react';
import { usePublic } from '../../context/PublicContext';
import { OFFICIAL_THEMES } from '../../utils/themes';

export function Navbar() {
  const { lang, toggleLang, themeId, setThemeId, resetTheme, t, isPreview } = usePublic();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);

  const themeWrapRef = useRef<HTMLDivElement | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMenuOpen(false);
    setThemeOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setThemeOpen(false);
      }
    };
    const onPointerDown = (e: MouseEvent) => {
      if (themeOpen && themeWrapRef.current && !themeWrapRef.current.contains(e.target as Node)) {
        setThemeOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('mousedown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('mousedown', onPointerDown);
    };
  }, [themeOpen]);

  const links = [
    { to: '/', label: t('navHome') },
    { to: '/about', label: t('navAbout') },
    { to: '/projects', label: t('navProjects') },
    { to: '/contact', label: t('navContact') }
  ];

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <>
      {isPreview && (
        <div
          className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:end-6 z-50 flex items-center gap-3 px-4 py-2.5 rounded-xl border shadow-xl text-xs font-medium"
          style={{
            backgroundColor: '#111114',
            color: '#F5E6B3',
            borderColor: 'rgba(212, 175, 55, 0.5)'
          }}
        >
          <span>{t('previewBanner')}</span>
          <Link
            to="/admin"
            className="px-2.5 py-1 rounded-md font-semibold whitespace-nowrap"
            style={{ backgroundColor: '#D4AF37', color: '#111111' }}
          >
            {t('exitPreview')}
          </Link>
        </div>
      )}

      <header className="fixed top-3 inset-x-0 z-40 px-3 sm:px-6 pointer-events-none">
        <nav
          aria-label="Main navigation"
          className="pointer-events-auto max-w-[1180px] mx-auto h-16 px-3 sm:px-6 rounded-2xl flex items-center justify-between gap-2 sm:gap-4 border shadow-lg transition-colors duration-200"
          style={{
            backgroundColor: 'var(--cf-glass)',
            borderColor: 'var(--cf-border)',
            backdropFilter: 'blur(18px) saturate(145%)',
            WebkitBackdropFilter: 'blur(18px) saturate(145%)'
          }}
        >
          {/* Zone 1: Brand Wordmark */}
          <Link
            to="/"
            className="flex items-center gap-2 shrink-0 whitespace-nowrap no-underline min-w-0"
            style={{ color: 'var(--cf-text)' }}
          >
            <img
              src="/assets/aistudio/logo-mark_5d783479.png"
              alt="THE CODEFATHER"
              className="w-8 h-7 object-contain rounded-md shrink-0"
              referrerPolicy="no-referrer"
            />
            <span className="hidden min-[420px]:inline font-display font-bold tracking-wider text-xs sm:text-base whitespace-nowrap">
              THE CODEFATHER
            </span>
          </Link>

          {/* Zone 2: Clean single-line nav links */}
          <ul className="hidden md:flex items-center gap-1 list-none m-0 p-0">
            {links.map((item) => {
              const active = isActive(item.to);
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    aria-current={active ? 'page' : undefined}
                    className="px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 no-underline"
                    style={{
                      color: active ? 'var(--cf-text)' : 'var(--cf-muted)',
                      backgroundColor: active ? 'rgba(var(--cf-accent-rgb), 0.22)' : 'transparent'
                    }}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Zone 3: Theme Switcher + Language Switcher + Mobile Burger */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div ref={themeWrapRef} className="relative">
              <button
                type="button"
                onClick={() => setThemeOpen((prev) => !prev)}
                aria-expanded={themeOpen}
                aria-haspopup="dialog"
                aria-label={t('theme')}
                className="h-9 sm:h-10 px-2.5 sm:px-3 rounded-xl border text-xs sm:text-sm font-medium inline-flex items-center gap-1.5 sm:gap-2 cursor-pointer transition-colors whitespace-nowrap shrink-0"
                style={{
                  backgroundColor: 'transparent',
                  borderColor: themeOpen ? 'var(--cf-accent-2)' : 'var(--cf-border)',
                  color: 'var(--cf-text)'
                }}
              >
                <span
                  className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0 border"
                  style={{
                    backgroundColor: 'var(--cf-accent)',
                    borderColor: 'var(--cf-accent-2)'
                  }}
                />
                <Palette className="w-4 h-4 sm:hidden" />
                <span className="hidden sm:inline">{t('theme')}</span>
              </button>

              {themeOpen && (
                <div
                  role="dialog"
                  aria-label={t('themeTitle')}
                  className="fixed sm:absolute top-20 sm:top-[calc(100%+12px)] inset-x-3 sm:inset-x-auto sm:end-0 sm:w-[540px] rounded-2xl border p-4 shadow-2xl z-50"
                  style={{
                    backgroundColor: 'var(--cf-bg)',
                    borderColor: 'var(--cf-border)',
                    color: 'var(--cf-text)'
                  }}
                >
                  <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b" style={{ borderColor: 'var(--cf-border)' }}>
                    <div>
                      <h2 className="text-sm font-bold m-0">{t('themeTitle')}</h2>
                      <p className="text-xs m-0" style={{ color: 'var(--cf-muted)' }}>
                        {t('themeSubtitle')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={resetTheme}
                      className="px-3 py-1.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      style={{
                        borderColor: 'var(--cf-border)',
                        color: 'var(--cf-text)',
                        backgroundColor: 'var(--cf-surface)'
                      }}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      {t('themeReset')}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[60vh] overflow-y-auto pe-1">
                    {OFFICIAL_THEMES.map((theme) => {
                      const active = theme.id === themeId;
                      const [c1, c2, c3, c4] = theme.colors;
                      return (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => setThemeId(theme.id)}
                          aria-pressed={active}
                          className="p-2.5 rounded-xl border text-start cursor-pointer transition-transform duration-150 hover:scale-[1.01] flex flex-col gap-2"
                          style={{
                            backgroundColor: 'var(--cf-surface)',
                            borderColor: active ? 'var(--cf-accent-2)' : 'var(--cf-border)',
                            boxShadow: active ? '0 0 0 1px var(--cf-accent-2)' : 'none',
                            color: 'var(--cf-text)'
                          }}
                        >
                          <div
                            className="h-12 w-full rounded-lg p-2 flex flex-col justify-between relative overflow-hidden"
                            style={{ backgroundColor: c1 }}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className="h-2 w-12 rounded-sm block"
                                style={{ backgroundColor: c3 }}
                              />
                              {active && (
                                <span
                                  className="w-4 h-4 rounded-full grid place-items-center"
                                  style={{ backgroundColor: c4, color: '#111111' }}
                                >
                                  <Check className="w-2.5 h-2.5" />
                                </span>
                              )}
                            </div>
                            <span
                              className="h-2.5 w-8 rounded-sm block"
                              style={{ backgroundColor: c4 }}
                            />
                          </div>

                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-semibold truncate">{theme.name}</span>
                          </div>

                          <div className="grid grid-cols-4 h-1.5 rounded-full overflow-hidden">
                            <span style={{ backgroundColor: c1 }} />
                            <span style={{ backgroundColor: c2 }} />
                            <span style={{ backgroundColor: c3 }} />
                            <span style={{ backgroundColor: c4 }} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={toggleLang}
              lang={lang === 'ar' ? 'en' : 'ar'}
              className="h-9 sm:h-10 px-2.5 sm:px-3 rounded-xl border text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition-colors"
              style={{
                backgroundColor: 'transparent',
                borderColor: 'var(--cf-border)',
                color: 'var(--cf-text)'
              }}
            >
              <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: 'var(--cf-accent-2)' }} />
              <span>{t('langSwitch')}</span>
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label={t('menu')}
              aria-expanded={menuOpen}
              className="md:hidden h-9 w-9 rounded-xl border grid place-items-center cursor-pointer shrink-0"
              style={{
                borderColor: 'var(--cf-border)',
                color: 'var(--cf-text)',
                backgroundColor: 'transparent'
              }}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Navigation Drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <aside
            ref={drawerRef}
            aria-label="Mobile navigation"
            className="fixed top-0 bottom-0 end-0 w-[min(320px,85vw)] p-5 flex flex-col gap-2 border-s shadow-2xl"
            style={{
              backgroundColor: 'var(--cf-bg)',
              borderColor: 'var(--cf-border)',
              color: 'var(--cf-text)'
            }}
          >
            <div className="flex items-center justify-between pb-4 mb-2 border-b" style={{ borderColor: 'var(--cf-border)' }}>
              <span className="font-display font-bold tracking-wider text-sm">THE CODEFATHER</span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label={t('close')}
                className="w-10 h-10 rounded-xl border grid place-items-center cursor-pointer"
                style={{ borderColor: 'var(--cf-border)', color: 'var(--cf-text)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex flex-col gap-1.5">
              {links.map((item) => {
                const active = isActive(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className="px-4 py-3.5 rounded-xl text-base font-medium no-underline transition-colors"
                    style={{
                      backgroundColor: active ? 'rgba(var(--cf-accent-rgb), 0.25)' : 'transparent',
                      color: active ? 'var(--cf-text)' : 'var(--cf-muted)'
                    }}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
