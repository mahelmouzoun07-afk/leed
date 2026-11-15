import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Building2, Globe2, MapPin } from "lucide-react";
import { FOOTER } from "./data";

export const REGION_COUNTS: Record<string, string> = {
  benin: "60K+",
  "north-america": "26M+",
  europe: "38M+",
  "asia-pacific": "21M+",
  "southeast-asia": "4M+",
  "latin-america": "9M+",
  "middle-east": "2M+",
  cis: "3M+",
  oceania: "2M+",
  africa: "3M+",
};

export const REGION_COUNTRIES: Record<string, [string, string][]> = {
  benin: [["Cotonou", "28K+"], ["Porto-Novo", "9K+"], ["Parakou", "6K+"], ["Abomey-Calavi", "5K+"]],
  "north-america": [["United States", "22M+"], ["Canada", "2M+"], ["Mexico", "1M+"]],
  europe: [["Germany", "6M+"], ["United Kingdom", "6M+"], ["France", "4M+"], ["Spain", "3M+"], ["Italy", "2M+"], ["Netherlands", "1M+"]],
  "asia-pacific": [["India", "5M+"], ["China", "4M+"], ["Japan", "3M+"], ["South Korea", "1M+"]],
  "southeast-asia": [["Indonesia", "1M+"], ["Vietnam", "800K+"], ["Thailand", "700K+"], ["Philippines", "600K+"]],
  "latin-america": [["Brazil", "4M+"], ["Argentina", "1M+"], ["Colombia", "900K+"], ["Chile", "600K+"]],
  "middle-east": [["Türkiye", "900K+"], ["United Arab Emirates", "400K+"], ["Saudi Arabia", "300K+"]],
  cis: [["Russian Federation", "2M+"], ["Kazakhstan", "300K+"], ["Uzbekistan", "200K+"]],
  oceania: [["Australia", "2M+"], ["New Zealand", "400K+"]],
  africa: [["Nigeria", "600K+"], ["South Africa", "500K+"], ["Kenya", "300K+"], ["Benin", "60K+"]],
};

export const INDUSTRIES = [
  "Information and communication",
  "Professional, scientific and technical activities",
  "Wholesale and retail trade",
  "Manufacturing",
  "Arts, entertainment and recreation",
  "Education",
  "Other service activities",
  "Administrative and support service activities",
  "Construction",
  "Human health and social work activities",
  "Accommodation and food service activities",
  "Financial and insurance activities",
  "Real estate activities",
  "Transportation and storage",
  "Agriculture, forestry and fishing",
  "Public administration and defence",
  "Water supply, sewerage, waste management",
  "Electricity, gas, steam and air conditioning supply",
  "Mining and quarrying",
  "Activities of households as employers",
  "Activities of extraterritorial organisations",
];

const grad = { backgroundImage: "linear-gradient(0.283turn, rgba(5,172,130,1) 0%, rgba(21,173,220,1) 100%)" };

export function GradientNum({ children }: { children: ReactNode }) {
  return (
    <span className="bg-clip-text text-transparent" style={grad}>
      {children}
    </span>
  );
}

export function CatalogHero({ title, accent, sub }: { title: string; accent?: string; sub: string }) {
  return (
    <section className="hero">
      <div className="w-full px-4 pt-10 text-center md:pb-10">
        <h1 className="hero-headline mx-auto max-w-[900px]">
          {title} {accent && <span className="headline-accent">{accent}</span>}
        </h1>
        <p className="mx-auto !mt-6 max-w-[620px] text-lg">{sub}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/tools/explorer/" className="cta-primary inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition-all duration-300 hover:scale-105">
            Explore the data <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/api-docs/" className="inline-flex items-center rounded-lg bg-chip px-6 py-3 font-medium text-foreground">
            Use the API
          </Link>
        </div>
      </div>
    </section>
  );
}

export function RegionsGrid() {
  return (
    <section>
      <div>
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2>
            Explore <GradientNum>105M+</GradientNum> companies across the world
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FOOTER.regions.map(([name, slug]) => (
            <Link
              key={slug}
              href={`/b2b-database/locations/${slug}/`}
              className="glass-window-inner flex items-center justify-between p-5 transition-transform hover:-translate-y-0.5"
            >
              <span className="flex items-center gap-3">
                <Globe2 className="h-5 w-5 text-muted-foreground" />
                <span className="text-base font-medium text-foreground">{name}</span>
              </span>
              <span className="text-base tabular-nums text-muted-foreground">{REGION_COUNTS[slug]}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function IndustriesList({ where }: { where?: string }) {
  return (
    <section>
      <div>
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2>
            Explore companies {where ? `in ${where} ` : ""}across <GradientNum>21</GradientNum> industries
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {INDUSTRIES.map((ind) => (
            <Link
              key={ind}
              href={`/tools/explorer/?industry=${encodeURIComponent(ind)}`}
              className="flex items-center gap-3 rounded-lg bg-card px-4 py-3 text-base text-foreground shadow-[var(--shadow-plaque)] transition-colors hover:bg-chip"
            >
              <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{ind}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CountryList({ title, rows }: { title: ReactNode; rows: [string, string][] }) {
  return (
    <section>
      <div>
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2>{title}</h2>
        </div>
        <div className="glass-window-inner mx-auto max-w-[760px]">
          {rows.map(([n, c]) => (
            <div key={n} className="flex items-center justify-between border-b border-border px-5 py-3 last:border-0">
              <span className="flex items-center gap-2 text-base text-foreground">
                <MapPin className="h-4 w-4 text-muted-foreground" /> {n}
              </span>
              <span className="text-base tabular-nums text-muted-foreground">{c}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
