import { usePublic } from '../../context/PublicContext';
import { EducationTimeline } from '../../components/public/EducationTimeline';
import { getLocalizedText } from '../../utils/i18n';

export function AboutPage() {
  const { data, lang, t } = usePublic();
  if (!data) return null;

  const { profile, skillCategories, skills } = data;

  return (
    <div className="space-y-16 py-4">
      <header className="space-y-3 max-w-3xl">
        <h1 className="text-3xl sm:text-5xl font-bold m-0">{t('aboutTitle')}</h1>
        <p className="text-lg sm:text-xl m-0" style={{ color: 'var(--cf-muted)' }}>
          {getLocalizedText(profile.role, lang)}
        </p>
      </header>

      <section
        className="rounded-2xl border p-6 sm:p-8 space-y-4"
        style={{
          backgroundColor: 'var(--cf-surface)',
          borderColor: 'var(--cf-border)'
        }}
      >
        {profile.aboutParagraphs.map((para, i) => (
          <p key={i} className="text-base sm:text-lg leading-relaxed m-0">
            {getLocalizedText(para, lang)}
          </p>
        ))}
        <div
          className="pt-4 mt-4 border-t flex flex-wrap gap-6 text-sm"
          style={{ borderColor: 'var(--cf-border)', color: 'var(--cf-muted)' }}
        >
          <span>{getLocalizedText(profile.location, lang)}</span>
          <span>·</span>
          <span>{getLocalizedText(profile.availability, lang)}</span>
          <span>·</span>
          <a href={`mailto:${profile.email}`} className="no-underline font-medium" style={{ color: 'var(--cf-accent-2)' }}>
            {profile.email}
          </a>
        </div>
      </section>

      <section className="space-y-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold m-0 mb-2">{t('skillsTitle')}</h2>
          <p className="text-sm sm:text-base m-0" style={{ color: 'var(--cf-muted)' }}>
            {t('skillsSubtitle')}
          </p>
        </div>

        <div className="space-y-8">
          {skillCategories.map((cat) => {
            const catSkills = skills.filter((s) => s.categoryId === cat.id);
            return (
              <div key={cat.id} className="space-y-4">
                <h3 className="text-xl font-bold m-0" style={{ color: 'var(--cf-accent-2)' }}>
                  {getLocalizedText(cat.name, lang)}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {catSkills.map((sk) => (
                    <div
                      key={sk.id}
                      className="rounded-2xl border p-5 flex items-start gap-4"
                      style={{
                        backgroundColor: 'var(--cf-surface)',
                        borderColor: 'var(--cf-border)'
                      }}
                    >
                      <span
                        className="w-11 h-11 rounded-xl grid place-items-center font-mono-tabular text-sm font-bold shrink-0"
                        style={{
                          backgroundColor: 'var(--cf-accent)',
                          color: 'var(--cf-accent-text)'
                        }}
                      >
                        {sk.code}
                      </span>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <strong className="text-base truncate">{sk.name}</strong>
                          <span className="font-mono-tabular text-xs" style={{ color: 'var(--cf-muted)' }}>
                            {sk.level}%
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm m-0" style={{ color: 'var(--cf-muted)' }}>
                          {getLocalizedText(sk.description, lang)}
                        </p>
                        <div
                          className="h-1.5 w-full rounded-full overflow-hidden"
                          style={{ backgroundColor: 'var(--cf-surface-2)' }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${sk.level}%`,
                              background: 'linear-gradient(90deg, var(--cf-accent), var(--cf-accent-2))'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold m-0 mb-2">{t('eduTitle')}</h2>
          <p className="text-sm sm:text-base m-0" style={{ color: 'var(--cf-muted)' }}>
            {t('eduSubtitle')}
          </p>
        </div>
        <EducationTimeline />
      </section>
    </div>
  );
}
