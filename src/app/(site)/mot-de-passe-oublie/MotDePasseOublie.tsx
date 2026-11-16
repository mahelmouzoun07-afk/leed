"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { Champ, boutonPrincipal, inputClass } from "@/components/form";
import { demanderReinitialisation } from "@/lib/auth/actions";
import { ETAT_VIDE } from "@/lib/auth/types";

export function MotDePasseOublie() {
  const [etat, action, enCours] = useActionState(demanderReinitialisation, ETAT_VIDE);
  return (
    <div className="mx-auto w-full max-w-[440px] px-4 pb-24 pt-10 md:pt-16">
      {etat.ok ? (
        <div className="glass-window-inner p-6 text-center" role="status">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-chip">
            <Mail className="h-5 w-5" aria-hidden="true" />
          </span>
          <h1 className="!mt-4 !text-[1.75rem] !font-medium !leading-tight">Vérifiez votre boîte mail</h1>
          <p className="!mb-0 text-base">{etat.message}</p>
        </div>
      ) : (
        <div className="glass-window-inner p-6">
          <h1 className="!text-[1.75rem] !font-medium !leading-tight tracking-[-0.02em]">Mot de passe oublié</h1>
          <p className="!mt-1 text-base">Entrez votre adresse : nous vous envoyons un lien pour en choisir un nouveau.</p>
          <form action={action} noValidate className="mt-5 flex flex-col gap-4">
            <Champ id="email" label="Adresse email" erreur={etat.erreurs?.email}>
              <input id="email" name="email" type="email" autoComplete="email" required className={inputClass} />
            </Champ>
            {etat.message && <p role="alert" className="!my-0 text-sm text-destructive">{etat.message}</p>}
            <button type="submit" disabled={enCours} className={`${boutonPrincipal} w-full`}>
              {enCours ? "Envoi…" : "M'envoyer le lien"}
            </button>
          </form>
          <p className="!mb-0 !mt-5 text-center text-sm">
            <Link href="/connexion/" className="text-foreground underline underline-offset-4">
              Retour à la connexion
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
