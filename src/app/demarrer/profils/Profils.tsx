"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Plus } from "lucide-react";
import { BlocErreur, Chargement, boutonPrincipal, boutonSecondaire, inputClass } from "@/components/form";
import { useParcours } from "@/lib/parcours/etat";
import { proposerProfils } from "@/lib/parcours/actions";
import type { Profil } from "@/lib/parcours/types";

export function Profils() {
  const router = useRouter();
  const { etat, pret, maj } = useParcours();
  const [profils, setProfils] = useState<Profil[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [nouveau, setNouveau] = useState("");

  const charger = async () => {
    setErreur(null);
    const r = await proposerProfils(etat.fiche, etat.reponses);
    if (r.ok) setProfils(r.donnees);
    else setErreur(r.erreur);
  };

  useEffect(() => {
    if (!pret) return;
    if (!etat.fiche) {
      router.replace("/demarrer/");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture du stockage du navigateur ou lancement d'un travail après l'affichage (évite un écart entre serveur et navigateur)
    if (etat.profils) setProfils(etat.profils);
    else void charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pret]);

  if (erreur)
    return (
      <BlocErreur message={erreur}>
        <button type="button" className={boutonPrincipal} onClick={charger}>
          Réessayer
        </button>
      </BlocErreur>
    );
  if (!profils) return <Chargement texte="Leed cherche qui achète ce que vous vendez…" />;

  const actifs = profils.filter((p) => p.actif).length;
  const basculer = (id: string) => setProfils(profils.map((p) => (p.id === id ? { ...p, actif: !p.actif } : p)));
  const ajouter = () => {
    const nom = nouveau.trim();
    if (nom.length < 3) return;
    setProfils([...profils, { id: `perso-${profils.length}`, nom, raison: "Ajouté par vous", note: 0, actif: true }]);
    setNouveau("");
  };
  const continuer = () => {
    maj({ profils, apercu: undefined });
    router.push("/demarrer/recherche/");
  };

  return (
    <div>
      <h1 className="hero-headline !text-[clamp(1.875rem,7vw,2.875rem)]">
        Les clients qui <span className="headline-accent">vous ressemblent</span>
      </h1>
      <p className="!mt-3 max-w-[600px] text-base">Décochez ceux qui ne vous intéressent pas, ajoutez les vôtres. La note dit à quel point le profil colle à votre offre.</p>

      <ul className="mt-6 flex flex-col gap-3">
        {profils.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              role="checkbox"
              aria-checked={p.actif}
              onClick={() => basculer(p.id)}
              className={`glass-window-inner flex w-full items-start gap-3 p-4 text-left transition-opacity ${p.actif ? "" : "opacity-55"}`}
            >
              <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${p.actif ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>
                {p.actif && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-medium text-foreground">{p.nom}</span>
                <span className="block text-sm text-muted-foreground">{p.raison}</span>
              </span>
              {p.note > 0 && (
                <span className="shrink-0 text-right">
                  <span className="block text-lg font-semibold tabular-nums text-foreground">{p.note}</span>
                  <span className="block text-xs text-muted-foreground">sur 100</span>
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          ajouter();
        }}
      >
        <input aria-label="Ajouter un profil de client" value={nouveau} onChange={(e) => setNouveau(e.target.value)} placeholder="Ajouter un profil, ex. Pharmacies de Cotonou" className={inputClass} />
        <button type="submit" className={boutonSecondaire} aria-label="Ajouter ce profil">
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span className="max-md:hidden">Ajouter</span>
        </button>
      </form>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button type="button" disabled={actifs === 0} onClick={continuer} className={boutonPrincipal}>
          Chercher ces entreprises <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
        <Link href="/demarrer/analyse/" className={boutonSecondaire}>
          Retour
        </Link>
        {actifs === 0 && <span className="text-sm text-destructive">Gardez au moins un profil.</span>}
      </div>
    </div>
  );
}
