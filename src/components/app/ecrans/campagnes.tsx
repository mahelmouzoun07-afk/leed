import Link from "next/link";
import { Circle, Pause, Play } from "lucide-react";
import { BoutonLien, Carte, EtatVide, Etiquette, Ligne, Sourdine, Titrine, TitrePage, classeBouton, nombre } from "@/components/app/kit";
import { basculerCampagne } from "@/lib/app/actions";
import { NOM_CANAL, type CampagneLigne, type CampagneVue } from "@/lib/app/vues";

function Bascule({ c }: { c: CampagneLigne }) {
  const enCours = c.statut === "active";
  if (c.statut === "brouillon" || c.statut === "terminee") return null;
  return (
    <form action={basculerCampagne}>
      <input type="hidden" name="id" value={c.id} />
      <input type="hidden" name="pause" value={enCours ? "true" : "false"} />
      <button type="submit" className={classeBouton("cadre", true)}>
        {enCours ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
        {enCours ? "Pause" : "Reprendre"}
      </button>
    </form>
  );
}

const NOM_STATUT_CAMPAGNE = { brouillon: "Brouillon", active: "Active", en_pause: "En pause", terminee: "Terminée" } as const;

export function EcranCampagnes({ lignes, ok }: { lignes: CampagneLigne[]; ok?: boolean }) {
  return (
    <div>
      <TitrePage
        titre="Campagnes"
        droite={
          <BoutonLien href="/app/campagnes/nouvelle" petit>
            Nouvelle
          </BoutonLien>
        }
      />
      {ok && (
        <p role="status" className="mb-3 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-600">
          C&apos;est enregistré.
        </p>
      )}
      {lignes.length === 0 ? (
        <EtatVide titre="Aucune campagne" texte="Une campagne, c'est une cible, un message et un budget. Elle se crée à partir des profils de clients idéaux que vous avez validés." action={<BoutonLien href="/app/campagnes/nouvelle">Estimer une campagne</BoutonLien>} />
      ) : (
        <div className="flex flex-col gap-3">
          {lignes.map((c) => (
            <Carte key={c.id} ton={c.statut === "active" ? "normal" : "calme"}>
              <Ligne>
                <Link href={`/app/campagnes/${c.id}`} className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground hover:underline">
                  <Circle className={`h-2.5 w-2.5 shrink-0 ${c.statut === "active" ? "fill-brand-600 text-brand-600" : "text-muted-foreground"}`} aria-hidden="true" />
                  <span className="truncate">{c.nom}</span>
                </Link>
                <Bascule c={c} />
              </Ligne>
              <Sourdine className="tabular-nums">
                {nombre(c.contactes)} contactés · {nombre(c.reponses)} réponses · {nombre(c.rdv)} RDV
              </Sourdine>
              <Ligne className="text-muted-foreground">
                <span>
                  {c.canaux.map((x) => NOM_CANAL[x]).join(", ")}
                  {c.plafondJour ? ` · ${c.plafondJour} par jour` : ""}
                </span>
                <Etiquette ton={c.statut === "active" ? "ok" : "neutre"}>{NOM_STATUT_CAMPAGNE[c.statut]}</Etiquette>
              </Ligne>
            </Carte>
          ))}
        </div>
      )}
    </div>
  );
}

const ONGLETS = [
  ["cible", "Cible"],
  ["messages", "Messages"],
  ["rythme", "Rythme"],
  ["budget", "Budget"],
] as const;

export function EcranCampagne({ v, onglet, ok }: { v: CampagneVue; onglet: string; ok?: boolean }) {
  const actif = ONGLETS.some(([k]) => k === onglet) ? onglet : "cible";
  return (
    <div className="flex flex-col gap-4">
      <TitrePage titre={v.nom} retour="/app/campagnes" droite={<Bascule c={v} />} />
      {ok && (
        <p role="status" className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-600">
          C&apos;est enregistré.
        </p>
      )}
      <div role="tablist" aria-label="Réglages de la campagne" className="flex flex-wrap gap-2">
        {ONGLETS.map(([k, l]) => (
          <Link key={k} role="tab" aria-selected={actif === k} href={`/app/campagnes/${v.id}?onglet=${k}`} className={`rounded-full px-3.5 py-1.5 text-sm ${actif === k ? "bg-primary text-primary-foreground" : "bg-chip text-foreground"}`}>
            {l}
          </Link>
        ))}
      </div>
      {actif === "cible" &&
        (v.cible ? (
          <div className="flex flex-col gap-4">
            {(
              [
                ["Secteurs", v.cible.secteurs],
                ["Villes", v.cible.villes],
                ["Taille", v.cible.tailles],
                ["Signaux d'achat", v.cible.signaux],
              ] as const
            ).map(([titre, valeurs]) => (
              <div key={titre} className="flex flex-col gap-2">
                <Titrine>{titre}</Titrine>
                <div className="flex flex-wrap gap-2">{valeurs.length === 0 ? <Sourdine>Tous</Sourdine> : valeurs.map((x) => <Etiquette key={x}>{x}</Etiquette>)}</div>
              </div>
            ))}
            <Sourdine>La modification de la cible ouvrira avec la recherche dans l&apos;annuaire.</Sourdine>
          </div>
        ) : (
          <EtatVide titre="Pas de cible rattachée" texte="Cette campagne n'a pas encore de profil de client idéal." />
        ))}
      {actif === "messages" && (
        <Carte>
          <Sourdine>Les messages sont rédigés par l&apos;agent dans votre style, avec ce que vous l&apos;autorisez à dire. Chaque message est contrôlé avant d&apos;être envoyé.</Sourdine>
          <div>
            <BoutonLien href="/app/reglages/messages" petit>
              Régler ce que l&apos;agent dit
            </BoutonLien>
          </div>
        </Carte>
      )}
      {actif === "rythme" && (
        <Carte>
          <Ligne>
            <span>Pas plus de</span>
            <b className="tabular-nums">{v.plafondJour ? `${v.plafondJour} par jour` : "selon votre forfait"}</b>
          </Ligne>
          <Sourdine>Limites fixes : 40 messages par jour et par compte, aucun envoi avant 8 h ni après 19 h, et « Répondez STOP » dans chaque premier message.</Sourdine>
        </Carte>
      )}
      {actif === "budget" && (
        <Carte>
          <Ligne>
            <span>Entreprises contactées</span>
            <b className="tabular-nums">{nombre(v.contactes)}</b>
          </Ligne>
          <Sourdine>Le budget de la campagne est celui de votre forfait : une entreprise est décomptée quand son premier message est bien parti.</Sourdine>
          <div>
            <BoutonLien href="/app/forfait" petit>
              Voir mon forfait
            </BoutonLien>
          </div>
        </Carte>
      )}
    </div>
  );
}
