import { Carte, EtatVide, Etiquette, Jauge, Ligne, Sourdine, Titrine, TitrePage, BoutonLien, classeBouton, dateCourte, nombre } from "@/components/app/kit";
import { NOM_CANAL, type ComptesVue, type ForfaitVue } from "@/lib/app/vues";

const NOM_SANTE = { actif: "En bonne santé", a_rebrancher: "À rebrancher", suspendu: "Suspendu", debranche: "Débranché" } as const;

export function EcranComptes({ v }: { v: ComptesVue }) {
  return (
    <div className="flex flex-col gap-3">
      <TitrePage titre="Vos comptes" />
      <Sourdine>L&apos;agent écrit depuis vos propres comptes, jamais depuis un numéro inconnu.</Sourdine>
      {v.comptes.length === 0 && <EtatVide titre="Aucun compte branché" texte="Branchez votre WhatsApp, votre email ou vos réseaux pour que l'agent puisse écrire en votre nom. Le branchement ouvre avec la connexion des comptes." />}
      {v.comptes.map((c) => (
        <Carte key={`${c.canal}-${c.identifiant}`}>
          <Ligne>
            <b className="text-foreground">{NOM_CANAL[c.canal]}</b>
            <Etiquette ton={c.statut === "actif" ? "ok" : "feu"}>{NOM_SANTE[c.statut]}</Etiquette>
          </Ligne>
          <Sourdine className="tabular-nums">{c.identifiant}</Sourdine>
          <Ligne>
            <span>Aujourd&apos;hui</span>
            <b className="tabular-nums">
              {c.envois} / {c.quota}
            </b>
          </Ligne>
          <Jauge valeur={c.quota > 0 ? (c.envois / c.quota) * 100 : 0} label={`Envois du jour ${NOM_CANAL[c.canal]}`} />
          <Ligne>
            <span className="text-sm text-muted-foreground tabular-nums">{nombre(c.joignables)} prospects joignables ici</span>
            <button type="button" disabled title="Bientôt disponible" className={classeBouton("cadre", true)}>
              Débrancher
            </button>
          </Ligne>
        </Carte>
      ))}
      {v.autres.map((a) => (
        <Carte key={a.canal} ton="calme">
          <Ligne>
            <div>
              <div className="text-sm font-medium text-muted-foreground">{NOM_CANAL[a.canal]}</div>
              <Sourdine className="tabular-nums">{nombre(a.joignables)} prospects joignables</Sourdine>
            </div>
            <button type="button" disabled title="Bientôt disponible" className={classeBouton("sombre", true)}>
              Connecter
            </button>
          </Ligne>
        </Carte>
      ))}
      <p className="text-center text-sm">
        {v.inclus === null ? "Tous vos comptes sont compris dans votre forfait" : `${v.inclus} ${v.inclus > 1 ? "comptes compris" : "compte compris"} dans votre forfait`} · {v.branches} branché{v.branches > 1 ? "s" : ""}
      </p>
    </div>
  );
}

const NOM_STATUT_FORFAIT = { actif: "Actif", grace: "En grâce", gele: "Gelé", epuise: "Épuisé", expire: "Expiré" } as const;

export function EcranForfait({ v }: { v: ForfaitVue }) {
  const f = v.forfait;
  return (
    <div className="flex flex-col gap-3">
      <TitrePage titre="Votre forfait" droite={f ? <Etiquette ton={f.statut === "actif" ? "ok" : "feu"}>{NOM_STATUT_FORFAIT[f.statut]}</Etiquette> : undefined} />
      {!f ? (
        <EtatVide titre="Pas de forfait en cours" texte="Choisissez l'essai gratuit ou un forfait à partir de 5 000 FCFA, sans abonnement." action={<BoutonLien href="/choisir" ton="action">Choisir mon offre</BoutonLien>} />
      ) : (
        <>
          <Carte>
            <Ligne>
              <span>Entreprises</span>
              <b className="tabular-nums">
                {nombre(f.achetees - f.restantes)} / {nombre(f.achetees)}
              </b>
            </Ligne>
            <Jauge valeur={f.achetees > 0 ? ((f.achetees - f.restantes) / f.achetees) * 100 : 0} ton="or" label="Entreprises utilisées" />
            <Ligne>
              <span>Durée</span>
              <b className="tabular-nums">{f.joursRestants === 0 ? "dernier jour" : `reste ${f.joursRestants} jours`}</b>
            </Ligne>
            <Jauge valeur={f.joursTotal > 0 ? ((f.joursTotal - f.joursRestants) / f.joursTotal) * 100 : 0} label="Durée écoulée" />
            <Sourdine>
              {f.type === "essai" ? "Essai gratuit" : `Forfait de ${nombre(f.montant)} FCFA`} · jusqu&apos;au {dateCourte(f.fin)}
            </Sourdine>
          </Carte>
          <Carte ton="vif">
            <p className="!my-0 text-sm !text-foreground">
              Rechargez avant la fin du forfait : vos <b className="tabular-nums">{nombre(f.restantes)}</b> entreprises restantes sont reportées, avec un bonus de fidélité.
            </p>
            <BoutonLien href="/app/forfait/recharger" ton="action" large>
              Recharger
            </BoutonLien>
          </Carte>
          <Carte>
            <Titrine>Réglages</Titrine>
            <Ligne>
              <span>Pas plus de</span>
              <b className="tabular-nums">{(v.plafondJour > 0 ? v.plafondJour : f.parJour)} par jour</b>
            </Ligne>
            <Jauge valeur={((v.plafondJour > 0 ? v.plafondJour : f.parJour) / 40) * 100} label="Rythme par jour" />
          </Carte>
        </>
      )}
      <Carte>
        <Titrine>Historique</Titrine>
        {v.historique.length === 0 ? (
          <Sourdine>Aucun mouvement pour l&apos;instant.</Sourdine>
        ) : (
          v.historique.map((h, i) => (
            <Ligne key={i}>
              <span className="min-w-0 truncate">
                <span className="tabular-nums text-muted-foreground">{dateCourte(h.quand)}</span> {h.libelle}
              </span>
              <b className={`tabular-nums ${h.nombre > 0 ? "text-brand-600" : ""}`}>{h.nombre > 0 ? `+${h.nombre}` : h.nombre}</b>
            </Ligne>
          ))
        )}
      </Carte>
    </div>
  );
}
