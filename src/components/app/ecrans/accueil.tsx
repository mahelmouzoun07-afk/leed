import Link from "next/link";
import { Pause, Play } from "lucide-react";
import { BoutonLien, Carte, Chiffres, Jauge, Ligne, Sourdine, Titrine, classeBouton, nombre } from "@/components/app/kit";
import { BoutonsDecision } from "./decisions";
import { basculerAgent } from "@/lib/app/actions";
import { NOM_CANAL, type AccueilVue } from "@/lib/app/vues";

export function EcranAccueil({ v }: { v: AccueilVue }) {
  const f = v.forfait;
  const partUtilisee = f && f.achetees > 0 ? ((f.achetees - f.restantes) / f.achetees) * 100 : 0;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="!m-0 !font-display !text-[1.5rem] !font-semibold !leading-tight tracking-[-0.02em]">{v.prenom ? `Bonjour ${v.prenom}` : "Bonjour"}</h1>
          <Sourdine className="mt-1 flex items-center gap-2">
            <span aria-hidden="true" className={`inline-block h-2 w-2 rounded-full ${v.agentActif ? "bg-brand-600" : "bg-muted-foreground"}`} />
            {v.agentActif ? "L'agent travaille" : "L'agent est en pause"}
          </Sourdine>
        </div>
        <form action={basculerAgent}>
          <input type="hidden" name="pause" value={v.agentActif ? "true" : "false"} />
          <button type="submit" className={classeBouton("cadre", true)}>
            {v.agentActif ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
            {v.agentActif ? "Pause" : "Reprendre"}
          </button>
        </form>
      </div>

      <Carte ton={v.decisionsNb > 0 ? "vif" : "normal"}>
        <Ligne>
          <span className="text-sm font-medium text-foreground">{v.decisionsNb === 0 ? "Aucune décision en attente" : v.decisionsNb === 1 ? "1 décision vous attend" : `${v.decisionsNb} décisions vous attendent`}</span>
          <Link href="/app/decisions" className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
            Tout voir
          </Link>
        </Ligne>
        {v.decisions.map((d) => (
          <div key={d.id} className="flex flex-col gap-2 border-t border-border pt-3 first:border-0 first:pt-0">
            <div>
              <div className="text-sm font-medium text-foreground">{d.extrait ? `« ${d.extrait} »` : d.question}</div>
              {d.prospect && <Sourdine>{[d.prospect, d.canal ? NOM_CANAL[d.canal] : null].filter(Boolean).join(" · ")}</Sourdine>}
            </div>
            <BoutonsDecision d={d} />
          </div>
        ))}
        {v.decisionsNb === 0 && <Sourdine>L&apos;agent vous prévient ici dès qu&apos;il a besoin de vous.</Sourdine>}
      </Carte>

      <Titrine>Cette semaine</Titrine>
      <Chiffres
        items={[
          [nombre(v.semaine.contactes), "contactés"],
          [nombre(v.semaine.reponses), "réponses"],
          [nombre(v.semaine.interesses), "intéressés"],
          [nombre(v.semaine.rdv), "rendez-vous"],
        ]}
      />

      {f ? (
        <Carte ton="calme">
          <Ligne>
            <span>Forfait</span>
            <b className="tabular-nums">
              {nombre(f.achetees - f.restantes)} / {nombre(f.achetees)}
            </b>
          </Ligne>
          <Jauge valeur={partUtilisee} ton="or" label="Entreprises contactées sur le forfait" />
          <Ligne className="text-muted-foreground">
            <span>{f.joursRestants === null ? "" : f.joursRestants === 0 ? "Dernier jour" : `Reste ${f.joursRestants} jours`}</span>
            <span>{nombre(f.restantes)} entreprises</span>
          </Ligne>
        </Carte>
      ) : (
        <Carte ton="calme">
          <div className="text-sm font-medium text-foreground">Vous n&apos;avez pas encore de forfait</div>
          <Sourdine>Choisissez l&apos;essai gratuit ou un forfait pour que l&apos;agent commence à écrire.</Sourdine>
          <div>
            <BoutonLien href="/choisir" ton="action" petit>
              Choisir mon offre
            </BoutonLien>
          </div>
        </Carte>
      )}

      <Carte>
        <Titrine>Par canal</Titrine>
        {v.canaux.length === 0 ? (
          <Sourdine>Aucun message envoyé cette semaine.</Sourdine>
        ) : (
          v.canaux.map((c) => {
            const max = Math.max(...v.canaux.map((x) => x.envoyes), 1);
            return (
              <div key={c.canal} className="flex flex-col gap-1.5">
                <Ligne>
                  <span>{NOM_CANAL[c.canal]}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {nombre(c.envoyes)} envoyés · {nombre(c.reponses)} réponses
                  </span>
                </Ligne>
                <Jauge valeur={(c.envoyes / max) * 100} label={`Envois ${NOM_CANAL[c.canal]}`} />
              </div>
            );
          })
        )}
      </Carte>

      <Carte>
        <Titrine>Aujourd&apos;hui</Titrine>
        {v.aujourdhui.length === 0 ? (
          <Sourdine>Rien de nouveau pour l&apos;instant.</Sourdine>
        ) : (
          <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
            {v.aujourdhui.map((a) => (
              <li key={`${a.heure}-${a.texte}`}>
                <b className="tabular-nums text-foreground">{a.heure}</b> {a.texte}
              </li>
            ))}
          </ul>
        )}
      </Carte>
    </div>
  );
}
