import type { Metadata } from "next";
import { Bot, Code2, Headphones, LineChart, Megaphone, Rocket, Wallet } from "lucide-react";
import { BRAND } from "@/components/data";

export const metadata: Metadata = { title: `About ${BRAND} | AI that works, not talks` };

const AREAS = [
  [Megaphone, "Marketing"],
  [Rocket, "Sales"],
  [Headphones, "Support"],
  [Code2, "Engineering"],
  [LineChart, "Analytics"],
  [Wallet, "Finance"],
  [Bot, "Operations"],
] as const;

const DEPLOYS = [
  ["Improve reply detection", "Just now"],
  ["Faster company search", "24 min ago"],
  ["New warm-up schedule", "48 min ago"],
  ["Fix email preview spacing", "1 h 12 min ago"],
];

const TEAM = [
  { name: "Founder & CEO", role: "Product and growth", grad: "linear-gradient(135deg,#d1fae5,#6ee7b7)" },
  { name: "Co-founder & CTO", role: "Agents and infrastructure", grad: "linear-gradient(135deg,#e0e7ff,#a5b4fc)" },
];

export default function Page() {
  return (
    <>
      <section className="hero">
        <div className="w-full px-4 pt-10 text-center md:pb-16">
          <h1 className="about-section-title hero-headline mx-auto max-w-[760px]">
            AI that <span className="headline-accent">works</span>, not talks
          </h1>
          <p className="mx-auto !mt-6 max-w-[560px] text-lg">
            {BRAND} is a small team in London building an agent that does outbound sales from research to booked meeting.
          </p>
          <div className="mx-auto mt-10 max-w-[760px]">
            <div className="text-sm text-muted-foreground">Backed by leading VCs</div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              {["Fund One", "Northlight Ventures", "Seed Partners"].map((v) => (
                <span key={v} className="rounded-xl bg-card px-5 py-3 text-base font-medium text-muted-foreground shadow-[var(--shadow-plaque)]">
                  {v}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section>
        <div>
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2>How we work</h2>
            <p className="text-lg">Agents run the day-to-day</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="glass-window-inner flex flex-col gap-4 p-6">
              <div className="flex items-baseline justify-between">
                <h3 className="about-card-title">Run by agents</h3>
                <span className="text-base text-muted-foreground">7 areas</span>
              </div>
              <div className="about-roles">
                {AREAS.map(([I, l]) => (
                  <span key={l}>
                    <I className="h-4 w-4" /> {l}
                  </span>
                ))}
              </div>
            </div>
            <div className="glass-window-inner flex flex-col gap-4 p-6">
              <h3 className="about-card-title">100% of our code is written by AI</h3>
              <div className="about-waffle" aria-label="Written by AI">
                {Array.from({ length: 100 }).map((_, i) => (
                  <span key={i} style={{ animationDelay: `${(i * 37) % 50 / 10}s` }} />
                ))}
              </div>
              <div className="text-sm text-muted-foreground">Written by AI</div>
            </div>
            <div className="glass-window-inner flex flex-col gap-4 p-6 md:col-span-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="about-card-title">We deploy every 24 minutes</h3>
                <div className="text-right">
                  <div className="text-3xl font-semibold tabular-nums text-foreground">60</div>
                  <div className="text-sm text-muted-foreground">Deploys a day, on average</div>
                </div>
              </div>
              <div className="overflow-hidden rounded-lg bg-chip">
                <div className="grid grid-cols-[1fr_auto_auto] gap-x-6 border-b border-border px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground">
                  <span>Deploy</span>
                  <span>Status</span>
                  <span className="text-right">When</span>
                </div>
                {DEPLOYS.map(([d, t]) => (
                  <div key={d} className="grid grid-cols-[1fr_auto_auto] gap-x-6 border-b border-border px-4 py-2.5 text-base last:border-0">
                    <span className="truncate text-foreground">{d}</span>
                    <span className="inline-flex items-center gap-2 text-muted-foreground">
                      Shipped <span className="status-pulse inline-block h-[6px] w-[6px] bg-brand-500" />
                    </span>
                    <span className="text-right tabular-nums text-muted-foreground">{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div>
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2>The team</h2>
          </div>
          <div className="glass-window-inner">
            <div className="flex flex-col md:flex-row">
              {TEAM.map((m) => (
                <div key={m.name} className="flex flex-1 flex-col">
                  <div className="aspect-[2] w-full" style={{ background: m.grad }} aria-hidden="true" />
                  <div className="px-6 py-5">
                    <div className="text-base font-medium text-foreground">{m.name}</div>
                    <p className="!my-1 text-base">{m.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
