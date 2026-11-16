"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock } from "lucide-react";
import { Chargement, boutonPrincipal, boutonSecondaire } from "@/components/form";
import { useParcours } from "@/lib/parcours/etat";
import { formaterFcfa } from "@/lib/forfait";

export function Apercu() {
  const router = useRouter();
  const { etat, pret } = useParcours();

  useEffect(() => {
    if (pret && !etat.apercu) router.replace("/demarrer/");
  }, [pret, etat.apercu, router]);

  const a = etat.apercu;
  if (!a) return <Chargement texte="Chargement…" />;
  const max = Math.max(...a.canaux.map((c) => c.nombre));

  return (
    <div>
      <h1 className="hero-headline !text-[clamp(1.875rem,7vw,2.875rem)]">
        Leed a trouvé <span className="headline-accent">{formaterFcfa(a.total)} entreprises</span> pour vous
      </h1>
      <p className="!mt-3 max-w-[600px] text-base">Leur nom et leurs coordonnées restent cachés tant qu&apos;elles n&apos;ont pas été contactées. Voici à quoi elles ressemblent.</p>

      <div className="glass-window-inner mt-6 p-5">
        <ul className="divide-y divide-border">
          {a.exemples.map((e, i) => (
            <li key={`${e.secteur}-${e.ville}-${i}`} className="py-3 text-base">
              <span className="font-medium text-foreground">{e.secteur}</span>
              {[e.ville, e.taille].filter(Boolean).map((x) => (
                <span key={x}> · {x}</span>
              ))}
              {e.indice && <span className="text-muted-foreground"> · « {e.indice} »</span>}
            </li>
          ))}
          <li className="flex items-center gap-2 py-3 text-base text-muted-foreground" aria-label="Autres entreprises, cachées">
            <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="h-3 flex-1 rounded bg-chip blur-[2px]" aria-hidden="true" />
          </li>
          <li className="flex items-center gap-2 py-3 text-base text-muted-foreground" aria-hidden="true">
            <Lock className="h-4 w-4 shrink-0" />
            <span className="h-3 w-2/3 rounded bg-chip blur-[2px]" />
          </li>
        </ul>
      </div>

      <div className="glass-window-inner mt-4 p-5">
        <div className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Par où les joindre</div>
        <ul className="mt-3 flex flex-col gap-3">
          {a.canaux.map((c) => (
            <li key={c.canal} className="grid grid-cols-[88px_1fr_auto] items-center gap-3 text-base">
              <span className="text-foreground">{c.canal}</span>
              <span className="h-2.5 rounded-full bg-chip" aria-hidden="true">
                <span className="block h-full rounded-full bg-indigo" style={{ width: `${Math.max(6, (c.nombre / max) * 100)}%` }} />
              </span>
              <span className="tabular-nums text-foreground">{formaterFcfa(c.nombre)}</span>
            </li>
          ))}
        </ul>
        <p className="!mb-0 !mt-4 text-sm">Une entreprise peut être joignable par plusieurs canaux : les totaux se recoupent.</p>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/inscription/" className={boutonPrincipal}>
          Créer mon compte pour commencer <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        <Link href="/demarrer/profils/" className={boutonSecondaire}>
          Modifier mes profils
        </Link>
      </div>
    </div>
  );
}
