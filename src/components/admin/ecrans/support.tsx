import Link from "next/link";
import { Carte, EtatVide, Etiquette, Ligne, Sourdine, TitrePage, classeBouton, ilYA } from "@/components/app/kit";
import { repondreTicket, resoudreTicket } from "@/lib/admin/actions";
import type { AdminTicketLigne, AdminTicketVue } from "@/lib/admin/vues";

const STATUT = { ouvert: "Ouvert", en_cours: "En cours", attente_client: "En attente du client", resolu: "Résolu" } as const;
const PRIORITE = { 1: "Urgent", 2: "Normal", 3: "Bas" } as const;

export function AdminSupport({ tickets, resolus }: { tickets: AdminTicketLigne[]; resolus: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      <TitrePage titre="Support" droite={<span className="text-sm text-muted-foreground">{tickets.length} ticket{tickets.length > 1 ? "s" : ""}</span>} />
      <div role="tablist" aria-label="Filtrer les tickets" className="flex gap-2">
        <Link role="tab" aria-selected={!resolus} href="/admin/support" className={`rounded-full px-3.5 py-1.5 text-sm ${!resolus ? "bg-primary text-primary-foreground" : "bg-chip text-foreground"}`}>Ouverts</Link>
        <Link role="tab" aria-selected={resolus} href="/admin/support?tab=resolus" className={`rounded-full px-3.5 py-1.5 text-sm ${resolus ? "bg-primary text-primary-foreground" : "bg-chip text-foreground"}`}>Résolus</Link>
      </div>
      {tickets.length === 0 ? (
        <EtatVide titre={resolus ? "Aucun ticket résolu" : "Aucun ticket ouvert"} texte="Ce que l'agent de support n'a pas su traiter arrive ici, avec le client concerné." />
      ) : (
        tickets.map((t) => (
          <Link key={t.id} href={`/admin/support/${t.id}`} className="block">
            <Carte ton={t.priorite === 1 && t.statut !== "resolu" ? "vif" : "normal"}>
              <Ligne>
                <b className="truncate text-foreground">{t.entreprise ?? "Client inconnu"}</b>
                <Etiquette ton={t.priorite === 1 ? "feu" : "neutre"}>{PRIORITE[t.priorite as 1 | 2 | 3] ?? "Normal"}</Etiquette>
              </Ligne>
              <p className="!my-0 text-sm !text-foreground">{t.sujet}</p>
              <Sourdine>{STATUT[t.statut]} · {ilYA(t.cree_le)}</Sourdine>
            </Carte>
          </Link>
        ))
      )}
    </div>
  );
}

export function AdminTicket({ v, ok, erreur }: { v: AdminTicketVue; ok?: boolean; erreur?: string }) {
  return (
    <div className="flex flex-col gap-4">
      <TitrePage titre={v.entreprise ?? "Ticket"} retour="/admin/support" droite={<Etiquette ton={v.statut === "resolu" ? "ok" : "neutre"}>{STATUT[v.statut]}</Etiquette>} />
      <p className="!my-0 text-base !text-foreground">{v.sujet}</p>
      {ok && <p role="status" className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-600">Enregistré dans le journal d&apos;audit.</p>}
      {erreur && <p role="alert" className="rounded-lg bg-[#fdeee4] px-3 py-2 text-sm text-[#b4410e]">{erreur}</p>}
      <div className="flex flex-col gap-2" aria-label="Échanges">
        {v.messages.length === 0 && <Sourdine>Aucun message dans ce ticket.</Sourdine>}
        {v.messages.map((m) => (
          <div key={m.id} className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm ${m.auteur === "admin" ? "self-end rounded-br-sm bg-primary text-primary-foreground" : "self-start rounded-bl-sm bg-chip text-foreground"}`}>
            {m.corps}
            <div className={`mt-1 text-[11px] ${m.auteur === "admin" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{m.auteur === "admin" ? "Équipe" : "Client"} · {ilYA(m.cree_le)}</div>
          </div>
        ))}
      </div>
      {v.statut !== "resolu" && (
        <>
          <form action={repondreTicket} className="flex flex-col gap-2">
            <input type="hidden" name="id" value={v.id} />
            <label htmlFor="corps" className="text-sm font-medium text-foreground">Votre réponse</label>
            <textarea id="corps" name="corps" rows={4} required minLength={2} maxLength={4000} className="w-full resize-none rounded-lg border border-border bg-card p-3 text-sm outline-none focus:border-primary" />
            <div><button type="submit" className={classeBouton("sombre", true)}>Répondre</button></div>
          </form>
          <form action={resoudreTicket}>
            <input type="hidden" name="id" value={v.id} />
            <button type="submit" className={classeBouton("cadre", true)}>Marquer comme résolu</button>
          </form>
        </>
      )}
    </div>
  );
}
