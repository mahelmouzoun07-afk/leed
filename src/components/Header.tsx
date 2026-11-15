"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Database, LayoutGrid, Menu, Search, Sparkles, Target, X } from "lucide-react";
import { Logo, useUI } from "./ui";

const PRODUCTS = [
  { icon: Sparkles, title: "Agent de prospection", text: "Il trouve vos clients, leur écrit depuis vos comptes et pose vos rendez-vous", href: "/" },
  { icon: Target, title: "Explorateur de cibles", text: "Décrivez votre client idéal et voyez combien d'entreprises lui ressemblent", href: "/tools/explorer/" },
  { icon: Database, title: "Annuaire d'entreprises", text: "Les entreprises d'Afrique de l'Ouest, même celles qui n'ont pas de site. Bientôt", href: "/b2b-database/" },
  { icon: Search, title: "Simulateur de budget", text: "Choisissez un montant et voyez ce que vous obtenez", href: "/#pricing" },
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
              Produits
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
            Tarifs
          </Link>
          <Link prefetch={false} href="/affiliate/?src=header" className={navItem}>
            Parrainage
          </Link>
          <Link prefetch={false} href="/about/" className={navItem}>
            À propos
          </Link>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              openSignIn();
            }}
            className={`${navItem} whitespace-nowrap`}
          >
            Connexion
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
            <div className="py-3 text-sm font-medium text-muted-foreground">Produits</div>
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
              ["Tarifs", "/#pricing"],
              ["Parrainage", "/affiliate/?src=header"],
              ["À propos", "/about/"],
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
              className="mt-4 rounded-xl bg-primary px-5 py-3 font-medium text-primary-foreground"
            >
              Connexion
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
