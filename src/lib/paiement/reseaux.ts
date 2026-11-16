/**
 * Pays, devises et opérateurs pour le paiement Mobile Money. Pur et sans secret : utilisable aussi côté navigateur.
 * Nos prix sont en FCFA ; un pays hors zone FCFA n'est pas encore pris en charge.
 */

const XOF = ["BJ", "CI", "SN", "TG", "ML", "BF", "NE", "GW"];
const XAF = ["CM", "GA", "CG", "TD", "CF", "GQ"];

/** La devise de paiement pour un pays (1 XOF = 1 XAF = 1 FCFA), ou null si le pays n'est pas en zone FCFA. */
export function deviseDuPays(pays: string | null | undefined): "XOF" | "XAF" | null {
  const p = (pays ?? "").toUpperCase();
  if (XOF.includes(p)) return "XOF";
  if (XAF.includes(p)) return "XAF";
  return null;
}

export type Reseau = { code: string; nom: string };

/** Le code d'un réseau SasPay se termine par le pays : « mtn_bj », « wave_sn »… */
export function paysDuReseau(code: string): string | null {
  const m = /_([a-z]{2})$/i.exec(code);
  return m ? m[1].toUpperCase() : null;
}

/** Garde les réseaux actifs du pays du client. */
export function reseauxDuPays(tous: { code: string; name: string; is_active?: boolean }[], pays: string | null | undefined): Reseau[] {
  const p = (pays ?? "").toUpperCase();
  return tous
    .filter((r) => r.is_active !== false && paysDuReseau(r.code) === p)
    .map((r) => ({ code: r.code, nom: r.name || nomLisible(r.code) }))
    .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
}

const NOMS: Record<string, string> = { mtn: "MTN MoMo", moov: "Moov Money", wave: "Wave", orange: "Orange Money", celtiis: "Celtiis Cash", airtel: "Airtel Money", free: "Free Money", djamo: "Djamo" };

/** Un nom lisible pour un code de réseau, quand SasPay n'en donne pas. */
export function nomLisible(code: string): string {
  const base = code.split("_")[0].toLowerCase();
  return NOMS[base] ?? code.toUpperCase();
}

/** Certains réseaux demandent un code à usage unique généré par le client avant le paiement (Orange Money Côte d'Ivoire et Burkina Faso). */
export function exigeCodeOtp(code: string): boolean {
  return /^orange_(ci|bf)$/i.test(code);
}

export const MONTANT_MAX_PAIEMENT = 500_000;
