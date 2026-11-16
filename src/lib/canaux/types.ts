/**
 * L'interface unique des canaux de leed (WhatsApp, Instagram, Facebook, LinkedIn, email).
 * Tout le reste du produit parle à `FournisseurCanaux`, jamais à Unipile : si Unipile change de prix, de conditions ou disparaît,
 * ou si l'on ajoute plus tard l'API officielle de Meta, on ne touche qu'à ce dossier (docs/UNIPILE.md, risque n° 3).
 */
export const CANAUX = ["whatsapp", "instagram", "facebook", "linkedin", "email"] as const;
export type Canal = (typeof CANAUX)[number];

export const NOM_CANAL: Record<Canal, string> = { whatsapp: "WhatsApp", instagram: "Instagram", facebook: "Facebook", linkedin: "LinkedIn", email: "Email" };

export const estCanal = (v: unknown): v is Canal => typeof v === "string" && (CANAUX as readonly string[]).includes(v);

/** L'état d'un compte chez nous (colonne statut_compte). */
export type StatutCompte = "actif" | "a_rebrancher" | "suspendu" | "debranche";

/** Un compte tel que le fournisseur le décrit. */
export type CompteDistant = {
  id: string;
  /** Le type du fournisseur (ex. WHATSAPP, GOOGLE_OAUTH). */
  type: string;
  canal: Canal | null;
  /** Le numéro, l'adresse email ou le nom du compte : ce que le client reconnaît. */
  identifiant: string;
  /** Le statut brut annoncé par le fournisseur (OK, CREDENTIALS, ERROR, STOPPED, CONNECTING…). */
  statutBrut: string;
  creeLe: string | null;
};

export type LienConnexion = { url: string };

export type DemandeLien = {
  /** Notre identifiant de lien : il revient dans l'appel de retour du fournisseur. */
  nom: string;
  canal: Canal;
  adresseRetour: string;
  succes: string;
  echec: string;
  expireDans: number;
  /** Pour rebrancher un compte existant. */
  rebrancher?: string;
};

export type DemandeEnvoi = { compteId: string; destinataire: string; texte: string; objet?: string };
export type ResultatEnvoi = { chatId: string | null; messageId: string | null };

export type WebhookDistant = { id: string; source: string; url: string; nom: string | null };

export interface FournisseurCanaux {
  /** Crée la page où le client relie son compte (QR code pour WhatsApp, connexion classique pour les autres). */
  creerLienConnexion(d: DemandeLien): Promise<LienConnexion>;
  lireCompte(id: string): Promise<CompteDistant | null>;
  listerComptes(): Promise<CompteDistant[]>;
  /** Supprime le compte chez le fournisseur : il ne coûte plus rien. Un compte déjà absent n'est pas une erreur. */
  supprimerCompte(id: string): Promise<void>;
  envoyer(d: DemandeEnvoi, canal: Canal): Promise<ResultatEnvoi>;
  listerWebhooks(): Promise<WebhookDistant[]>;
  creerWebhook(d: { source: "messaging" | "account_status"; url: string; secret: string; nom: string }): Promise<WebhookDistant>;
}
