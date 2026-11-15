"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, CalendarCheck, CircleHelp, Send, UserPlus } from "lucide-react";
import { Slider, useUI } from "../ui";

function TiltCard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      className="relative h-full transition-transform duration-300 ease-out"
      style={{ transformStyle: "preserve-3d", willChange: "transform" }}
      onMouseMove={(e) => {
        const r = ref.current!.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        ref.current!.style.transform = `perspective(800px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg)`;
      }}
      onMouseLeave={() => {
        ref.current!.style.transform = "";
      }}
    >
      {children}
    </div>
  );
}

const FEATURES = [
  { n: 80, pre: "", suf: "M+", rest: "decision makers", text: "Built on our own GPU cluster covering 400M+ people" },
  { n: 97, pre: "", suf: "%", rest: "inbox rate", text: "Pre-warmed domains from day one" },
  { n: 1, pre: "From $", suf: "", rest: "per warm lead", text: "Pay as you go at $0.04 per email" },
];

export function ThreeThings() {
  return (
    <section>
      <div>
        <div>
          <div className="mb-12 text-center">
            <h2>Three things nobody else has</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <TiltCard key={f.rest}>
                <div className="glass-window-inner flex h-full min-h-[160px] flex-col p-4 md:p-6">
                  <div className="text-[clamp(24px,4.5vw,36px)] font-medium leading-tight text-foreground">
                    <span className="tabular-nums">{f.pre}{f.n}{f.suf}</span> {f.rest}
                  </div>
                  <p className="!mb-0 !mt-auto pt-6 text-base leading-relaxed text-muted-foreground">{f.text}</p>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* slider position (0–100) -> budget in dollars; 30 -> $30 like the original */
const POINTS: [number, number][] = [
  [0, 10],
  [30, 30],
  [60, 100],
  [80, 300],
  [100, 1000],
];
function budget(pos: number) {
  for (let i = 1; i < POINTS.length; i++) {
    const [p0, v0] = POINTS[i - 1];
    const [p1, v1] = POINTS[i];
    if (pos <= p1) {
      const v = v0 + ((pos - p0) / (p1 - p0)) * (v1 - v0);
      return v < 100 ? Math.round(v) : Math.round(v / 10) * 10;
    }
  }
  return 1000;
}
const fmt = (n: number) => n.toLocaleString("en-US");

export function PricingCalc() {
  const { openCheckout } = useUI();
  const [pos, setPos] = useState(30);
  const usd = budget(pos);
  const emails = Math.round(usd / 0.04);
  const lo = Math.max(1, Math.round(usd / 15));
  const hi = Math.max(lo + 1, Math.round(usd / 5));
  const meetings = Math.max(1, Math.round(usd / 30));
  const tiles = [
    { icon: Send, value: fmt(emails), label: "Emails" },
    { icon: UserPlus, value: `~${fmt(lo)}–${fmt(hi)}`, label: "Warm leads" },
    { icon: CalendarCheck, value: `~${fmt(meetings)}`, label: "Meetings" },
    { icon: CircleHelp, value: "$1–$20", label: "Cost per lead", tip: "Depends on your market and offer" },
  ];
  return (
    <div className="glass-window-inner mx-auto max-w-[680px] p-4 md:px-9 md:py-6">
      <div className="mb-7">
        <div className="relative pt-9">
          <span
            className="absolute top-[-5px] -translate-x-1/2 text-2xl font-semibold tabular-nums text-foreground"
            style={{ left: `clamp(16px, calc((100% - 16px) * ${pos / 100} + 8px), calc(100% - 36px))` }}
          >
            ${fmt(usd)}
          </span>
          <Slider value={pos} onChange={setPos} label="Budget" />
        </div>
      </div>
      <div className="mb-7 grid grid-cols-2 gap-2">
        {tiles.map((t) => (
          <div key={t.label} className="relative flex flex-col rounded-lg bg-chip p-2">
            <span className="absolute right-2 top-2" title={t.tip}>
              <t.icon className={`h-5 w-5 text-muted-foreground ${t.tip ? "cursor-help" : ""}`} strokeWidth={1.5} />
            </span>
            <div className="break-words pr-7 text-2xl font-semibold tabular-nums text-foreground">{t.value}</div>
            <div className="mt-auto flex items-center gap-1 pt-2 text-base font-medium text-muted-foreground">{t.label}</div>
          </div>
        ))}
      </div>
      <div className="text-center">
        <button
          type="button"
          onClick={() => openCheckout(usd)}
          className="cta-primary inline-flex items-center gap-2 rounded-lg px-8 py-3 font-medium transition-all duration-300 hover:scale-105"
        >
          Get $30 to try it
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function Pricing() {
  return (
    <section>
      <div>
        <div id="pricing" className="scroll-mt-24">
          <div className="mx-auto mb-12 max-w-xl text-center">
            <h2>Pay as you go with no subscription</h2>
          </div>
          <PricingCalc />
        </div>
      </div>
    </section>
  );
}
