"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Lock } from "lucide-react";
import { BlocErreur, boutonPrincipal } from "@/components/form";
import { Slider } from "@/components/ui";
import { useParcours } from "@/lib/parcours/etat";
import { choisirOffre } from "@/lib/parcours/factice";
import { MONTANT_PAR_DEFAUT, bareme, economie, formaterFcfa, marcheSuivante, montantDepuisPosition } from "@/lib/forfait";

const MOYENS = ["MTN MoMo", "Moov Money", "Wave", "Orange Money"];
const RESEAUX_VERROUILLES = ["WhatsApp", "Instagram", "Facebook", "LinkedIn"];

export function Choisir() {
  const router = useRouter();
  const { etat, pret } = useParcours();
  const [pos, setPos] = useState(50);
  const [moyen, setMoyen] = useState(MOYENS[0]);
  const [envoi, setEnvoi] = useState<"essai" | "forfait" | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [fait, setFait] = useState<"essai" | "forfait" | null>(null);

  useEffect(() => {
    if (pret && !etat.compte) router.replace("/inscription/");
  }, [pret, etat.compte, router]);

  const montant = montantDepuisPosition(pos);
  const b = bareme(montant);
  const suivante = marcheSuivante(montant);
  const gain = economie(montant);

  const valider = async (type: "essai" | "forfait") => {
    setErreur(null);
    setEnvoi(type);
    const r = await choisirOffre(type === "essai" ? { type } : { type, montant, moyen });
    setEnvoi(null);
    if (!r.ok) return setErreur(r.erreur);
    setFait(type);
  };

  if (fait) {
    return (
      <div className="mx-auto w-full max-w-[560px] px-4 pb-24 pt-10 md:pt-16">
        <div className="glass-window-inner p-6 text-center" role="status">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <Check className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="!mt-4 !text-[1.75rem] !font-medium !leading-tight">{fait === "essai" ? "Votre essai gratuit est choisi" : `Votre forfait de ${formaterFcfa(montant)} FCFA est choisi`}</h1>
          <p className="!mb-0 text-base">
            {fait === "essai" ? "La prochaine étape sera de connecter votre Gmail." : `Le paiement par ${moyen} et la connexion de vos comptes ouvrent bientôt.`} Aucun paiement n'a été pris.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[960px] px-4 pb-24 pt-10 md:pt-16">
      <h1 className="hero-headline !text-[clamp(1.875rem,7vw,2.875rem)]">
        Comment voulez-vous <span className="headline-accent">commencer</span> ?
      </h1>
      <p className="!mt-3 max-w-[600px] text-base">Vous pouvez essayer sans payer, ou prendre un forfait tout de suite. Dans les deux cas, pas d'abonnement.</p>
      {erreur && (
        <div className="mt-4">
          <BlocErreur message={erreur} />
        </div>
      )}
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <section aria-labelledby="essai" className="glass-window-inner flex flex-col p-6 !m-0">
          <h2 id="essai" className="!mb-0 !text-xl !font-medium !leading-snug">
            Essai gratuit
          </h2>
          <div className="mt-3 text-4xl font-semibold tabular-nums text-foreground">0 FCFA</div>
          <ul className="mt-4 flex flex-col gap-2 text-base text-foreground">
            <li className="flex gap-2">
              <Check className="mt-1 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" /> 10 entreprises contactées par email, depuis votre Gmail
            </li>
            <li className="flex gap-2">
              <Check className="mt-1 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" /> 7 jours
            </li>
            <li className="flex gap-2">
              <Lock className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" /> <span className="text-muted-foreground">{RESEAUX_VERROUILLES.join(", ")} : avec un forfait</span>
            </li>
          </ul>
          <p className="text-sm">Un essai par numéro WhatsApp, par adresse Gmail et par site web.</p>
          <button type="button" disabled={envoi !== null} onClick={() => valider("essai")} className="mt-auto inline-flex items-center justify-center gap-2 rounded-lg border border-border px-6 py-3 font-medium text-foreground transition-colors hover:bg-chip disabled:opacity-60">
            {envoi === "essai" ? "Un instant…" : "Essayer gratuitement"}
          </button>
        </section>

        <section aria-labelledby="forfait" className="glass-window-inner flex flex-col p-6 outline outline-2 outline-primary !m-0">
          <div className="flex items-center justify-between">
            <h2 id="forfait" className="!mb-0 !text-xl !font-medium !leading-snug">
              Forfait
            </h2>
            <span className="rounded-full bg-chip px-2.5 py-0.5 text-sm text-foreground">Tous les réseaux</span>
          </div>
          <div className="mt-3 text-4xl font-semibold tabular-nums text-foreground" aria-live="polite">
            {formaterFcfa(montant)} FCFA
          </div>
          <div className="mt-2">
            <Slider value={pos} onChange={setPos} label="Montant du forfait" />
          </div>
          {montant === MONTANT_PAR_DEFAUT && <div className="mt-1 text-sm text-muted-foreground">Le plus choisi</div>}
          <ul className="mt-4 flex flex-col gap-1.5 text-base text-foreground">
            <li>
              {formaterFcfa(b.entreprises)} entreprises contactées, à {b.prix} FCFA chacune
            </li>
            <li>
              {b.comptes === "Tous" ? "Tous vos comptes connectés" : `${b.comptes} ${b.comptes === "1" ? "compte connecté" : "comptes connectés"} en même temps`} · {b.parJour} entreprises par jour
            </li>
            <li>Valable 30 jours</li>
          </ul>
          {gain > 0 && <p className="!mb-0 !mt-2 text-sm">À {formaterFcfa(montant)} FCFA, vous économisez {formaterFcfa(gain)} FCFA par rapport au prix de base.</p>}
          {suivante && <p className="!mb-0 !mt-2 text-sm text-foreground">{suivante}</p>}
          <fieldset className="mt-4">
            <legend className="mb-2 text-sm font-medium text-foreground">Payer avec</legend>
            <div role="radiogroup" className="flex flex-wrap gap-2">
              {MOYENS.map((m) => (
                <button key={m} type="button" role="radio" aria-checked={moyen === m} onClick={() => setMoyen(m)} className={`rounded-full border px-3.5 py-2 text-sm transition-colors ${moyen === m ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-chip"}`}>
                  {m}
                </button>
              ))}
            </div>
          </fieldset>
          <button type="button" disabled={envoi !== null} onClick={() => valider("forfait")} className={`${boutonPrincipal} mt-6 w-full`}>
            {envoi === "forfait" ? "Un instant…" : "Payer et commencer"} {envoi === null && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
          </button>
        </section>
      </div>
    </div>
  );
}
