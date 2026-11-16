"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CreditCard, Database, History, Home, LifeBuoy, Link2, Menu, ShieldAlert, Users } from "lucide-react";

type Entree = { href: string; libelle: string; Icone: typeof Home; bas?: boolean };

const ENTREES: Entree[] = [
  { href: "/admin", libelle: "Accueil", Icone: Home, bas: true },
  { href: "/admin/clients", libelle: "Clients", Icone: Users, bas: true },
  { href: "/admin/comptes", libelle: "Comptes", Icone: Link2, bas: true },
  { href: "/admin/annuaire", libelle: "Annuaire", Icone: Database },
  { href: "/admin/messages", libelle: "Messages bloqués", Icone: ShieldAlert },
  { href: "/admin/paiements", libelle: "Paiements", Icone: CreditCard },
  { href: "/admin/support", libelle: "Support", Icone: LifeBuoy, bas: true },
  { href: "/admin/couts", libelle: "Coûts", Icone: BarChart3 },
  { href: "/admin/journal", libelle: "Journal", Icone: History },
];
const PLUS: Entree = { href: "/admin/plus", libelle: "Plus", Icone: Menu, bas: true };

function actif(chemin: string, href: string) {
  const c = chemin.replace(/\/$/, "") || "/";
  if (href === "/admin") return c === "/admin";
  return c === href || c.startsWith(href + "/");
}

export function NavAdmin({ base = "/admin" }: { base?: string }) {
  const chemin = (usePathname() || "").replace(/^\/dev/, "");
  const lien = (href: string) => (base === "/admin" ? href : href.replace("/admin", base));
  const bas = [...ENTREES.filter((e) => e.bas), PLUS];
  const dansPlus = ENTREES.filter((e) => !e.bas).some((e) => actif(chemin, e.href)) || actif(chemin, "/admin/plus");
  return (
    <>
      <nav aria-label="Navigation de l'espace équipe" className="hidden flex-wrap items-center gap-1 lg:flex">
        {ENTREES.map(({ href, libelle, Icone }) => (
          <Link key={href} href={lien(href)} aria-current={actif(chemin, href) ? "page" : undefined} className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${actif(chemin, href) ? "bg-chip font-medium text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            <Icone className="h-4 w-4" aria-hidden="true" />
            {libelle}
          </Link>
        ))}
      </nav>
      <nav aria-label="Navigation de l'espace équipe" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] lg:hidden">
        {bas.map(({ href, libelle, Icone }) => {
          const est = href === "/admin/plus" ? dansPlus : actif(chemin, href);
          return (
            <Link key={href} href={lien(href)} aria-current={est ? "page" : undefined} className={`flex flex-col items-center gap-0.5 py-2.5 text-xs ${est ? "font-medium text-foreground" : "text-muted-foreground"}`}>
              <Icone className="h-5 w-5" aria-hidden="true" />
              {libelle}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
