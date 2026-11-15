"use client";

import { usePathname } from "next/navigation";
import { Check, Info } from "lucide-react";

const ETAPES = [
  { label: "Votre activité", chemins: ["/demarrer"] },
  { label: "Analyse", chemins: ["/demarrer/analyse", "/demarrer/questions"] },
  { label: "Profils", chemins: ["/demarrer/profils"] },
  { label: "Recherche", chemins: ["/demarrer/recherche"] },
  { label: "Aperçu", chemins: ["/demarrer/apercu"] },
];

/** Fil d'étapes du parcours, avec la mention honnête que les résultats sont des exemples. */
export function EtapesParcours() {
  const chemin = (usePathname() || "").replace(/\/$/, "");
  const courant = Math.max(0, ETAPES.findIndex((e) => e.chemins.includes(chemin)));
  return (
    <div className="mb-8">
      <ol className="flex flex-wrap items-center gap-2" aria-label="Étapes">
        {ETAPES.map((e, i) => (
          <li key={e.label} className="flex items-center gap-2">
            <span
              aria-current={i === courant ? "step" : undefined}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm ${
                i < courant ? "bg-brand-50 text-brand-600" : i === courant ? "bg-card text-foreground shadow-[var(--shadow-plaque)]" : "bg-chip text-muted-foreground"
              }`}
            >
              {i < courant && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
              <span className="max-md:hidden">{e.label}</span>
              <span className="md:hidden">{i === courant ? e.label : i + 1}</span>
            </span>
            {i < ETAPES.length - 1 && <span className="h-px w-3 bg-border md:w-5" aria-hidden="true" />}
          </li>
        ))}
      </ol>
      <p className="!mb-0 !mt-4 flex items-start gap-2 text-sm">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        Aperçu : les résultats affichés sont des exemples. La vraie recherche ouvre bientôt.
      </p>
    </div>
  );
}
