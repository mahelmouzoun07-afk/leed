"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { STATS } from "../data";
import { useUI } from "../ui";

function Gift() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13" />
      <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
    </svg>
  );
}

function StatBadge() {
  const [cur, setCur] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  useEffect(() => {
    const t = setInterval(() => {
      setCur((c) => {
        setPrev(c);
        return (c + 1) % STATS.length;
      });
    }, 4000);
    return () => clearInterval(t);
  }, []);
  const badge = (i: number, state: string) => (
    <span key={`${i}-${state}`} className="stat-badge" data-state={state} aria-hidden={state === "exit"}>
      <div className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-card px-4 py-2 text-xs shadow-[var(--shadow-plaque)] md:gap-2 md:text-sm">
        <span className="font-semibold tabular-nums text-foreground">{STATS[i].value}</span>
        <span className="font-normal text-foreground">{STATS[i].label}</span>
      </div>
    </span>
  );
  return (
    <div className="stat-badge-slot !mb-6">
      {prev !== null && prev !== cur && badge(prev, "exit")}
      {badge(cur, prev === null ? "still" : "enter")}
    </div>
  );
}

export function normalizeDomain(v: string) {
  const s = v.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/?#\s]/)[0];
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(s) ? s : null;
}

export function Hero() {
  const router = useRouter();
  const { openNoWebsite } = useUI();
  const [value, setValue] = useState("");
  const [invalid, setInvalid] = useState(false);
  const has = value.trim().length > 0;

  const launch = () => {
    const d = normalizeDomain(value);
    if (!d) {
      setInvalid(true);
      return;
    }
    router.push(`/start/?site=${encodeURIComponent(d)}`);
  };

  return (
    <section className="hero relative overflow-hidden">
      <div className="relative z-10 flex w-full flex-col items-center justify-center pt-10 text-center md:self-stretch md:pb-16 md:pt-24">
        <div className="flex w-full flex-col items-center justify-center">
          <StatBadge />
          <h1 className="hero-headline mx-auto mb-3 max-w-[760px]">
            Trouvez <span className="headline-accent">vos clients</span>
            <br />
            pendant que vous dormez
          </h1>
          <div className="!mb-10 flex flex-wrap items-center justify-center gap-2">
            <div className="inline-flex items-center rounded-full bg-chip px-4 py-1.5 text-sm text-foreground">Depuis vos propres comptes</div>
            <div className="inline-flex items-center gap-2 rounded-full bg-chip px-4 py-1.5 text-sm text-foreground">
              <Gift />
              10 entreprises offertes pour essayer
            </div>
          </div>
          <div className="flex w-full flex-col items-center">
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                launch();
              }}
              className="relative flex w-full max-w-[480px] flex-col gap-2 md:flex-row md:items-center"
            >
              <div data-invalid={invalid} className="hero-launch-field relative flex w-full items-center gap-2 rounded-2xl bg-card py-1 pl-5 pr-5 md:pr-1">
                <input
                  id="hero-website-input"
                  type="text"
                  autoComplete="off"
                  placeholder="L'adresse de votre site, ex. studiokoffi.bj"
                  aria-invalid={invalid}
                  aria-describedby={invalid ? "hero-website-error" : undefined}
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value);
                    setInvalid(false);
                  }}
                  className="min-w-0 flex-1 bg-transparent py-3 text-foreground outline-none placeholder:text-muted-foreground"
                />
                <button
                  type="submit"
                  disabled={!has}
                  aria-label="Trouver mes clients"
                  className="cta-primary cta-muted-disabled hidden flex-shrink-0 items-center justify-center rounded-lg px-3.5 py-3 font-medium transition-all duration-300 enabled:hover:scale-105 disabled:bg-chip md:inline-flex"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <button
                type="submit"
                disabled={!has}
                className="cta-primary cta-muted-disabled inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 font-medium transition-all duration-300 disabled:bg-chip md:hidden"
              >
                Trouver mes clients
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
            {invalid && (
              <div id="hero-website-error" role="alert" className="mt-2 text-sm text-destructive">
                Entrez une adresse de site valide, par exemple votreentreprise.com
              </div>
            )}
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={openNoWebsite}
              className="mt-4 text-sm font-normal text-muted-foreground transition-colors duration-300 hover:text-foreground"
            >
              Je n&apos;ai pas de site web
            </button>
          </div>
          <p className="mx-auto !mt-8 max-w-[560px] text-center text-lg text-muted-foreground md:!mt-10">
            Leed étudie votre marché, trouve les entreprises qui ont besoin de vous, leur écrit sur WhatsApp, Instagram, Facebook, LinkedIn ou par email, et vous amène des rendez-vous
          </p>
        </div>
      </div>
    </section>
  );
}
