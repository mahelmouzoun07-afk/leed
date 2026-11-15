"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Code, Copy, Database, FlaskConical, LayoutGrid, Menu, Search, Sparkles, Target, X } from "lucide-react";
import { Logo, useUI } from "./ui";

const PRODUCTS = [
  { icon: Sparkles, title: "Outreach Agent", text: "24/7 AI SDR that runs cold email outreach end-to-end", href: "/" },
  { icon: Search, title: "AI search for companies & people", text: "Search 106M companies and 400M+ validated people", href: "/tools/explorer/" },
  { icon: Code, title: "API", text: "Power your own agent with high-precision unique data", href: "/api-docs/" },
  { icon: Database, title: "B2B Company Database", text: "106M companies and 400M+ validated people, ready for bulk data workflows", href: "/b2b-database/" },
  { icon: FlaskConical, title: "Deep research agents", text: "Enrich accounts with unique AI-derived datapoints", href: "/tools/explorer/?mode=research" },
  { icon: Copy, title: "Lookalike Companies", text: "Discover companies similar to your best customers", href: "/tools/explorer/?mode=lookalike" },
  { icon: Target, title: "ICP Explorer", text: "Build and refine your ideal customer segments", href: "/tools/explorer/?mode=icp" },
];

const navItem =
  "hover:text-foreground/80 transition-colors duration-300 cursor-pointer text-base px-4 py-3";

export function Header() {
  const { openSignIn } = useUI();
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = mobile ? "hidden" : "";
  }, [mobile]);

  return (
    <header className="sticky top-0 z-50">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="relative mx-auto flex max-w-[1200px] items-center justify-between px-4 py-4 xl:px-0">
        <Link prefetch={false} href="/" className="cursor-pointer" onClick={() => setMobile(false)}>
          <Logo />
        </Link>
        <nav className="hidden items-center gap-2 md:flex">
          <div className="relative" ref={boxRef}>
            <button
              type="button"
              aria-haspopup="true"
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
              className={`inline-flex items-center gap-1 ${navItem}`}
            >
              <LayoutGrid className="h-4 w-4" />
              Products
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
              <div
                role="menu"
                className="fixed left-1/2 top-[68px] z-50 grid w-[min(640px,calc(100vw-2rem))] -translate-x-1/2 grid-cols-2 gap-1 rounded-2xl bg-card p-2 shadow-[var(--shadow-plaque)]"
                style={{ animation: "fade-in .15s ease both" }}
              >
                {PRODUCTS.map((p) => (
                  <Link prefetch={false}
                    key={p.title}
                    href={p.href}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-chip"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-chip">
                      <p.icon className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-base font-medium text-foreground">{p.title}</span>
                      <span className="block text-sm text-muted-foreground">{p.text}</span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Link prefetch={false} href="/#pricing" className={navItem}>
            Pricing
          </Link>
          <Link prefetch={false} href="/affiliate/?src=header" className={navItem}>
            Affiliates
          </Link>
          <Link prefetch={false} href="/about/" className={navItem}>
            About
          </Link>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              openSignIn();
            }}
            className={`${navItem} whitespace-nowrap`}
          >
            Sign in
          </a>
        </nav>
        <button
          type="button"
          aria-label="Menu"
          aria-expanded={mobile}
          onClick={() => setMobile((m) => !m)}
          className="-mr-2 p-2 text-foreground md:hidden"
        >
          {mobile ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {mobile && (
        <div className="fixed inset-x-0 bottom-0 top-[72px] z-40 overflow-y-auto bg-background px-4 pb-8 md:hidden">
          <div className="flex flex-col">
            <div className="py-3 text-sm font-medium text-muted-foreground">Products</div>
            {PRODUCTS.map((p) => (
              <Link prefetch={false}
                key={p.title}
                href={p.href}
                onClick={() => setMobile(false)}
                className="flex items-center gap-3 rounded-lg py-3 text-lg text-foreground"
              >
                <p.icon className="h-5 w-5 text-muted-foreground" />
                {p.title}
              </Link>
            ))}
            <div className="my-3 h-px bg-border" />
            {[
              ["Pricing", "/#pricing"],
              ["Affiliates", "/affiliate/?src=header"],
              ["About", "/about/"],
            ].map(([l, h]) => (
              <Link key={l} href={h} onClick={() => setMobile(false)} className="py-3 text-lg text-foreground">
                {l}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => {
                setMobile(false);
                openSignIn();
              }}
              className="cta-primary mt-4 rounded-xl bg-primary px-5 py-3 font-medium text-primary-foreground"
            >
              Sign in
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
