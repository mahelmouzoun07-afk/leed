"use client";

import { useEffect, useRef } from "react";
import { MOBILE_ORDER, ROWS, type Testimonial } from "../data";

function Card({ t, hidden }: { t: Testimonial; hidden?: boolean }) {
  return (
    <div className="testimonial-card" aria-hidden={hidden || undefined}>
      <p className="testimonial-quote">
        <span>“{t.quote}”</span>
      </p>
      <div className="testimonial-identity">
        <span className="testimonial-avatar" style={{ background: t.color }} aria-hidden="true">
          {t.initials}
        </span>
        <div>
          {t.noName ? (
            <div className="testimonial-name">{t.company}</div>
          ) : (
            <>
              <div className="testimonial-name">{t.name}</div>
              <div className="testimonial-company">{t.company}</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const COPIES = 6;

/** A row that drifts by itself, loops forever and can be dragged. */
function AutoRow({ items, speed }: { items: Testimonial[]; speed: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let paused = false;
    let dragging = false;
    let startX = 0;
    let startLeft = 0;
    let pos = el.scrollLeft;
    const setWidth = () => el.scrollWidth / COPIES;
    const wrap = () => {
      const w = setWidth();
      if (pos >= w * 2) pos -= w;
      if (pos < w * 0.5) pos += w;
    };
    const tick = () => {
      if (!paused && !dragging && !reduce) {
        pos += speed;
        wrap();
        el.scrollLeft = pos;
      }
      raf = requestAnimationFrame(tick);
    };
    // start one copy in so the row can loop both ways
    pos = setWidth();
    el.scrollLeft = pos;
    raf = requestAnimationFrame(tick);

    const enter = () => (paused = true);
    const leave = () => (paused = false);
    const down = (e: PointerEvent) => {
      dragging = true;
      startX = e.clientX;
      startLeft = el.scrollLeft;
      el.classList.add("dragging");
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      pos = startLeft - (e.clientX - startX);
      wrap();
      el.scrollLeft = pos;
    };
    const up = () => {
      dragging = false;
      el.classList.remove("dragging");
    };
    const onScroll = () => {
      if (paused && !dragging) pos = el.scrollLeft;
    };
    el.addEventListener("mouseenter", enter);
    el.addEventListener("mouseleave", leave);
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("mouseenter", enter);
      el.removeEventListener("mouseleave", leave);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("scroll", onScroll);
    };
  }, [speed]);

  return (
    <div className="testimonial-row" ref={ref}>
      {Array.from({ length: COPIES }).flatMap((_, c) => items.map((t, i) => <Card key={`${c}-${i}`} t={t} hidden={c !== 1} />))}
    </div>
  );
}

export function Testimonials() {
  return (
    <section>
      <div>
        <div className="mx-auto max-w-2xl text-center">
          <h2>What customers are saying</h2>
        </div>
        <div className="testimonials-rows mt-16 flex flex-col gap-4">
          <div className="md:hidden">
            <div className="testimonial-row testimonial-row--snap">
              {MOBILE_ORDER.map((t, i) => (
                <Card key={i} t={t} />
              ))}
            </div>
          </div>
          {ROWS.map((row, i) => (
            <div key={i} className="hidden md:block">
              <AutoRow items={row} speed={i === 1 ? 0.3 : 0.4} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
