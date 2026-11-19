import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Code2, Cpu, Database, Layers } from 'lucide-react';
import { usePublic } from '../../context/PublicContext';
import { EducationTimeline } from '../../components/public/EducationTimeline';
import { ProjectCard } from '../../components/public/ProjectCard';
import { getLocalizedText, isTranslationMissing } from '../../utils/i18n';

export function HomePage() {
  const { data, lang, dir, t } = usePublic();
  if (!data) return null;

  const { profile, skillCategories, skills, projects, settings } = data;
  const featured = projects.filter((p) => p.featured).slice(0, 3);
  const displayProjects = featured.length > 0 ? featured : projects.slice(0, 3);
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <div className="space-y-20 sm:space-y-28">
      {/* 1. Kinetic Hero Section (No large personal photo) */}
      <section className="min-h-[calc(100svh-140px)] flex items-center py-6">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 space-y-5"
          >
            <p className="font-display text-sm sm:text-base font-semibold m-0" style={{ color: 'var(--cf-accent-2)' }}>
              {t('heroGreeting')} {getLocalizedText(profile.name, lang)}
            </p>

            <h1 className="m-0 leading-[0.95]">
              <span
                className="block font-display font-medium text-2xl sm:text-4xl mb-1"
                style={{ color: 'var(--cf-muted)' }}
              >
                THE
              </span>
              <span
                className="block font-display font-bold text-5xl sm:text-7xl lg:text-8xl tracking-tight bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    'linear-gradient(105deg, var(--cf-text) 25%, var(--cf-accent) 72%, var(--cf-accent-2) 100%)'
                }}
              >
                CODEFATHER
              </span>
            </h1>

            <p
              className="font-display text-xs sm:text-sm tracking-[0.26em] uppercase m-0"
              style={{ color: 'var(--cf-muted)' }}
            >
              {settings.tagline || t('tagline')}
            </p>

            <p className="text-base sm:text-xl leading-relaxed max-w-2xl m-0" style={{ color: 'var(--cf-muted)' }}>
              {getLocalizedText(profile.intro, lang)}
            </p>

            {isTranslationMissing(profile.intro, lang) && (
              <p className="text-xs italic m-0" style={{ color: 'var(--cf-accent-2)' }}>
                {t('missingTranslation')}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/projects"
                className="px-6 py-3 rounded-xl font-bold text-sm sm:text-base no-underline inline-flex items-center gap-2 transition-transform duration-150 hover:-translate-y-0.5 shadow-lg"
                style={{
                  backgroundColor: 'var(--cf-accent)',
                  color: 'var(--cf-accent-text)'
                }}
              >
                <span>{t('viewProjects')}</span>
                <ArrowIcon className="w-4 h-4" />
              </Link>

              <Link
                to="/contact"
                className="px-6 py-3 rounded-xl font-bold text-sm sm:text-base no-underline border transition-colors duration-150"
                style={{
                  borderColor: 'var(--cf-border)',
                  color: 'var(--cf-text)',
                  backgroundColor: 'transparent'
                }}
              >
                {t('contactMe')}
              </Link>
            </div>
          </motion.div>

          {/* Architectural Brand Identity Emblem Frame (no personal photo) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5"
          >
            <div
              className="rounded-3xl border p-6 sm:p-8 relative overflow-hidden"
              style={{
                backgroundColor: 'var(--cf-surface)',
                borderColor: 'var(--cf-border)'
              }}
            >
              <div
                aria-hidden="true"
                className="absolute -top-20 -end-20 w-56 h-56 rounded-full blur-3xl opacity-30 pointer-events-none"
                style={{ backgroundColor: 'var(--cf-accent)' }}
              />
              <div
                aria-hidden="true"
                className="absolute -bottom-20 -start-20 w-56 h-56 rounded-full blur-3xl opacity-25 pointer-events-none"
                style={{ backgroundColor: 'var(--cf-accent-2)' }}
              />

              <div className="relative z-10 flex flex-col items-center text-center gap-6">
                <div
                  className="w-28 h-24 rounded-2xl border grid place-items-center p-2.5 overflow-hidden shadow-lg"
                  style={{
                    backgroundColor: '#0C0C0F',
                    borderColor: 'var(--cf-border)'
                  }}
                >
                  <img
                    src="/assets/aistudio/logo-mark_5d783479.png"
                    alt="THE CODEFATHER Brand Mark"
                    className="w-full h-full object-cover object-top scale-110"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="space-y-1.5">
                  <p className="font-display font-bold text-lg m-0" style={{ color: 'var(--cf-text)' }}>
                    {getLocalizedText(profile.role, lang)}
                  </p>
                  <p className="text-xs m-0" style={{ color: 'var(--cf-muted)' }}>
                    {getLocalizedText(profile.location, lang)} · {getLocalizedText(profile.availability, lang)}
                  </p>
                </div>

                {/* Live domain metrics from SQL */}
                <div
                  className="w-full grid grid-cols-3 gap-3 pt-5 border-t text-center"
                  style={{ borderColor: 'var(--cf-border)' }}
                >
                  <div>
                    <div className="font-mono-tabular text-2xl font-bold" style={{ color: 'var(--cf-accent-2)' }}>
                      {projects.length}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--cf-muted)' }}>
                      {t('navProjects')}
                    </div>
                  </div>
                  <div>
                    <div className="font-mono-tabular text-2xl font-bold" style={{ color: 'var(--cf-accent-2)' }}>
                      {skills.length}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--cf-muted)' }}>
                      {t('skillsTitle')}
                    </div>
                  </div>
                  <div>
                    <div className="font-mono-tabular text-2xl font-bold" style={{ color: 'var(--cf-accent-2)' }}>
                      20
                    </div>
                    <div className="text-xs" style={{ color: 'var(--cf-muted)' }}>
                      {t('theme')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. About Me Section */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl sm:text-4xl font-bold m-0 mb-2">{t('aboutTitle')}</h2>
          <p className="text-sm sm:text-base m-0" style={{ color: 'var(--cf-muted)' }}>
            {t('aboutSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {profile.aboutParagraphs.map((para, idx) => (
            <div
              key={idx}
              className="rounded-2xl border p-6 sm:p-7"
              style={{
                backgroundColor: 'var(--cf-surface)',
                borderColor: 'var(--cf-border)'
              }}
            >
              <p className="text-base leading-relaxed m-0" style={{ color: 'var(--cf-text)' }}>
                {getLocalizedText(para, lang)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Skills Icon Grid Overview */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-4xl font-bold m-0 mb-2">{t('skillsTitle')}</h2>
            <p className="text-sm sm:text-base m-0" style={{ color: 'var(--cf-muted)' }}>
              {t('skillsSubtitle')}
            </p>
          </div>
          <Link
            to="/about"
            className="inline-flex items-center gap-1.5 text-sm font-bold no-underline"
            style={{ color: 'var(--cf-accent-2)' }}
          >
            <span>{t('viewAllSkills')}</span>
            <ArrowIcon className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {skillCategories.map((cat, idx) => {
            const catSkills = skills.filter((s) => s.categoryId === cat.id);
            const IconComp = idx === 0 ? Code2 : idx === 1 ? Layers : idx === 2 ? Database : Cpu;
            return (
              <div
                key={cat.id}
                className="rounded-2xl border p-6 flex flex-col gap-4"
                style={{
                  backgroundColor: 'var(--cf-surface)',
                  borderColor: 'var(--cf-border)'
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-10 h-10 rounded-xl grid place-items-center shrink-0"
                    style={{
                      backgroundColor: 'rgba(var(--cf-accent-rgb), 0.2)',
                      color: 'var(--cf-accent-2)'
                    }}
                  >
                    <IconComp className="w-5 h-5" />
                  </span>
                  <h3 className="text-lg font-bold m-0">{getLocalizedText(cat.name, lang)}</h3>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {catSkills.map((sk) => (
                    <div
                      key={sk.id}
                      className="flex items-center gap-3 p-3 rounded-xl border"
                      style={{
                        backgroundColor: 'var(--cf-bg)',
                        borderColor: 'var(--cf-border)'
                      }}
                    >
                      <span
                        className="w-10 h-10 rounded-lg grid place-items-center font-mono-tabular text-xs font-bold shrink-0"
                        style={{
                          backgroundColor: 'var(--cf-accent)',
                          color: 'var(--cf-accent-text)'
                        }}
                      >
                        {sk.code}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold truncate">{sk.name}</div>
                        <div className="text-xs truncate" style={{ color: 'var(--cf-muted)' }}>
                          {getLocalizedText(sk.description, lang)}
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

      {/* 4. Featured Projects */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-4xl font-bold m-0 mb-2">{t('featuredTitle')}</h2>
            <p className="text-sm sm:text-base m-0" style={{ color: 'var(--cf-muted)' }}>
              {t('featuredSubtitle')}
            </p>
          </div>
          <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 text-sm font-bold no-underline"
            style={{ color: 'var(--cf-accent-2)' }}
          >
            <span>{t('viewAllProjects')}</span>
            <ArrowIcon className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </section>

      {/* 5. Approved Black & Gold Education Timeline (2006–2026) */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl sm:text-4xl font-bold m-0 mb-2">{t('eduTitle')}</h2>
          <p className="text-sm sm:text-base m-0" style={{ color: 'var(--cf-muted)' }}>
            {t('eduSubtitle')}
          </p>
        </div>
        <EducationTimeline />
      </section>

      {/* 6. Contact Call to Action */}
      <section
        className="rounded-3xl border p-8 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6"
        style={{
          backgroundColor: 'var(--cf-surface)',
          borderColor: 'var(--cf-accent)'
        }}
      >
        <div className="space-y-2 max-w-xl">
          <h2 className="text-2xl sm:text-3xl font-bold m-0">{t('ctaTitle')}</h2>
          <p className="text-sm sm:text-base m-0" style={{ color: 'var(--cf-muted)' }}>
            {t('ctaSubtitle')}
          </p>
        </div>
        <Link
          to="/contact"
          className="px-7 py-3.5 rounded-xl font-bold text-sm sm:text-base no-underline inline-flex items-center justify-center gap-2 shrink-0 transition-transform duration-150 hover:-translate-y-0.5"
          style={{
            backgroundColor: 'var(--cf-accent)',
            color: 'var(--cf-accent-text)'
          }}
        >
          <span>{t('ctaButton')}</span>
          <ArrowIcon className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}
