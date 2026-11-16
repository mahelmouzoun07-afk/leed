import "server-only";
import { env } from "../env";
import { log } from "../journal";

/**
 * La « coquille » de l'IA : tout le reste de leed parle à ce petit contrat (`ClientIA`),
 * jamais à un fournisseur précis. Le moteur qui tourne derrière se change avec trois variables,
 * sans toucher au code :
 *   IA_URL_BASE      adresse d'un service compatible « OpenAI » (Groq par défaut, ou OpenRouter, Gemini, Mistral, Claude plus tard…)
 *   IA_CLE_API       la clé de ce service (à défaut : GROQ_API_KEY)
 *   IA_MODELE_FORT / IA_MODELE_RAPIDE   les deux modèles : un pour rédiger et synthétiser, un pour lire
 */

export type Message = { role: "system" | "user" | "assistant"; content: string };

export type DemandeIA = {
  modele: string;
  messages: Message[];
  /** Basse = réponses régulières. 0.2 pour lire et analyser, 0.6 pour rédiger. */
  temperature?: number;
  maxJetons?: number;
  /** Demande une réponse en JSON (le mode JSON des services compatibles). */
  json?: boolean;
};

export type ReponseIA = {
  texte: string;
  jetonsEntree: number;
  jetonsSortie: number;
  modele: string;
};

export interface ClientIA {
  readonly modeles: { rapide: string; fort: string };
  completer(demande: DemandeIA): Promise<ReponseIA>;
}

export class ErreurIA extends Error {
  constructor(
    message: string,
    readonly statutHttp: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "ErreurIA";
  }
}

export const URL_BASE_PAR_DEFAUT = "https://api.groq.com/openai/v1";
// Modèles ouverts et gratuits chez Groq. Le gros (70 milliards de paramètres) écrit et synthétise bien en français ; le petit lit vite.
export const MODELE_FORT_PAR_DEFAUT = "llama-3.3-70b-versatile";
export const MODELE_RAPIDE_PAR_DEFAUT = "llama-3.1-8b-instant";

const DELAI_MS = 30_000;
const ATTENTE_MAX_MS = 6_000;

type Config = { urlBase: string; cle: string; modeles: { rapide: string; fort: string } };

/** La configuration de l'IA, ou null si aucune clé n'est posée (le site doit alors se rabattre proprement). */
export function configurationIA(): Config | null {
  const e = env();
  const cle = e.IA_CLE_API ?? e.GROQ_API_KEY;
  if (!cle) return null;
  return {
    urlBase: (e.IA_URL_BASE ?? URL_BASE_PAR_DEFAUT).replace(/\/$/, ""),
    cle,
    modeles: { rapide: e.IA_MODELE_RAPIDE ?? MODELE_RAPIDE_PAR_DEFAUT, fort: e.IA_MODELE_FORT ?? MODELE_FORT_PAR_DEFAUT },
  };
}

export function iaDisponible(): boolean {
  return configurationIA() !== null;
}

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Le client réel : un appel HTTP « chat completions », avec un seul nouvel essai si le service est occupé. */
export function creerClientIA(config: Config | null = configurationIA()): ClientIA {
  if (!config) throw new ErreurIA("L'IA n'est pas configurée (clé manquante).", 0, "ia_non_configuree");
  const { urlBase, cle, modeles } = config;

  async function appeler(demande: DemandeIA): Promise<Response> {
    return fetch(`${urlBase}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${cle}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        model: demande.modele,
        messages: demande.messages,
        temperature: demande.temperature ?? 0.2,
        max_tokens: demande.maxJetons ?? 1200,
        ...(demande.json ? { response_format: { type: "json_object" } } : {}),
      }),
      signal: AbortSignal.timeout(DELAI_MS),
    });
  }

  return {
    modeles,
    async completer(demande) {
      let reponse: Response;
      try {
        reponse = await appeler(demande);
        // Service occupé ou en panne passagère : on attend un peu et on réessaie UNE fois.
        if (reponse.status === 429 || reponse.status >= 500) {
          const demandee = Number(reponse.headers.get("retry-after")) * 1000;
          await pause(Math.min(Number.isFinite(demandee) && demandee > 0 ? demandee : 1500, ATTENTE_MAX_MS));
          reponse = await appeler(demande);
        }
      } catch (e) {
        throw new ErreurIA(e instanceof Error && e.name === "TimeoutError" ? "L'IA a mis trop de temps à répondre." : "L'IA est injoignable.", 0, "ia_injoignable");
      }

      if (!reponse.ok) {
        const corps = await reponse.text().catch(() => "");
        log.warn("ia.refus", { statut: reponse.status, modele: demande.modele, debut: corps.slice(0, 160) });
        const code = reponse.status === 429 ? "ia_occupee" : reponse.status === 401 || reponse.status === 403 ? "ia_cle_refusee" : "ia_erreur";
        throw new ErreurIA(`Le service d'IA a répondu ${reponse.status}.`, reponse.status, code);
      }

      const json = (await reponse.json().catch(() => null)) as {
        choices?: { message?: { content?: string | null } }[];
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      } | null;
      const texte = json?.choices?.[0]?.message?.content;
      if (typeof texte !== "string" || texte.trim() === "") throw new ErreurIA("L'IA a renvoyé une réponse vide.", reponse.status, "ia_reponse_vide");
      return {
        texte,
        jetonsEntree: json?.usage?.prompt_tokens ?? 0,
        jetonsSortie: json?.usage?.completion_tokens ?? 0,
        modele: demande.modele,
      };
    },
  };
}

/** Le message à montrer au visiteur selon la panne. */
export function messagePourErreurIA(e: unknown): string {
  if (e instanceof ErreurIA) {
    if (e.code === "ia_occupee") return "Notre assistant est très sollicité en ce moment. Réessayez dans une minute.";
    if (e.code === "ia_cle_refusee") return "L'analyse est momentanément indisponible. Notre équipe est prévenue.";
  }
  return "L'analyse n'a pas pu aboutir. Réessayez dans un instant.";
}
