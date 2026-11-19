import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ExternalLink, Github } from 'lucide-react';
import { usePublic } from '../../context/PublicContext';
import { ProjectCard } from '../../components/public/ProjectCard';
import { NotFoundPage } from './NotFoundPage';
import { getLocalizedText, isTranslationMissing } from '../../utils/i18n';

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, lang, dir, t } = usePublic();
  if (!data) return null;

  const project = data.projects.find((p) => p.id === id);
  if (!project) return <NotFoundPage />;

  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;
  const title = getLocalizedText(project.title, lang);
  const fullDesc = getLocalizedText(project.fullDescription, lang);
  const category = getLocalizedText(project.category, lang);

  const related = data.projects
    .filter((p) => p.id !== project.id && getLocalizedText(p.category, lang) === category)
    .slice(0, 2);

  return (
    <div className="space-y-12 py-4">
      <header className="space-y-4">
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-sm font-bold no-underline"
          style={{ color: 'var(--cf-accent-2)' }}
        >
          <BackIcon className="w-4 h-4" />
          <span>{t('backToProjects')}</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2 text-sm" style={{ color: 'var(--cf-muted)' }}>
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

        <h1 className="text-3xl sm:text-5xl font-bold m-0">{title}</h1>

        {isTranslationMissing(project.title, lang) && (
          <p className="text-xs italic m-0" style={{ color: 'var(--cf-accent-2)' }}>
            {t('missingTranslation')}
          </p>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-4">
          <figure
            className="m-0 rounded-2xl border overflow-hidden aspect-video"
            style={{
              backgroundColor: 'var(--cf-surface)',
              borderColor: 'var(--cf-border)'
            }}
          >
            {project.imageUrl ? (
              <img
                src={project.imageUrl}
                alt={title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full grid place-items-center font-display text-6xl font-bold"
                style={{
                  background: 'linear-gradient(135deg, var(--cf-accent), var(--cf-accent-2))',
                  color: 'var(--cf-accent-text)'
                }}
              >
                {project.code}
              </div>
            )}
          </figure>

          {project.gallery.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {project.gallery.map((imgUrl, idx) => (
                <figure
                  key={idx}
                  className="m-0 rounded-xl border overflow-hidden aspect-video"
                  style={{ borderColor: 'var(--cf-border)' }}
                >
                  <img
                    src={imgUrl}
                    alt={`${title} ${idx + 1}`}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </figure>
              ))}
            </div>
          )}
        </div>

        <aside
          className="lg:col-span-5 rounded-2xl border p-6 sm:p-7 space-y-6"
          style={{
            backgroundColor: 'var(--cf-surface)',
            borderColor: 'var(--cf-border)'
          }}
        >
          <div className="space-y-3">
            <h2 className="text-xl font-bold m-0">{t('projectsTitle')}</h2>
            <p className="text-base leading-relaxed m-0" style={{ color: 'var(--cf-muted)' }}>
              {fullDesc}
            </p>
          </div>

          <div className="space-y-2.5 pt-4 border-t" style={{ borderColor: 'var(--cf-border)' }}>
            <h3 className="text-sm font-bold m-0">{t('technologies')}</h3>
            <p className="text-sm font-mono-tabular m-0" style={{ color: 'var(--cf-text)' }}>
              {project.technologies.join(' · ')}
            </p>
          </div>

          {(project.liveUrl || project.sourceUrl) && (
            <div className="space-y-3 pt-4 border-t" style={{ borderColor: 'var(--cf-border)' }}>
              <h3 className="text-sm font-bold m-0">{t('projectLinks')}</h3>
              <div className="flex flex-wrap gap-3">
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl text-sm font-bold no-underline inline-flex items-center gap-2"
                    style={{
                      backgroundColor: 'var(--cf-accent)',
                      color: 'var(--cf-accent-text)'
                    }}
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>{t('liveDemo')}</span>
                  </a>
                )}
                {project.sourceUrl && (
                  <a
                    href={project.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl text-sm font-bold no-underline border inline-flex items-center gap-2"
                    style={{
                      borderColor: 'var(--cf-border)',
                      color: 'var(--cf-text)'
                    }}
                  >
                    <Github className="w-4 h-4" />
                    <span>{t('sourceCode')}</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>

      {related.length > 0 && (
        <section className="space-y-6 pt-6">
          <h2 className="text-2xl sm:text-3xl font-bold m-0">{t('relatedProjects')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {related.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
