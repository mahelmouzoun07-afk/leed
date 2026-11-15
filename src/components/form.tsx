"use client";

import type { ReactNode } from "react";
import { AlertCircle, Check, LoaderCircle } from "lucide-react";

export const inputClass =
  "w-full h-11 rounded-lg border border-border bg-card px-3 text-base text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:shadow-[0_0_0_1px_var(--primary)]";
export const boutonPrincipal =
  "cta-primary cta-muted-disabled inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 font-medium transition-all duration-300 disabled:bg-chip";
export const boutonSecondaire =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-border px-5 py-3 font-medium text-foreground transition-colors hover:bg-chip";

export const estEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

/** Un champ avec son libellé, son aide et son message d'erreur. */
export function Champ({ id, label, aide, erreur, children }: { id: string; label: string; aide?: string; erreur?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {aide && !erreur && <div className="mt-1.5 text-sm text-muted-foreground">{aide}</div>}
      {erreur && (
        <div id={`${id}-erreur`} role="alert" className="mt-1.5 text-sm text-destructive">
          {erreur}
        </div>
      )}
    </div>
  );
}

/** Une puce à cocher (choix multiple) ou à choisir (choix unique). */
export function Puce({ actif, onClick, children, radio = false }: { actif: boolean; onClick: () => void; children: ReactNode; radio?: boolean }) {
  return (
    <button
      type="button"
      role={radio ? "radio" : "checkbox"}
      aria-checked={actif}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition-colors ${
        actif ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-chip"
      }`}
    >
      {actif && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
      {children}
    </button>
  );
}

/** État « chargement » : une phrase qui dit ce qui se passe. */
export function Chargement({ texte }: { texte: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center justify-center gap-2 py-10 text-base text-muted-foreground">
      <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> {texte}
    </div>
  );
}

/** État « erreur » : ce qui s'est passé, en français, et quoi faire. */
export function BlocErreur({ message, children }: { message: string; children?: ReactNode }) {
  return (
    <div role="alert" className="glass-window-inner flex flex-col items-start gap-3 p-5">
      <div className="flex items-center gap-2 font-medium text-foreground">
        <AlertCircle className="h-5 w-5 text-destructive" aria-hidden="true" /> Un problème est survenu
      </div>
      <p className="!my-0 text-base">{message}</p>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}
