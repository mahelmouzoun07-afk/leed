import { Carte, Chiffres, EtatVide, Jauge, Ligne, Sourdine, Titrine, TitrePage, fcfa, nombre } from "@/components/app/kit";
import type { RapportsVue } from "@/lib/app/vues";

export function EcranRapports({ v }: { v: RapportsVue }) {
  const max = Math.max(...v.entonnoir.map((e) => e.valeur), 1);
  const vide = v.entonnoir.every((e) => e.valeur === 0);
  return (
    <div className="flex flex-col gap-4">
      <TitrePage titre="Rapports" />
      {vide ? (
        <EtatVide titre="Pas encore de résultats" texte="Le chemin des prospects, l'argent dépensé et ce que l'agent apprend s'affichent ici dès que les premiers messages sont partis." />
      ) : (
        <Carte>
          <Titrine>Le chemin des prospects</Titrine>
          {v.entonnoir.map((e, i) => {
            const precedent = i > 0 ? v.entonnoir[i - 1].valeur : null;
            const taux = precedent && precedent > 0 && i >= 2 ? ` · ${Math.round((e.valeur / precedent) * 100)} %` : "";
            return (
              <div key={e.libelle} className="flex flex-col gap-1.5">
                <Ligne>
                  <span>{e.libelle}</span>
                  <b className="tabular-nums">
                    {nombre(e.valeur)}
                    {taux}
                  </b>
                </Ligne>
                <Jauge valeur={(e.valeur / max) * 100} ton={i >= 4 ? "vert" : "sombre"} label={e.libelle} />
              </div>
            );
          })}
        </Carte>
      )}
      <Carte ton="calme">
        <Titrine>L&apos;argent</Titrine>
        <Chiffres
          colonnes={3}
          items={[
            [nombre(v.argent.depenses), "FCFA dépensés"],
            [v.argent.parRdv != null ? nombre(v.argent.parRdv) : "-", "FCFA par RDV"],
            [v.argent.gagnes != null ? nombre(v.argent.gagnes) : "-", "FCFA gagnés"],
          ]}
        />
        {v.argent.gagnes == null && <Sourdine>Les montants gagnés s&apos;afficheront quand vous aurez indiqué ce que vos rendez-vous ont rapporté.</Sourdine>}
        {v.argent.depenses > 0 && <Sourdine>Total payé : {fcfa(v.argent.depenses)}.</Sourdine>}
      </Carte>
      <Carte>
        <Titrine>Ce que l&apos;agent a appris</Titrine>
        {v.appris.length === 0 ? <Sourdine>L&apos;agent a besoin de plusieurs centaines de messages pour repérer ce qui marche. Ses constats apparaîtront ici.</Sourdine> : (
          <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
            {v.appris.map((a) => (
              <li key={a}>- {a}</li>
            ))}
          </ul>
        )}
      </Carte>
      {v.proposition && (
        <Carte ton="vif">
          <Titrine>Ce qu&apos;il propose</Titrine>
          <p className="!my-0 text-sm !text-foreground">{v.proposition}</p>
        </Carte>
      )}
    </div>
  );
}
