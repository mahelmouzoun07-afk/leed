import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, ChevronRight, Inbox } from "lucide-react";

/**
 * Les briques des écrans connectés (espace client et espace équipe), reprises de la maquette :
 * cartes, étiquettes, jauges, chiffres, lignes. Aucun état, aucun emoji : des icônes seulement.
 */

type TonCarte = "normal" | "calme" | "vif";
const CARTES: Record<TonCarte, string> = {
  normal: "glass-window-inner p-4",
  calme: "rounded-2xl bg-chip p-4",
  vif: "rounded-2xl border border-safran bg-[color-mix(in_srgb,var(--safran)_12%,white)] p-4",
};

export function Carte({ ton = "normal", className = "", children }: { ton?: TonCarte; className?: string; children: ReactNode }) {
  return <div className={`${CARTES[ton]} flex flex-col gap-3 ${className}`}>{children}</div>;
}

type TonEtiquette = "neutre" | "marque" | "ok" | "feu";
const ETIQUETTES: Record<TonEtiquette, string> = {
  neutre: "bg-chip text-foreground",
  marque: "bg-primary text-primary-foreground",
  ok: "bg-brand-50 text-brand-600",
  feu: "bg-[#fdeee4] text-[#b4410e]",
};

export function Etiquette({ ton = "neutre", children }: { ton?: TonEtiquette; children: ReactNode }) {
  return <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${ETIQUETTES[ton]}`}>{children}</span>;
}

export function Jauge({ valeur, ton = "sombre", label }: { valeur: number; ton?: "sombre" | "or" | "vert"; label?: string }) {
  const v = Math.max(0, Math.min(100, Math.round(valeur)));
  const couleur = ton === "or" ? "bg-safran" : ton === "vert" ? "bg-brand-600" : "bg-primary";
  return (
    <div role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} aria-label={label} className="h-2 w-full overflow-hidden rounded-full bg-chip">
      <div className={`h-full rounded-full ${couleur}`} style={{ width: `${v}%` }} />
    </div>
  );
}

export function Chiffres({ items, colonnes = 4 }: { items: [string, string][]; colonnes?: 2 | 3 | 4 }) {
  const grille = colonnes === 2 ? "grid-cols-2" : colonnes === 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4";
  return (
    <div className={`grid ${grille} gap-2`}>
      {items.map(([valeur, label]) => (
        <div key={label} className="rounded-xl bg-chip p-3">
          <div className="text-xl font-semibold tabular-nums text-foreground">{valeur}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      ))}
    </div>
  );
}

export function Ligne({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`flex items-center justify-between gap-3 text-sm ${className}`}>{children}</div>;
}

export function Titrine({ children }: { children: ReactNode }) {
  return <h2 className="!m-0 !font-sans !text-xs !font-medium !leading-normal uppercase tracking-wide text-muted-foreground">{children}</h2>;
}

export function Sourdine({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`text-sm text-muted-foreground ${className}`}>{children}</div>;
}

export function TitrePage({ titre, retour, droite }: { titre: string; retour?: string; droite?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        {retour && (
          <Link href={retour} aria-label="Retour" className="-ml-1 rounded-lg p-1.5 text-foreground transition-colors hover:bg-chip">
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Link>
        )}
        <h1 className="!m-0 truncate !font-display !text-[1.5rem] !font-semibold !leading-tight tracking-[-0.02em]">{titre}</h1>
      </div>
      {droite && <div className="shrink-0">{droite}</div>}
    </div>
  );
}

export function EtatVide({ titre, texte, action }: { titre: string; texte: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border p-8 text-center">
      <Inbox className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
      <div className="text-base font-medium text-foreground">{titre}</div>
      <p className="!m-0 max-w-[420px] text-sm">{texte}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

type TonBouton = "sombre" | "cadre" | "action";
export function classeBouton(ton: TonBouton = "cadre", petit = false, large = false) {
  const base = `inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
    petit ? "px-3.5 py-2 text-sm" : "px-5 py-3"
  } ${large ? "w-full" : ""}`;
  if (ton === "sombre") return `${base} bg-primary text-primary-foreground hover:bg-[var(--cta-hover)]`;
  if (ton === "action") return `${base} bg-safran text-[var(--ink-on-safran)] hover:bg-[var(--safran-hover)]`;
  return `${base} border border-border bg-card text-foreground hover:bg-chip`;
}

export function BoutonLien({ href, ton = "cadre", petit = false, large = false, children }: { href: string; ton?: TonBouton; petit?: boolean; large?: boolean; children: ReactNode }) {
  return (
    <Link href={href} className={classeBouton(ton, petit, large)}>
      {children}
    </Link>
  );
}

/** Une ligne de liste cliquable, avec une flèche à droite. */
export function LigneLien({ href, titre, texte, droite }: { href: string; titre: string; texte?: string; droite?: ReactNode }) {
  return (
    <Link href={href} className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-chip">
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">{titre}</div>
        {texte && <div className="text-sm text-muted-foreground">{texte}</div>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {droite}
        <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </div>
    </Link>
  );
}

/** Un tableau qui défile de côté sur téléphone au lieu de se couper. */
export function Tableau({ colonnes, lignes, legende }: { colonnes: string[]; lignes: ReactNode[][]; legende: string }) {
  return (
    <div className="glass-window-inner overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-sm">
        <caption className="sr-only">{legende}</caption>
        <thead>
          <tr className="border-b border-border text-xs text-muted-foreground">
            {colonnes.map((c) => (
              <th key={c} scope="col" className="px-4 py-3 font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lignes.map((l, i) => (
            <tr key={i} className="border-b border-border last:border-0">
              {l.map((cellule, j) => (
                <td key={j} className="px-4 py-3 align-top text-foreground">
                  {cellule}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const fcfa = (n: number) => `${n.toLocaleString("fr-FR").replace(/[  ]/g, " ")} FCFA`;
export const nombre = (n: number) => n.toLocaleString("fr-FR").replace(/[  ]/g, " ");

export function dateCourte(iso: string | null | undefined) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
export function heure(iso: string | null | undefined) {
  if (!iso) return "-";
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}
/** « il y a 12 min », « il y a 3 h », « il y a 2 j » */
export function ilYA(iso: string | null | undefined, maintenant = Date.now()) {
  if (!iso) return "-";
  const s = Math.max(0, Math.round((maintenant - new Date(iso).getTime()) / 1000));
  if (s < 90) return "à l'instant";
  if (s < 3600) return `il y a ${Math.round(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.round(s / 3600)} h`;
  return `il y a ${Math.round(s / 86400)} j`;
}

/** Nombre de jours entiers avant une date (0 si elle est passée). */
export function joursAvant(iso: string | null | undefined, maintenant = Date.now()) {
  if (!iso) return 0;
  return Math.max(0, Math.ceil((new Date(iso).getTime() - maintenant) / 86_400_000));
}
