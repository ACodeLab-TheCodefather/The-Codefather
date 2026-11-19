import { useMemo, useState } from 'react';
import { usePublic } from '../../context/PublicContext';
import { ProjectCard } from '../../components/public/ProjectCard';
import { getLocalizedText } from '../../utils/i18n';

export function ProjectsPage() {
  const { data, lang, t } = usePublic();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = useMemo(() => {
    const list = data?.projects ?? [];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const p of list) {
      const cat = getLocalizedText(p.category, lang);
      if (cat && !seen.has(cat)) {
        seen.add(cat);
        out.push(cat);
      }
    }
    return out;
  }, [data?.projects, lang]);

  if (!data) return null;

  const filtered = data.projects.filter(
    (p) => selectedCategory === 'all' || getLocalizedText(p.category, lang) === selectedCategory
  );

  return (
    <div className="space-y-10 py-4">
      <header className="space-y-3 max-w-3xl">
        <h1 className="text-3xl sm:text-5xl font-bold m-0">{t('projectsTitle')}</h1>
        <p className="text-base sm:text-lg m-0" style={{ color: 'var(--cf-muted)' }}>
          {t('projectsSubtitle')}
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t('projectsTitle')}>
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          aria-pressed={selectedCategory === 'all'}
          className="px-4 py-2 rounded-xl border text-sm font-semibold cursor-pointer transition-colors whitespace-nowrap"
          style={{
            backgroundColor: selectedCategory === 'all' ? 'var(--cf-accent)' : 'transparent',
            color: selectedCategory === 'all' ? 'var(--cf-accent-text)' : 'var(--cf-text)',
            borderColor: selectedCategory === 'all' ? 'var(--cf-accent)' : 'var(--cf-border)'
          }}
        >
          {t('allCategories')}
        </button>
        {categories.map((cat) => {
          const active = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              aria-pressed={active}
              className="px-4 py-2 rounded-xl border text-sm font-semibold cursor-pointer transition-colors whitespace-nowrap"
              style={{
                backgroundColor: active ? 'var(--cf-accent)' : 'transparent',
                color: active ? 'var(--cf-accent-text)' : 'var(--cf-text)',
                borderColor: active ? 'var(--cf-accent)' : 'var(--cf-border)'
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div
          className="rounded-2xl border p-10 text-center"
          style={{ backgroundColor: 'var(--cf-surface)', borderColor: 'var(--cf-border)', color: 'var(--cf-muted)' }}
        >
          {t('projectsEmpty')}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
