"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { BlocErreur, Champ, boutonPrincipal, estEmail, inputClass } from "@/components/form";
import { seConnecter } from "@/lib/parcours/factice";

export function BoutonGoogle({ libelle }: { libelle: string }) {
  return (
    <button type="button" disabled title="Bientôt disponible" className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card py-3 font-medium text-foreground transition-colors enabled:hover:bg-chip disabled:opacity-60">
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
        <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
      </svg>
      {libelle}
      <span className="rounded-full bg-chip px-2 py-0.5 text-xs font-normal text-muted-foreground">bientôt</span>
    </button>
  );
}

export function Connexion() {
  const [email, setEmail] = useState("");
  const [champErreur, setChampErreur] = useState<string | undefined>();
  const [envoi, setEnvoi] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const valider = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);
    if (!estEmail(email)) return setChampErreur("Entrez une adresse email valide.");
    setChampErreur(undefined);
    setEnvoi(true);
    const r = await seConnecter(email.trim());
    setEnvoi(false);
    if (r.ok) setEnvoye(true);
    else setErreur(r.erreur);
  };

  return (
    <div className="mx-auto w-full max-w-[440px] px-4 pb-24 pt-10 md:pt-16">
      {envoye ? (
        <div className="glass-window-inner p-6 text-center" role="status">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-chip">
            <Mail className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="mt-4 text-xl font-medium text-foreground">Vérifiez votre boîte mail</div>
          <p className="!mb-0 text-base">
            Nous avons envoyé un lien de connexion à <span className="text-foreground">{email}</span>.
          </p>
          <button type="button" onClick={() => setEnvoye(false)} className="mt-3 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
            Utiliser une autre adresse
          </button>
        </div>
      ) : (
        <div className="glass-window-inner p-6">
          <h1 className="!text-[1.75rem] !font-medium !leading-tight tracking-[-0.02em]">Connexion à Leed</h1>
          <p className="!mt-1 text-base">Bon retour. Recevez un lien par email pour entrer dans votre espace.</p>
          <div className="mt-5">
            <BoutonGoogle libelle="Continuer avec Google" />
          </div>
          <div className="my-4 flex items-center gap-3 text-sm text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            ou
            <span className="h-px flex-1 bg-border" />
          </div>
          {erreur && (
            <div className="mb-4">
              <BlocErreur message={erreur} />
            </div>
          )}
          <form noValidate onSubmit={valider} className="flex flex-col gap-4">
            <Champ id="email" label="Adresse email" erreur={champErreur}>
              <input id="email" type="email" autoComplete="email" placeholder="vous@exemple.com" value={email} aria-invalid={!!champErreur} onChange={(e) => setEmail(e.target.value)} className={`${inputClass} ${champErreur ? "!border-destructive" : ""}`} />
            </Champ>
            <button type="submit" disabled={envoi} className={`${boutonPrincipal} w-full`}>
              {envoi ? "Envoi en cours…" : "M'envoyer le lien de connexion"}
            </button>
          </form>
          <p className="!mb-0 !mt-5 text-center text-sm">
            Pas encore de compte ?{" "}
            <Link href="/demarrer/" className="text-foreground underline underline-offset-4">
              Commencez par décrire votre activité
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
