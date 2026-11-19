import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Copy, Globe, KeyRound, Moon, ShieldCheck, Sun } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';

export function AdminLoginPage() {
  const { loading, setupRequired, authenticated, mode, toggleMode, lang, toggleLang, t, refreshAuth } =
    useAdmin();
  const navigate = useNavigate();

  // Setup state
  const [setupUsername, setSetupUsername] = useState('');
  const [setupEmail, setSetupEmail] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupConfirm, setSetupConfirm] = useState('');
  const [enrollmentData, setEnrollmentData] = useState<{
    qrDataUrl: string;
    totpSecret: string;
    recoveryCodes: string[];
  } | null>(null);

  // Login state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [twoFactorMode, setTwoFactorMode] = useState<'totp' | 'recovery'>('totp');
  const [twoFactorCode, setTwoFactorCode] = useState('');

  // Password recovery state
  const [recoverView, setRecoverView] = useState(false);
  const [recIdentifier, setRecIdentifier] = useState('');
  const [recCode, setRecCode] = useState('');
  const [recNewPass, setRecNewPass] = useState('');

  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [copiedCodes, setCopiedCodes] = useState(false);

  useEffect(() => {
    if (!loading && authenticated && !enrollmentData) {
      navigate('/admin', { replace: true });
    }
  }, [loading, authenticated, enrollmentData, navigate]);

  const isDark = mode === 'dark';
  const cardBg = isDark ? '#121216' : '#FFFFFF';
  const pageBg = isDark ? '#09090B' : '#F4F4F6';
  const borderCol = isDark ? '#27272E' : '#E2E2E8';
  const inputBg = isDark ? '#0B0B0E' : '#FAFAFC';
  const mutedText = isDark ? '#A1A1AA' : '#52525B';
  const gold = isDark ? '#D4AF37' : '#B68914';

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (setupPassword !== setupConfirm) {
      setErrorMsg(lang === 'ar' ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/admin/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: setupUsername.trim(),
          email: setupEmail.trim(),
          password: setupPassword
        })
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error || 'Setup failed.');
        return;
      }
      setEnrollmentData({
        qrDataUrl: json.qrDataUrl,
        totpSecret: json.totpSecret,
        recoveryCodes: json.recoveryCodes
      });
      await refreshAuth();
    } catch {
      setErrorMsg('Network error during setup.');
    } finally {
      setBusy(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    setBusy(true);
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ identifier: identifier.trim(), password })
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error || 'Login failed.');
        return;
      }
      if (json.requires2fa) {
        setChallengeToken(json.challengeToken);
        return;
      }
      await refreshAuth();
      navigate('/admin', { replace: true });
    } catch {
      setErrorMsg('Network error.');
    } finally {
      setBusy(false);
    }
  };

  const handleVerify2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeToken) return;
    setErrorMsg(null);
    setBusy(true);
    try {
      const res = await fetch('/api/admin/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          challengeToken,
          code: twoFactorCode.trim(),
          mode: twoFactorMode
        })
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error || 'Verification failed.');
        return;
      }
      await refreshAuth();
      navigate('/admin', { replace: true });
    } catch {
      setErrorMsg('Network error.');
    } finally {
      setBusy(false);
    }
  };

  const handleRecoverPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    setBusy(true);
    try {
      const res = await fetch('/api/admin/auth/recover-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: recIdentifier.trim(),
          recoveryCode: recCode.trim(),
          newPassword: recNewPass
        })
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error || 'Recovery failed.');
        return;
      }
      setRecoverView(false);
      setInfoMsg(
        lang === 'ar'
          ? 'تمت إعادة تعيين كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.'
          : 'Password reset successfully. Sign in with your new password.'
      );
    } catch {
      setErrorMsg('Network error.');
    } finally {
      setBusy(false);
    }
  };

  const copyRecoveryCodes = async () => {
    if (!enrollmentData) return;
    await navigator.clipboard.writeText(enrollmentData.recoveryCodes.join('\n'));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2500);
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-between p-4 sm:p-6 transition-colors"
      style={{
        backgroundColor: pageBg,
        color: isDark ? '#F5F5F7' : '#111115'
      }}
    >
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5 no-underline" style={{ color: 'inherit' }}>
          <img
            src="/assets/aistudio/logo-mark_5d783479.png"
            alt="THE CODEFATHER"
            className="w-8 h-7 object-contain"
          />
          <span className="font-display font-bold tracking-wider text-sm">THE CODEFATHER</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMode}
            className="h-9 px-3 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            style={{ backgroundColor: cardBg, borderColor: borderCol, color: 'inherit' }}
          >
            {isDark ? <Sun className="w-3.5 h-3.5" style={{ color: gold }} /> : <Moon className="w-3.5 h-3.5" style={{ color: gold }} />}
            <span>{isDark ? t('adminLightMode') : t('adminDarkMode')}</span>
          </button>
          <button
            type="button"
            onClick={toggleLang}
            className="h-9 px-3 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            style={{ backgroundColor: cardBg, borderColor: borderCol, color: 'inherit' }}
          >
            <Globe className="w-3.5 h-3.5" style={{ color: gold }} />
            <span>{t('langSwitch')}</span>
          </button>
        </div>
      </header>

      <main className="w-full max-w-md mx-auto my-8">
        <div
          className="rounded-2xl border p-6 sm:p-8 shadow-2xl space-y-6"
          style={{ backgroundColor: cardBg, borderColor: borderCol }}
        >
          {loading ? (
            <div className="py-10 text-center text-sm" style={{ color: mutedText }}>
              ...
            </div>
          ) : enrollmentData ? (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <span
                  className="w-10 h-10 rounded-xl grid place-items-center shrink-0"
                  style={{ backgroundColor: 'rgba(212, 175, 55, 0.16)', color: gold }}
                >
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <div>
                  <h1 className="text-lg font-bold m-0">{t('saveRecoveryCodesTitle')}</h1>
                  <p className="text-xs m-0" style={{ color: mutedText }}>
                    {t('saveRecoveryCodesDesc')}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-2 p-4 rounded-xl border" style={{ borderColor: borderCol, backgroundColor: inputBg }}>
                <img src={enrollmentData.qrDataUrl} alt="2FA QR Code" className="w-44 h-44 rounded-lg" />
                <code className="font-mono-tabular text-xs break-all" style={{ color: gold }}>
                  {enrollmentData.totpSecret}
                </code>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {enrollmentData.recoveryCodes.map((code) => (
                    <div
                      key={code}
                      className="px-3 py-1.5 rounded-lg border font-mono-tabular text-xs text-center"
                      style={{ borderColor: borderCol, backgroundColor: inputBg }}
                    >
                      {code}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={copyRecoveryCodes}
                  className="w-full py-2 rounded-xl border text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
                  style={{ borderColor: borderCol, backgroundColor: 'transparent', color: 'inherit' }}
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedCodes ? 'Copied' : lang === 'ar' ? 'نسخ الرموز' : 'Copy Recovery Codes'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => navigate('/admin', { replace: true })}
                className="w-full py-3 rounded-xl font-bold text-sm border-0 cursor-pointer"
                style={{ backgroundColor: gold, color: '#111111' }}
              >
                {t('continueToDashboard')}
              </button>
            </div>
          ) : setupRequired ? (
            <form onSubmit={handleSetup} className="space-y-4">
              <div className="space-y-1">
                <h1 className="text-xl font-bold m-0">{t('adminSetupTitle')}</h1>
                <p className="text-xs m-0 leading-relaxed" style={{ color: mutedText }}>
                  {t('adminSetupDesc')}
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl border border-red-500/40 bg-red-500/10 text-red-400 text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-1">
                <label htmlFor="s-user" className="text-xs font-bold block">{t('username')}</label>
                <input
                  id="s-user"
                  required
                  minLength={3}
                  value={setupUsername}
                  onChange={(e) => setSetupUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm"
                  style={{ backgroundColor: inputBg, borderColor: borderCol, color: 'inherit' }}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="s-email" className="text-xs font-bold block">{t('email')}</label>
                <input
                  id="s-email"
                  type="email"
                  required
                  value={setupEmail}
                  onChange={(e) => setSetupEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm"
                  style={{ backgroundColor: inputBg, borderColor: borderCol, color: 'inherit' }}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="s-pass" className="text-xs font-bold block">{t('password')}</label>
                <input
                  id="s-pass"
                  type="password"
                  required
                  minLength={8}
                  value={setupPassword}
                  onChange={(e) => setSetupPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm"
                  style={{ backgroundColor: inputBg, borderColor: borderCol, color: 'inherit' }}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="s-conf" className="text-xs font-bold block">{t('confirmPassword')}</label>
                <input
                  id="s-conf"
                  type="password"
                  required
                  minLength={8}
                  value={setupConfirm}
                  onChange={(e) => setSetupConfirm(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm"
                  style={{ backgroundColor: inputBg, borderColor: borderCol, color: 'inherit' }}
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 rounded-xl font-bold text-sm border-0 cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: gold, color: '#111111' }}
              >
                {busy ? '...' : t('createAdminBtn')}
              </button>
            </form>
          ) : recoverView ? (
            <form onSubmit={handleRecoverPassword} className="space-y-4">
              <div className="space-y-1">
                <h1 className="text-xl font-bold m-0">{t('recoverTitle')}</h1>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl border border-red-500/40 bg-red-500/10 text-red-400 text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-1">
                <label htmlFor="r-id" className="text-xs font-bold block">{t('usernameOrEmail')}</label>
                <input
                  id="r-id"
                  required
                  value={recIdentifier}
                  onChange={(e) => setRecIdentifier(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm"
                  style={{ backgroundColor: inputBg, borderColor: borderCol, color: 'inherit' }}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="r-code" className="text-xs font-bold block">{t('recoveryCode')}</label>
                <input
                  id="r-code"
                  required
                  value={recCode}
                  onChange={(e) => setRecCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono-tabular"
                  style={{ backgroundColor: inputBg, borderColor: borderCol, color: 'inherit' }}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="r-pass" className="text-xs font-bold block">{t('newPassword')}</label>
                <input
                  id="r-pass"
                  type="password"
                  required
                  minLength={8}
                  value={recNewPass}
                  onChange={(e) => setRecNewPass(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm"
                  style={{ backgroundColor: inputBg, borderColor: borderCol, color: 'inherit' }}
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 rounded-xl font-bold text-sm border-0 cursor-pointer"
                style={{ backgroundColor: gold, color: '#111111' }}
              >
                {t('recoverBtn')}
              </button>

              <button
                type="button"
                onClick={() => {
                  setRecoverView(false);
                  setErrorMsg(null);
                }}
                className="w-full py-2 text-xs font-semibold bg-transparent border-0 cursor-pointer"
                style={{ color: mutedText }}
              >
                {t('backToLogin')}
              </button>
            </form>
          ) : challengeToken ? (
            <form onSubmit={handleVerify2fa} className="space-y-4">
              <div className="flex items-center gap-3">
                <span
                  className="w-10 h-10 rounded-xl grid place-items-center shrink-0"
                  style={{ backgroundColor: 'rgba(212, 175, 55, 0.16)', color: gold }}
                >
                  <KeyRound className="w-5 h-5" />
                </span>
                <div>
                  <h1 className="text-lg font-bold m-0">{t('twoFactorTitle')}</h1>
                  <p className="text-xs m-0" style={{ color: mutedText }}>
                    {t('twoFactorDesc')}
                  </p>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl border border-red-500/40 bg-red-500/10 text-red-400 text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-1">
                <label htmlFor="tfa-code" className="text-xs font-bold block">
                  {twoFactorMode === 'totp' ? t('totpCode') : t('recoveryCode')}
                </label>
                <input
                  id="tfa-code"
                  required
                  autoFocus
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  placeholder={twoFactorMode === 'totp' ? '123456' : 'XXXXX-XXXXX'}
                  className="w-full px-3.5 py-3 rounded-xl border text-base font-mono-tabular tracking-widest text-center"
                  style={{ backgroundColor: inputBg, borderColor: borderCol, color: 'inherit' }}
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 rounded-xl font-bold text-sm border-0 cursor-pointer"
                style={{ backgroundColor: gold, color: '#111111' }}
              >
                {t('verifyAndEnter')}
              </button>

              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setTwoFactorMode((m) => (m === 'totp' ? 'recovery' : 'totp'));
                    setTwoFactorCode('');
                  }}
                  className="text-xs font-semibold bg-transparent border-0 cursor-pointer"
                  style={{ color: gold }}
                >
                  {twoFactorMode === 'totp' ? t('useRecoveryCode') : t('useTotpCode')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setChallengeToken(null);
                    setTwoFactorCode('');
                  }}
                  className="text-xs bg-transparent border-0 cursor-pointer"
                  style={{ color: mutedText }}
                >
                  {t('backToLogin')}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <h1 className="text-xl font-bold m-0">{t('adminLoginTitle')}</h1>
                <p className="text-xs m-0" style={{ color: mutedText }}>
                  THE CODEFATHER · THINK • CODE • CREATE
                </p>
              </div>

              {infoMsg && (
                <div className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
                  {infoMsg}
                </div>
              )}
              {errorMsg && (
                <div className="p-3 rounded-xl border border-red-500/40 bg-red-500/10 text-red-400 text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-1">
                <label htmlFor="l-id" className="text-xs font-bold block">{t('usernameOrEmail')}</label>
                <input
                  id="l-id"
                  required
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm"
                  style={{ backgroundColor: inputBg, borderColor: borderCol, color: 'inherit' }}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="l-pass" className="text-xs font-bold block">{t('password')}</label>
                <input
                  id="l-pass"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm"
                  style={{ backgroundColor: inputBg, borderColor: borderCol, color: 'inherit' }}
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 rounded-xl font-bold text-sm border-0 cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: gold, color: '#111111' }}
              >
                {busy ? '...' : t('loginBtn')}
              </button>

              <button
                type="button"
                onClick={() => {
                  setRecoverView(true);
                  setErrorMsg(null);
                }}
                className="w-full py-1 text-xs font-medium bg-transparent border-0 cursor-pointer"
                style={{ color: mutedText }}
              >
                {t('forgotPassword')}
              </button>
            </form>
          )}
        </div>
      </main>

      <footer className="text-center text-xs" style={{ color: mutedText }}>
        THE CODEFATHER · {t('adminTitle')}
      </footer>
    </div>
  );
}
