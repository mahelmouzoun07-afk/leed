"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, X } from "lucide-react";
import { Accordion, EmailCapture, SectionHead } from "@/components/common";
import { Slider } from "@/components/ui";
import { BRAND } from "@/components/data";

const fmt = (n: number) => n.toLocaleString("en-US");

function Earnings() {
  const [count, setCount] = useState(5);
  const [spend, setSpend] = useState(100);
  const monthly = Math.round(count * spend * 0.2);
  return (
    <div className="glass-window-inner mx-auto max-w-[680px] p-4 md:px-9 md:py-7">
      <div className="mb-6">
        <div className="mb-3 flex items-baseline justify-between gap-4">
          <span className="text-base font-medium text-muted-foreground">Customers you refer</span>
          <span className="text-2xl font-semibold tabular-nums text-foreground">{count}</span>
        </div>
        <Slider value={count} min={1} max={100} onChange={setCount} label="Customers you refer" />
      </div>
      <div className="mb-7">
        <div className="mb-3 flex items-baseline justify-between gap-4">
          <span className="text-base font-medium text-muted-foreground">What each of them spends per month</span>
          <span className="text-2xl font-semibold tabular-nums text-foreground">${fmt(spend)}</span>
        </div>
        <Slider value={spend} min={30} max={1000} step={10} onChange={setSpend} label="What each of them spends per month" />
        <p className="!mt-3 text-base text-muted-foreground">Billing is per email sent, so most accounts land near $100 a month</p>
      </div>
      <div className="mb-7 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="rounded-lg bg-chip p-4">
          <div className="text-3xl font-semibold leading-tight tabular-nums text-brand-600">${fmt(monthly)}</div>
          <div className="mt-1 text-base font-medium text-muted-foreground">your commission per month</div>
        </div>
        <div className="rounded-lg bg-chip p-4">
          <div className="text-3xl font-semibold leading-tight tabular-nums text-foreground">${fmt(monthly * 12)}</div>
          <div className="mt-1 text-base font-medium text-muted-foreground">over their first 12 months</div>
        </div>
      </div>
      <p className="text-base text-muted-foreground">
        <span className="text-foreground">An estimate, not a promise of earnings</span>, since commission is only paid on money we actually receive
      </p>
      <div className="mt-6 border-t border-border pt-6">
        <div className="mb-3">
          <span className="block font-medium text-foreground">Start earning against that number</span>
          <span className="block text-base text-muted-foreground">Register now and your link is live today</span>
        </div>
        <EmailCapture cta="Create my partner account" />
      </div>
    </div>
  );
}

const TERMS: [string, string][] = [
  ["Commission", "20 percent of net revenue from each customer you refer"],
  ["For how long", "12 months from that customer's first payment"],
  ["What counts as a referral", "A first real payment, not a signup or a trial"],
  ["Cookie window", "30 days, last click wins"],
  ["Holding period", "30 days before a commission can be paid out"],
  ["Refunds and chargebacks", "No commission on a payment that is refunded or charged back"],
  ["Minimum payout", "$25, smaller balances roll into the next run"],
  ["Payouts", "Monthly, by PayPal, Wise or bank transfer"],
  ["Tiers", "One rate for everyone, no second level"],
];

export function AffiliatePage() {
  return (
    <>
      <section className="hero">
        <div className="px-4 py-12 text-center">
          <h1 className="hero-headline mx-auto max-w-[1000px]">
            Earn <span className="headline-accent">20%</span> of every payment your referrals make for 12 months
          </h1>
          <p className="mx-auto !mt-6 max-w-[620px] text-lg text-muted-foreground">
            Recommend the AI tool that brings B2B leads for about $9 each, writes the emails and books the meetings
          </p>
          <div className="!mt-6 flex flex-wrap items-center justify-center gap-2">
            {["Instant approval without review", "No cap on earnings", "Monthly payouts by PayPal or Wise"].map((t) => (
              <div key={t} className="inline-flex items-center rounded-full bg-chip px-4 py-1.5 text-sm text-foreground">
                {t}
              </div>
            ))}
          </div>
          <div className="mx-auto mt-8 max-w-[520px]">
            <EmailCapture cta="Get my partner link" />
          </div>
          <p className="!mt-4 text-base text-muted-foreground">
            Or{" "}
            <a href="#terms" className="text-foreground underline underline-offset-4">
              read the full terms
            </a>{" "}
            first
          </p>
          <div className="mx-auto !mt-8 max-w-[620px]">
            <div className="glass-window-inner rounded-2xl px-6 py-5 text-center">
              <div className="flex justify-center">
                <span className="inline-flex items-center rounded-md bg-foreground px-2 py-0.5 text-xs font-medium text-background">Case study</span>
              </div>
              <p className="!mb-0 !mt-3 text-base !text-foreground">A writer mentioned us at the end of one post, and eight readers became paying customers</p>
              <div className="mt-4 flex items-center justify-center gap-3 sm:gap-5">
                {[
                  ["120", "clicks", false],
                  ["8", "paying customers", false],
                  ["$389", "their commission", true],
                ].map(([v, l, g], i) => (
                  <div key={String(l)} className="flex items-center gap-3 sm:gap-5">
                    {i > 0 && <ArrowRight className="size-4 shrink-0 text-muted-foreground" />}
                    <div className="rounded-xl bg-chip px-5 py-3 text-center">
                      <div className={`text-2xl font-semibold tabular-nums ${g ? "text-brand-600" : "text-foreground"}`}>{v}</div>
                      <div className="text-sm text-muted-foreground">{l}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="earnings" className="scroll-mt-24">
        <div className="px-4">
          <SectionHead title="What that pays you" sub="Twenty percent of what your referrals pay us, every month for their first 12 months" />
          <Earnings />
        </div>
      </section>

      <section>
        <div className="px-4">
          <SectionHead title="What you are actually recommending" sub="The data underneath is what sets it apart from other cold email tools" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              ["105M+", "companies", "The open web, maps and local registries"],
              ["400M+", "people profiles", "Decision makers by name and role"],
              ["218M+", "places on the map", "Every business with an address"],
            ].map(([n, l, t]) => (
              <div key={l} className="glass-window-inner p-6">
                <div className="text-3xl font-semibold tabular-nums text-brand-600">{n}</div>
                <div className="mt-1 text-base font-medium text-foreground">{l}</div>
                <p className="text-base text-muted-foreground">{t}</p>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-6 max-w-[720px] text-center text-base text-muted-foreground">On top of it the agent runs the whole loop by itself, and customers pay per email sent</p>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-24">
        <div className="px-4">
          <SectionHead title="How it works" sub="Three steps, the first one takes a minute" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              ["Register", "Create your account and add payout details, no fee and no approval queue"],
              ["Share your link", "Your link is live the moment you register, with a partner pack ready to use"],
              ["Get paid every month", "Track clicks, signups and commission in your dashboard"],
            ].map(([t, d], i) => (
              <div key={t} className="glass-window-inner flex flex-col p-6">
                <span className="flex size-8 items-center justify-center rounded-full bg-chip text-base font-medium tabular-nums text-foreground">{i + 1}</span>
                <div className="mt-4 font-medium text-foreground">{t}</div>
                <p className="text-base text-muted-foreground">{d}</p>
                {i === 1 && (
                  <Link href="/affiliate/materials/" className="mt-3 text-base text-foreground underline underline-offset-4">
                    Open the partner pack
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="px-4">
          <SectionHead title="Is this for you" sub="Partners do well when their audience already wants more meetings" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[
              ["Write about outbound or sales?", "Your readers are comparing tools right now"],
              ["Run a lead generation agency?", "Every client you set up pays you on top of your own fee"],
              ["Make videos about AI tools?", "The link in the description keeps earning"],
              ["Run a newsletter or a community?", "Founders need an SDR and cannot afford one"],
            ].map(([t, d]) => (
              <div key={t} className="glass-window-inner p-6">
                <div className="font-medium text-foreground">{t}</div>
                <p className="text-base text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="terms" className="scroll-mt-24">
        <div className="px-4">
          <SectionHead title="The terms, in full" sub="The whole commercial deal on one screen" />
          <div className="glass-window-inner mx-auto max-w-[820px] px-6 py-2">
            <dl className="!my-0">
              {TERMS.map(([k, v], i) => (
                <div key={k} className={`grid grid-cols-1 gap-1 py-4 md:grid-cols-[minmax(0,14rem)_1fr] md:gap-6 ${i ? "border-t border-border" : ""}`}>
                  <dt className="font-medium text-foreground">{k}</dt>
                  <dd className="!my-0 text-base text-muted-foreground">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <p className="mx-auto mt-4 max-w-[820px] text-base text-muted-foreground">
            Full legal terms:{" "}
            <Link href="/affiliate/terms/" className="text-foreground underline underline-offset-4">
              Affiliate Program Terms
            </Link>
            . Where this summary and the agreement disagree, the agreement wins
          </p>
        </div>
      </section>

      <section>
        <div className="px-4">
          <SectionHead title="How you may promote us" sub="Earn the click honestly" />
          <div className="mx-auto grid max-w-[900px] grid-cols-1 gap-4 md:grid-cols-2">
            {[
              { t: "Yes, go ahead", ok: true, items: ["Reviews and comparisons on your own site", "YouTube, podcasts and newsletters", "Your clients, community and network", "Social posts that disclose the link", "Paid traffic to your own content"] },
              { t: "No, this ends the partnership", ok: false, items: [`Bidding on the ${BRAND} brand in paid search`, "Incentivized or paid clicks", "Referring yourself", "Cookie stuffing or forced clicks", "Spam and unpublished claims"] },
            ].map((c) => (
              <div key={c.t} className="glass-window-inner p-6">
                <div className="font-medium text-foreground">{c.t}</div>
                <ul className="mt-3 space-y-2">
                  {c.items.map((it) => (
                    <li key={it} className="flex items-start gap-3 text-base text-muted-foreground">
                      {c.ok ? <Check className="mt-1 h-4 w-4 shrink-0 text-success" /> : <X className="mt-1 h-4 w-4 shrink-0 text-destructive" />}
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="px-4">
          <div className="glass-window-inner mx-auto max-w-[680px] p-6 text-center">
            <h2 className="!mb-2">Not signing up yet</h2>
            <p className="text-base text-muted-foreground">Register with the address you want the pack sent to, and reply to the welcome email if you bring serious volume</p>
            <div className="mt-6 text-left">
              <EmailCapture cta="Register and tell us what you need" surface="chip" />
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="scroll-mt-24">
        <div className="px-4">
          <SectionHead title="Questions people actually ask" />
          <div className="mx-auto max-w-[720px]">
            <Accordion
              items={[
                { q: "How long does the cookie last?", a: "30 days, and the most recent partner link clicked is credited." },
                { q: "What happens if my referral asks for a refund?", a: "A refund cancels the commission on that payment." },
                { q: `Do I have to be a ${BRAND} customer?`, a: "No, there is nothing to buy to become a partner." },
              ]}
            />
          </div>
        </div>
      </section>

      <section id="cta-section" className="scroll-mt-24">
        <div className="px-4 text-center">
          <h2 className="mx-auto max-w-[760px]">Start earning on traffic you already have</h2>
          <p className="mx-auto max-w-[560px] text-lg text-muted-foreground">Registration takes a minute and the link works immediately</p>
          <div className="mx-auto mt-8 max-w-[520px]">
            <EmailCapture cta="Become a partner" />
          </div>
        </div>
      </section>
    </>
  );
}
