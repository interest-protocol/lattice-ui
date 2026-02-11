import { type FC, useEffect, useRef } from 'react';

import useThemeColors from '@/hooks/ui/use-theme-colors';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  opacity: number;
}

const BackgroundParticles: FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { particlePalette, particleStrokeRgb } = useThemeColors();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let particles: Particle[] = [];

    const setCanvasSize = () => {
      const dpr =
        typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initParticles();
    };

    const initParticles = () => {
      const count = Math.min(
        80,
        Math.floor((window.innerWidth * window.innerHeight) / 25000)
      );
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: 0.5 + Math.random() * 1.5,
        color:
          particlePalette[Math.floor(Math.random() * particlePalette.length)],
        opacity: 0.15 + Math.random() * 0.35,
      }));
    };

    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      ctx.clearRect(0, 0, w, h);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color.replace(/[\d.]+\)$/g, `${p.opacity})`);
        ctx.fill();
      });

      // subtle glow connections between nearby particles
      particles.forEach((a, i) => {
        particles.slice(i + 1).forEach((b) => {
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 80) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            const alpha = (1 - dist / 80) * 0.06;
            ctx.strokeStyle = `rgba(${particleStrokeRgb}, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animationId = requestAnimationFrame(draw);
    };

    setCanvasSize();
    draw();

    const handleResize = () => {
      setCanvasSize();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, [particlePalette, particleStrokeRgb]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
        display: 'block',
      }}
      aria-hidden
    />
  );
};

export default BackgroundParticles;
