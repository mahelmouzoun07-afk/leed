import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/components/data";

export const metadata: Metadata = { title: `Partner pack — ${BRAND}` };

const ITEMS = [
  ["Quotable numbers", "Median cost per lead, inbox rate and database size, with sources."],
  ["Ready posts", "Short posts for LinkedIn, X and newsletters you can adapt."],
  ["Screenshots", "Product screenshots of the agent at work, light and dark."],
  ["Logos", "Logo files in SVG and PNG with usage notes."],
];

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-12">
      <h1 className="hero-headline !text-[clamp(1.875rem,9.5vw,2.875rem)] md:!text-[3.75rem]">Partner pack</h1>
      <p className="max-w-[620px] text-lg">Everything you need to talk about {BRAND} with confidence.</p>
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        {ITEMS.map(([t, d]) => (
          <div key={t} className="glass-window-inner p-6">
            <div className="font-medium text-foreground">{t}</div>
            <p className="text-base">{d}</p>
            <span className="mt-2 inline-block text-sm text-muted-foreground">Available after you register</span>
          </div>
        ))}
      </div>
      <Link href="/affiliate/" className="mt-8 inline-block text-foreground underline underline-offset-4">
        Back to the affiliate program
      </Link>
    </div>
  );
}
