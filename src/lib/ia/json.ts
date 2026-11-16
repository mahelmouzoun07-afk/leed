import "server-only";
import type { z } from "zod";
import { log } from "../journal";
import { echec, succes, type Resultat } from "../resultat";
import { ErreurIA, messagePourErreurIA, type ClientIA, type Message } from "./client";

/**
 * Demande à l'IA une réponse en JSON, la vérifie contre un schéma, et corrige UNE fois si elle est mal formée.
 * Les petits modèles gratuits se trompent plus souvent qu'un gros modèle payant : c'est ce filet qui rend le résultat sûr.
 * Ce qui sort d'ici est toujours conforme au schéma, ou c'est une erreur propre. Jamais un texte « à peu près ».
 */

export type Usage = { jetonsEntree: number; jetonsSortie: number; appels: number };

export type DemandeJson<S extends z.ZodType> = {
  client: ClientIA;
  /** Le nom de la tâche et la version de son prompt, pour retrouver ce qui a produit une réponse. */
  tache: string;
  version: string;
  modele: string;
  systeme: string;
  utilisateur: string;
  schema: S;
  temperature?: number;
  maxJetons?: number;
};

/** Extrait le premier objet JSON d'un texte (le modèle l'entoure parfois de ```json ou de phrases). */
export function extraireJson(texte: string): unknown {
  const nettoye = texte.replace(/```(?:json)?/gi, "").trim();
  const debut = nettoye.indexOf("{");
  const fin = nettoye.lastIndexOf("}");
  if (debut === -1 || fin <= debut) throw new Error("aucun objet JSON");
  return JSON.parse(nettoye.slice(debut, fin + 1));
}

function problemes(e: z.ZodError): string {
  return e.issues
    .slice(0, 6)
    .map((i) => `${i.path.join(".") || "racine"} : ${i.message}`)
    .join(" ; ");
}

export async function demanderJson<S extends z.ZodType>(d: DemandeJson<S>): Promise<Resultat<{ valeur: z.infer<S>; usage: Usage }>> {
  const usage: Usage = { jetonsEntree: 0, jetonsSortie: 0, appels: 0 };
  const messages: Message[] = [
    { role: "system", content: d.systeme },
    { role: "user", content: d.utilisateur },
  ];

  for (let essai = 1; essai <= 2; essai++) {
    let texte: string;
    try {
      const r = await d.client.completer({ modele: d.modele, messages, temperature: d.temperature ?? 0.2, maxJetons: d.maxJetons, json: true });
      usage.appels += 1;
      usage.jetonsEntree += r.jetonsEntree;
      usage.jetonsSortie += r.jetonsSortie;
      texte = r.texte;
    } catch (e) {
      log.warn("ia.appel_echoue", { tache: d.tache, version: d.version, code: e instanceof ErreurIA ? e.code : "inconnu" });
      return echec(messagePourErreurIA(e), e instanceof ErreurIA ? e.code : "ia_erreur");
    }

    let raison: string;
    try {
      const analyse = d.schema.safeParse(extraireJson(texte));
      if (analyse.success) {
        log.info("ia.tache", { tache: d.tache, version: d.version, modele: d.modele, essais: essai, ...usage });
        return succes({ valeur: analyse.data as z.infer<S>, usage });
      }
      raison = problemes(analyse.error);
    } catch {
      raison = "la réponse n'était pas un objet JSON valide";
    }

    log.warn("ia.reponse_invalide", { tache: d.tache, version: d.version, essai, raison: raison.slice(0, 200) });
    // Second essai : on montre au modèle sa propre réponse et ce qui ne va pas.
    messages.push({ role: "assistant", content: texte }, { role: "user", content: `Ta réponse n'est pas valide : ${raison}. Réponds de nouveau, uniquement avec l'objet JSON corrigé, sans aucun autre texte.` });
  }
  return echec("L'analyse n'a pas pu aboutir. Réessayez dans un instant.", "ia_reponse_invalide");
}
