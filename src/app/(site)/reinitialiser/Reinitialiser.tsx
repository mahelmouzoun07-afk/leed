"use client";

import { useActionState, useState } from "react";
import { BlocErreur, Champ, boutonPrincipal, inputClass } from "@/components/form";
import { changerMotDePasse } from "@/lib/auth/actions";
import { REGLES_MOT_DE_PASSE } from "@/lib/auth/mot-de-passe";
import { ETAT_VIDE } from "@/lib/auth/types";

export function Reinitialiser() {
  const [etat, action, enCours] = useActionState(changerMotDePasse, ETAT_VIDE);
  const [mdp, setMdp] = useState("");
  return (
    <div className="mx-auto w-full max-w-[440px] px-4 pb-24 pt-10 md:pt-16">
      <div className="glass-window-inner p-6">
        <h1 className="!text-[1.75rem] !font-medium !leading-tight tracking-[-0.02em]">Choisissez un nouveau mot de passe</h1>
        {etat.message && (
          <div className="mt-4">
            <BlocErreur message={etat.message} />
          </div>
        )}
        <form action={action} noValidate className="mt-5 flex flex-col gap-4">
          <Champ id="motDePasse" label="Nouveau mot de passe" erreur={etat.erreurs?.motDePasse}>
            <input id="motDePasse" name="motDePasse" type="password" autoComplete="new-password" required value={mdp} onChange={(e) => setMdp(e.target.value)} className={inputClass} />
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {REGLES_MOT_DE_PASSE.map((r) => (
                <li key={r.id} className={r.ok(mdp) ? "text-brand-600" : "text-muted-foreground"}>
                  {r.ok(mdp) ? "Oui" : "À faire"} : {r.libelle}
                </li>
              ))}
            </ul>
          </Champ>
          <Champ id="confirmation" label="Répétez le mot de passe" erreur={etat.erreurs?.confirmation}>
            <input id="confirmation" name="confirmation" type="password" autoComplete="new-password" required className={inputClass} />
          </Champ>
          <button type="submit" disabled={enCours} className={`${boutonPrincipal} w-full`}>
            {enCours ? "Enregistrement…" : "Enregistrer"}
          </button>
        </form>
      </div>
    </div>
  );
}
