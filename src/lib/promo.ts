/**
 * Les codes promo : les règles qui ne dépendent pas de la base (format, messages, génération).
 * Le PRIX, lui, est toujours calculé par la base (fonction calculer_code_promo) : rien d'ici ne décide d'un montant.
 */

export const CODE_MIN = 8;
export const CODE_MAX = 12;
/** Lettres et chiffres, majuscules ou minuscules, 8 à 12 caractères. */
const FORMAT = /^[A-Za-z0-9]{8,12}$/;

/** Ce que le client a tapé, nettoyé : espaces retirés, majuscules. « abc12345 » et « ABC12345 » sont le même code. */
export function normaliserCode(brut: string): string {
  return (brut ?? "").replace(/\s+/g, "").toUpperCase();
}

export function formatCodeValide(brut: string): boolean {
  return FORMAT.test(normaliserCode(brut));
}

/** Sans 0, O, 1, I, L : un code lu à voix haute ou recopié d'un message ne se confond pas. Il reste de 8 à 12 lettres et chiffres. */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function genererCode(longueur = 10, hasard: (n: number) => number[] = octetsAleatoires): string {
  const n = Math.min(CODE_MAX, Math.max(CODE_MIN, longueur));
  // Rejet des octets qui fausseraient la répartition (256 n'est pas un multiple de la taille de l'alphabet).
  const limite = 256 - (256 % ALPHABET.length);
  let sortie = "";
  while (sortie.length < n) {
    for (const o of hasard(n * 2)) {
      if (o < limite && sortie.length < n) sortie += ALPHABET[o % ALPHABET.length];
    }
  }
  return sortie;
}

function octetsAleatoires(n: number): number[] {
  const t = new Uint8Array(n);
  globalThis.crypto.getRandomValues(t);
  return [...t];
}

export type RaisonRefus = "inconnu" | "montant_invalide" | "pas_commence" | "expire" | "pays" | "nouveaux_clients" | "montant_trop_bas" | "epuise" | "deja_utilise";

export type CalculPromo =
  | { valide: false; raison: RaisonRefus; montant_min_fcfa?: number }
  | {
      valide: true;
      code_promo_id: string;
      pourcentage: number;
      libelle: string | null;
      montant_forfait_fcfa: number;
      remise_fcfa: number;
      a_payer_fcfa: number;
      plafond_remise_fcfa: number | null;
      acces_complet: boolean;
    };

const fcfa = (n: number) => `${n.toLocaleString("fr-FR").replace(/[  ]/g, " ")} FCFA`;

/**
 * Le message montré au client. Un code qui n'existe pas, qui est désactivé, expiré ou épuisé reçoit le MÊME message :
 * on ne dit pas à un inconnu quels codes existent. Les autres refus disent pourquoi, car le client détient déjà un vrai code.
 */
export function messagePourRaison(raison: RaisonRefus, montantMin?: number): string {
  switch (raison) {
    case "montant_trop_bas":
      return `Ce code s'applique à partir d'un forfait de ${fcfa(montantMin ?? 5000)}. Augmentez le montant pour en profiter.`;
    case "deja_utilise":
      return "Vous avez déjà utilisé ce code.";
    case "pays":
      return "Ce code n'est pas valable dans votre pays.";
    case "nouveaux_clients":
      return "Ce code est réservé aux nouveaux clients.";
    case "montant_invalide":
      return "Choisissez d'abord un montant de forfait.";
    default:
      return "Ce code n'existe pas ou n'est plus valable.";
  }
}

/** La phrase qui résume l'effet du code, pour l'écran de paiement. */
export function resumeRemise(c: Extract<CalculPromo, { valide: true }>): string {
  if (c.a_payer_fcfa === 0) return `Forfait offert : rien à payer (${fcfa(c.remise_fcfa)} de remise).`;
  return `Code appliqué : ${fcfa(c.remise_fcfa)} de remise${c.pourcentage < 100 ? ` (${c.pourcentage} %)` : ""}.`;
}
