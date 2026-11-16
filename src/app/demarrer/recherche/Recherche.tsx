"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle } from "lucide-react";
import { BlocErreur, boutonPrincipal, boutonSecondaire } from "@/components/form";
import { useParcours } from "@/lib/parcours/etat";
import { chercherProspects } from "@/lib/parcours/actions";

const LIGNES = ["Je trouve les entreprises qui correspondent…", "Je cherche leur numéro WhatsApp et leur email…", "Je repère leurs comptes Instagram, Facebook et LinkedIn…", "Je compte par où les joindre…"];

export function Recherche() {
  const router = useRouter();
  const { etat, pret, maj } = useParcours();
  const [erreur, setErreur] = useState<string | null>(null);
  const [ligne, setLigne] = useState(0);
  const lance = useRef(false);

  const lancer = async () => {
    if (!etat.profils) return;
    setErreur(null);
    setLigne(0);
    const r = await chercherProspects(etat.profils, etat.entree, etat.fiche);
    if (!r.ok) return setErreur(r.erreur);
    maj({ apercu: r.donnees });
    router.replace("/demarrer/apercu/");
  };

  useEffect(() => {
    if (!pret || lance.current) return;
    if (!etat.profils) {
      router.replace("/demarrer/");
      return;
    }
    lance.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture du stockage du navigateur ou lancement d'un travail après l'affichage (évite un écart entre serveur et navigateur)
    void lancer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pret]);

  useEffect(() => {
    if (erreur) return;
    const t = setInterval(() => setLigne((n) => Math.min(n + 1, LIGNES.length - 1)), 900);
    return () => clearInterval(t);
  }, [erreur]);

  if (erreur)
    return (
      <BlocErreur message={erreur}>
        <Link href="/demarrer/profils/" className={boutonPrincipal}>
          Revenir aux profils
        </Link>
        <button type="button" className={boutonSecondaire} onClick={lancer}>
          Réessayer
        </button>
      </BlocErreur>
    );

  return (
    <div>
      <h1 className="hero-headline !text-[clamp(1.875rem,7vw,2.875rem)]">
        Leed cherche <span className="headline-accent">vos clients</span>
      </h1>
      <ul className="glass-window-inner mt-8 flex flex-col gap-3 p-5" role="status" aria-live="polite">
        {LIGNES.map((l, i) => (
          <li key={l} className="flex items-center gap-2 text-base transition-opacity duration-300" style={{ opacity: i <= ligne ? 1 : 0.3 }}>
            {i < ligne ? <Check className="h-4 w-4 text-brand-600" aria-hidden="true" /> : i === ligne ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <span className="h-4 w-4" />}
            <span className="text-foreground">{l}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
