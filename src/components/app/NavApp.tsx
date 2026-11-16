"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Home, Inbox, Link2, Megaphone, Menu, MessageCircle, Settings, Users, Wallet } from "lucide-react";

type Entree = { href: string; libelle: string; Icone: typeof Home; bas?: boolean };

const ENTREES: Entree[] = [
  { href: "/app", libelle: "Accueil", Icone: Home, bas: true },
  { href: "/app/decisions", libelle: "Décisions", Icone: Inbox, bas: true },
  { href: "/app/prospects", libelle: "Prospects", Icone: Users },
  { href: "/app/conversations", libelle: "Conversations", Icone: MessageCircle, bas: true },
  { href: "/app/campagnes", libelle: "Campagnes", Icone: Megaphone },
  { href: "/app/rapports", libelle: "Rapports", Icone: BarChart3, bas: true },
  { href: "/app/comptes", libelle: "Comptes", Icone: Link2 },
  { href: "/app/forfait", libelle: "Forfait", Icone: Wallet },
  { href: "/app/reglages", libelle: "Réglages", Icone: Settings },
];
const PLUS: Entree = { href: "/app/plus", libelle: "Plus", Icone: Menu, bas: true };

function actif(chemin: string, href: string) {
  const c = chemin.replace(/\/$/, "") || "/";
  if (href === "/app") return c === "/app";
  return c === href || c.startsWith(href + "/");
}

export function NavApp({ decisionsNb, base = "/app" }: { decisionsNb: number; base?: string }) {
  const chemin = (usePathname() || "").replace(/^\/dev/, "");
  const lien = (href: string) => (base === "/app" ? href : href.replace("/app", base));
  const bas = [...ENTREES.filter((e) => e.bas), PLUS];
  const badge = decisionsNb > 0 && (
    <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-[#b4410e] px-1.5 text-xs font-semibold text-white" aria-label={`${decisionsNb} en attente`}>
      {decisionsNb}
    </span>
  );
  return (
    <>
      <nav aria-label="Navigation principale" className="hidden items-center gap-1 md:flex">
        {ENTREES.map(({ href, libelle, Icone }) => (
          <Link key={href} href={lien(href)} aria-current={actif(chemin, href) ? "page" : undefined} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors ${actif(chemin, href) ? "bg-chip font-medium text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            <Icone className="h-4 w-4" aria-hidden="true" />
            {libelle}
            {href === "/app/decisions" && badge}
          </Link>
        ))}
      </nav>
      <nav aria-label="Navigation principale" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] md:hidden">
        {bas.map(({ href, libelle, Icone }) => {
          const est = href === "/app/plus" ? ["/app/plus", "/app/prospects", "/app/campagnes", "/app/comptes", "/app/forfait", "/app/reglages"].some((h) => actif(chemin, h)) : actif(chemin, href);
          return (
            <Link key={href} href={lien(href)} aria-current={est ? "page" : undefined} className={`flex flex-col items-center gap-0.5 py-2.5 text-xs ${est ? "font-medium text-foreground" : "text-muted-foreground"}`}>
              <span className="relative">
                <Icone className="h-5 w-5" aria-hidden="true" />
                {href === "/app/decisions" && decisionsNb > 0 && <span className="absolute -right-2 -top-1.5 inline-flex min-w-4 items-center justify-center rounded-full bg-[#b4410e] px-1 text-[10px] font-semibold text-white">{decisionsNb}</span>}
              </span>
              {libelle}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
