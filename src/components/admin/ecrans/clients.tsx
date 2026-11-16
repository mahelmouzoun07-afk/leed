import Link from "next/link";
import { AlertTriangle, CreditCard, Database, LifeBuoy, ShieldAlert } from "lucide-react";
import { Carte, Chiffres, EtatVide, Etiquette, Jauge, Ligne, Sourdine, Tableau, Titrine, TitrePage, classeBouton, dateCourte, fcfa, joursAvant, nombre } from "@/components/app/kit";
import { offrirEntreprises, suspendreEnvoi } from "@/lib/admin/actions";
import type { AdminAccueilVue, AdminClientLigne, AdminClientVue, EtatClient } from "@/lib/admin/vues";

const NOM_CANAL: Record<string, string> = { whatsapp: "WhatsApp", instagram: "Instagram", facebook: "Facebook", linkedin: "LinkedIn", email: "Email" };
const ETATS: Record<EtatClient, { libelle: string; ton: "neutre" | "ok" | "feu" }> = {
  actif: { libelle: "Actif", ton: "ok" },
  bientot_fini: { libelle: "Bientôt fini", ton: "feu" },
  essai: { libelle: "En essai", ton: "neutre" },
  expire: { libelle: "Expiré", ton: "neutre" },
  aucun: { libelle: "Sans forfait", ton: "neutre" },
};
const COUTS: [string, string][] = [
  ["unipile", "Unipile"],
  ["ia", "IA"],
  ["paiement", "Frais Mobile Money"],
];

export function AdminAccueil({ v }: { v: AdminAccueilVue }) {
  const totalCouts = Object.values(v.couts_mois).reduce((s, n) => s + n, 0);
  const reste = v.encaisse_mois - totalCouts;
  const urgences: { Icone: typeof AlertTriangle; texte: string; ton: "feu" | "neutre"; etiquette: string; href: string }[] = [];
  if (v.comptes_a_rebrancher > 0) urgences.push({ Icone: AlertTriangle, texte: `${v.comptes_a_rebrancher} compte${v.comptes_a_rebrancher > 1 ? "s" : ""} à rebrancher`, ton: "feu", etiquette: "Urgent", href: "/admin/comptes" });
  if (v.messages_a_relire > 0) urgences.push({ Icone: ShieldAlert, texte: `${v.messages_a_relire} message${v.messages_a_relire > 1 ? "s" : ""} bloqué${v.messages_a_relire > 1 ? "s" : ""} cette semaine`, ton: "neutre", etiquette: "Aujourd'hui", href: "/admin/messages" });
  if (v.paiements_en_attente > 0) urgences.push({ Icone: CreditCard, texte: `${v.paiements_en_attente} paiement${v.paiements_en_attente > 1 ? "s" : ""} en attente depuis plus d'une heure`, ton: "neutre", etiquette: "Aujourd'hui", href: "/admin/paiements" });
  if (v.tickets_ouverts > 0) urgences.push({ Icone: LifeBuoy, texte: `${v.tickets_ouverts} ticket${v.tickets_ouverts > 1 ? "s" : ""} de support ouvert${v.tickets_ouverts > 1 ? "s" : ""}`, ton: "neutre", etiquette: "Aujourd'hui", href: "/admin/support" });
  if (v.sources_annuaire === 0) urgences.push({ Icone: Database, texte: "L'annuaire n'a encore aucune source chargée", ton: "neutre", etiquette: "À planifier", href: "/admin/annuaire" });
  return (
    <div className="flex flex-col gap-4">
      <TitrePage titre="Accueil" />
      <Chiffres items={[[nombre(v.clients_actifs), "clients actifs"], [nombre(v.comptes_branches), "comptes branchés"], [nombre(v.comptes_a_rebrancher), "à rebrancher"], [nombre(v.tickets_ouverts), "tickets"]]} />
      <Carte ton={urgences.some((u) => u.ton === "feu") ? "vif" : "normal"}>
        <Titrine>À traiter aujourd&apos;hui</Titrine>
        {urgences.length === 0 ? (
          <Sourdine>Rien à signaler. Les alertes apparaissent ici dès qu&apos;un compte se déconnecte, qu&apos;un paiement bloque ou qu&apos;un message est refusé.</Sourdine>
        ) : (
          urgences.map((u) => (
            <Link key={u.href} href={u.href} className="flex items-center justify-between gap-3 text-sm text-foreground hover:underline">
              <span className="flex items-center gap-2">
                <u.Icone className="h-4 w-4 shrink-0" aria-hidden="true" />
                {u.texte}
              </span>
              <Etiquette ton={u.ton}>{u.etiquette}</Etiquette>
            </Link>
          ))
        )}
      </Carte>
      <Carte>
        <Titrine>Ce mois</Titrine>
        <Ligne><span>Encaissé</span><b className="tabular-nums">{fcfa(v.encaisse_mois)}</b></Ligne>
        {COUTS.map(([cle, libelle]) => (
          <Ligne key={cle}><span>{libelle}</span><b className="tabular-nums">-{fcfa(v.couts_mois[cle] ?? 0)}</b></Ligne>
        ))}
        <Ligne className="border-t border-border pt-2"><b>Reste</b><b className={`tabular-nums ${reste < 0 ? "text-[#b4410e]" : "text-brand-600"}`}>{fcfa(reste)}</b></Ligne>
        {totalCouts === 0 && <Sourdine>Les coûts du mois s&apos;affichent dès qu&apos;ils sont enregistrés (Unipile, IA, frais de paiement).</Sourdine>}
      </Carte>
      <Carte>
        <Titrine>Santé de l&apos;envoi</Titrine>
        {v.sante.length === 0 ? (
          <Sourdine>Aucun compte connecté pour l&apos;instant.</Sourdine>
        ) : (
          v.sante.map((s) => (
            <div key={s.canal} className="flex flex-col gap-1.5">
              <Ligne>
                <span>{NOM_CANAL[s.canal]}</span>
                <span className="tabular-nums text-muted-foreground">
                  {s.comptes} compte{s.comptes > 1 ? "s" : ""} · {s.alertes} alerte{s.alertes > 1 ? "s" : ""}
                </span>
              </Ligne>
              <Jauge valeur={s.comptes > 0 ? ((s.comptes - s.alertes) / s.comptes) * 100 : 0} ton="vert" label={`Comptes en bonne santé ${NOM_CANAL[s.canal]}`} />
            </div>
          ))
        )}
      </Carte>
    </div>
  );
}

const FILTRES = [
  ["", "Tous"],
  ["actif", "Actifs"],
  ["essai", "En essai"],
  ["expire", "Expirés"],
  ["bientot_fini", "À risque"],
] as const;

export function AdminClients({ clients, q, etat }: { clients: AdminClientLigne[]; q: string; etat: string }) {
  const liste = clients.filter((c) => (!q || c.nom.toLowerCase().includes(q.toLowerCase())) && (!etat || c.etat === etat));
  return (
    <div className="flex flex-col gap-4">
      <TitrePage titre="Clients" droite={<span className="text-sm text-muted-foreground">{clients.length} client{clients.length > 1 ? "s" : ""}</span>} />
      <form method="get" className="flex flex-wrap gap-2">
        <input type="search" name="q" defaultValue={q} placeholder="Chercher un client" aria-label="Chercher un client" className="h-10 flex-1 rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-primary" />
        <select name="etat" defaultValue={etat} aria-label="État" className="h-10 rounded-lg border border-border bg-card px-2 text-sm">
          {FILTRES.map(([k, l]) => (
            <option key={k} value={k}>{l}</option>
          ))}
        </select>
        <button type="submit" className={classeBouton("sombre", true)}>Filtrer</button>
      </form>
      {liste.length === 0 ? (
        <EtatVide titre="Aucun client" texte={clients.length === 0 ? "Les clients apparaissent ici dès leur inscription." : "Aucun client ne correspond à ces filtres."} />
      ) : (
        <Tableau
          legende="Liste des clients"
          colonnes={["Client", "Forfait", "Reste", "État"]}
          lignes={liste.map((c) => [
            <Link key="n" href={`/admin/clients/${c.id}`} className="block hover:underline">
              <b>{c.nom}</b>
              <div className="text-muted-foreground">{[c.ville, c.pays].filter(Boolean).join(", ")}</div>
            </Link>,
            <span key="f" className="tabular-nums">{c.forfait_type === "essai" ? "Essai" : c.forfait_montant ? nombre(c.forfait_montant) : "-"}</span>,
            <span key="r" className="tabular-nums">{c.achetees ? `${nombre(c.restantes ?? 0)} / ${nombre(c.achetees)}` : "-"}</span>,
            <span key="e" className="inline-flex gap-1">
              <Etiquette ton={ETATS[c.etat].ton}>{ETATS[c.etat].libelle}</Etiquette>
              {c.envoi_suspendu && <Etiquette ton="feu">Envoi suspendu</Etiquette>}
            </span>,
          ])}
        />
      )}
    </div>
  );
}

export function AdminClient({ v, role, ok, erreur }: { v: AdminClientVue; role: "admin" | "support"; ok?: boolean; erreur?: string }) {
  const couts = Object.values(v.couts_mois).reduce((s, n) => s + n, 0);
  const marge = v.encaisse_mois - couts;
  const champ = "w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary";
  return (
    <div className="flex flex-col gap-4">
      <TitrePage titre={v.nom} retour="/admin/clients" droite={v.envoi_suspendu ? <Etiquette ton="feu">Envoi suspendu</Etiquette> : <Etiquette ton="ok">Envoi actif</Etiquette>} />
      {ok && <p role="status" className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-600">Action enregistrée dans le journal d&apos;audit.</p>}
      {erreur && <p role="alert" className="rounded-lg bg-[#fdeee4] px-3 py-2 text-sm text-[#b4410e]">{erreur}</p>}
      <Sourdine>
        {v.proprietaire ? [[v.proprietaire.prenom, v.proprietaire.nom].filter(Boolean).join(" "), v.proprietaire.email, v.proprietaire.telephone].filter(Boolean).join(" · ") : "Aucun propriétaire"}
        <br />
        Client depuis le {dateCourte(v.cree_le)} · {[v.ville, v.pays].filter(Boolean).join(", ")}
      </Sourdine>
      {v.forfait ? (
        <Chiffres
          colonnes={2}
          items={[
            [v.forfait.type === "essai" ? "Essai" : nombre(v.forfait.montant), "forfait (FCFA)"],
            [nombre(v.forfait.restantes), "entreprises restantes"],
            [String(joursAvant(v.forfait.fin)), "jours restants"],
            [String(v.comptes.filter((c) => c.statut === "actif").length), "comptes branchés"],
          ]}
        />
      ) : (
        <Carte ton="calme"><Sourdine>Ce client n&apos;a pas de forfait.</Sourdine></Carte>
      )}
      <Carte>
        <Titrine>Ses comptes</Titrine>
        {v.comptes.length === 0 ? <Sourdine>Aucun compte branché.</Sourdine> : v.comptes.map((c) => (
          <Ligne key={`${c.canal}-${c.identifiant}`}>
            <span>{NOM_CANAL[c.canal]} <span className="text-muted-foreground">{c.identifiant}</span></span>
            <Etiquette ton={c.statut === "actif" && c.note_sante >= 70 ? "ok" : "feu"}>{c.statut === "actif" ? (c.note_sante >= 70 ? "Bonne santé" : "À surveiller") : "À rebrancher"}</Etiquette>
          </Ligne>
        ))}
      </Carte>
      <Carte ton="calme">
        <Titrine>Ce qu&apos;il nous coûte ce mois</Titrine>
        {COUTS.map(([cle, libelle]) => (
          <Ligne key={cle}><span>{libelle}</span><b className="tabular-nums">{fcfa(v.couts_mois[cle] ?? 0)}</b></Ligne>
        ))}
        <Ligne className="border-t border-border pt-2"><b>Marge</b><b className={`tabular-nums ${marge < 0 ? "text-[#b4410e]" : "text-brand-600"}`}>{fcfa(marge)}</b></Ligne>
        <Sourdine>Encaissé ce mois : {fcfa(v.encaisse_mois)}. {v.campagnes} campagne{v.campagnes > 1 ? "s" : ""}, {nombre(v.prospects)} prospects. Le contenu de ses conversations n&apos;est jamais visible ici.</Sourdine>
      </Carte>
      <Carte>
        <Titrine>Actions (inscrites dans le journal d&apos;audit)</Titrine>
        <form action={suspendreEnvoi} className="flex flex-col gap-2">
          <input type="hidden" name="id" value={v.id} />
          <input type="hidden" name="suspendre" value={v.envoi_suspendu ? "false" : "true"} />
          <label htmlFor="motif-s" className="text-sm font-medium text-foreground">{v.envoi_suspendu ? "Reprendre l'envoi" : "Suspendre l'envoi"} : motif</label>
          <input id="motif-s" name="motif" required minLength={3} maxLength={300} placeholder="Ex. compte en danger, plainte reçue" className={`${champ} h-11`} />
          <div><button type="submit" className={classeBouton("cadre", true)}>{v.envoi_suspendu ? "Reprendre l'envoi" : "Suspendre l'envoi"}</button></div>
        </form>
        {role === "admin" && v.forfait && (
          <form action={offrirEntreprises} className="flex flex-col gap-2 border-t border-border pt-3">
            <input type="hidden" name="id" value={v.id} />
            <label htmlFor="nombre-o" className="text-sm font-medium text-foreground">Offrir des entreprises</label>
            <div className="grid grid-cols-[110px_1fr] gap-2">
              <input id="nombre-o" name="nombre" type="number" required min={1} max={500} placeholder="10" aria-label="Nombre d'entreprises" className={`${champ} h-11`} />
              <input name="motif" required minLength={3} maxLength={300} placeholder="Motif (ex. geste commercial)" aria-label="Motif" className={`${champ} h-11`} />
            </div>
            <div><button type="submit" className={classeBouton("cadre", true)}>Offrir</button></div>
          </form>
        )}
      </Carte>
    </div>
  );
}
