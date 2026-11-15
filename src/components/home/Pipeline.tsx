"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, LoaderCircle } from "lucide-react";
import { BRAND, CAMPAIGNS, COMPETITORS, FIT_ROWS, PEOPLE } from "../data";
import { PixelLoader, useInView } from "../ui";

/* 1 — Learns what you sell */
function LearnsIllustration() {
  const [ref, seen] = useInView<HTMLDivElement>(0.2);
  const [shown, setShown] = useState(5);
  useEffect(() => {
    if (!seen) return;
    let n = 5;
    const t = setInterval(() => {
      n++;
      setShown(n);
      if (n > COMPETITORS.length) clearInterval(t);
    }, 1200);
    return () => clearInterval(t);
  }, [seen]);
  return (
    <div ref={ref} className="w-full divide-y divide-border rounded-lg bg-chip px-4">
      <div className="py-4">
        <div className="mb-1 text-base font-medium text-foreground">oakandreed.com</div>
        <p className="!mb-0 text-base leading-relaxed text-muted-foreground">
          Handmade ceramic tableware for restaurants, cafés &amp; hotels, made in small batches since 1998
        </p>
      </div>
      <div className="py-4">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-4 w-4 items-center justify-center">
            <PixelLoader active={shown <= COMPETITORS.length} />
          </div>
          <span className="text-base font-medium text-muted-foreground">{BRAND} agent is studying competitors…</span>
        </div>
        <div className="flex flex-col gap-2">
          {COMPETITORS.map((c, i) => {
            const visible = i < shown;
            const done = i < shown - 1;
            return (
              <div
                key={c.domain}
                className="flex items-start gap-2 transition-all duration-300"
                style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateX(-8px)" }}
              >
                <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center self-center">
                  {visible && (done ? <Check className="h-3.5 w-3.5 text-brand-500" /> : <LoaderCircle className="h-3.5 w-3.5 animate-spin text-muted-foreground" />)}
                </div>
                <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full" style={{ background: c.color }} aria-hidden="true" />
                <span className="text-base text-foreground">{c.domain}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* 2 — Figures out who buys it */
function FitIllustration() {
  return (
    <div className="glass-window-inner w-full">
      <div className="company-data-table-wrap !pt-0">
        <table className="company-data-table company-data-table--lg">
          <thead>
            <tr>
              <th>Clients</th>
              <th>Fit score</th>
            </tr>
          </thead>
          <tbody>
            {FIT_ROWS.map(([n, s]) => (
              <tr key={n}>
                <td>{n}</td>
                <td>
                  <span className="tabular-nums">{s}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* 3 — Finds those exact people */
function PeopleIllustration() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-1 lg:grid-cols-2">
      {PEOPLE.map((p) => (
        <div key={p.email} className="min-w-0 rounded-lg bg-chip p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="hidden h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-chip text-base font-medium text-foreground md:flex">{p.i}</div>
            <div className="min-w-0">
              <div className="truncate text-base font-medium text-foreground">{p.name}</div>
              <div className="truncate text-sm text-muted-foreground">
                {p.role} · {p.company}
              </div>
            </div>
          </div>
          <div className="truncate text-sm text-muted-foreground">{p.email}</div>
        </div>
      ))}
    </div>
  );
}

/* 4 — Writes each a personal email */
function EmailIllustration() {
  return (
    <div className="glass-window-inner w-full">
      <div className="grid grid-cols-[auto_1fr] gap-x-3 border-b border-border px-4 py-2.5">
        <span className="text-base text-muted-foreground">Subject</span>
        <span className="text-base font-medium text-foreground">Oak &amp; Reed x Fig &amp; Ember</span>
      </div>
      <div className="px-4 pb-4 pt-4 text-base leading-relaxed text-muted-foreground">
        Hi there,
        <br />
        <br />
        Saw <span className="border-b border-border bg-chip text-foreground">Fig &amp; Ember just opened a second dining room</span>. More covers usually means more chipped plates and mismatched sets. Oak &amp; Reed makes durable stoneware in small batches, so a re-order always matches.
        <br />
        <br />
        Want a sample set to try on your busiest night?
      </div>
    </div>
  );
}

/* 5 — Handles replies and books meetings */
function ChatIllustration() {
  return (
    <div className="w-full">
      <div className="flex w-full flex-col gap-3">
        <div className="max-w-[82%] self-start rounded-2xl rounded-bl-[2px] bg-chip px-3 py-2">
          <span className="text-base text-foreground">Do they survive a commercial dishwasher?</span>
        </div>
        <div className="max-w-[82%] self-start rounded-2xl rounded-bl-[2px] bg-chip px-3 py-2">
          <span className="text-base text-foreground">Good to know, can you do Tuesday 2pm?</span>
        </div>
        <div className="flex max-w-full flex-col gap-2 self-end rounded-2xl rounded-br-[2px] bg-chip px-3 pb-3 pt-2 md:max-w-[82%]">
          <span className="text-base text-foreground">Tuesday 2pm works, sending the invite now.</span>
          <span className="inline-flex items-center gap-1.5 self-start whitespace-nowrap rounded-md bg-chip px-2.5 py-1 text-sm font-medium text-foreground md:text-base">
            <Check className="h-3.5 w-3.5 flex-shrink-0 text-brand-500" />
            Demo booked · Tue 14:00
          </span>
        </div>
      </div>
    </div>
  );
}

/* 6 — Learns what works and doubles down */
function CampaignIllustration() {
  return (
    <div className="glass-window-inner w-full">
      <div className="company-data-table-wrap !pt-0">
        <table className="company-data-table company-data-table--lg company-data-table--status-left">
          <thead>
            <tr>
              <th>Campaign</th>
              <th>Status</th>
              <th>Cost/lead</th>
            </tr>
          </thead>
          <tbody>
            {CAMPAIGNS.map(([n, s, c, on]) => (
              <tr key={n} className={on ? "" : "row-dim"}>
                <td>{n}</td>
                <td>
                  <span className="inline-flex items-center gap-2">
                    {s}
                    {on && <span className="status-pulse inline-block h-[6px] w-[6px] bg-brand-500" />}
                  </span>
                </td>
                <td>{c}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const CARDS: { title: string; bleed: boolean; body: ReactNode }[] = [
  { title: "Learns what you sell", bleed: true, body: <LearnsIllustration /> },
  { title: "Figures out who buys it", bleed: true, body: <FitIllustration /> },
  { title: "Finds those exact people", bleed: true, body: <PeopleIllustration /> },
  { title: "Writes each a personal email", bleed: true, body: <EmailIllustration /> },
  { title: "Handles replies and books meetings", bleed: false, body: <ChatIllustration /> },
  { title: "Learns what works and doubles down", bleed: true, body: <CampaignIllustration /> },
];
const MARGINS = [65, 58, 51, 44, 35, 0];

export function Pipeline() {
  const wraps = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const els = wraps.current;
      els.forEach((el, i) => {
        if (!el) return;
        let covered = 0;
        for (let k = i + 1; k < els.length; k++) {
          const nx = els[k];
          if (!nx) continue;
          const stickTop = 196 + 7 * k;
          if (nx.getBoundingClientRect().top <= stickTop + 1) covered++;
        }
        el.style.transform = `scale(${1 - covered * 0.02})`;
      });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section>
      <div>
        <div className="use-case-stack">
          <div style={{ position: "absolute", inset: "0 0 523px", pointerEvents: "none", zIndex: 7 }}>
            <div className="use-case-header mx-auto max-w-2xl text-center" style={{ position: "sticky", top: 84, pointerEvents: "auto" }}>
              <h2>We run the entire pipeline</h2>
            </div>
          </div>
          <div aria-hidden="true" className="mb-6 md:mb-12" style={{ height: 80 }} />
          {CARDS.map((c, i) => (
            <div
              key={c.title}
              ref={(el) => {
                wraps.current[i] = el;
              }}
              className="use-case-sticky-wrap"
              style={{ position: "sticky", top: 196 + 7 * i, zIndex: i + 1, marginBottom: MARGINS[i] }}
            >
              <div className={`use-case-card ${c.bleed ? "use-case-card--bleed" : ""}`}>
                <div className="use-case-card-inner">
                  <div className="use-case-text">
                    <h2>{c.title}</h2>
                  </div>
                  <div className="use-case-illustration">{c.bleed ? <div className="use-case-bleed-preview">{c.body}</div> : c.body}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
