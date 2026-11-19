import { Link } from 'react-router-dom';
import { usePublic } from '../../context/PublicContext';
import { getLocalizedText } from '../../utils/i18n';

export function Footer() {
  const { data, lang, t } = usePublic();
  const ownerName = getLocalizedText(data?.profile.name, lang) || 'THE CODEFATHER';
  const email = data?.profile.email || 'hello@example.com';

  return (
    <footer
      className="mt-20 border-t py-10 px-4"
      style={{ borderColor: 'var(--cf-border)', color: 'var(--cf-muted)' }}
    >
      <div className="max-w-[1180px] mx-auto flex flex-col items-center text-center gap-3">
        <div className="flex items-center gap-2.5">
          <img
            src="/assets/aistudio/logo-mark_5d783479.png"
            alt=""
            className="w-7 h-6 object-contain"
            referrerPolicy="no-referrer"
          />
          <span
            className="font-display font-bold tracking-widest text-sm"
            style={{ color: 'var(--cf-text)' }}
          >
            THE CODEFATHER
          </span>
        </div>

        <p className="font-display text-xs tracking-[0.24em] m-0">
          {data?.settings.tagline || t('tagline')}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 text-xs pt-1">
          <Link to="/" className="no-underline hover:underline" style={{ color: 'var(--cf-muted)' }}>
            {t('navHome')}
          </Link>
          <Link to="/about" className="no-underline hover:underline" style={{ color: 'var(--cf-muted)' }}>
            {t('navAbout')}
          </Link>
          <Link to="/projects" className="no-underline hover:underline" style={{ color: 'var(--cf-muted)' }}>
            {t('navProjects')}
          </Link>
          <Link to="/contact" className="no-underline hover:underline" style={{ color: 'var(--cf-muted)' }}>
            {t('navContact')}
          </Link>
        </div>

        <p className="text-xs m-0 pt-2">
          © {new Date().getFullYear()} {ownerName} · {t('rights')} ·{' '}
          <a href={`mailto:${email}`} className="no-underline hover:underline" style={{ color: 'var(--cf-accent-2)' }}>
            {email}
          </a>
        </p>
      </div>
    </footer>
  );
}
