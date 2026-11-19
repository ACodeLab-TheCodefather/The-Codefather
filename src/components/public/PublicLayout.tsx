import { Outlet } from 'react-router-dom';
import { PublicProvider, usePublic } from '../../context/PublicContext';
import { Footer } from './Footer';
import { Navbar } from './Navbar';
import { ParticleCanvas } from './ParticleCanvas';

function PublicShell() {
  const { loading, error, reload } = usePublic();

  return (
    <div
      className="relative isolate min-h-screen flex flex-col transition-colors duration-300"
      style={{
        backgroundColor: 'var(--cf-bg)',
        color: 'var(--cf-text)'
      }}
    >
      <ParticleCanvas />
      <Navbar />
      <main className="relative z-10 flex-1 w-full max-w-[1180px] mx-auto px-4 sm:px-6 pt-24 pb-10">
        {loading ? (
          <div className="py-24 flex flex-col gap-6 animate-pulse" aria-busy="true">
            <div className="h-12 w-72 rounded-xl" style={{ backgroundColor: 'var(--cf-surface)' }} />
            <div className="h-6 w-96 max-w-full rounded-lg" style={{ backgroundColor: 'var(--cf-surface)' }} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-64 rounded-2xl" style={{ backgroundColor: 'var(--cf-surface)' }} />
              ))}
            </div>
          </div>
        ) : error ? (
          <div
            className="my-16 p-8 rounded-2xl border text-center max-w-lg mx-auto"
            style={{ backgroundColor: 'var(--cf-surface)', borderColor: 'var(--cf-border)' }}
          >
            <p className="text-base mb-4">{error}</p>
            <button
              type="button"
              onClick={() => void reload()}
              className="px-5 py-2.5 rounded-xl font-semibold cursor-pointer border-0"
              style={{ backgroundColor: 'var(--cf-accent)', color: 'var(--cf-accent-text)' }}
            >
              Retry
            </button>
          </div>
        ) : (
          <Outlet />
        )}
      </main>
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}

export function PublicLayout() {
  return (
    <PublicProvider>
      <PublicShell />
    </PublicProvider>
  );
}
