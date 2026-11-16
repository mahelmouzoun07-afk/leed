"use client";

import { useEffect, useRef, useState } from "react";
import { BRAND_LOWER } from "./data";

/* ---------- Logo leed ----------
   Mot construit en formes géométriques (pas de texte) : hauteur d'x 140,
   ascendante 180, graisse 32. Le « d » final est un disque plein : le point
   d'arrivée, le client trouvé. Source : scripts/logo/construire.cjs.
   `inverse` : version pour fond sombre (lettres blanches, disque safran). */
export function Logo({ className = "", inverse = false }: { className?: string; inverse?: boolean }) {
  const encre = inverse ? "#ffffff" : "var(--foreground)";
  const disque = inverse ? "var(--safran)" : "var(--indigo)";
  return (
    <span className={`inline-flex h-7 items-center select-none ${className}`}>
      <svg height="22" viewBox="0 36 496 180" role="img" aria-label={BRAND_LOWER}>
        <rect x="0" y="36" width="32" height="180" fill={encre} />
        <path d="M176 146A54 54 0 1 0 164.55 179.25" fill="none" stroke={encre} strokeWidth="32" />
        <path d="M68 146H192" fill="none" stroke={encre} strokeWidth="26" />
        <path d="M328 146A54 54 0 1 0 316.55 179.25" fill="none" stroke={encre} strokeWidth="32" />
        <path d="M220 146H344" fill="none" stroke={encre} strokeWidth="26" />
        <circle cx="426" cy="146" r="70" fill={disque} />
        <rect x="464" y="36" width="32" height="180" fill={encre} />
      </svg>
    </span>
  );
}

/* ---------- Slider (keyboard + pointer) ---------- */
export function Slider({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  label,
}: {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const pct = ((value - min) / (max - min)) * 100;
  const setFromX = (clientX: number) => {
    const r = ref.current!.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    const v = Math.round((min + p * (max - min)) / step) * step;
    onChange(Math.min(max, Math.max(min, v)));
  };
  return (
    <div
      ref={ref}
      className="range-slider"
      onPointerDown={(e) => {
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        setFromX(e.clientX);
        ref.current?.querySelector<HTMLElement>(".thumb")?.focus();
      }}
      onPointerMove={(e) => e.buttons === 1 && setFromX(e.clientX)}
    >
      <span className="track">
        <span className="range" style={{ right: `${100 - pct}%` }} />
      </span>
      <span
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        className="thumb"
        style={{ left: `calc(${pct}% + ${8 - pct * 0.16}px)` }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowUp") onChange(Math.min(max, value + step));
          else if (e.key === "ArrowLeft" || e.key === "ArrowDown") onChange(Math.max(min, value - step));
          else if (e.key === "Home") onChange(min);
          else if (e.key === "End") onChange(max);
          else return;
          e.preventDefault();
        }}
      />
    </div>
  );
}

/* ---------- Little 2x2 "agent working" pixel loader ---------- */
export function PixelLoader({ active = true }: { active?: boolean }) {
  const [i, setI] = useState(3);
  useEffect(() => {
    if (!active) return;
    const order = [0, 1, 3, 2];
    let k = 0;
    const t = setInterval(() => {
      k = (k + 1) % 4;
      setI(order[k]);
    }, 220);
    return () => clearInterval(t);
  }, [active]);
  return (
    <div className="grid h-3 w-3 grid-cols-2 gap-px">
      {[0, 1, 2, 3].map((n) => (
        <div key={n} className={`h-[5px] w-[5px] ${n === i ? "bg-brand-500" : "bg-muted-foreground/20"}`} />
      ))}
    </div>
  );
}

/* ---------- Hook: element has entered the viewport ---------- */
export function useInView<T extends Element>(threshold = 0.3) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen, threshold]);
  return [ref, seen] as const;
}
