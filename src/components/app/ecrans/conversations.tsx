import Link from "next/link";
import { Carte, EtatVide, Etiquette, Ligne, Sourdine, Titrine, TitrePage, classeBouton, ilYA } from "@/components/app/kit";
import { prendreLaMain } from "@/lib/app/actions";
import { NOM_CANAL, type ConversationLigne, type ConversationVue } from "@/lib/app/vues";

export function EcranConversations({ lignes }: { lignes: ConversationLigne[] }) {
  return (
    <div>
      <TitrePage titre="Conversations" />
      {lignes.length === 0 ? (
        <EtatVide titre="Aucune conversation" texte="Tous vos canaux (WhatsApp, email, Instagram…) se retrouvent ici dans une seule boîte, dès que l'agent a écrit à une entreprise." />
      ) : (
        <ul className="glass-window-inner divide-y divide-border">
          {lignes.map((c) => (
            <li key={c.id}>
              <Link href={`/app/conversations/${c.id}`} className="flex items-start justify-between gap-3 px-4 py-3 transition-colors hover:bg-chip">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-foreground">{c.prospect}</span>
                    <Etiquette>{NOM_CANAL[c.canal]}</Etiquette>
                  </div>
                  <div className="line-clamp-2 text-sm text-muted-foreground">{c.dernierMessage || "Aucun message"}</div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-xs text-muted-foreground">{ilYA(c.quand)}</span>
                  {c.reprise ? <Etiquette ton="marque">Vous</Etiquette> : c.enAttente ? <Etiquette ton="feu">À traiter</Etiquette> : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function EcranConversation({ v, ok }: { v: ConversationVue; ok?: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      <TitrePage titre={v.prospect} retour="/app/conversations" droite={<Etiquette ton="ok">{NOM_CANAL[v.canal]}</Etiquette>} />
      <Ligne>
        <span className="text-muted-foreground">{v.repriseParClient ? "Vous avez la main" : "Géré par l'agent"}</span>
        <form action={prendreLaMain}>
          <input type="hidden" name="id" value={v.id} />
          <input type="hidden" name="reprise" value={v.repriseParClient ? "false" : "true"} />
          <button type="submit" className={classeBouton("cadre", true)}>
            {v.repriseParClient ? "Rendre la main à l'agent" : "Reprendre la main"}
          </button>
        </form>
      </Ligne>
      {ok && (
        <p role="status" className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-600">
          C&apos;est enregistré.
        </p>
      )}
      <div className="flex flex-col gap-2" aria-label="Messages">
        {v.messages.length === 0 && <Sourdine>Aucun message pour l&apos;instant.</Sourdine>}
        {v.messages.map((m) => (
          <div key={m.id} className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${m.sens === "sortant" ? "self-end rounded-br-sm bg-primary text-primary-foreground" : "self-start rounded-bl-sm bg-chip text-foreground"}`}>
            {m.corps}
            <div className={`mt-1 text-[11px] ${m.sens === "sortant" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{ilYA(m.quand)}</div>
          </div>
        ))}
      </div>
      {v.preparation && !v.repriseParClient && (
        <Carte>
          <Ligne>
            <Titrine>L&apos;agent prépare</Titrine>
            <span className="text-xs text-muted-foreground">dans {v.preparation.dans}</span>
          </Ligne>
          <p className="!my-0 text-sm !text-foreground">« {v.preparation.corps} »</p>
          <Sourdine>Vous pourrez l&apos;envoyer, le modifier ou l&apos;annuler ici dès que l&apos;envoi automatique est ouvert.</Sourdine>
          <div className="flex flex-wrap gap-2">
            {["Envoyer", "Modifier", "Annuler"].map((b) => (
              <button key={b} type="button" disabled title="Bientôt disponible" className={classeBouton("cadre", true)}>
                {b}
              </button>
            ))}
          </div>
        </Carte>
      )}
    </div>
  );
}
