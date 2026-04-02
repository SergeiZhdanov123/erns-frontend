"use client";

import { useEffect, useRef, useCallback } from "react";

interface InteractiveGridProps {
  className?: string;
  dotColor?: string;
  lineColor?: string;
  dotSize?: number;
  gap?: number;
  mouseRadius?: number;
}

export function InteractiveGrid({
  className = "",
  dotColor = "rgba(0, 230, 118, 0.75)",
  lineColor = "rgba(0, 230, 118, 0.6)",
  dotSize = 3,
  gap = 40,
  mouseRadius = 400,
}: InteractiveGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animRef = useRef<number>(0);
  const dotsRef = useRef<{ x: number; y: number }[]>([]);

  const buildGrid = useCallback(
    (w: number, h: number) => {
      const dots: { x: number; y: number }[] = [];
      const cols = Math.ceil(w / gap) + 1;
      const rows = Math.ceil(h / gap) + 1;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          dots.push({ x: c * gap, y: r * gap });
        }
      }
      dotsRef.current = dots;
    },
    [gap]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle resize
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      buildGrid(rect.width, rect.height);
    };
    resize();
    window.addEventListener("resize", resize);

    // Track mouse
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };
    const onMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };
    window.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);

    // Prefers reduced motion
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Render loop
    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const dots = dotsRef.current;
      const r2 = mouseRadius * mouseRadius;
      const activeDots: { x: number; y: number; dist: number }[] = [];

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        const dx = dot.x - mx;
        const dy = dot.y - my;
        const d2 = dx * dx + dy * dy;
        const isNear = d2 < r2;
        const dist = isNear ? Math.sqrt(d2) : 0;
        const t = isNear ? 1 - dist / mouseRadius : 0;

        // Dot
        const size = dotSize + (isNear ? t * 3 : 0);
        const alpha = 0.15 + (isNear ? t * 0.6 : 0);
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 230, 118, ${alpha})`;
        ctx.fill();

        if (isNear) activeDots.push({ x: dot.x, y: dot.y, dist });
      }

      // Draw connections between nearby active dots
      if (!prefersReduced) {
        for (let i = 0; i < activeDots.length; i++) {
          for (let j = i + 1; j < activeDots.length; j++) {
            const a = activeDots[i];
            const b = activeDots[j];
            const ddx = a.x - b.x;
            const ddy = a.y - b.y;
            const dd = Math.sqrt(ddx * ddx + ddy * ddy);
            if (dd < gap * 2) {
              const lineAlpha = (1 - dd / (gap * 2)) * 0.2;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              // Fade connections between dots too based on their distance from mouse
              const combinedT = (1 - a.dist / mouseRadius) * (1 - b.dist / mouseRadius);
              ctx.strokeStyle = `rgba(0, 230, 118, ${lineAlpha * combinedT * 6})`;
              ctx.lineWidth = 1.2;
              ctx.stroke();
            }
          }
        }

        // Draw line from cursor to nearest dots
        if (activeDots.length > 0) {
          const sorted = activeDots.sort((a, b) => a.dist - b.dist).slice(0, 4);
          for (const dot of sorted) {
            const t = 1 - dot.dist / mouseRadius;
            ctx.beginPath();
            ctx.moveTo(mx, my);
            ctx.lineTo(dot.x, dot.y);
            // Use quadratic falloff (t*t) for a much smoother fade
            ctx.strokeStyle = `rgba(0, 230, 118, ${t * t * 0.85})`;
            ctx.lineWidth = 1.6;
            ctx.stroke();
          }
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [buildGrid, dotColor, lineColor, dotSize, mouseRadius, gap]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full z-0 ${className}`}
      style={{ pointerEvents: "auto" }}
    />
  );
}
