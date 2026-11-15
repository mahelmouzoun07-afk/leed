"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { BRAND_LOWER } from "./data";

/* ---------- Logo (placeholder mark, not the original's) ---------- */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex h-7 items-center gap-1.5 select-none ${className}`} aria-label={BRAND_LOWER}>
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
        <rect x="0" y="0" width="9" height="9" rx="2" fill="#c7c7c7" />
        <rect x="11" y="11" width="9" height="9" rx="2" fill="#c7c7c7" />
        <rect x="11" y="0" width="9" height="9" rx="4.5" fill="var(--brand-500)" />
      </svg>
      <span className="text-[24px] leading-none tracking-[-0.03em] text-foreground">{BRAND_LOWER}</span>
    </span>
  );
}

/* ---------- Dialog ---------- */
export function Dialog({
  open,
  onClose,
  children,
  label,
  className = "",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  label: string;
  className?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => panelRef.current?.querySelector<HTMLElement>("input,textarea,button")?.focus(), 30);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      clearTimeout(t);
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div className="dialog-overlay" onClick={onClose} />
      <div ref={panelRef} role="dialog" aria-modal="true" aria-label={label} className={`dialog-panel ${className}`}>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-chip hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </>
  );
}

/* ---------- Shared UI state (sign in, checkout, "no website") ---------- */
type UI = {
  openSignIn: () => void;
  openCheckout: (amount?: number) => void;
  openNoWebsite: () => void;
};
const UIContext = createContext<UI>({ openSignIn() {}, openCheckout() {}, openNoWebsite() {} });
export const useUI = () => useContext(UIContext);

export function UIProvider({ children, render }: { children: ReactNode; render: (s: UIState) => ReactNode }) {
  const [signIn, setSignIn] = useState(false);
  const [checkout, setCheckout] = useState<number | null>(null);
  const [noWebsite, setNoWebsite] = useState(false);
  const value: UI = {
    openSignIn: useCallback(() => setSignIn(true), []),
    openCheckout: useCallback((a?: number) => setCheckout(a ?? 30), []),
    openNoWebsite: useCallback(() => setNoWebsite(true), []),
  };
  return (
    <UIContext.Provider value={value}>
      {children}
      {render({
        signIn,
        closeSignIn: () => setSignIn(false),
        checkout,
        closeCheckout: () => setCheckout(null),
        noWebsite,
        closeNoWebsite: () => setNoWebsite(false),
      })}
    </UIContext.Provider>
  );
}
export type UIState = {
  signIn: boolean;
  closeSignIn: () => void;
  checkout: number | null;
  closeCheckout: () => void;
  noWebsite: boolean;
  closeNoWebsite: () => void;
};

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
