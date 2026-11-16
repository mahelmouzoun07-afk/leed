"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { BlocErreur, Champ, boutonPrincipal, inputClass } from "@/components/form";
import { connecter, connexionGoogle, envoyerLienMagique } from "@/lib/auth/actions";
import { ETAT_VIDE } from "@/lib/auth/types";

export function BoutonGoogle({ libelle, actif }: { libelle: string; actif: boolean }) {
  return (
    <form action={connexionGoogle}>
      <button
        type="submit"
        disabled={!actif}
        title={actif ? undefined : "Bientôt disponible"}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card py-3 font-medium text-foreground transition-colors enabled:hover:bg-chip disabled:opacity-60"
      >
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
          <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
        </svg>
        {libelle}
        {!actif && <span className="rounded-full bg-chip px-2 py-0.5 text-xs font-normal text-muted-foreground">bientôt</span>}
      </button>
    </form>
  );
}

const ERREURS_URL: Record<string, string> = {
  lien: "Ce lien n'est plus valable (il expire au bout d'une heure et ne sert qu'une fois). Demandez-en un nouveau.",
  google: "La connexion avec Google n'a pas abouti. Réessayez ou utilisez votre adresse email.",
};

export function Connexion({ retour, erreur, googleActif }: { retour: string; erreur: string; googleActif: boolean }) {
  const [etat, action, enCours] = useActionState(connecter, ETAT_VIDE);
  const [lien, actionLien, lienEnCours] = useActionState(envoyerLienMagique, ETAT_VIDE);

  return (
    <div className="mx-auto w-full max-w-[440px] px-4 pb-24 pt-10 md:pt-16">
      <div className="glass-window-inner p-6">
        <h1 className="!text-[1.75rem] !font-medium !leading-tight tracking-[-0.02em]">Connexion à Leed</h1>
        <p className="!mt-1 text-base">Bon retour. Entrez votre adresse et votre mot de passe.</p>
        {ERREURS_URL[erreur] && (
          <div className="mt-4">
            <BlocErreur message={ERREURS_URL[erreur]} />
          </div>
        )}
        <div className="mt-5">
          <BoutonGoogle libelle="Continuer avec Google" actif={googleActif} />
        </div>
        <div className="my-4 flex items-center gap-3 text-sm text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          ou
          <span className="h-px flex-1 bg-border" />
        </div>
        {etat.message && !etat.ok && (
          <div className="mb-4">
            <BlocErreur message={etat.message} />
          </div>
        )}
        <form action={action} noValidate className="flex flex-col gap-4">
          <input type="hidden" name="retour" value={retour} />
          <Champ id="email" label="Adresse email">
            <input id="email" name="email" type="email" autoComplete="email" required className={inputClass} />
          </Champ>
          <Champ id="motDePasse" label="Mot de passe">
            <input id="motDePasse" name="motDePasse" type="password" autoComplete="current-password" required className={inputClass} />
          </Champ>
          <button type="submit" disabled={enCours} className={`${boutonPrincipal} w-full`}>
            {enCours ? "Connexion…" : "Me connecter"}
          </button>
          <Link href="/mot-de-passe-oublie/" className="text-center text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
            Mot de passe oublié ?
          </Link>
        </form>

        <div className="mt-6 border-t border-border pt-5">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Mail className="h-4 w-4" aria-hidden="true" /> Sans mot de passe
          </div>
          {lien.ok ? (
            <p role="status" className="!mb-0 text-sm">
              {lien.message}
            </p>
          ) : (
            <form action={actionLien} noValidate className="mt-3 flex flex-col gap-3">
              <input type="hidden" name="retour" value={retour} />
              <Champ id="email-lien" label="Adresse email" erreur={lien.erreurs?.email}>
                <input id="email-lien" name="email" type="email" autoComplete="email" required className={inputClass} />
              </Champ>
              {lien.message && !lien.ok && <p role="alert" className="!my-0 text-sm text-destructive">{lien.message}</p>}
              <button type="submit" disabled={lienEnCours} className="inline-flex items-center justify-center rounded-lg border border-border px-5 py-3 font-medium text-foreground transition-colors hover:bg-chip disabled:opacity-60">
                {lienEnCours ? "Envoi…" : "Recevoir un lien de connexion"}
              </button>
            </form>
          )}
        </div>

        <p className="!mb-0 !mt-5 text-center text-sm">
          Pas encore de compte ?{" "}
          <Link href="/demarrer/" className="text-foreground underline underline-offset-4">
            Commencez par décrire votre activité
          </Link>
        </p>
      </div>
    </div>
  );
}
