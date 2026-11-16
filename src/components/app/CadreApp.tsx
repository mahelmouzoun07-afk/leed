import Link from "next/link";
import { Info } from "lucide-react";
import { Logo } from "@/components/ui";
import { NavApp } from "./NavApp";

/**
 * Le cadre de l'espace client : en-tête, navigation (barre du bas sur téléphone, menu en haut sur ordinateur),
 * bandeau du mode démonstration. Sans accès aux données : l'affichage seulement.
 */
export function CadreApp({ nom, demo, decisionsNb, base = "/app", children }: { nom: string; demo: boolean; decisionsNb: number; base?: string; children: React.ReactNode }) {
  return (
    <div className="landing min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background">
        <div className="mx-auto flex h-14 max-w-[1100px] items-center justify-between gap-4 px-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link href={base} aria-label="Accueil de votre espace">
              <Logo />
            </Link>
            <span className="truncate text-sm text-muted-foreground max-md:hidden">{nom}</span>
          </div>
          <NavApp decisionsNb={decisionsNb} base={base} />
        </div>
      </header>
      {demo && (
        <div className="border-b border-border bg-[color-mix(in_srgb,var(--safran)_16%,white)]">
          <div className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-sm text-foreground">
            <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Mode démonstration : ces données sont fictives et rien n&apos;est enregistré.</span>
            <a href="/app/demo/quitter" className="font-medium underline underline-offset-4">
              Voir mes vraies données
            </a>
          </div>
        </div>
      )}
      <main className="mx-auto w-full max-w-[1100px] px-4 pb-28 pt-5 md:pb-12 md:pt-8">{children}</main>
    </div>
  );
}
