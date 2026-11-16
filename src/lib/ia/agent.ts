import "server-only";
import { echec, succes, type Resultat } from "../resultat";
import type { Entree, Profil } from "../parcours/types";
import type { ClientIA } from "./client";
import { controlerMessage, type Violation } from "./controles";
import { demanderJson, type Usage } from "./json";
import {
  SYSTEME_FICHE,
  SYSTEME_PROFILS,
  SYSTEME_PROSPECT,
  SYSTEME_REDACTION,
  SYSTEME_RELECTURE,
  VERSIONS,
  utilisateurFiche,
  utilisateurProfils,
  utilisateurProspect,
  utilisateurRedaction,
  utilisateurRelecture,
  type CanalRedaction,
  type EntreeProspect,
} from "./prompts";
import { schemaAnalyseProspect, schemaFiche, schemaMessage, schemaProfils, schemaRelecture, type AnalyseProspect, type FicheIA } from "./schemas";

/**
 * Les étapes de l'agent. Chacune prend un `ClientIA` : en production le vrai (Groq ou autre),
 * dans les tests un faux qui répond ce qu'on veut. Aucune étape ne dépend d'un fournisseur.
 */

/** 1. Lire l'activité du client et en faire la fiche. */
export async function faireFiche(client: ClientIA, entree: Entree, texteSite?: string): Promise<Resultat<{ fiche: FicheIA; usage: Usage }>> {
  const r = await demanderJson({ client, tache: "fiche", version: VERSIONS.fiche, modele: client.modeles.fort, systeme: SYSTEME_FICHE, utilisateur: utilisateurFiche(entree, texteSite), schema: schemaFiche, maxJetons: 900 });
  if (!r.ok) return r;
  return succes({ fiche: r.donnees.valeur, usage: r.donnees.usage });
}

function identifiant(nom: string, i: number): string {
  const base = nom.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  return `${base || "profil"}-${i + 1}`;
}

/** 2. Proposer 3 à 5 profils de clients idéaux, notés. Les trois meilleurs sont actifs d'emblée. */
export async function proposerProfilsIA(client: ClientIA, fiche: FicheIA, reponses?: Record<string, string>): Promise<Resultat<{ profils: Profil[]; usage: Usage }>> {
  const r = await demanderJson({ client, tache: "profils", version: VERSIONS.profils, modele: client.modeles.fort, systeme: SYSTEME_PROFILS, utilisateur: utilisateurProfils(fiche, reponses), schema: schemaProfils, temperature: 0.4, maxJetons: 900 });
  if (!r.ok) return r;
  const tries = [...r.donnees.valeur.profils].sort((a, b) => b.note - a.note);
  return succes({ profils: tries.map((p, i) => ({ id: identifiant(p.nom, i), nom: p.nom, raison: p.raison, note: p.note, actif: i < 3 })), usage: r.donnees.usage });
}

/** 3. Étudier un prospect : une accroche précise, ou null (alors on n'écrit pas). */
export async function analyserProspect(client: ClientIA, fiche: FicheIA, prospect: EntreeProspect): Promise<Resultat<{ analyse: AnalyseProspect; usage: Usage }>> {
  const r = await demanderJson({ client, tache: "prospect", version: VERSIONS.prospect, modele: client.modeles.fort, systeme: SYSTEME_PROSPECT, utilisateur: utilisateurProspect(fiche, prospect), schema: schemaAnalyseProspect, maxJetons: 600 });
  if (!r.ok) return r;
  return succes({ analyse: r.donnees.valeur, usage: r.donnees.usage });
}

export type IssueMessage =
  | { statut: "valide"; objet: string | null; texte: string; usage: Usage }
  | { statut: "bloque"; raisons: string[]; usage: Usage };

const sommer = (a: Usage, b: Usage): Usage => ({ jetonsEntree: a.jetonsEntree + b.jetonsEntree, jetonsSortie: a.jetonsSortie + b.jetonsSortie, appels: a.appels + b.appels });

/**
 * 4. Rédiger, contrôler en code, relire par une seconde IA.
 *  - pas d'accroche précise : pas de message ;
 *  - un contrôle en code échoue : un seul nouvel essai avec les raisons ; s'il échoue encore, le message est bloqué ;
 *  - la seconde IA refuse : le message est bloqué (jamais corrigé en silence).
 * Un message bloqué ne part pas et ne coûte rien au client ; les raisons sont gardées pour l'équipe.
 */
export async function preparerMessage(
  client: ClientIA,
  a: { fiche: FicheIA; prospect: EntreeProspect; analyse: AnalyseProspect; canal: CanalRedaction; signataire: string; prenomContact?: string | null; exemplesStyle?: string[] },
): Promise<Resultat<IssueMessage>> {
  let usage: Usage = { jetonsEntree: 0, jetonsSortie: 0, appels: 0 };
  if (!a.analyse.accroche) return succes({ statut: "bloque", raisons: ["Aucune raison précise d'écrire à cette entreprise : on n'écrit pas."], usage });

  const sourcesVraies = [JSON.stringify(a.fiche), a.analyse.accroche, a.analyse.pourquoiMaintenant ?? "", ...a.analyse.faitsCites, a.prospect.nom, a.signataire].join("\n");
  const prenomsConnus = a.prenomContact ? [a.prenomContact] : [];

  let corrections: string[] = [];
  let violations: Violation[] = [];
  for (let essai = 1; essai <= 2; essai++) {
    const r = await demanderJson({
      client,
      tache: "redaction",
      version: VERSIONS.redaction,
      modele: client.modeles.fort,
      systeme: SYSTEME_REDACTION,
      utilisateur: utilisateurRedaction({ fiche: a.fiche, prospect: a.prospect, accroche: a.analyse.accroche, canal: a.canal, signataire: a.signataire, prenomContact: a.prenomContact, exemplesStyle: a.exemplesStyle, corrections }),
      schema: schemaMessage,
      temperature: 0.6,
      maxJetons: 600,
    });
    if (!r.ok) return echec(r.erreur, r.code);
    usage = sommer(usage, r.donnees.usage);
    const { objet, texte } = r.donnees.valeur;
    violations = controlerMessage({ canal: a.canal, objet: a.canal === "Email" ? objet : null, texte, sourcesVraies, prenomsConnus, premier: true });
    if (violations.length > 0) {
      corrections = violations.map((v) => v.raison);
      continue;
    }

    // Les contrôles du code sont passés : la seconde IA relit avec la liste des interdits.
    const l = await demanderJson({
      client,
      tache: "relecture",
      version: VERSIONS.relecture,
      modele: client.modeles.fort,
      systeme: SYSTEME_RELECTURE,
      utilisateur: utilisateurRelecture({ fiche: a.fiche, prospect: a.prospect, accroche: a.analyse.accroche, canal: a.canal, objet: a.canal === "Email" ? objet : null, texte, prenomsConnus }),
      schema: schemaRelecture,
      maxJetons: 300,
    });
    if (!l.ok) return echec(l.erreur, l.code);
    usage = sommer(usage, l.donnees.usage);
    if (!l.donnees.valeur.conforme) return succes({ statut: "bloque", raisons: l.donnees.valeur.problemes.length ? l.donnees.valeur.problemes : ["La relecture a refusé le message."], usage });
    return succes({ statut: "valide", objet: a.canal === "Email" ? objet : null, texte, usage });
  }
  return succes({ statut: "bloque", raisons: violations.map((v) => v.raison), usage });
}
