"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { BlocErreur, Champ, boutonPrincipal, inputClass } from "@/components/form";
import { completerProfil } from "@/lib/auth/actions";
import { PAYS } from "@/lib/auth/pays";
import { ETAT_VIDE } from "@/lib/auth/types";

/** Étape pour les clients arrivés par Google : il manque le nom de l'entreprise et le numéro WhatsApp. */
export function Completer() {
  const [etat, action, enCours] = useActionState(completerProfil, ETAT_VIDE);
  const e = etat.erreurs ?? {};
  return (
    <div className="mx-auto w-full max-w-[520px] px-4 pb-24 pt-10 md:pt-16">
      <div className="glass-window-inner p-6">
        <h1 className="!text-[1.75rem] !font-medium !leading-tight tracking-[-0.02em]">Encore une étape</h1>
        <p className="!mt-1 text-base">Ces informations apparaissent dans les messages envoyés en votre nom.</p>
        {etat.message && (
          <div className="mt-4">
            <BlocErreur message={etat.message} />
          </div>
        )}
        <form action={action} noValidate className="mt-5 flex flex-col gap-4">
          <Champ id="entreprise" label="Nom de votre entreprise" erreur={e.entreprise}>
            <input id="entreprise" name="entreprise" autoComplete="organization" required className={`${inputClass} ${e.entreprise ? "!border-destructive" : ""}`} />
          </Champ>
          <Champ id="whatsapp" label="Votre numéro WhatsApp" aide="Avec l'indicatif du pays." erreur={e.whatsapp}>
            <input id="whatsapp" name="whatsapp" type="tel" autoComplete="tel" placeholder="+229 01 23 45 67 89" required className={`${inputClass} ${e.whatsapp ? "!border-destructive" : ""}`} />
          </Champ>
          <Champ id="pays" label="Pays" erreur={e.pays}>
            <select id="pays" name="pays" defaultValue="BJ" className={inputClass}>
              {PAYS.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.nom}
                </option>
              ))}
            </select>
          </Champ>
          <button type="submit" disabled={enCours} className={`${boutonPrincipal} w-full`}>
            {enCours ? "Enregistrement…" : "Continuer"} {!enCours && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
          </button>
        </form>
      </div>
    </div>
  );
}
