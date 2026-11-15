"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download, Search } from "lucide-react";
import { INDUSTRIES } from "@/components/industries";
import { useUI } from "@/components/ui";

const COUNTRIES = ["United States", "United Kingdom", "Germany", "France", "Spain", "Canada", "Australia", "India", "Brazil", "Benin"];
const SIZES = ["1–10", "11–50", "51–200", "201–1000", "1000+"];
const SYL = ["nor", "bri", "vel", "tan", "lum", "cor", "ast", "pex", "mar", "qui", "zen", "oro", "fal", "dex", "kin"];
const SUF = ["Labs", "Group", "Studio", "Partners", "Works", "Systems", "& Co", "Digital", "Supply", "Health"];

function rng(seed: number) {
  let s = seed % 2147483647;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
function hash(t: string) {
  let h = 7;
  for (const c of t) h = (h * 31 + c.charCodeAt(0)) % 2147483647;
  return h || 1;
}

const MODES: Record<string, { title: string; sub: string }> = {
  icp: { title: "ICP Explorer", sub: "Build and refine your ideal customer segments" },
  lookalike: { title: "Lookalike Companies", sub: "Discover companies similar to your best customers" },
  research: { title: "Deep research agents", sub: "Enrich accounts with AI-derived datapoints" },
  default: { title: "Segments Explorer", sub: "Size any market in seconds and preview the companies inside it" },
};

export function Explorer() {
  const params = useSearchParams();
  const { openCheckout } = useUI();
  const mode = MODES[params.get("mode") || "default"] ?? MODES.default;
  const [industry, setIndustry] = useState(params.get("industry") || INDUSTRIES[0]);
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [size, setSize] = useState(SIZES[1]);
  const [q, setQ] = useState("");

  const { total, rows } = useMemo(() => {
    const r = rng(hash(industry + country + size));
    const total = Math.round(2000 + r() * 180000);
    const rows = Array.from({ length: 8 }).map(() => {
      const name = SYL[Math.floor(r() * SYL.length)] + SYL[Math.floor(r() * SYL.length)];
      const nm = name[0].toUpperCase() + name.slice(1) + " " + SUF[Math.floor(r() * SUF.length)];
      return { name: nm, domain: name + ".com", employees: size, score: Math.round(70 + r() * 29) };
    });
    return { total, rows };
  }, [industry, country, size]);

  const shown = rows.filter((x) => x.name.toLowerCase().includes(q.toLowerCase()));
  const sel = "h-11 w-full rounded-lg border border-border bg-card px-3 text-base text-foreground outline-none focus:border-primary";

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 pb-24 pt-8 md:pt-14">
      <h1 className="hero-headline !text-[clamp(1.875rem,7vw,3rem)]">{mode.title}</h1>
      <p className="!mt-3 max-w-[620px] text-lg">{mode.sub}</p>
      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        <div className="glass-window-inner flex flex-col gap-4 self-start p-5">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
            Industry
            <select value={industry} onChange={(e) => setIndustry(e.target.value)} className={sel}>
              {INDUSTRIES.map((i) => (
                <option key={i}>{i}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
            Country
            <select value={country} onChange={(e) => setCountry(e.target.value)} className={sel}>
              {COUNTRIES.map((i) => (
                <option key={i}>{i}</option>
              ))}
            </select>
          </label>
          <div className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
            Company size
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={s === size}
                  onClick={() => setSize(s)}
                  className={`rounded-full px-3 py-1.5 text-sm ${s === size ? "bg-primary text-primary-foreground" : "bg-chip text-foreground"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-lg bg-chip p-4">
            <div className="text-3xl font-semibold tabular-nums text-brand-600">{total.toLocaleString("en-US")}</div>
            <div className="text-sm text-muted-foreground">companies match this segment</div>
          </div>
          <button type="button" onClick={() => openCheckout(30)} className="cta-primary inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 font-medium">
            <Download className="h-4 w-4" /> Export or start outreach
          </button>
        </div>
        <div className="glass-window-inner">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter preview by name" aria-label="Filter preview by name" className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground" />
          </div>
          <div className="company-data-table-wrap !pt-0">
            <table className="company-data-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Employees</th>
                  <th>Website</th>
                  <th>Fit</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((x) => (
                  <tr key={x.domain + x.name}>
                    <td>{x.name}</td>
                    <td>{x.employees}</td>
                    <td>{x.domain}</td>
                    <td className="tabular-nums">{x.score}%</td>
                  </tr>
                ))}
                {shown.length === 0 && (
                  <tr>
                    <td colSpan={4}>No company in the preview matches “{q}”</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border px-4 py-3 text-sm text-muted-foreground">Preview of sample companies. Sign in to see the full list.</div>
        </div>
      </div>
    </div>
  );
}
