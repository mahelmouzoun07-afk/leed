"use client";

import { useCallback, useEffect, useState } from "react";
import type { Etat } from "./types";

const CLE = "leed:parcours";

function lire(): Etat {
  try {
    const brut = window.sessionStorage.getItem(CLE);
    return brut ? (JSON.parse(brut) as Etat) : {};
  } catch {
    return {};
  }
}

function ecrire(e: Etat) {
  try {
    window.sessionStorage.setItem(CLE, JSON.stringify(e));
  } catch {
    /* stockage indisponible (navigation privée) : le parcours continue sans mémoire */
  }
}

/**
 * Mémoire du parcours, gardée dans l'onglet du visiteur (sessionStorage).
 * `pret` passe à true une fois la lecture faite : avant, on n'affiche pas
 * de décision (redirection, état vide) pour éviter un clignotement.
 */
export function useParcours() {
  const [etat, setEtat] = useState<Etat>({});
  const [pret, setPret] = useState(false);

  useEffect(() => {
    setEtat(lire());
    setPret(true);
  }, []);

  const maj = useCallback((partiel: Partial<Etat>) => {
    const suivant = { ...lire(), ...partiel };
    ecrire(suivant);
    setEtat(suivant);
  }, []);

  const effacer = useCallback((cles: (keyof Etat)[]) => {
    const suivant = { ...lire() };
    for (const c of cles) delete suivant[c];
    ecrire(suivant);
    setEtat(suivant);
  }, []);

  return { etat, pret, maj, effacer };
}
