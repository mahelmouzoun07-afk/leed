"use client";

import { useState, type ReactNode } from "react";
import { ArrowRight, Check, ChevronDown } from "lucide-react";

export function Accordion({ items, bordered = false }: { items: { q: string; a: ReactNode }[]; bordered?: boolean }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className={`w-full ${bordered ? "rounded-lg border border-border" : ""}`}>
      {items.map((it, i) => {
        const on = open === i;
        return (
          <div key={it.q} className={`border-b border-border last:border-b-0 ${bordered ? "px-4" : ""}`}>
            <h3 className="flex">
              <button
                type="button"
                aria-expanded={on}
                aria-controls={`acc-${i}`}
                onClick={() => setOpen(on ? null : i)}
                className="flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-base font-medium text-foreground transition-all hover:underline"
              >
                {it.q}
                <ChevronDown className={`size-4 shrink-0 translate-y-0.5 text-muted-foreground transition-transform duration-200 ${on ? "rotate-180" : ""}`} />
              </button>
            </h3>
            <div
              id={`acc-${i}`}
              role="region"
              className="grid transition-[grid-template-rows] duration-200 ease-out"
              style={{ gridTemplateRows: on ? "1fr" : "0fr" }}
            >
              <div className="min-h-0 overflow-hidden">
                <div className="pb-4 pt-0 text-base text-muted-foreground">{it.a}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

export function EmailCapture({ cta, surface = "card", done }: { cta: string; surface?: "card" | "chip"; done?: string }) {
  const [v, setV] = useState("");
  const [bad, setBad] = useState(false);
  const [ok, setOk] = useState(false);
  if (ok)
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl bg-brand-50 px-5 py-4 text-base text-foreground">
        <Check className="h-4 w-4 text-brand-600" /> {done ?? "Check your inbox, your partner link is on its way"}
      </div>
    );
  return (
    <form
      noValidate
      className="w-full"
      onSubmit={(e) => {
        e.preventDefault();
        if (!isEmail(v)) return setBad(true);
        setOk(true);
      }}
    >
      <div
        data-invalid={bad}
        className={`hero-launch-field relative flex w-full flex-col items-stretch gap-2 rounded-2xl px-5 py-1.5 md:flex-row md:items-center md:pr-1 ${surface === "card" ? "bg-card" : "bg-chip"}`}
      >
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          aria-label="Your email"
          aria-invalid={bad}
          placeholder="you@yourdomain.com"
          value={v}
          onChange={(e) => {
            setV(e.target.value);
            setBad(false);
          }}
          className="min-w-0 flex-1 bg-transparent py-3 text-foreground outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          className="cta-primary mb-2 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg px-5 py-3 font-medium transition-all duration-300 hover:scale-105 md:mb-0"
        >
          {cta}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
      {bad && <div className="mt-2 text-left text-sm text-destructive">Enter a valid email address</div>}
    </form>
  );
}

export function SectionHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mx-auto mb-10 max-w-[680px] text-center">
      <h2>{title}</h2>
      {sub && <p className="text-lg text-muted-foreground">{sub}</p>}
    </div>
  );
}
