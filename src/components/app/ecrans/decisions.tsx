import Link from "next/link";
import { CalendarCheck, CircleHelp, Flame, Link2, Mic, Wallet, type LucideIcon } from "lucide-react";
import { Carte, EtatVide, Etiquette, Ligne, Sourdine, TitrePage, classeBouton, ilYA } from "@/components/app/kit";
import { repondreDecision } from "@/lib/app/actions";
import { NOM_CANAL, NOM_DECISION, type DecisionVue, type TypeDecision } from "@/lib/app/vues";

const ICONES: Record<TypeDecision, LucideIcon> = {
  lead_chaud: Flame,
  question_prospect: CircleHelp,
  confirmer_rdv: CalendarCheck,
  valider_information: CircleHelp,
  note_vocale: Mic,
  forfait_bientot_fini: Wallet,
  compte_a_rebrancher: Link2,
};

function reste(echeance: string | null, maintenant = Date.now()) {
  if (!echeance) return null;
  const min = Math.round((new Date(echeance).getTime() - maintenant) / 60000);
  if (min <= 0) return "délai dépassé";
  return min >= 60 ? `reste ${Math.floor(min / 60)} h ${String(min % 60).padStart(2, "0")}` : `reste ${min} min`;
}

/** Une décision se répond par un bouton : chaque bouton est un petit formulaire sécurisé. */
export function BoutonsDecision({ d, petit = true }: { d: DecisionVue; petit?: boolean }) {
  if (d.options.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {d.options.map((o, i) => (
        <form key={o.cle} action={repondreDecision}>
          <input type="hidden" name="id" value={d.id} />
          <input type="hidden" name="cle" value={o.cle} />
          <button type="submit" className={classeBouton(i === 0 ? "sombre" : "cadre", petit)}>
            {o.libelle}
          </button>
        </form>
      ))}
    </div>
  );
}

export function CarteDecision({ d }: { d: DecisionVue }) {
  const Icone = ICONES[d.type];
  const rep = d.statut !== "ouverte";
  const delai = reste(d.echeance);
  return (
    <Carte ton={d.type === "lead_chaud" && !rep ? "vif" : "normal"}>
      <Ligne>
        <Etiquette ton={d.type === "lead_chaud" ? "feu" : "neutre"}>
          <Icone className="h-3.5 w-3.5" aria-hidden="true" />
          {NOM_DECISION[d.type]}
        </Etiquette>
        <span className="text-xs text-muted-foreground">{delai ?? ilYA(d.creeLe)}</span>
      </Ligne>
      {d.prospect && (
        <div>
          <div className="text-sm font-medium text-foreground">{d.prospect}</div>
          <Sourdine>
            {[d.ville, d.canal ? NOM_CANAL[d.canal] : null].filter(Boolean).join(" · ")}
          </Sourdine>
        </div>
      )}
      <p className="!my-0 text-sm !text-foreground">{d.extrait ? `« ${d.extrait} »` : d.question}</p>
      {d.proposition && (
        <div className="rounded-xl bg-chip p-3 text-sm text-foreground">
          <span className="font-medium">L&apos;agent propose :</span> {d.proposition}
        </div>
      )}
      {rep ? (
        <Etiquette ton="ok">{d.statut === "repondue" ? "Répondue" : d.statut === "expiree" ? "Expirée" : "Annulée"}</Etiquette>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <BoutonsDecision d={d} />
          {d.conversationId && (
            <Link href={`/app/conversations/${d.conversationId}`} className={classeBouton("cadre", true)}>
              Voir le fil
            </Link>
          )}
        </div>
      )}
    </Carte>
  );
}

export function EcranDecisions({ decisions, repondues, ok }: { decisions: DecisionVue[]; repondues: boolean; ok?: boolean }) {
  return (
    <div>
      <TitrePage titre="Décisions" droite={!repondues && decisions.length > 0 ? <Etiquette ton="feu">{decisions.length} en attente</Etiquette> : undefined} />
      <div role="tablist" aria-label="Filtrer les décisions" className="mb-4 flex gap-2">
        <Link role="tab" aria-selected={!repondues} href="/app/decisions" className={`rounded-full px-3.5 py-1.5 text-sm ${!repondues ? "bg-primary text-primary-foreground" : "bg-chip text-foreground"}`}>
          En attente
        </Link>
        <Link role="tab" aria-selected={repondues} href="/app/decisions?tab=repondues" className={`rounded-full px-3.5 py-1.5 text-sm ${repondues ? "bg-primary text-primary-foreground" : "bg-chip text-foreground"}`}>
          Déjà répondues
        </Link>
      </div>
      {ok && (
        <p role="status" className="mb-3 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-600">
          Votre réponse est enregistrée.
        </p>
      )}
      <div className="flex flex-col gap-3">
        {decisions.length === 0 ? (
          <EtatVide titre={repondues ? "Aucune décision passée" : "Rien n'attend votre réponse"} texte={repondues ? "Les décisions auxquelles vous répondez apparaissent ici." : "Quand l'agent a besoin de vous (un prospect chaud, une question, un rendez-vous), la demande arrive ici."} />
        ) : (
          decisions.map((d) => <CarteDecision key={d.id} d={d} />)
        )}
      </div>
      {!repondues && decisions.length > 0 && <p className="mt-4 text-center text-sm">Sans réponse après 4 h, l&apos;agent envoie un mot d&apos;attente au prospect.</p>}
    </div>
  );
}
