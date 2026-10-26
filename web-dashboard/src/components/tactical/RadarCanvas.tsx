'use client';

import { useRef, useEffect } from 'react';

interface RadarCanvasProps {
  /** Diameter of the radar canvas in pixels */
  size?: number;
  /** Additional CSS class names */
  className?: string;
  /** Primary sweep colour (CSS colour string) */
  color?: string;
}

/**
 * RadarCanvas — Tactical radar sweep rendered on HTML5 Canvas.
 *
 * Draws a rotating sweep line, concentric range rings, crosshair guides,
 * and a centre dot. Designed to be small and performant for embedding in
 * the SIGEM dashboard header bar.
 */
export default function RadarCanvas({
  size = 120,
  className = '',
  color = '#10b981',
}: RadarCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 2; // 2px inset for border

    /** Parse hex/rgb colour into r,g,b components for alpha compositing */
    function parseColor(c: string): { r: number; g: number; b: number } {
      const el = document.createElement('div');
      el.style.color = c;
      document.body.appendChild(el);
      const computed = getComputedStyle(el).color;
      document.body.removeChild(el);
      const match = computed.match(/(\d+),\s*(\d+),\s*(\d+)/);
      if (match) {
        return { r: +match[1], g: +match[2], b: +match[3] };
      }
      return { r: 16, g: 185, b: 129 }; // fallback emerald-500
    }

    const rgb = parseColor(color);

    function rgba(alpha: number): string {
      return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
    }

    function draw(timestamp: number) {
      if (!ctx) return;
      ctx.clearRect(0, 0, size, size);

      // --- Background circle ---
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(15,23,42,0.9)';
      ctx.fill();
      ctx.strokeStyle = rgba(0.3);
      ctx.lineWidth = 1;
      ctx.stroke();

      // --- Crosshair guides ---
      ctx.strokeStyle = rgba(0.15);
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.moveTo(cx - radius, cy);
      ctx.lineTo(cx + radius, cy);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx, cy - radius);
      ctx.lineTo(cx, cy + radius);
      ctx.stroke();

      // --- Concentric range rings at 33% and 66% ---
      ctx.strokeStyle = rgba(0.1);
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.33, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.66, 0, Math.PI * 2);
      ctx.stroke();

      // --- Rotating sweep ---
      const sweepDuration = 4000; // 4s full rotation
      const angle = ((timestamp % sweepDuration) / sweepDuration) * Math.PI * 2;
      const sweepSpan = Math.PI / 3; // 60° gradient arc

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);

      const gradient = ctx.createConicGradient(0, 0, 0);
      gradient.addColorStop(0, rgba(0.45));
      gradient.addColorStop(sweepSpan / (Math.PI * 2), rgba(0));
      gradient.addColorStop(1, rgba(0));

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius - 1, 0, sweepSpan);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Sweep leading edge line
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(radius - 1, 0);
      ctx.strokeStyle = rgba(0.6);
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();

      // --- Centre dot ---
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fillStyle = rgba(1);
      ctx.fill();

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [size, color]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '9999px',
        boxShadow: '0 0 12px rgba(16,185,129,0.15), 0 0 4px rgba(15,23,42,0.6)',
      }}
      aria-label="Radar táctico"
      role="img"
    />
  );
}
