import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { usePublic } from '../../context/PublicContext';

export function NotFoundPage() {
  const { t } = usePublic();

  return (
    <section className="py-20 sm:py-28 flex flex-col items-center text-center gap-4">
      <p
        className="font-display font-bold text-7xl sm:text-9xl leading-none m-0 bg-clip-text text-transparent"
        style={{
          backgroundImage: 'linear-gradient(95deg, var(--cf-accent), var(--cf-accent-2))'
        }}
      >
        {t('notFoundCode')}
      </p>
      <h1 className="text-2xl sm:text-4xl font-bold m-0">{t('notFoundTitle')}</h1>
      <p className="text-sm sm:text-base max-w-md m-0" style={{ color: 'var(--cf-muted)' }}>
        {t('notFoundDesc')}
      </p>
      <Link
        to="/"
        className="mt-2 px-6 py-3 rounded-xl font-bold text-sm no-underline inline-flex items-center gap-2"
        style={{
          backgroundColor: 'var(--cf-accent)',
          color: 'var(--cf-accent-text)'
        }}
      >
        <Home className="w-4 h-4" />
        <span>{t('backHome')}</span>
      </Link>
    </section>
  );
}
