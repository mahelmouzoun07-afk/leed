import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Carte, EtatVide, Etiquette, Ligne, LigneLien, Sourdine, Titrine, TitrePage, classeBouton } from "@/components/app/kit";
import { ajouterExclusion, enregistrerAlertes, enregistrerAutonomie, enregistrerMessages, supprimerExclusion } from "@/lib/app/actions";
import { deconnecter } from "@/lib/auth/actions";
import { AUTONOMIE_PAR_NIVEAU, LIGNES_AUTONOMIE, type NiveauAutonomie, type ReglagesVue } from "@/lib/app/vues";

const champ = "w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary";
const Enregistre = ({ ok }: { ok?: boolean }) =>
  ok ? (
    <p role="status" className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-600">
      C&apos;est enregistré.
    </p>
  ) : null;

export function EcranReglages({ v }: { v: ReglagesVue }) {
  const NIVEAU = { prudent: "Prudent", equilibre: "Équilibré", autonome: "Autonome" } as const;
  return (
    <div className="flex flex-col gap-4">
      <TitrePage titre="Réglages" />
      <ul className="glass-window-inner divide-y divide-border">
        <li><LigneLien href="/app/reglages/activite" titre="Mon activité" texte="Ce que l'agent a compris de votre site" /></li>
        <li><LigneLien href="/app/reglages/messages" titre="Ce que l'agent dit" texte="Signature, prix, ce qu'il ne doit jamais dire" /></li>
        <li><LigneLien href="/app/reglages/autonomie" titre="Autonomie" texte="Ce qu'il fait seul, ce qu'il vous demande" droite={<Etiquette>{NIVEAU[v.autonomie.niveau]}</Etiquette>} /></li>
        <li><LigneLien href="/app/reglages/alertes" titre="Alertes" texte="Quoi, où, à quelles heures" /></li>
        <li><LigneLien href="/app/reglages/horaires" titre="Horaires et agenda" texte="Vos créneaux de rendez-vous" /></li>
        <li><LigneLien href="/app/reglages/exclusions" titre="À ne pas contacter" texte="Clients actuels, concurrents, proches" droite={v.exclusions.length > 0 ? <Etiquette>{v.exclusions.length}</Etiquette> : undefined} /></li>
        <li><LigneLien href="/app/reglages/compte" titre="Mon compte" texte="Nom, mot de passe, mes données" /></li>
      </ul>
      <Carte ton="calme">
        <Titrine>Ce qui ne se change pas</Titrine>
        <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
          <li>- 40 messages par jour et par compte</li>
          <li>- « Répondez STOP » dans chaque premier message</li>
          <li>- Pas d&apos;envoi avant 8 h ni après 19 h</li>
          <li>- Chaque message est contrôlé avant d&apos;être envoyé</li>
        </ul>
      </Carte>
    </div>
  );
}

export function EcranActivite({ v }: { v: ReglagesVue }) {
  return (
    <div className="flex flex-col gap-4">
      <TitrePage titre="Mon activité" retour="/app/reglages" />
      <Carte>
        <div className="text-base font-medium text-foreground">{v.entreprise}</div>
        {v.resume ? <p className="!my-0 text-sm">{v.resume}</p> : <Sourdine>Aucune fiche d&apos;activité enregistrée pour l&apos;instant.</Sourdine>}
      </Carte>
      {v.offres.length > 0 && (
        <Carte>
          <Titrine>Ce que vous proposez</Titrine>
          <ul className="flex flex-col gap-1 text-sm text-foreground">
            {v.offres.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </Carte>
      )}
      <Sourdine>Pour corriger cette fiche, refaites l&apos;analyse de votre activité.</Sourdine>
      <div>
        <Link href="/demarrer" className={classeBouton("cadre", true)}>
          Refaire l&apos;analyse
        </Link>
      </div>
    </div>
  );
}

export function EcranMessages({ v, ok }: { v: ReglagesVue; ok?: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      <TitrePage titre="Ce que l'agent dit" retour="/app/reglages" />
      <Enregistre ok={ok} />
      <form action={enregistrerMessages} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="nomAffiche" className="text-sm font-medium text-foreground">Votre signature</label>
          <input id="nomAffiche" name="nomAffiche" defaultValue={v.nomAffiche} maxLength={120} placeholder="Koffi, du Studio Koffi" className={`${champ} h-11`} />
          <Sourdine>C&apos;est ainsi que l&apos;agent se présente dans les messages.</Sourdine>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="prix" className="text-sm font-medium text-foreground">Ce qu&apos;il peut dire de vos prix</label>
          <textarea id="prix" name="prix" rows={3} maxLength={600} defaultValue={v.consignes.prix} placeholder="Un logo coûte entre 40 000 et 60 000 FCFA." className={`${champ} resize-none`} />
          <Sourdine>L&apos;agent ne cite jamais un prix que vous n&apos;avez pas écrit ici.</Sourdine>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="interdits" className="text-sm font-medium text-foreground">Ce qu&apos;il ne doit jamais dire</label>
          <textarea id="interdits" name="interdits" rows={3} maxLength={600} defaultValue={v.consignes.interdits} placeholder="Ne jamais promettre de délai de moins de 5 jours." className={`${champ} resize-none`} />
        </div>
        <div>
          <button type="submit" className={classeBouton("sombre")}>Enregistrer</button>
        </div>
      </form>
    </div>
  );
}

export function EcranAutonomie({ v, ok }: { v: ReglagesVue; ok?: boolean }) {
  const NIVEAUX: [NiveauAutonomie, string, string][] = [
    ["prudent", "Prudent", "Je valide les premiers messages de chaque campagne"],
    ["equilibre", "Équilibré", "L'agent écrit seul, il me demande pour l'important"],
    ["autonome", "Autonome", "L'agent fait tout, il me prévient après"],
  ];
  return (
    <div className="flex flex-col gap-4">
      <TitrePage titre="Autonomie" retour="/app/reglages" />
      <Enregistre ok={ok} />
      <form action={enregistrerAutonomie} className="flex flex-col gap-3">
        <fieldset className="flex flex-col gap-2">
          <legend className="sr-only">Niveau d&apos;autonomie</legend>
          {NIVEAUX.map(([cle, nom, texte]) => (
            <label key={cle} className="has-[:checked]:border-primary glass-window-inner flex cursor-pointer items-start gap-3 border border-transparent p-4">
              <input type="radio" name="niveau" value={cle} defaultChecked={v.autonomie.niveau === cle} className="mt-1 accent-[var(--primary)]" />
              <span>
                <span className="block text-sm font-medium text-foreground">{nom}</span>
                <span className="block text-sm text-muted-foreground">{texte}</span>
              </span>
            </label>
          ))}
        </fieldset>
        <Carte>
          <Titrine>Dans le détail</Titrine>
          <Sourdine>Choisissez qui décide, ligne par ligne. Cochez la case pour que ce détail remplace le niveau choisi.</Sourdine>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" name="detail" value="oui" className="accent-[var(--primary)]" /> Utiliser mes réglages ligne par ligne
          </label>
          {LIGNES_AUTONOMIE.map(([cle, libelle]) => (
            <Ligne key={cle}>
              <label htmlFor={`ligne_${cle}`}>{libelle}</label>
              <select id={`ligne_${cle}`} name={`ligne_${cle}`} defaultValue={v.autonomie.lignes[cle]} className="h-9 rounded-lg border border-border bg-card px-2 text-sm">
                <option value="agent">Agent seul</option>
                <option value="moi">Me demande</option>
              </select>
            </Ligne>
          ))}
        </Carte>
        <Sourdine>Niveau actuel : {AUTONOMIE_PAR_NIVEAU[v.autonomie.niveau] && NIVEAUX.find((n) => n[0] === v.autonomie.niveau)?.[1]}.</Sourdine>
        <div>
          <button type="submit" className={classeBouton("sombre")}>Enregistrer</button>
        </div>
      </form>
    </div>
  );
}

export function EcranAlertes({ v, ok }: { v: ReglagesVue; ok?: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      <TitrePage titre="Alertes" retour="/app/reglages" />
      <Enregistre ok={ok} />
      <form action={enregistrerAlertes} className="flex flex-col gap-4">
        <Carte>
          <Titrine>Où vous prévenir</Titrine>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" name="whatsapp" defaultChecked={v.alertes.whatsapp} className="accent-[var(--primary)]" /> Sur WhatsApp
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" name="email" defaultChecked={v.alertes.email} className="accent-[var(--primary)]" /> Par email
          </label>
          <Sourdine>Les alertes arrivent dès que l&apos;envoi et la messagerie sont ouverts.</Sourdine>
        </Carte>
        <Carte>
          <Titrine>À quelles heures</Titrine>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="debut" className="text-sm text-foreground">Pas avant</label>
              <input id="debut" name="debut" type="time" defaultValue={v.alertes.debut} className={`${champ} h-11`} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="fin" className="text-sm text-foreground">Pas après</label>
              <input id="fin" name="fin" type="time" defaultValue={v.alertes.fin} className={`${champ} h-11`} />
            </div>
          </div>
        </Carte>
        <div>
          <button type="submit" className={classeBouton("sombre")}>Enregistrer</button>
        </div>
      </form>
    </div>
  );
}

export function EcranHoraires() {
  return (
    <div className="flex flex-col gap-4">
      <TitrePage titre="Horaires et agenda" retour="/app/reglages" />
      <Carte>
        <Titrine>Quand l&apos;agent écrit</Titrine>
        <p className="!my-0 text-sm">De 8 h à 19 h, heure de l&apos;entreprise contactée. Jamais pendant la prière du vendredi dans les pays concernés, ni les jours fériés.</p>
      </Carte>
      <Carte ton="calme">
        <Titrine>Votre agenda</Titrine>
        <Sourdine>Vos créneaux de rendez-vous se règlent quand vous branchez votre agenda, avec la connexion de vos comptes.</Sourdine>
      </Carte>
    </div>
  );
}

export function EcranExclusions({ v, ok }: { v: ReglagesVue; ok?: boolean }) {
  const NOM = { nom: "Nom", domaine: "Site ou domaine", identifiant: "Numéro ou adresse" } as const;
  return (
    <div className="flex flex-col gap-4">
      <TitrePage titre="À ne pas contacter" retour="/app/reglages" />
      <Enregistre ok={ok} />
      <Sourdine>Vos clients actuels, vos concurrents, vos proches : l&apos;agent ne leur écrira jamais.</Sourdine>
      <form action={ajouterExclusion} className="grid grid-cols-[130px_1fr_auto] gap-2 max-md:grid-cols-1">
        <select name="type" aria-label="Type" className="h-11 rounded-lg border border-border bg-card px-2 text-sm">
          <option value="nom">Nom</option>
          <option value="domaine">Site ou domaine</option>
          <option value="identifiant">Numéro ou adresse</option>
        </select>
        <input name="valeur" required minLength={2} maxLength={160} aria-label="Valeur" placeholder="Imprimerie Sogbo" className={`${champ} h-11`} />
        <button type="submit" className={classeBouton("sombre")}>Ajouter</button>
      </form>
      {v.exclusions.length === 0 ? (
        <EtatVide titre="Personne dans la liste" texte="Ajoutez les entreprises que l'agent ne doit jamais contacter." />
      ) : (
        <ul className="glass-window-inner divide-y divide-border">
          {v.exclusions.map((x) => (
            <li key={x.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-foreground">{x.valeur}</div>
                <Sourdine>{NOM[x.type]}</Sourdine>
              </div>
              <form action={supprimerExclusion}>
                <input type="hidden" name="id" value={x.id} />
                <button type="submit" aria-label={`Retirer ${x.valeur}`} className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-chip hover:text-foreground">
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function EcranCompte({ v }: { v: ReglagesVue }) {
  return (
    <div className="flex flex-col gap-4">
      <TitrePage titre="Mon compte" retour="/app/reglages" />
      <Carte>
        <Ligne><span className="text-muted-foreground">Nom</span><b>{v.prenom || "-"}</b></Ligne>
        <Ligne><span className="text-muted-foreground">Email</span><b className="truncate">{v.email}</b></Ligne>
        <Ligne><span className="text-muted-foreground">Entreprise</span><b>{v.entreprise}</b></Ligne>
      </Carte>
      <Carte ton="calme">
        <Titrine>Mot de passe</Titrine>
        <Sourdine>Pour en choisir un nouveau, demandez un lien depuis la page « Mot de passe oublié ».</Sourdine>
        <div>
          <Link href="/mot-de-passe-oublie" className={classeBouton("cadre", true)}>Changer mon mot de passe</Link>
        </div>
      </Carte>
      <Carte ton="calme">
        <Titrine>Mes données</Titrine>
        <Sourdine>Pour télécharger ou supprimer vos données, écrivez-nous depuis la page Support : nous vous répondons sous quelques jours.</Sourdine>
        <div>
          <Link href="/support" className={classeBouton("cadre", true)}>Contacter le support</Link>
        </div>
      </Carte>
      <form action={deconnecter}>
        <button type="submit" className={classeBouton("cadre")}>Me déconnecter</button>
      </form>
    </div>
  );
}
