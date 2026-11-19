import React, { useState } from 'react';
import { CheckCircle2, Mail, MapPin, Send } from 'lucide-react';
import { usePublic } from '../../context/PublicContext';
import { getLocalizedText } from '../../utils/i18n';

export function ContactPage() {
  const { data, lang, t } = usePublic();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // Honeypot spam trap
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    const nextErrors: Record<string, string> = {};

    if (!name.trim()) nextErrors.name = t('errRequired');
    if (!email.trim()) nextErrors.email = t('errRequired');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) nextErrors.email = t('errEmail');

    if (!message.trim()) nextErrors.message = t('errRequired');
    else if (message.trim().length < 10) nextErrors.message = t('errMinLen');

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim() || (lang === 'ar' ? 'رسالة من الموقع' : 'Website Inquiry'),
          message: message.trim(),
          website
        })
      });

      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        setStatusMsg({ type: 'err', text: errBody.error || t('contactError') });
        return;
      }

      setStatusMsg({ type: 'ok', text: t('contactSuccess') });
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      setErrors({});
    } catch {
      setStatusMsg({ type: 'err', text: t('contactError') });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-10 py-4">
      <header className="space-y-3 max-w-3xl">
        <h1 className="text-3xl sm:text-5xl font-bold m-0">{t('contactTitle')}</h1>
        <p className="text-base sm:text-lg m-0" style={{ color: 'var(--cf-muted)' }}>
          {t('contactSubtitle')}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <form
          onSubmit={handleSubmit}
          noValidate
          className="lg:col-span-8 rounded-2xl border p-6 sm:p-8 space-y-5"
          style={{
            backgroundColor: 'var(--cf-surface)',
            borderColor: 'var(--cf-border)'
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label htmlFor="c-name" className="block text-sm font-bold">
                {t('fieldName')}
              </label>
              <input
                id="c-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={Boolean(errors.name)}
                className="w-full px-4 py-3 rounded-xl border text-sm transition-colors"
                style={{
                  backgroundColor: 'var(--cf-bg)',
                  borderColor: errors.name ? '#EF4444' : 'var(--cf-border)',
                  color: 'var(--cf-text)'
                }}
              />
              {errors.name && <p className="text-xs text-red-400 m-0">{errors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="c-email" className="block text-sm font-bold">
                {t('fieldEmail')}
              </label>
              <input
                id="c-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(errors.email)}
                className="w-full px-4 py-3 rounded-xl border text-sm transition-colors"
                style={{
                  backgroundColor: 'var(--cf-bg)',
                  borderColor: errors.email ? '#EF4444' : 'var(--cf-border)',
                  color: 'var(--cf-text)'
                }}
              />
              {errors.email && <p className="text-xs text-red-400 m-0">{errors.email}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="c-subject" className="block text-sm font-bold">
              {t('fieldSubject')}
            </label>
            <input
              id="c-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border text-sm transition-colors"
              style={{
                backgroundColor: 'var(--cf-bg)',
                borderColor: 'var(--cf-border)',
                color: 'var(--cf-text)'
              }}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="c-message" className="block text-sm font-bold">
              {t('fieldMessage')}
            </label>
            <textarea
              id="c-message"
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              aria-invalid={Boolean(errors.message)}
              className="w-full px-4 py-3 rounded-xl border text-sm transition-colors resize-y"
              style={{
                backgroundColor: 'var(--cf-bg)',
                borderColor: errors.message ? '#EF4444' : 'var(--cf-border)',
                color: 'var(--cf-text)'
              }}
            />
            {errors.message && <p className="text-xs text-red-400 m-0">{errors.message}</p>}
          </div>

          {/* Honeypot field hidden from real users */}
          <div className="absolute -left-[9999px] w-px h-px overflow-hidden" aria-hidden="true">
            <label>
              Website
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 rounded-xl font-bold text-sm inline-flex items-center gap-2 cursor-pointer border-0 disabled:opacity-50"
              style={{
                backgroundColor: 'var(--cf-accent)',
                color: 'var(--cf-accent-text)'
              }}
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? t('sending') : t('sendMessage')}</span>
            </button>
          </div>

          {statusMsg && (
            <div
              role="status"
              aria-live="polite"
              className="p-4 rounded-xl border flex items-center gap-3 text-sm font-semibold"
              style={{
                backgroundColor: 'var(--cf-bg)',
                borderColor: statusMsg.type === 'ok' ? 'var(--cf-accent-2)' : '#EF4444',
                color: statusMsg.type === 'ok' ? 'var(--cf-accent-2)' : '#FCA5A5'
              }}
            >
              {statusMsg.type === 'ok' && <CheckCircle2 className="w-5 h-5 shrink-0" />}
              <span>{statusMsg.text}</span>
            </div>
          )}
        </form>

        <aside
          className="lg:col-span-4 rounded-2xl border p-6 sm:p-7 space-y-5"
          style={{
            backgroundColor: 'var(--cf-surface)',
            borderColor: 'var(--cf-border)'
          }}
        >
          <div className="space-y-1">
            <h2 className="text-lg font-bold m-0">THE CODEFATHER</h2>
            <p className="font-display text-xs tracking-[0.2em] m-0" style={{ color: 'var(--cf-muted)' }}>
              {t('tagline')}
            </p>
          </div>

          {data?.profile && (
            <div className="space-y-4 pt-3 border-t text-sm" style={{ borderColor: 'var(--cf-border)' }}>
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--cf-accent-2)' }} />
                <div>
                  <div className="text-xs" style={{ color: 'var(--cf-muted)' }}>{t('fieldEmail')}</div>
                  <a href={`mailto:${data.profile.email}`} className="no-underline font-semibold" style={{ color: 'var(--cf-text)' }}>
                    {data.profile.email}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--cf-accent-2)' }} />
                <div>
                  <div className="text-xs" style={{ color: 'var(--cf-muted)' }}>
                    {getLocalizedText(data.profile.location, lang)}
                  </div>
                  <div className="font-medium">
                    {getLocalizedText(data.profile.availability, lang)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
