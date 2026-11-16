"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { Carte, Chiffres, Sourdine, Titrine, TitrePage, classeBouton, fcfa, nombre } from "@/components/app/kit";
import { Puce } from "@/components/form";
import { Slider } from "@/components/ui";
import { bareme, montantDepuisPosition } from "@/lib/forfait";
import { NOM_CANAL, CANAUX, type CanalNom, type SimulateurVue } from "@/lib/app/vues";

/**
 * Avant de dépenser : ce qu'on peut attendre. Les taux viennent de VRAIS envois mesurés (et partagés entre
 * clients) ; tant qu'il n'y en a pas assez, on n'affiche aucune estimation de réponses : on ne l'invente pas.
 */
export function Simulateur({ v }: { v: SimulateurVue }) {
  const [pos, setPos] = useState(35);
  const [canal, setCanal] = useState<CanalNom>("whatsapp");
  const montant = montantDepuisPosition(pos);
  const b = bareme(montant);
  const t = v.taux;
  const fourchette = (n: number) => {
    const bas = Math.round(n * 0.7);
    const haut = Math.round(n * 1.3);
    return bas === haut ? `~${nombre(bas)}` : `~${nombre(bas)} à ${nombre(haut)}`;
  };
  const reponses = t ? b.entreprises * t.reponse : 0;
  const rdv = t ? b.entreprises * t.rdv : 0;
  return (
    <div className="flex flex-col gap-4">
      <TitrePage titre="Nouvelle campagne" retour="/app/campagnes" />
      <div className="flex flex-col gap-2">
        <Titrine>Budget</Titrine>
        <span className="text-[2rem] font-semibold tabular-nums leading-tight text-foreground">{fcfa(montant)}</span>
        <Slider value={pos} onChange={setPos} label="Budget de la campagne" />
      </div>
      <div className="flex flex-col gap-2">
        <Titrine>Canal</Titrine>
        <div role="radiogroup" aria-label="Canal" className="flex flex-wrap gap-2">
          {CANAUX.map((c) => (
            <Puce radio key={c} actif={canal === c} onClick={() => setCanal(c)}>
              {NOM_CANAL[c]}
            </Puce>
          ))}
        </div>
      </div>
      <Chiffres
        colonnes={2}
        items={
          t
            ? [
                [`${nombre(b.entreprises)}`, "entreprises contactées"],
                [fourchette(reponses), "réponses"],
                [fourchette(rdv), "rendez-vous"],
                [rdv >= 1 ? `~${nombre(Math.round(montant / Math.max(rdv, 1) / 50) * 50)} F` : "-", "par rendez-vous"],
              ]
            : [
                [`${nombre(b.entreprises)}`, "entreprises contactées"],
                [`${b.prix} F`, "par entreprise"],
              ]
        }
      />
      <Carte ton="calme">
        {t ? (
          <Sourdine>
            Estimation fondée sur {nombre(t.echantillon)} prospects contactés ({t.perimetre}). Ce n&apos;est pas une promesse : les résultats varient d&apos;une entreprise à l&apos;autre.
          </Sourdine>
        ) : (
          <Sourdine className="flex items-start gap-2">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Leed n&apos;affiche pas d&apos;estimation de réponses tant qu&apos;il n&apos;a pas mesuré assez d&apos;envois réels (au moins 300). Ce que vous voyez ici est exact : le nombre d&apos;entreprises que ce budget permet de contacter.</span>
          </Sourdine>
        )}
      </Carte>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled title="Ouvre avec la recherche dans l'annuaire" className={classeBouton("action")}>
          Lancer
        </button>
      </div>
    </div>
  );
}
