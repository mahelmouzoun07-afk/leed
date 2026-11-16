"use client";

import { useActionState, useEffect, useState } from "react";
import { BlocErreur, Champ, boutonPrincipal, inputClass } from "@/components/form";
import { preparerTotp, verifierTotp } from "@/lib/auth/actions-admin";
import { ETAT_VIDE } from "@/lib/auth/types";

type Preparation = { qrCode: string; secret: string; facteurId: string };

export function VerificationAdmin({ facteurId }: { facteurId: string | null }) {
  const [etat, action, enCours] = useActionState(verifierTotp, ETAT_VIDE);
  const [prep, setPrep] = useState<Preparation | null>(null);
  const [erreurPrep, setErreurPrep] = useState<string | null>(null);

  // Première activation : on demande le QR code à afficher dans l'application d'authentification.
  useEffect(() => {
    if (facteurId) return;
    let actif = true;
    preparerTotp().then((r) => {
      if (!actif) return;
      if (r.ok && r.qrCode && r.secret && r.facteurId) setPrep({ qrCode: r.qrCode, secret: r.secret, facteurId: r.facteurId });
      else setErreurPrep(r.message ?? "Impossible de préparer la vérification.");
    });
    return () => {
      actif = false;
    };
  }, [facteurId]);

  const id = facteurId ?? prep?.facteurId ?? "";
  return (
    <div className="mx-auto w-full max-w-[460px] px-4 pb-24 pt-10 md:pt-16">
      <div className="glass-window-inner p-6">
        <h1 className="!text-[1.5rem] !font-medium !leading-tight tracking-[-0.02em]">Vérification en deux étapes</h1>
        {facteurId ? (
          <p className="!mt-1 text-base">Entrez le code à 6 chiffres affiché par votre application d&apos;authentification.</p>
        ) : (
          <div className="mt-2 text-base">
            <p className="!mt-0">
              Première connexion : scannez ce QR code avec une application d&apos;authentification (Google Authenticator, Microsoft Authenticator…), puis entrez le code affiché.
            </p>
            {erreurPrep && <BlocErreur message={erreurPrep} />}
            {prep && (
              <div className="mt-3 flex flex-col items-center gap-3">
                {/* QR code fourni par Supabase sous forme d'image SVG intégrée */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={prep.qrCode} alt="QR code à scanner avec votre application d'authentification" width={180} height={180} />
                <p className="!my-0 text-center text-sm">
                  Impossible de scanner ? Saisissez cette clé : <span className="break-all font-mono text-foreground">{prep.secret}</span>
                </p>
              </div>
            )}
          </div>
        )}
        {etat.message && (
          <div className="mt-4">
            <BlocErreur message={etat.message} />
          </div>
        )}
        <form action={action} noValidate className="mt-5 flex flex-col gap-4">
          <input type="hidden" name="facteurId" value={id} />
          <Champ id="code" label="Code à 6 chiffres" erreur={etat.erreurs?.code}>
            <input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required className={inputClass} />
          </Champ>
          <button type="submit" disabled={enCours || !id} className={`${boutonPrincipal} w-full`}>
            {enCours ? "Vérification…" : "Valider"}
          </button>
        </form>
      </div>
    </div>
  );
}
