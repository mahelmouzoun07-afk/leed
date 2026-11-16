import { Carte, EtatVide, Etiquette, Ligne, Sourdine, Tableau, Titrine, TitrePage, classeBouton, dateCourte, fcfa, heure, nombre } from "@/components/app/kit";
import { Champ, inputClass } from "@/components/form";
import { ChampCode } from "@/components/admin/ChampCode";
import { creerCodePromo, modifierCodePromo } from "@/lib/admin/actions";
import type { AdminCodePromo, AdminCodesPromoVue, EtatCodePromo } from "@/lib/admin/vues";

const ETAT: Record<EtatCodePromo, { texte: string; ton: "ok" | "neutre" | "feu" }> = {
  actif: { texte: "Actif", ton: "ok" },
  desactive: { texte: "Désactivé", ton: "neutre" },
  expire: { texte: "Expiré", ton: "feu" },
  epuise: { texte: "Épuisé", ton: "feu" },
  a_venir: { texte: "À venir", ton: "neutre" },
};
const PAYS: [string, string][] = [["BJ", "Bénin"], ["SN", "Sénégal"], ["CI", "Côte d'Ivoire"], ["TG", "Togo"]];
const dateInput = (iso: string | null) => (iso ? iso.slice(0, 10) : "");

function Regles({ c }: { c: AdminCodePromo }) {
  const lignes = [
    c.pourcentage === 100 ? `Forfait offert, jusqu'à ${fcfa(c.plafond_remise_fcfa ?? 0)} de valeur, avec toutes les fonctionnalités` : `${c.pourcentage} % de réduction${c.plafond_remise_fcfa ? `, au plus ${fcfa(c.plafond_remise_fcfa)}` : ""}`,
    c.montant_min_fcfa > 0 ? `Forfait d'au moins ${fcfa(c.montant_min_fcfa)}` : null,
    c.max_utilisations ? `${nombre(c.max_utilisations)} utilisation${c.max_utilisations > 1 ? "s" : ""} au total` : "Utilisations illimitées",
    `${c.max_par_entreprise} par entreprise`,
    c.nouveaux_clients_seulement ? "Nouveaux clients seulement" : null,
    c.pays.length > 0 ? `Pays : ${c.pays.join(", ")}` : "Tous les pays",
    `Du ${dateCourte(c.debut)}${c.fin ? ` au ${dateCourte(c.fin)}` : ", sans date de fin"}`,
  ].filter(Boolean) as string[];
  return (
    <ul className="m-0 flex list-none flex-col gap-1 p-0 text-sm text-muted-foreground">
      {lignes.map((l) => (
        <li key={l}>{l}</li>
      ))}
    </ul>
  );
}

function CarteCode({ c }: { c: AdminCodePromo }) {
  const e = ETAT[c.etat];
  return (
    <Carte>
      <Ligne>
        <div className="min-w-0">
          <b className="break-all text-lg tracking-wider text-foreground">{c.code}</b>
          {c.libelle && <Sourdine>{c.libelle}</Sourdine>}
        </div>
        <div className="flex flex-col items-end gap-1">
          <Etiquette ton={e.ton}>{e.texte}</Etiquette>
          {c.pourcentage === 100 && <Etiquette ton="marque">100 %</Etiquette>}
        </div>
      </Ligne>
      <Regles c={c} />
      <Ligne className="border-t border-border pt-2">
        <span>Utilisé{c.utilisations > 1 ? "s" : ""}</span>
        <b className="tabular-nums">
          {nombre(c.utilisations)}
          {c.max_utilisations ? ` / ${nombre(c.max_utilisations)}` : ""}
          {c.en_cours > 0 ? ` (+${c.en_cours} en cours)` : ""}
        </b>
      </Ligne>
      <Ligne>
        <span>Remises accordées</span>
        <b className="tabular-nums">{fcfa(c.remise_totale_fcfa)}</b>
      </Ligne>
      <details className="rounded-lg border border-border">
        <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-foreground">Modifier ou désactiver</summary>
        <form action={modifierCodePromo} className="flex flex-col gap-3 border-t border-border p-3">
          <input type="hidden" name="id" value={c.id} />
          <input type="hidden" name="actif" value={String(c.actif)} />
          <Champ id={`lib-${c.id}`} label="Note interne">
            <input id={`lib-${c.id}`} name="libelle" defaultValue={c.libelle ?? ""} maxLength={120} className={inputClass} />
          </Champ>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Champ id={`fin-${c.id}`} label="Date de fin" aide="Vide : sans fin.">
              <input id={`fin-${c.id}`} name="fin" type="date" defaultValue={dateInput(c.fin)} className={inputClass} />
            </Champ>
            <Champ id={`max-${c.id}`} label="Utilisations au total" aide="Vide : illimité.">
              <input id={`max-${c.id}`} name="max_utilisations" type="number" min={1} inputMode="numeric" defaultValue={c.max_utilisations ?? ""} className={inputClass} />
            </Champ>
          </div>
          <button type="submit" className={classeBouton("sombre", true)}>Enregistrer</button>
          <Sourdine>Le code, la réduction et le plafond ne changent jamais après la création : désactivez ce code et créez-en un autre.</Sourdine>
        </form>
        <form action={modifierCodePromo} className="border-t border-border p-3">
          <input type="hidden" name="id" value={c.id} />
          <input type="hidden" name="libelle" value={c.libelle ?? ""} />
          <input type="hidden" name="fin" value={dateInput(c.fin)} />
          <input type="hidden" name="max_utilisations" value={c.max_utilisations ?? ""} />
          <input type="hidden" name="actif" value={String(!c.actif)} />
          <button type="submit" className={classeBouton("cadre", true)}>{c.actif ? "Désactiver ce code" : "Réactiver ce code"}</button>
        </form>
      </details>
    </Carte>
  );
}

export function AdminCodesPromo({ v, ok, erreur, nouveau }: { v: AdminCodesPromoVue; ok?: boolean; erreur?: string; nouveau?: string }) {
  return (
    <div className="flex flex-col gap-4">
      <TitrePage titre="Codes promo" droite={<span className="text-sm text-muted-foreground">{v.codes.filter((c) => c.etat === "actif").length} actif{v.codes.filter((c) => c.etat === "actif").length > 1 ? "s" : ""}</span>} />
      {erreur && <p role="alert" className="rounded-lg bg-[#fdeee4] px-3 py-2 text-sm text-[#b4410e]">{erreur}</p>}
      {ok && !nouveau && <p role="status" className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-600">Enregistré.</p>}
      {nouveau && (
        <Carte ton="vif">
          <Titrine>Code créé</Titrine>
          <b className="select-all break-all text-2xl tracking-widest text-foreground">{nouveau}</b>
          <Sourdine>Donnez ce code à la personne : elle le saisit sur l&apos;écran de paiement, en majuscules ou en minuscules.</Sourdine>
        </Carte>
      )}

      <Carte>
        <Titrine>Créer un code</Titrine>
        <form action={creerCodePromo} className="flex flex-col gap-4">
          <ChampCode />
          <Champ id="libelle" label="Note interne" aide="Pour vous retrouver : « partenariat radio », « cadeau de lancement ». Le client ne la voit pas.">
            <input id="libelle" name="libelle" maxLength={120} className={inputClass} />
          </Champ>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Champ id="pourcentage" label="Réduction (%)" aide="De 1 à 100. À 100 %, le forfait est offert avec toutes les fonctionnalités.">
              <input id="pourcentage" name="pourcentage" type="number" min={1} max={100} inputMode="numeric" required defaultValue={20} className={inputClass} />
            </Champ>
            <Champ id="plafond" label="Plafond de remise (FCFA)" aide="Remise maximale par utilisation. Obligatoire à 100 % (au moins 5 000) : c'est la valeur du forfait offert.">
              <input id="plafond" name="plafond" type="number" min={100} step={500} inputMode="numeric" className={inputClass} />
            </Champ>
            <Champ id="montant_min" label="Forfait minimum (FCFA)" aide="Le code ne s'applique qu'à partir de ce montant de forfait.">
              <input id="montant_min" name="montant_min" type="number" min={0} step={500} inputMode="numeric" defaultValue={5000} className={inputClass} />
            </Champ>
            <Champ id="max_par_entreprise" label="Utilisations par entreprise">
              <input id="max_par_entreprise" name="max_par_entreprise" type="number" min={1} inputMode="numeric" defaultValue={1} className={inputClass} />
            </Champ>
            <Champ id="max_utilisations" label="Utilisations au total" aide="Vide : illimité.">
              <input id="max_utilisations" name="max_utilisations" type="number" min={1} inputMode="numeric" className={inputClass} />
            </Champ>
            <div />
            <Champ id="debut" label="Valable à partir du" aide="Vide : tout de suite.">
              <input id="debut" name="debut" type="date" className={inputClass} />
            </Champ>
            <Champ id="fin" label="Valable jusqu'au" aide="Vide : sans date de fin.">
              <input id="fin" name="fin" type="date" className={inputClass} />
            </Champ>
          </div>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium text-foreground">Pays concernés</legend>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {PAYS.map(([code, nom]) => (
                <label key={code} className="inline-flex items-center gap-2 text-sm text-foreground">
                  <input type="checkbox" name="pays" value={code} className="h-4 w-4" />
                  {nom}
                </label>
              ))}
            </div>
            <Sourdine>Aucun pays coché : le code est valable partout.</Sourdine>
          </fieldset>
          <label className="inline-flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" name="nouveaux" className="h-4 w-4" />
            Réservé aux nouveaux clients (qui n&apos;ont encore jamais acheté de forfait)
          </label>
          <button type="submit" className={classeBouton("action", false, true)}>Créer le code</button>
        </form>
      </Carte>

      {v.codes.length === 0 ? (
        <EtatVide titre="Aucun code promo" texte="Créez votre premier code ci-dessus. Le client le saisit sur l'écran de paiement et voit tout de suite ce qu'il paie." />
      ) : (
        <>
          <Titrine>Vos codes</Titrine>
          {v.codes.map((c) => (
            <CarteCode key={c.id} c={c} />
          ))}
        </>
      )}

      {v.recentes.length > 0 && (
        <>
          <Titrine>Dernières utilisations</Titrine>
          <Tableau
            legende="Dernières utilisations de codes promo"
            colonnes={["Quand", "Code", "Entreprise", "Remise", "À payer", "État"]}
            lignes={v.recentes.map((u) => [
              <span key="q" className="whitespace-nowrap text-muted-foreground">{dateCourte(u.cree_le)} {heure(u.cree_le)}</span>,
              <b key="c" className="tracking-wider">{u.code}</b>,
              u.entreprise,
              <span key="r" className="tabular-nums">{nombre(u.remise_fcfa)}</span>,
              <span key="p" className="tabular-nums">{u.a_payer_fcfa === 0 ? "offert" : nombre(u.a_payer_fcfa)}</span>,
              <Etiquette key="e" ton={u.statut === "confirme" ? "ok" : "neutre"}>{u.statut === "confirme" ? "Confirmé" : "En cours"}</Etiquette>,
            ])}
          />
        </>
      )}
      <Sourdine>Un code à 100 % offre le forfait choisi jusqu&apos;au plafond, sans aucun paiement, avec tous les comptes, le rythme maximal et des cibles illimitées. Chaque création et chaque désactivation est inscrite au journal d&apos;audit.</Sourdine>
    </div>
  );
}
