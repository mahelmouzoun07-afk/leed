import Link from "next/link";
import { Lock } from "lucide-react";
import { Carte, EtatVide, Etiquette, Ligne, Sourdine, Titrine, TitrePage, classeBouton, ilYA, nombre } from "@/components/app/kit";
import { marquerSigne, neplusContacter, noterProspect } from "@/lib/app/actions";
import { NOM_CANAL, NOM_STATUT, type CanalNom, type ProspectVue, type ProspectsVue, type StatutProspect } from "@/lib/app/vues";

const TON_STATUT: Record<StatutProspect, "neutre" | "marque" | "ok" | "feu"> = {
  nouveau: "neutre",
  analyse: "neutre",
  en_sequence: "neutre",
  en_conversation: "neutre",
  interesse: "feu",
  rdv_pris: "ok",
  refuse: "neutre",
  stop: "neutre",
  epuise: "neutre",
};
const STATUTS: StatutProspect[] = ["nouveau", "en_sequence", "en_conversation", "interesse", "rdv_pris", "refuse", "stop", "epuise"];
const champ = "h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none focus:border-primary";

export function EcranProspects({ v }: { v: ProspectsVue }) {
  const filtre = v.filtres.q || v.filtres.statut || v.filtres.canal || v.filtres.ville;
  return (
    <div>
      <TitrePage titre="Prospects" />
      <Ligne className="mb-3">
        <span>
          <b className="tabular-nums">{nombre(v.total)}</b> trouvés · <b className="tabular-nums">{nombre(v.contactes)}</b> contactés
        </span>
      </Ligne>
      <form method="get" className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-5">
        <input type="search" name="q" defaultValue={v.filtres.q} placeholder="Chercher une entreprise" aria-label="Chercher une entreprise" className={`${champ} col-span-2 md:col-span-2`} />
        <select name="statut" defaultValue={v.filtres.statut} aria-label="Statut" className={champ}>
          <option value="">Tous les statuts</option>
          {STATUTS.map((s) => (
            <option key={s} value={s}>
              {NOM_STATUT[s]}
            </option>
          ))}
        </select>
        <select name="canal" defaultValue={v.filtres.canal} aria-label="Canal" className={champ}>
          <option value="">Tous les canaux</option>
          {(Object.keys(NOM_CANAL) as CanalNom[]).map((c) => (
            <option key={c} value={c}>
              {NOM_CANAL[c]}
            </option>
          ))}
        </select>
        <select name="ville" defaultValue={v.filtres.ville} aria-label="Ville" className={champ}>
          <option value="">Toutes les villes</option>
          {v.villes.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <button type="submit" className={`${classeBouton("sombre", true)} col-span-2 md:col-span-5 md:justify-self-start`}>
          Filtrer
        </button>
      </form>
      {v.lignes.length === 0 ? (
        <EtatVide
          titre={filtre ? "Aucun prospect ne correspond" : "Aucun prospect pour l'instant"}
          texte={filtre ? "Essayez d'enlever un filtre." : "Les entreprises que l'agent sélectionne pour vous apparaissent ici. Leur nom et leurs coordonnées se dévoilent dès qu'il leur a écrit."}
        />
      ) : (
        <ul className="glass-window-inner divide-y divide-border">
          {v.lignes.map((p) => (
            <li key={p.id}>
              <Link href={`/app/prospects/${p.id}`} className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-chip">
                <div className="min-w-0">
                  {p.masque ? (
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                      <span>{p.secteur ?? "Entreprise"}</span>
                      <span aria-hidden="true" className="h-3 w-24 rounded bg-chip blur-[3px]" />
                    </div>
                  ) : (
                    <div className="truncate text-sm font-medium text-foreground">{p.nom}</div>
                  )}
                  <Sourdine>{[p.ville, p.canal ? NOM_CANAL[p.canal] : null].filter(Boolean).join(" · ")}</Sourdine>
                </div>
                <Etiquette ton={TON_STATUT[p.statut]}>{p.masque ? "À contacter" : NOM_STATUT[p.statut]}</Etiquette>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-sm">Le nom et les coordonnées d&apos;une entreprise restent cachés tant que l&apos;agent ne lui a pas écrit.</p>
    </div>
  );
}

export function EcranProspect({ v, ok }: { v: ProspectVue; ok?: boolean }) {
  if (v.masque) {
    return (
      <div className="flex flex-col gap-4">
        <TitrePage titre={v.secteur ?? "Entreprise"} retour="/app/prospects" droite={v.score != null ? <Etiquette ton="marque">{v.score}</Etiquette> : undefined} />
        <Sourdine>{v.ville}</Sourdine>
        <Carte ton="calme">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Lock className="h-4 w-4" aria-hidden="true" /> Cette entreprise n&apos;a pas encore été contactée
          </div>
          <Sourdine>Son nom, ses coordonnées et la raison de lui écrire apparaissent dès que l&apos;agent lui a envoyé le premier message. Un forfait plus important permet de contacter plus d&apos;entreprises par jour.</Sourdine>
        </Carte>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <TitrePage titre={v.nom} retour="/app/prospects" droite={v.score != null ? <Etiquette ton="marque">{v.score}</Etiquette> : undefined} />
      <Sourdine>{[v.secteur, v.ville].filter(Boolean).join(" · ")}</Sourdine>
      {v.contact && (
        <div className="text-sm">
          <b className="text-foreground">{v.contact.nom ?? "Contact"}</b>
          {v.contact.role && <span className="text-muted-foreground"> · {v.contact.role}</span>}
        </div>
      )}
      {ok && (
        <p role="status" className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-600">
          C&apos;est enregistré.
        </p>
      )}
      {v.signal && (
        <Carte ton="calme">
          <Titrine>Pourquoi lui écrire</Titrine>
          <p className="!my-0 text-sm !text-foreground">{v.signal}</p>
        </Carte>
      )}
      <Carte>
        <Titrine>Comment la joindre</Titrine>
        {v.identifiants.length === 0 ? (
          <Sourdine>Aucune coordonnée trouvée pour l&apos;instant.</Sourdine>
        ) : (
          v.identifiants.map((i) => (
            <Ligne key={`${i.canal}-${i.identifiant}`}>
              <span>
                {NOM_CANAL[i.canal]} <span className="text-muted-foreground">{i.identifiant}</span>
              </span>
              {i.utilise && <Etiquette ton="ok">Utilisé</Etiquette>}
            </Ligne>
          ))
        )}
      </Carte>
      <Carte>
        <Titrine>Historique</Titrine>
        {v.historique.length === 0 ? (
          <Sourdine>Aucun échange pour l&apos;instant.</Sourdine>
        ) : (
          <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
            {v.historique.map((h, i) => (
              <li key={i}>
                <span className="tabular-nums">{ilYA(h.quand)}</span> {h.sens === "sortant" ? "envoyé" : "reçu"} ({NOM_CANAL[h.canal]}) : {h.texte}
              </li>
            ))}
          </ul>
        )}
      </Carte>
      <div className="flex flex-wrap gap-2">
        {v.conversationId && (
          <Link href={`/app/conversations/${v.conversationId}`} className={classeBouton("sombre", true)}>
            Voir la conversation
          </Link>
        )}
        <form action={marquerSigne}>
          <input type="hidden" name="id" value={v.id} />
          <button type="submit" disabled={!v.aRdv} title={v.aRdv ? undefined : "Disponible dès qu'un rendez-vous existe"} className={classeBouton("cadre", true)}>
            Marquer signé
          </button>
        </form>
        <form action={neplusContacter}>
          <input type="hidden" name="id" value={v.id} />
          <button type="submit" disabled={v.statut === "epuise"} className={classeBouton("cadre", true)}>
            Ne plus contacter
          </button>
        </form>
      </div>
      <form action={noterProspect} className="flex flex-col gap-2">
        <label htmlFor="note" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Ma note
        </label>
        <textarea id="note" name="note" rows={3} maxLength={2000} defaultValue={v.note} placeholder="Rappeler après les fêtes…" className="w-full resize-none rounded-lg border border-border bg-card p-3 text-sm outline-none focus:border-primary" />
        <input type="hidden" name="id" value={v.id} />
        <div>
          <button type="submit" className={classeBouton("cadre", true)}>
            Enregistrer la note
          </button>
        </div>
      </form>
    </div>
  );
}
