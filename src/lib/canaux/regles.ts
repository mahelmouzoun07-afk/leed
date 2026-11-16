import { createHmac, timingSafeEqual } from "node:crypto";
import type { Canal, StatutCompte } from "./types";

/**
 * Les règles « pures » de la connexion des comptes : correspondances entre les mots d'Unipile et les nôtres,
 * signature du lien de retour, lecture des messages automatiques. Rien ici n'appelle le réseau ni la base : tout se teste.
 */

// ───── Canal <-> fournisseur ─────

/** Les types de compte d'Unipile que chaque canal accepte à la connexion (à confirmer avec le test de docs/UNIPILE.md §7). */
export const PROVIDERS_PAR_CANAL: Record<Canal, string[]> = {
  whatsapp: ["WHATSAPP"],
  instagram: ["INSTAGRAM"],
  facebook: ["MESSENGER"],
  linkedin: ["LINKEDIN"],
  email: ["GOOGLE", "OUTLOOK", "MAIL"],
};

const CANAL_PAR_TYPE: Record<string, Canal> = {
  WHATSAPP: "whatsapp",
  INSTAGRAM: "instagram",
  MESSENGER: "facebook",
  FACEBOOK: "facebook",
  LINKEDIN: "linkedin",
  GOOGLE_OAUTH: "email",
  GOOGLE: "email",
  OUTLOOK: "email",
  MAIL: "email",
  ICLOUD: "email",
  EXCHANGE: "email",
};

export function canalDuType(type: string | null | undefined): Canal | null {
  return CANAL_PAR_TYPE[String(type ?? "").toUpperCase()] ?? null;
}

// ───── Les états ─────

/**
 * Ce que dit Unipile -> notre état. `null` : on ne change rien (CONNECTING est temporaire ; CREATION_SUCCESS est traité par le retour de connexion).
 *  - OK, RECONNECTED, SYNC_SUCCESS : bon ;
 *  - CREDENTIALS, PERMISSIONS : à rebrancher (mot de passe changé, session expirée, contrôle de sécurité) ;
 *  - ERROR, STOPPED : suspendu (la synchronisation est arrêtée : plus d'envoi, le client est prévenu) ;
 *  - DELETED : débranché.
 */
export function statutDepuisUnipile(brut: string | null | undefined): StatutCompte | null {
  switch (String(brut ?? "").toUpperCase()) {
    case "OK":
    case "RECONNECTED":
    case "SYNC_SUCCESS":
      return "actif";
    case "CREDENTIALS":
    case "PERMISSIONS":
      return "a_rebrancher";
    case "ERROR":
    case "STOPPED":
      return "suspendu";
    case "DELETED":
      return "debranche";
    default:
      return null;
  }
}

/** Un compte Unipile peut avoir plusieurs sources (boîte et agenda) : le pire état l'emporte. */
const GRAVITE: Record<string, number> = { OK: 0, CONNECTING: 1, PERMISSIONS: 2, CREDENTIALS: 3, ERROR: 4, STOPPED: 4 };
export function pireStatut(statuts: (string | undefined | null)[]): string {
  const liste = statuts.filter((s): s is string => !!s).map((s) => s.toUpperCase());
  if (liste.length === 0) return "OK";
  return liste.reduce((pire, s) => ((GRAVITE[s] ?? 0) > (GRAVITE[pire] ?? 0) ? s : pire));
}

// ───── Sécurité des appels reçus ─────

function egaux(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Unipile n'a pas de signature : on lui fait ajouter un en-tête secret à chacun de ses appels, et on le compare en temps constant. */
export function enteteValide(recu: string | null | undefined, secret: string | undefined): boolean {
  if (!secret || !recu) return false;
  return egaux(recu.trim(), secret);
}

/** La signature qui accompagne l'adresse de retour de la connexion : un faux appel à cette adresse ne passe pas. */
export function signerLien(lienId: string, secret: string): string {
  return createHmac("sha256", secret).update(`lien:${lienId}`).digest("hex").slice(0, 40);
}

export function signatureLienValide(lienId: string | null, signature: string | null, secret: string | undefined): boolean {
  if (!lienId || !signature || !secret) return false;
  return egaux(signature, signerLien(lienId, secret));
}

// ───── Ce qu'Unipile nous envoie ─────

export type EvenementUnipile =
  | { type: "etat_compte"; compteId: string; statutBrut: string; typeCompte: string | null }
  | { type: "message_recu"; compteId: string; chatId: string | null; messageId: string | null }
  | { type: "retour_connexion"; compteId: string; nom: string; statutBrut: string }
  | { type: "ignore" };

const texte = (v: unknown): string | null => (typeof v === "string" && v.trim() !== "" ? v : null);

/** Lit un message automatique d'Unipile. Ce qu'on ne comprend pas est « ignoré » (réponse 200, sans rien faire), jamais une erreur. */
export function lireEvenement(corps: unknown): EvenementUnipile {
  if (!corps || typeof corps !== "object") return { type: "ignore" };
  const c = corps as Record<string, unknown>;

  // Changement d'état d'un compte : { AccountStatus: { account_id, account_type, message } }
  const etat = c.AccountStatus as Record<string, unknown> | undefined;
  if (etat && typeof etat === "object") {
    const compteId = texte(etat.account_id);
    const statutBrut = texte(etat.message);
    if (compteId && statutBrut) return { type: "etat_compte", compteId, statutBrut, typeCompte: texte(etat.account_type) };
  }

  // Retour de la connexion hébergée : { status: "CREATION_SUCCESS" | "RECONNECTED", account_id, name }
  const statut = texte(c.status);
  if ((statut === "CREATION_SUCCESS" || statut === "RECONNECTED") && texte(c.account_id) && texte(c.name)) {
    return { type: "retour_connexion", compteId: texte(c.account_id) as string, nom: texte(c.name) as string, statutBrut: statut };
  }

  // Message reçu : { event: "message_received", account_id, chat_id, message_id, ... }
  if (texte(c.event) === "message_received" && texte(c.account_id)) {
    return { type: "message_recu", compteId: texte(c.account_id) as string, chatId: texte(c.chat_id), messageId: texte(c.message_id) };
  }
  return { type: "ignore" };
}

// ───── Adresses des destinataires ─────

/** WhatsApp : « 22997000000@s.whatsapp.net » (forme donnée par la documentation d'Unipile ; à confirmer au test d'envoi). */
export function identifiantWhatsApp(numero: string): string | null {
  const chiffres = numero.replace(/\D/g, "").replace(/^00/, "");
  return chiffres.length >= 8 && chiffres.length <= 15 ? `${chiffres}@s.whatsapp.net` : null;
}

/** Un identifiant de compte (ou de lien) affiché à l'équipe : on n'en montre que les extrémités. */
export function masquer(id: string): string {
  return id.length <= 8 ? "••••" : `${id.slice(0, 3)}…${id.slice(-3)}`;
}
