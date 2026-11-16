"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Mail } from "lucide-react";
import { BlocErreur, Champ, boutonPrincipal, inputClass } from "@/components/form";
import { BoutonGoogle } from "@/app/(site)/connexion/Connexion";
import { inscrire } from "@/lib/auth/actions";
import { PAYS } from "@/lib/auth/pays";
import { REGLES_MOT_DE_PASSE } from "@/lib/auth/mot-de-passe";
import { ETAT_VIDE } from "@/lib/auth/types";
import { useParcours } from "@/lib/parcours/etat";
import { formaterFcfa } from "@/lib/forfait";

export function Inscription({ googleActif }: { googleActif: boolean }) {
  const { etat } = useParcours();
  const [resultat, action, enCours] = useActionState(inscrire, ETAT_VIDE);
  const [mdp, setMdp] = useState("");
  const e = resultat.erreurs ?? {};
  const total = etat.apercu?.total;
  const mauvais = (k: string) => (e[k] ? "!border-destructive" : "");

  // Ce que le visiteur a fait avant (site, fiche, profils, aperçu) part avec le formulaire pour être rattaché au compte.
  const analyse = JSON.stringify({ entree: etat.entree ?? {}, fiche: etat.fiche, profils: etat.profils, apercu: etat.apercu });

  if (resultat.etape === "verifier_email") {
    return (
      <div className="mx-auto w-full max-w-[520px] px-4 pb-24 pt-10 md:pt-16">
        <div className="glass-window-inner p-6 text-center" role="status">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-chip">
            <Mail className="h-5 w-5" aria-hidden="true" />
          </span>
          <h1 className="!mt-4 !text-[1.75rem] !font-medium !leading-tight">Vérifiez votre boîte mail</h1>
          <p className="!mb-0 text-base">
            Cliquez sur le lien de confirmation pour entrer dans votre espace. Vous retrouverez tout ce que vous venez de faire.
          </p>
          <p className="!mb-0 text-sm">{resultat.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[520px] px-4 pb-24 pt-10 md:pt-16">
      <div className="glass-window-inner p-6">
        <h1 className="!text-[1.75rem] !font-medium !leading-tight tracking-[-0.02em]">Créez votre compte</h1>
        <p className="!mt-1 text-base">
          {total ? `Tout ce que vous venez de faire est conservé : vos ${formaterFcfa(total)} entreprises vous attendent.` : "Une minute suffit."}
        </p>
        <div className="mt-5">
          <BoutonGoogle libelle="S'inscrire avec Google" actif={googleActif} />
        </div>
        <div className="my-4 flex items-center gap-3 text-sm text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          ou
          <span className="h-px flex-1 bg-border" />
        </div>
        {resultat.message && !resultat.ok && (
          <div className="mb-4">
            <BlocErreur message={resultat.message} />
          </div>
        )}
        <form action={action} noValidate className="flex flex-col gap-4">
          <input type="hidden" name="analyse" value={analyse} />
          <Champ id="prenomNom" label="Prénom et nom" erreur={e.prenomNom}>
            <input id="prenomNom" name="prenomNom" autoComplete="name" required className={`${inputClass} ${mauvais("prenomNom")}`} />
          </Champ>
          <Champ id="entreprise" label="Nom de votre entreprise" erreur={e.entreprise}>
            <input id="entreprise" name="entreprise" autoComplete="organization" required className={`${inputClass} ${mauvais("entreprise")}`} />
          </Champ>
          <Champ id="email" label="Adresse email" erreur={e.email}>
            <input id="email" name="email" type="email" autoComplete="email" required className={`${inputClass} ${mauvais("email")}`} />
          </Champ>
          <Champ id="motDePasse" label="Mot de passe" erreur={e.motDePasse}>
            <input id="motDePasse" name="motDePasse" type="password" autoComplete="new-password" required value={mdp} onChange={(ev) => setMdp(ev.target.value)} aria-describedby="regles-mdp" className={`${inputClass} ${mauvais("motDePasse")}`} />
            <ul id="regles-mdp" className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {REGLES_MOT_DE_PASSE.map((r) => (
                <li key={r.id} className={r.ok(mdp) ? "text-brand-600" : "text-muted-foreground"}>
                  {r.ok(mdp) ? <Check className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" /> : <span aria-hidden="true" className="mr-1 inline-block w-3.5 text-center">-</span>}
                  <span className="sr-only">{r.ok(mdp) ? "Fait : " : "À faire : "}</span>
                  {r.libelle}
                </li>
              ))}
            </ul>
          </Champ>
          <Champ id="whatsapp" label="Votre numéro WhatsApp" aide="Avec l'indicatif du pays. Un seul essai gratuit par numéro." erreur={e.whatsapp}>
            <input id="whatsapp" name="whatsapp" type="tel" autoComplete="tel" placeholder="+229 01 23 45 67 89" required className={`${inputClass} ${mauvais("whatsapp")}`} />
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
          <div>
            <label className="flex cursor-pointer items-start gap-2">
              <input type="checkbox" name="cgu" className="mt-[3px] h-4 w-4 shrink-0 accent-[var(--primary)]" />
              <span className="text-sm leading-snug text-muted-foreground">
                J&apos;accepte les{" "}
                <Link href="/conditions/" target="_blank" className="text-foreground underline underline-offset-4">
                  conditions d&apos;utilisation
                </Link>{" "}
                et la{" "}
                <Link href="/confidentialite/" target="_blank" className="text-foreground underline underline-offset-4">
                  politique de confidentialité
                </Link>
                .
              </span>
            </label>
            {e.cgu && (
              <div role="alert" className="mt-1.5 text-sm text-destructive">
                {e.cgu}
              </div>
            )}
          </div>
          <button type="submit" disabled={enCours} className={`${boutonPrincipal} w-full`}>
            {enCours ? "Création du compte…" : "Créer mon compte"} {!enCours && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
          </button>
        </form>
        <p className="!mb-0 !mt-5 text-center text-sm">
          Déjà un compte ?{" "}
          <Link href="/connexion/" className="text-foreground underline underline-offset-4">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
