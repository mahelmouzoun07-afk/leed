"use client";

import { useActionState } from "react";
import { BlocErreur, Champ, boutonPrincipal, inputClass } from "@/components/form";
import { connecterAdmin } from "@/lib/auth/actions-admin";
import { ETAT_VIDE } from "@/lib/auth/types";

export function ConnexionAdmin() {
  const [etat, action, enCours] = useActionState(connecterAdmin, ETAT_VIDE);
  return (
    <div className="mx-auto w-full max-w-[420px] px-4 pb-24 pt-10 md:pt-16">
      <div className="glass-window-inner p-6">
        <h1 className="!text-[1.5rem] !font-medium !leading-tight tracking-[-0.02em]">Espace équipe</h1>
        <p className="!mt-1 text-base">Réservé à l&apos;équipe Leed. Une vérification en deux étapes suit la connexion.</p>
        {etat.message && (
          <div className="mt-4">
            <BlocErreur message={etat.message} />
          </div>
        )}
        <form action={action} noValidate className="mt-5 flex flex-col gap-4">
          <Champ id="email" label="Adresse email">
            <input id="email" name="email" type="email" autoComplete="email" required className={inputClass} />
          </Champ>
          <Champ id="motDePasse" label="Mot de passe">
            <input id="motDePasse" name="motDePasse" type="password" autoComplete="current-password" required className={inputClass} />
          </Champ>
          <button type="submit" disabled={enCours} className={`${boutonPrincipal} w-full`}>
            {enCours ? "Connexion…" : "Continuer"}
          </button>
        </form>
      </div>
    </div>
  );
}
