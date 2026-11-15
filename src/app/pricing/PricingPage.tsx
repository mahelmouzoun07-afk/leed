"use client";

import { ArrowRight, Check } from "lucide-react";
import { PricingCalc } from "@/components/home/Features";
import { Accordion } from "@/components/common";
import { useUI } from "@/components/ui";

const PLANS = [
  { name: "Pay as you go", price: "$0.04", unit: "per email", note: "No commitment, stop anytime", features: ["Agent researches and writes for you", "Pre-warmed sending domains", "Replies handled automatically"], cta: "Start free", amount: 30 },
  { name: "Typical", price: "$100", unit: "per month", note: "About 2,500 emails a month", features: ["Everything in Pay as you go", "Several campaigns in parallel", "Weekly results report"], cta: "Choose Typical", amount: 100, featured: true },
  { name: "Growth", price: "$500", unit: "per month", note: "About 12,500 emails a month", features: ["Everything in Typical", "Dedicated domains and mailboxes", "Priority support"], cta: "Choose Growth", amount: 500 },
];

export function PricingPage() {
  const { openCheckout } = useUI();
  return (
    <>
      <section className="hero">
        <div className="w-full px-4 pt-10 text-center md:pb-10">
          <h1 className="hero-headline mx-auto max-w-[760px]">
            Pay only for the <span className="headline-accent">emails you send</span>
          </h1>
          <p className="mx-auto !mt-6 max-w-[560px] text-lg">No subscription required. Start with $30 in free credits and scale when it works.</p>
          <div className="mt-10">
            <PricingCalc />
          </div>
        </div>
      </section>
      <section>
        <div>
          <div className="mx-auto mb-12 max-w-xl text-center">
            <h2>Pick the pace that fits</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {PLANS.map((p) => (
              <div key={p.name} className={`glass-window-inner flex flex-col p-6 ${p.featured ? "outline outline-2 outline-brand-600" : ""}`}>
                <div className="flex items-center justify-between">
                  <div className="text-xl font-medium text-foreground">{p.name}</div>
                  {p.featured && <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-sm text-brand-600">Most popular</span>}
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-4xl font-semibold tabular-nums text-foreground">{p.price}</span>
                  <span className="text-base text-muted-foreground">{p.unit}</span>
                </div>
                <p className="text-base">{p.note}</p>
                <ul className="mt-2 space-y-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-base text-muted-foreground">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-brand-500" /> {f}
                    </li>
                  ))}
                </ul>
                <button type="button" onClick={() => openCheckout(p.amount)} className="cta-primary mt-6 inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 font-medium transition-all duration-300 hover:scale-[1.02]">
                  {p.cta} <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section>
        <div className="mx-auto max-w-[720px]">
          <div className="mx-auto mb-10 max-w-xl text-center">
            <h2>Pricing questions</h2>
          </div>
          <Accordion
            items={[
              { q: "What counts as an email?", a: "Every message the agent sends, including follow-ups. Replies you receive are free." },
              { q: "Can I get a refund?", a: "Yes. If you get no positive replies after 1,000 emails, the first payment is refunded." },
              { q: "Do I need my own domain or mailbox?", a: "No. Sending domains are set up and warmed for you from day one." },
              { q: "Can I set a daily budget?", a: "Yes, set a daily cap and the agent never sends more than that." },
            ]}
          />
        </div>
      </section>
    </>
  );
}
