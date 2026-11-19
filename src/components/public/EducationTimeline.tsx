import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, GraduationCap } from 'lucide-react';
import { usePublic } from '../../context/PublicContext';
import type { EducationEvent } from '../../types/cms';
import { getLocalizedText, isTranslationMissing } from '../../utils/i18n';

interface YearGroup {
  year: number;
  events: EducationEvent[];
}

export function EducationTimeline() {
  const { data, lang, dir, t } = usePublic();
  const groups: YearGroup[] = useMemo(() => {
    const list = (data?.education ?? [])
      .slice()
      .sort((a, b) => a.year - b.year || a.sortOrder - b.sortOrder);
    const map = new Map<number, EducationEvent[]>();
    for (const ev of list) {
      const arr = map.get(ev.year) ?? [];
      arr.push(ev);
      map.set(ev.year, arr);
    }
    return Array.from(map.entries()).map(([year, events]) => ({ year, events }));
  }, [data?.education]);

  const [yearIdx, setYearIdx] = useState(0);
  const [eventIdx, setEventIdx] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  if (groups.length === 0) {
    return (
      <div
        className="rounded-2xl border p-8 text-center"
        style={{
          backgroundColor: '#0A0A0C',
          borderColor: 'rgba(212, 175, 55, 0.28)',
          color: '#E5DEC9'
        }}
      >
        <p className="m-0 text-sm">{t('eduEmpty')}</p>
      </div>
    );
  }

  const safeYearIdx = Math.min(yearIdx, groups.length - 1);
  const activeGroup = groups[safeYearIdx];
  const safeEventIdx = Math.min(eventIdx, activeGroup.events.length - 1);
  const activeEvent = activeGroup.events[safeEventIdx];

  const isStart = safeYearIdx === 0 && safeEventIdx === 0;
  const isEnd =
    safeYearIdx === groups.length - 1 && safeEventIdx === activeGroup.events.length - 1;

  const selectYear = (idx: number) => {
    setDirection(idx >= safeYearIdx ? 1 : -1);
    setYearIdx(idx);
    setEventIdx(0);
  };

  const step = (delta: 1 | -1) => {
    setDirection(delta);
    if (delta > 0) {
      if (safeEventIdx < activeGroup.events.length - 1) {
        setEventIdx(safeEventIdx + 1);
      } else if (safeYearIdx < groups.length - 1) {
        setYearIdx(safeYearIdx + 1);
        setEventIdx(0);
      }
    } else {
      if (safeEventIdx > 0) {
        setEventIdx(safeEventIdx - 1);
      } else if (safeYearIdx > 0) {
        const prevGroup = groups[safeYearIdx - 1];
        setYearIdx(safeYearIdx - 1);
        setEventIdx(prevGroup.events.length - 1);
      }
    }
  };

  const PrevIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;
  const NextIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;

  return (
    <div
      className="rounded-2xl border p-5 sm:p-8 shadow-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(155deg, #09090B 0%, #12110E 55%, #09090B 100%)',
        borderColor: 'rgba(212, 175, 55, 0.35)',
        color: '#F5EFE0'
      }}
    >
      {/* Year Rail — Horizontal on desktop, Vertical on mobile; only populated years shown */}
      <div
        role="tablist"
        aria-label={t('eduTitle')}
        className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4 pb-2 md:pb-4"
      >
        {/* Rail line */}
        <div
          aria-hidden="true"
          className="hidden md:block absolute top-3 inset-x-4 h-[2px]"
          style={{
            background:
              'linear-gradient(90deg, rgba(212,175,55,0.15), rgba(212,175,55,0.85), rgba(212,175,55,0.15))'
          }}
        />
        <div
          aria-hidden="true"
          className="md:hidden absolute top-3 bottom-3 start-[11px] w-[2px]"
          style={{
            background:
              'linear-gradient(180deg, rgba(212,175,55,0.2), rgba(212,175,55,0.85), rgba(212,175,55,0.2))'
          }}
        />

        {groups.map((group, idx) => {
          const active = idx === safeYearIdx;
          return (
            <button
              key={group.year}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => selectYear(idx)}
              className="relative z-10 flex md:flex-col items-center gap-3 md:gap-2.5 py-1.5 md:py-0 px-1 bg-transparent border-0 cursor-pointer group shrink-0"
              style={{
                color: active ? '#F3D578' : '#9C9278'
              }}
            >
              <span
                className="w-6 h-6 rounded-full border-2 grid place-items-center transition-all duration-200"
                style={{
                  backgroundColor: active ? '#D4AF37' : '#09090B',
                  borderColor: active ? '#F3D578' : 'rgba(212, 175, 55, 0.45)',
                  boxShadow: active ? '0 0 0 6px rgba(212, 175, 55, 0.18)' : 'none'
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: active ? '#09090B' : '#D4AF37' }}
                />
              </span>
              <span className="font-mono-tabular text-sm sm:text-base font-bold tracking-wide">
                {group.year}
              </span>
              {group.events.length > 1 && (
                <span className="text-[11px] font-mono-tabular opacity-75">
                  ({group.events.length})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Event Presentation Card: Image on Left, Details on Right (stacks on mobile) */}
      <AnimatePresence mode="wait">
        <motion.article
          key={activeEvent.id}
          initial={{ opacity: 0, x: direction * (dir === 'rtl' ? -18 : 18) }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * (dir === 'rtl' ? 18 : -18) }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          aria-live="polite"
          className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch rounded-xl border p-4 sm:p-6"
          style={{
            backgroundColor: '#121216',
            borderColor: 'rgba(212, 175, 55, 0.22)'
          }}
        >
          {/* Image Slot (Always Left in LTR / Left Column visually) */}
          <figure className="md:col-span-5 md:order-1 m-0 aspect-[4/3] md:aspect-auto md:min-h-[260px] rounded-xl overflow-hidden border relative"
            style={{
              backgroundColor: '#0A0A0D',
              borderColor: 'rgba(212, 175, 55, 0.2)'
            }}
          >
            {activeEvent.imageUrl ? (
              <img
                src={activeEvent.imageUrl}
                alt={getLocalizedText(activeEvent.title, lang)}
                className="w-full h-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div
                className="w-full h-full min-h-[220px] flex flex-col items-center justify-center gap-3 p-6 text-center"
                style={{
                  background:
                    'radial-gradient(circle at 30% 25%, rgba(212, 175, 55, 0.16), transparent 65%), #0B0B0E'
                }}
              >
                <GraduationCap className="w-10 h-10" style={{ color: '#D4AF37' }} />
                <span className="font-mono-tabular text-3xl font-bold" style={{ color: '#F3D578' }}>
                  {activeEvent.year}
                </span>
              </div>
            )}
          </figure>

          {/* Details Slot */}
          <div className="md:col-span-7 md:order-2 flex flex-col justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono-tabular mb-3" style={{ color: '#D4AF37' }}>
                <span>{activeEvent.year}</span>
                {getLocalizedText(activeEvent.institution, lang) && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{getLocalizedText(activeEvent.institution, lang)}</span>
                  </>
                )}
                {activeGroup.events.length > 1 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>
                      {safeEventIdx + 1} / {activeGroup.events.length}
                    </span>
                  </>
                )}
              </div>

              <h3 className="text-xl sm:text-2xl font-bold mb-3" style={{ color: '#FAF5E4' }}>
                {getLocalizedText(activeEvent.title, lang)}
              </h3>

              <p className="text-sm sm:text-base leading-relaxed m-0" style={{ color: '#C9C2B0' }}>
                {getLocalizedText(activeEvent.description, lang)}
              </p>

              {(isTranslationMissing(activeEvent.title, lang) ||
                isTranslationMissing(activeEvent.description, lang)) && (
                <p className="mt-3 text-xs italic" style={{ color: '#D4AF37' }}>
                  {t('missingTranslation')}
                </p>
              )}
            </div>

            {/* Multiple events inside same year selector */}
            {activeGroup.events.length > 1 && (
              <div className="flex flex-wrap items-center gap-2 pt-2">
                {activeGroup.events.map((ev, eIdx) => (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => setEventIdx(eIdx)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-colors"
                    style={{
                      backgroundColor: eIdx === safeEventIdx ? '#D4AF37' : 'transparent',
                      color: eIdx === safeEventIdx ? '#09090B' : '#E5DEC9',
                      borderColor: eIdx === safeEventIdx ? '#D4AF37' : 'rgba(212, 175, 55, 0.28)'
                    }}
                  >
                    {getLocalizedText(ev.title, lang)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.article>
      </AnimatePresence>

      {/* Previous & Next Navigation Controls */}
      <div className="flex items-center justify-between gap-4 mt-5">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={isStart}
          className="px-4 py-2.5 rounded-xl border text-sm font-semibold inline-flex items-center gap-2 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
          style={{
            backgroundColor: 'transparent',
            borderColor: 'rgba(212, 175, 55, 0.4)',
            color: '#F3D578'
          }}
        >
          <PrevIcon className="w-4 h-4" />
          <span>{t('eduPrev')}</span>
        </button>

        <span className="text-xs font-mono-tabular" style={{ color: '#9C9278' }}>
          {safeYearIdx + 1} / {groups.length}
        </span>

        <button
          type="button"
          onClick={() => step(1)}
          disabled={isEnd}
          className="px-4 py-2.5 rounded-xl border text-sm font-semibold inline-flex items-center gap-2 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
          style={{
            backgroundColor: isEnd ? 'transparent' : '#D4AF37',
            borderColor: 'rgba(212, 175, 55, 0.6)',
            color: isEnd ? '#9C9278' : '#0A0A0C'
          }}
        >
          <span>{t('eduNext')}</span>
          <NextIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
