import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { usePublic } from '../../context/PublicContext';
import type { ProjectItem } from '../../types/cms';
import { getLocalizedText, isTranslationMissing } from '../../utils/i18n';

export function ProjectCard({ project }: { project: ProjectItem }) {
  const { lang, dir, t } = usePublic();
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;
  const title = getLocalizedText(project.title, lang);
  const shortDesc = getLocalizedText(project.shortDescription, lang);
  const category = getLocalizedText(project.category, lang);

  return (
    <article
      className="group rounded-2xl border overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-1"
      style={{
        backgroundColor: 'var(--cf-surface)',
        borderColor: 'var(--cf-border)'
      }}
    >
      <Link
        to={`/projects/${encodeURIComponent(project.id)}`}
        className="block aspect-video overflow-hidden relative"
        style={{ backgroundColor: 'var(--cf-surface-2)' }}
        tabIndex={-1}
        aria-hidden="true"
      >
        {project.imageUrl ? (
          <img
            src={project.imageUrl}
            alt={title}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div
            className="w-full h-full grid place-items-center font-display text-3xl font-bold"
            style={{
              background: 'linear-gradient(135deg, var(--cf-accent), var(--cf-accent-2))',
              color: 'var(--cf-accent-text)'
            }}
          >
            {project.code}
          </div>
        )}
      </Link>

      <div className="p-5 sm:p-6 flex flex-col flex-1 gap-2.5">
        {/* Zero-pill clean unboxed metadata */}
        <div
          className="flex items-center gap-2 text-xs font-medium"
          style={{ color: 'var(--cf-muted)' }}
        >
          <span>{category}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono-tabular">{project.year}</span>
          {project.status === 'draft' && (
            <>
              <span aria-hidden="true">·</span>
              <span style={{ color: 'var(--cf-accent-2)' }}>{t('draftBadge')}</span>
            </>
          )}
        </div>

        <h3 className="text-lg sm:text-xl font-bold m-0">
          <Link
            to={`/projects/${encodeURIComponent(project.id)}`}
            className="no-underline transition-colors"
            style={{ color: 'var(--cf-text)' }}
          >
            {title}
          </Link>
        </h3>

        <p className="text-sm leading-relaxed m-0 flex-1" style={{ color: 'var(--cf-muted)' }}>
          {shortDesc}
        </p>

        {isTranslationMissing(project.title, lang) && (
          <span className="text-xs italic" style={{ color: 'var(--cf-accent-2)' }}>
            {t('missingTranslation')}
          </span>
        )}

        <div className="pt-2 flex items-center justify-between gap-3">
          <span className="text-xs font-mono-tabular truncate" style={{ color: 'var(--cf-muted)' }}>
            {project.technologies.slice(0, 3).join(' · ')}
          </span>
          <Link
            to={`/projects/${encodeURIComponent(project.id)}`}
            className="inline-flex items-center gap-1.5 text-sm font-bold no-underline whitespace-nowrap shrink-0"
            style={{ color: 'var(--cf-accent-2)' }}
          >
            <span>{t('viewDetails')}</span>
            <ArrowIcon className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
