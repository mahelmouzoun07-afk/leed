import type { Metadata } from "next";
import { BRAND, BRAND_LOWER } from "@/components/data";

export const metadata: Metadata = { title: `API documentation — ${BRAND}` };

const ENDPOINTS = [
  { m: "GET", p: "/v1/companies/search", d: "Search companies by industry, country, size and keywords." },
  { m: "GET", p: "/v1/companies/{domain}", d: "Full profile of one company by its website." },
  { m: "GET", p: "/v1/people/search", d: "Find decision makers by role at a list of companies." },
  { m: "POST", p: "/v1/lookalikes", d: "Companies similar to the domains you send." },
  { m: "POST", p: "/v1/research", d: "Run a research agent that answers a question about each account." },
];

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-[960px] px-4 pb-24 pt-8 md:pt-14">
      <h1 className="hero-headline !text-[clamp(1.875rem,7vw,3rem)]">API documentation</h1>
      <p className="!mt-3 max-w-[640px] text-lg">Power your own agent with {BRAND}&apos;s company and people data. All requests use a bearer token from your dashboard.</p>
      <pre className="mt-8 overflow-x-auto rounded-2xl bg-[#161616] p-5 font-mono text-sm leading-relaxed text-[#f8f8f8]">
        {`curl https://api.${BRAND_LOWER}.example/v1/companies/search \\
  -H "Authorization: Bearer $API_KEY" \\
  -G -d industry="Manufacturing" -d country="Germany" -d size="51-200"`}
      </pre>
      <div className="glass-window-inner mt-8">
        {ENDPOINTS.map((e) => (
          <div key={e.p} className="flex flex-col gap-1 border-b border-border px-5 py-4 last:border-0 md:flex-row md:items-center md:gap-4">
            <span className={`w-14 shrink-0 rounded-md px-2 py-0.5 text-center font-mono text-xs font-semibold ${e.m === "GET" ? "bg-brand-50 text-brand-600" : "bg-chip text-foreground"}`}>{e.m}</span>
            <code className="font-mono text-sm text-foreground">{e.p}</code>
            <span className="text-base text-muted-foreground md:ml-auto md:text-right">{e.d}</span>
          </div>
        ))}
      </div>
      <p className="mt-6 text-sm">Sample documentation for the demo site. Pricing is per request; see the pricing page.</p>
    </div>
  );
}
