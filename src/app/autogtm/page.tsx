import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BRAND } from "@/components/data";

export const metadata: Metadata = { title: `New name, same product — ${BRAND}` };

export default function Page() {
  return (
    <section className="hero">
      <div className="w-full px-4 pt-10 text-center md:pb-16">
        <h1 className="hero-headline mx-auto max-w-[760px]">
          New name, <span className="headline-accent">same product</span>
        </h1>
        <p className="mx-auto !mt-6 max-w-[560px] text-lg">
          Your old homepage moved to {BRAND}. Your account, campaigns and credits are exactly where you left them.
        </p>
        <div className="mx-auto mt-8 grid max-w-[720px] grid-cols-1 gap-3 text-left sm:grid-cols-3">
          {["Research", "Prepare", "Outreach"].map((s, i) => (
            <div key={s} className="glass-window-inner p-5">
              <div className="text-sm text-muted-foreground">Step {i + 1}</div>
              <div className="mt-1 text-lg font-medium text-foreground">{s}</div>
            </div>
          ))}
        </div>
        <Link href="/" className="cta-primary mt-8 inline-flex items-center gap-2 rounded-lg px-8 py-3 font-medium transition-all duration-300 hover:scale-105">
          Go to {BRAND} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
