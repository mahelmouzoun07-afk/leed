"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Info, Lock, Mail, MessageCircle, Send, X } from "lucide-react";
import { Dialog, PixelLoader, type UIState } from "./ui";
import { BRAND } from "./data";

const input =
  "w-full h-11 rounded-lg border border-border bg-card px-3 text-base text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:shadow-[0_0_0_1px_var(--primary)]";
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

/* ---------- Sign in ---------- */
function SignIn({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState(false);
  useEffect(() => {
    if (open) {
      setSent(false);
      setErr(false);
    }
  }, [open]);
  return (
    <Dialog open={open} onClose={onClose} label="Sign in">
      <div className="landing p-6 pt-8">
        {sent ? (
          <div className="py-4 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-chip">
              <Mail className="h-5 w-5" />
            </span>
            <div className="mt-4 text-xl font-medium">Check your inbox</div>
            <p className="text-base">
              We sent a sign-in link to <span className="text-foreground">{email}</span>
            </p>
            <button type="button" onClick={() => setSent(false)} className="mt-2 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
              Use another email
            </button>
          </div>
        ) : (
          <>
            <div className="text-2xl font-medium tracking-[-0.02em]">Sign in to {BRAND}</div>
            <p className="!mt-1 text-base">Welcome back. Continue with Google or get a link by email.</p>
            <button
              type="button"
              onClick={() => {
                setEmail("you@gmail.com");
                setSent(true);
              }}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card py-3 font-medium transition-colors hover:bg-chip"
            >
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
                <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
              </svg>
              Continue with Google
            </button>
            <div className="my-4 flex items-center gap-3 text-sm text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                if (!isEmail(email)) return setErr(true);
                setSent(true);
              }}
            >
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground" htmlFor="signin-email">
                Email
              </label>
              <input
                id="signin-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                aria-invalid={err}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErr(false);
                }}
                className={`${input} ${err ? "!border-destructive" : ""}`}
              />
              {err && <div className="mt-1.5 text-sm text-destructive">Enter a valid email address</div>}
              <button type="submit" className="cta-primary mt-4 w-full rounded-lg py-3 font-medium transition-all duration-300">
                Send me a sign-in link
              </button>
            </form>
          </>
        )}
      </div>
    </Dialog>
  );
}

/* ---------- "I don't have a website" ---------- */
function NoWebsite({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const ok = text.trim().length >= 20;
  return (
    <Dialog open={open} onClose={onClose} label="Describe your business">
      <form
        className="landing p-6 pt-8"
        onSubmit={(e) => {
          e.preventDefault();
          if (!ok) return;
          onClose();
          router.push(`/start/?about=${encodeURIComponent(text.trim())}`);
        }}
      >
        <div className="text-2xl font-medium tracking-[-0.02em]">No website? No problem</div>
        <p className="!mt-1 text-base">Tell the agent what you sell and who you sell it to. A couple of sentences is enough.</p>
        <textarea
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. We make handmade ceramic plates and bowls for restaurants and boutique hotels in the UK"
          className="mt-4 w-full resize-none rounded-lg border border-border bg-card p-3 text-base outline-none placeholder:text-muted-foreground focus:border-primary focus:shadow-[0_0_0_1px_var(--primary)]"
        />
        <div className="mt-1 text-right text-xs text-muted-foreground" aria-live="polite">{text.trim().length < 20 ? `${20 - text.trim().length} more characters` : "Looks good"}</div>
        <button
          type="submit"
          disabled={!ok}
          className="cta-primary cta-muted-disabled mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg py-3 font-medium transition-all duration-300 disabled:bg-chip"
        >
          Find my leads <ArrowRight className="h-4 w-4" />
        </button>
        <div className="mt-6 border-t border-border pt-4">
          <div className="text-sm font-medium text-foreground">No website? Try an example</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {["oakandreed.com", "brightdesk.io", "harborlogistics.co"].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => {
                  onClose();
                  router.push(`/start/?site=${d}&example=1`);
                }}
                className="rounded-full bg-chip px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-[var(--black-a8)]"
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </form>
    </Dialog>
  );
}

/* ---------- Checkout ---------- */
const PLANS = [
  { pay: 30, get: 60, emails: "1,500", replies: "~5" },
  { pay: 50, get: 100, emails: "2,500", replies: "~9" },
  { pay: 100, get: 200, emails: "5,000", replies: "~18" },
];
const RESULTS = [
  { name: "Ryan Becker", who: "Menuboost, Restaurant marketing", quote: "“It books several demos a week on its own.”", hot: "131", rate: "1.1%", cost: "$2.33", color: "#059669" },
  { name: "Kofi Mensah", who: "StoryLoom, Publishing", quote: "“The simplest, clearest outreach tool I have used.”", hot: "47", rate: "0.9%", cost: "$3.12", color: "#dc2626" },
  { name: "Sophie Lindqvist", who: "Campus Pulse, EdTech", quote: "“They are now the ones answering most often.”", hot: "29", rate: "1.2%", cost: "$5.03", color: "#b45309" },
];

function Checkout({ amount, onClose }: { amount: number | null; onClose: () => void }) {
  const open = amount !== null;
  const [mode, setMode] = useState<"double" | "payg">("double");
  const [plan, setPlan] = useState(0);
  const [email, setEmail] = useState("");
  const [agree, setAgree] = useState(false);
  const [touched, setTouched] = useState(false);
  const [slide, setSlide] = useState(0);
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!open) return;
    setDone(false);
    const t = setInterval(() => setSlide((s) => (s + 1) % RESULTS.length), 4000);
    return () => clearInterval(t);
  }, [open]);
  const p = PLANS[plan];
  const valid = isEmail(email) && agree;
  const label = mode === "double" ? `Pay $${p.pay} and start` : "Start for free";
  return (
    <Dialog open={open} onClose={onClose} label="Checkout" className="sheet-on-phone !max-w-[480px]">
      <div className="landing flex min-h-full flex-col">
        <div className="flex justify-center pb-1.5 pt-2.5 md:hidden">
          <div className="h-1 w-9 rounded-sm bg-muted-foreground/40" />
        </div>
        {done ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <Check className="h-6 w-6" />
            </span>
            <div className="mt-4 text-2xl font-medium">You are all set</div>
            <p className="text-base">
              This copy of the site is a demo, so no card was charged. We would now email <span className="text-foreground">{email}</span> and start the agent.
            </p>
            <button type="button" onClick={onClose} className="cta-primary mt-4 rounded-lg px-6 py-3 font-medium">
              Close
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 px-4 pb-5 pt-3 md:px-6 md:pt-8">
            <div className="flex flex-col gap-3.5">
              <div role="radio" aria-checked={mode === "double"} tabIndex={0} onClick={() => setMode("double")} onKeyDown={(e) => e.key === "Enter" && setMode("double")} className="flex cursor-pointer flex-col gap-2.5">
                <div className="flex items-center gap-2.5">
                  <Radio on={mode === "double"} />
                  <div className="text-base font-semibold leading-tight">
                    Pay ${p.pay}, get ${p.get} in credits
                  </div>
                </div>
                <div className="text-base leading-snug text-muted-foreground">Full refund if no positive replies after 1,000 emails</div>
                <div className="flex gap-2">
                  {PLANS.map((pl, i) => (
                    <button
                      key={pl.pay}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMode("double");
                        setPlan(i);
                      }}
                      className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg border px-1.5 py-2.5 transition-colors ${
                        plan === i && mode === "double" ? "border-brand-600 bg-brand-50/60" : "border-border hover:bg-chip"
                      }`}
                    >
                      <span className="text-base font-bold tabular-nums">
                        ${pl.pay} <span className="font-medium text-muted-foreground">→</span> <span className="text-brand-600">${pl.get}</span>
                      </span>
                      <span className="text-sm">{pl.emails} emails</span>
                      <span className="text-sm">{pl.replies} hot replies</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-px bg-border" />
              <div role="radio" aria-checked={mode === "payg"} tabIndex={0} onClick={() => setMode("payg")} onKeyDown={(e) => e.key === "Enter" && setMode("payg")} className="flex cursor-pointer flex-col gap-2">
                <div className="flex items-center gap-2.5">
                  <Radio on={mode === "payg"} />
                  <div className="text-base font-semibold leading-tight">Pay as you go</div>
                </div>
                <div className="text-base leading-snug text-muted-foreground">No upfront payment, $0.04 per email as you send</div>
              </div>
            </div>

            <div className="border-t border-border" />
            <div className="grid">
              {RESULTS.map((r, i) => (
                <div key={r.name} aria-hidden={i !== slide} className="flex flex-col gap-3 transition-opacity duration-300" style={{ gridArea: "1/1", opacity: i === slide ? 1 : 0, pointerEvents: i === slide ? "auto" : "none" }}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: r.color }}>
                      {r.name.split(" ").map((w) => w[0]).join("")}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[15px] font-semibold leading-tight">{r.name}</div>
                      <div className="text-sm leading-tight text-muted-foreground">{r.who}</div>
                    </div>
                  </div>
                  <p className="!m-0 text-[15px] leading-snug !text-foreground">{r.quote}</p>
                  <div className="text-[15px] font-semibold">Results</div>
                  <div className="flex gap-2">
                    {[
                      ["Hot replies", r.hot],
                      ["Reply rate", r.rate],
                      ["Cost/lead", r.cost],
                    ].map(([k, v]) => (
                      <div key={k} className="flex-1 rounded-lg border border-border bg-chip px-2.5 py-2">
                        <div className="mb-2 text-sm font-medium leading-tight text-muted-foreground">{k}</div>
                        <div className="text-base font-bold">{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-border" />

            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                setTouched(true);
                if (valid) setDone(true);
              }}
            >
              <div className="mb-3.5">
                <div className="flex items-center gap-2">
                  <PixelLoader />
                  <div className="text-[15px] font-semibold">{mode === "double" ? "Double your first payment" : "Only pay for what you send"}</div>
                </div>
                <p className="!mb-0 !mt-1 text-[15px] leading-snug">
                  {mode === "double" ? `Pay $${p.pay}, get $${p.get} in credits. Then $0.04 per email, stop anytime` : "We only charge $0.04 per email the agent sends, stop anytime"}
                </p>
              </div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-muted-foreground" htmlFor="checkout-email">
                Email <Info className="h-3.5 w-3.5" aria-label="We send your results and receipts to this email" />
              </label>
              <input
                id="checkout-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                aria-invalid={touched && !isEmail(email)}
                onChange={(e) => setEmail(e.target.value)}
                className={`${input} ${touched && !isEmail(email) ? "!border-destructive" : ""}`}
              />
              {mode === "double" && (
                <div className="mt-5 flex h-[120px] flex-col justify-center gap-2 rounded-lg border border-dashed border-border px-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2 text-foreground">
                    <Lock className="h-4 w-4" /> Card details
                  </div>
                  Payment form placeholder — this demo copy never takes payments.
                </div>
              )}
              <label className="mt-4 flex cursor-pointer items-start gap-2">
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-[3px] h-3.5 w-3.5 shrink-0 accent-[var(--brand-600)]" />
                <span className={`text-sm leading-snug ${touched && !agree ? "text-destructive" : "text-muted-foreground"}`}>
                  I allow {BRAND} to email on behalf of my company and accept the{" "}
                  <a href="/terms-of-use/" target="_blank" className="text-brand-600 underline">
                    Terms of use
                  </a>
                  .
                </span>
              </label>
              <button
                type="submit"
                aria-disabled={!valid}
                className={`mt-4 w-full rounded-lg py-3 font-semibold transition-colors ${valid ? "bg-brand-600 text-white hover:bg-[color-mix(in_srgb,black_10%,var(--brand-600))]" : "bg-chip text-muted-foreground"}`}
              >
                {label}
              </button>
              <div className="mt-2.5 flex items-center justify-center gap-1 text-sm text-muted-foreground">
                <Lock className="h-3.5 w-3.5" /> Secure card payment
              </div>
            </form>
          </div>
        )}
      </div>
    </Dialog>
  );
}
function Radio({ on }: { on: boolean }) {
  return (
    <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${on ? "border-brand-600" : "border-muted-foreground"}`}>
      {on && <span className="h-2 w-2 rounded-full bg-brand-600" />}
    </span>
  );
}

/* ---------- Support chat bubble ---------- */
function Chat() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<{ me: boolean; t: string }[]>([{ me: false, t: "Hi! Ask us anything about the agent, pricing or your account." }]);
  const [text, setText] = useState("");
  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-4 z-[90] flex h-[460px] max-h-[calc(100dvh-8rem)] w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-lg),var(--shadow-plaque)]" style={{ animation: "fade-in .15s ease both" }}>
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <div className="font-medium">{BRAND} support</div>
              <div className="text-xs text-muted-foreground">We usually reply in a few minutes</div>
            </div>
            <button type="button" aria-label="Close chat" onClick={() => setOpen(false)} className="rounded-md p-1 text-muted-foreground hover:bg-chip">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
            {msgs.map((m, i) => (
              <div key={i} className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.me ? "self-end rounded-br-[2px] bg-primary text-primary-foreground" : "self-start rounded-bl-[2px] bg-chip"}`}>
                {m.t}
              </div>
            ))}
          </div>
          <form
            className="flex gap-2 border-t border-border p-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!text.trim()) return;
              setMsgs((m) => [...m, { me: true, t: text.trim() }]);
              setText("");
              setTimeout(() => setMsgs((m) => [...m, { me: false, t: "Thanks! A teammate will get back to you here shortly." }]), 900);
            }}
          >
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message…" className="h-10 flex-1 rounded-lg bg-chip px-3 text-sm outline-none" />
            <button type="submit" aria-label="Send" className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
      <button
        type="button"
        aria-label={open ? "Close support chat" : "Open support chat"}
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-[90] flex h-14 w-14 items-center justify-center rounded-full bg-[#16a34a] text-white shadow-[var(--shadow-lg)] transition-transform hover:scale-105 max-md:bottom-6 max-md:right-6"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </>
  );
}

export function Overlays(s: UIState) {
  return (
    <>
      <SignIn open={s.signIn} onClose={s.closeSignIn} />
      <NoWebsite open={s.noWebsite} onClose={s.closeNoWebsite} />
      <Checkout amount={s.checkout} onClose={s.closeCheckout} />
      <Chat />
    </>
  );
}
