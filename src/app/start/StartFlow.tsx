"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, LoaderCircle, Mail, Search, Users } from "lucide-react";
import { PixelLoader, useUI } from "@/components/ui";
import { BRAND } from "@/components/data";

const STEPS = ["Research", "Prepare", "Outreach"];
const SEGMENTS = ["Operations leaders", "Founders of small agencies", "Procurement managers", "Regional distributors", "Growing e-commerce brands"];
const PEOPLE = [
  ["Alex Turner", "Head of Operations"],
  ["Maya Patel", "Founder"],
  ["Jonas Weber", "Procurement Lead"],
];

function titleCase(s: string) {
  return s.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function StartFlow() {
  const params = useSearchParams();
  const { openCheckout } = useUI();
  const site = (params.get("site") || "").trim();
  const about = (params.get("about") || "").trim();
  const name = useMemo(() => (site ? titleCase(site.split(".")[0]) : "Your company"), [site]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setTick(0);
    const t = setInterval(() => setTick((n) => (n >= 16 ? n : n + 1)), 650);
    return () => clearInterval(t);
  }, [site, about]);

  const stage = tick < 7 ? 0 : tick < 13 ? 1 : 2;
  const competitors = [`${site.split(".")[0] || "market"}-alt.com`, "northpeak.io", "corelane.com", "brightway.co"];

  return (
    <div className="mx-auto w-full max-w-[880px] px-4 pb-24 pt-6 md:pt-10">
      <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <h1 className="hero-headline !text-[clamp(1.875rem,7vw,2.875rem)]">
        {stage < 2 ? (
          <>
            Finding leads for <span className="headline-accent">{site || "your business"}</span>
          </>
        ) : (
          <>
            Your first <span className="headline-accent">hot leads</span> are ready
          </>
        )}
      </h1>
      {about && <p className="!mt-3 max-w-[640px] text-base">“{about}”</p>}

      <ol className="mt-8 flex items-center gap-2" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm ${
                i < stage ? "bg-brand-50 text-brand-600" : i === stage ? "bg-card text-foreground shadow-[var(--shadow-plaque)]" : "bg-chip text-muted-foreground"
              }`}
              aria-current={i === stage ? "step" : undefined}
            >
              {i < stage ? <Check className="h-3.5 w-3.5" /> : i === stage ? <PixelLoader /> : <span className="h-3 w-3" />}
              {s}
            </span>
            {i < STEPS.length - 1 && <span className="h-px w-6 bg-border" />}
          </li>
        ))}
      </ol>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="glass-window-inner p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Search className="h-4 w-4" /> Learning what you sell
          </div>
          <div className="mt-3 text-base font-medium text-foreground">{site || "Your business"}</div>
          <p className="!mt-1 text-base leading-relaxed">
            {about || `${name} helps businesses in its market. The agent reads the site, offers and pricing to understand who it is for.`}
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {competitors.map((c, i) => {
              const vis = tick > i;
              const done = tick > i + 1;
              return (
                <div key={c} className="flex items-center gap-2 transition-all duration-300" style={{ opacity: vis ? 1 : 0, transform: vis ? "none" : "translateX(-8px)" }}>
                  {done ? <Check className="h-3.5 w-3.5 text-brand-500" /> : <LoaderCircle className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                  <span className="text-base text-foreground">{c}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-window-inner p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Users className="h-4 w-4" /> Who buys it
          </div>
          <div className="mt-3 divide-y divide-border">
            {SEGMENTS.map((s, i) => {
              const vis = tick > 3 + i;
              return (
                <div key={s} className="flex justify-between py-2 text-base transition-opacity duration-300" style={{ opacity: vis ? 1 : 0.15 }}>
                  <span className={i < 3 ? "font-medium text-foreground" : "text-muted-foreground"}>{s}</span>
                  <span className="tabular-nums text-muted-foreground">{92 - i * 5}%</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-window-inner p-5 md:col-span-2" style={{ opacity: stage >= 1 ? 1 : 0.4, transition: "opacity .3s" }}>
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Mail className="h-4 w-4" /> Prepared emails
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            {PEOPLE.map(([n, r], i) => {
              const vis = tick > 7 + i * 2;
              return (
                <div key={n} className="rounded-lg bg-chip p-4 transition-all duration-300" style={{ opacity: vis ? 1 : 0, transform: vis ? "none" : "translateY(6px)" }}>
                  <div className="text-base font-medium text-foreground">{n}</div>
                  <div className="text-sm text-muted-foreground">
                    {r} · {SEGMENTS[i]}
                  </div>
                  <div className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    Hi {n.split(" ")[0]}, noticed your team is growing fast. {name} could take one task off your plate this quarter. Worth a quick look?
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center gap-3 text-center" aria-live="polite">
        {stage < 2 ? (
          <span className="inline-flex items-center gap-2 text-base text-muted-foreground">
            <LoaderCircle className="h-4 w-4 animate-spin" /> {stage === 0 ? "Researching your market…" : "Writing personal emails…"}
          </span>
        ) : (
          <>
            <p className="!my-0 text-lg">The {BRAND} agent is ready to send these emails and handle the replies.</p>
            <button
              type="button"
              onClick={() => openCheckout(30)}
              className="cta-primary inline-flex items-center gap-2 rounded-lg px-8 py-3 font-medium transition-all duration-300 hover:scale-105"
            >
              Get $30 to try it <ArrowRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
