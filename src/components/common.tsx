"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

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

export function SectionHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mx-auto mb-10 max-w-[680px] text-center">
      <h2>{title}</h2>
      {sub && <p className="text-lg text-muted-foreground">{sub}</p>}
    </div>
  );
}
