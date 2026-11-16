"use client";

import { useState } from "react";
import { Carte, Chiffres, Ligne, Sourdine, Titrine, TitrePage, classeBouton, fcfa, nombre } from "@/components/app/kit";
import { Puce } from "@/components/form";
import { Slider } from "@/components/ui";
import { bareme, economie, marcheSuivante, montantDepuisPosition } from "@/lib/forfait";

const OPERATEURS = ["MTN MoMo", "Moov Money", "Wave", "Orange Money"];

/** Recharger : le palier suivant est toujours montré, avec l'économie en FCFA. Le paiement ouvre avec Mobile Money. */
export function Recharge({ restantes, avantLaFin }: { restantes: number; avantLaFin: boolean }) {
  const [pos, setPos] = useState(50);
  const [operateur, setOperateur] = useState(OPERATEURS[0]);
  const montant = montantDepuisPosition(pos);
  const b = bareme(montant);
  const suivante = marcheSuivante(montant);
  const gain = economie(montant);
  const bonus = avantLaFin ? Math.floor((b.entreprises * b.palier.bonus) / 100) : 0;
  return (
    <div className="flex flex-col gap-4">
      <TitrePage titre="Recharger" retour="/app/forfait" />
      <div className="flex flex-col gap-2">
        <span className="text-[2rem] font-semibold tabular-nums leading-tight text-foreground" aria-live="polite">
          {fcfa(montant)}
        </span>
        <Slider value={pos} onChange={setPos} label="Montant de la recharge" />
        <Ligne className="text-muted-foreground">
          <span>5 000</span>
          <span>150 000</span>
        </Ligne>
      </div>
      <Chiffres
        colonnes={2}
        items={[
          [nombre(b.entreprises), "entreprises"],
          [`${b.prix} F`, "par entreprise"],
          [b.comptes, b.comptes === "1" ? "compte" : "comptes"],
          [`${b.parJour}/j`, "rythme"],
        ]}
      />
      {suivante && (
        <Carte ton="calme">
          <p className="!my-0 text-sm !text-foreground">{suivante}</p>
        </Carte>
      )}
      {gain > 0 && <Sourdine>À {fcfa(montant)}, vous économisez {fcfa(gain)} par rapport au prix de base.</Sourdine>}
      <Carte ton="calme">
        <Ligne>
          <span>Entreprises reportées</span>
          <b className="tabular-nums text-brand-600">+{nombre(restantes)}</b>
        </Ligne>
        <Ligne>
          <span>Bonus de fidélité</span>
          <b className="tabular-nums text-brand-600">{avantLaFin ? `+${b.palier.bonus} % (${nombre(bonus)})` : "recharge avant la fin du forfait"}</b>
        </Ligne>
      </Carte>
      <div className="flex flex-col gap-2">
        <Titrine>Opérateur</Titrine>
        <div role="radiogroup" aria-label="Opérateur Mobile Money" className="flex flex-wrap gap-2">
          {OPERATEURS.map((o) => (
            <Puce radio key={o} actif={operateur === o} onClick={() => setOperateur(o)}>
              {o}
            </Puce>
          ))}
        </div>
      </div>
      <button type="button" disabled className={classeBouton("action", false, true)}>
        Payer {fcfa(montant)}
      </button>
      <Sourdine>Le paiement par Mobile Money ouvre bientôt. Rien n&apos;est débité aujourd&apos;hui.</Sourdine>
    </div>
  );
}
