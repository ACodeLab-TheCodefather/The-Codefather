import { useEffect, useRef } from 'react';
import { usePublic } from '../../context/PublicContext';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  colorIndex: 0 | 1;
}

export function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { tokens } = usePublic();
  const tokensRef = useRef(tokens);
  tokensRef.current = tokens;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let rafId = 0;
    const pointer = { x: -9999, y: -9999, active: false };
    let particles: Particle[] = [];

    const init = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(84, Math.max(28, Math.floor((width * height) / 17000)));
      particles = Array.from({ length: count }, (_, idx) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.44,
        vy: (Math.random() - 0.5) * 0.44,
        radius: Math.random() * 1.8 + 0.9,
        colorIndex: idx % 2 === 0 ? 0 : 1
      }));
    };

    const draw = () => {
      const current = tokensRef.current;
      ctx.clearRect(0, 0, width, height);

      if (!prefersReduced) {
        for (const p of particles) {
          p.x += p.vx;
          p.y += p.vy;

          if (pointer.active) {
            const dx = pointer.x - p.x;
            const dy = pointer.y - p.y;
            const distSq = dx * dx + dy * dy;
            if (distSq > 900 && distSq < 36100) {
              p.x += dx * 0.004;
              p.y += dy * 0.004;
            }
          }

          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;
        }
      }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        ctx.globalAlpha = 0.82;
        ctx.fillStyle = `rgb(${p.colorIndex === 0 ? current.accentRgb : current.accent2Rgb})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 19600) {
            const alpha = (1 - Math.sqrt(distSq) / 140) * 0.3;
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = `rgb(${current.textRgb})`;
            ctx.lineWidth = 0.75;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }

        if (pointer.active) {
          const pdx = p.x - pointer.x;
          const pdy = p.y - pointer.y;
          const pDistSq = pdx * pdx + pdy * pdy;
          if (pDistSq < 32400) {
            ctx.globalAlpha = (1 - Math.sqrt(pDistSq) / 180) * 0.45;
            ctx.strokeStyle = `rgb(${current.accent2Rgb})`;
            ctx.lineWidth = 0.9;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(pointer.x, pointer.y);
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 1;
      if (!prefersReduced) {
        rafId = requestAnimationFrame(draw);
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
    };
    const onMouseLeave = () => {
      pointer.active = false;
    };
    let resizeTimer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        init();
        if (prefersReduced) draw();
      }, 150);
    };

    init();
    draw();
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(resizeTimer);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <>
      <div
        aria-hidden="true"
        className="cf-blobs fixed -inset-24 z-0 pointer-events-none"
        style={{
          background: `radial-gradient(40vmax 40vmax at 16% 18%, rgba(var(--cf-accent-rgb), 0.24), transparent 70%),
                       radial-gradient(36vmax 36vmax at 86% 80%, rgba(var(--cf-accent-2-rgb), 0.18), transparent 70%)`
        }}
      />
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        data-testid="particle-canvas"
        className="fixed inset-0 w-screen h-screen z-0 pointer-events-none"
      />
    </>
  );
}
