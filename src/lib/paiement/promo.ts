import "server-only";
import { creerClientAdmin } from "../supabase/admin";
import { log } from "../journal";
import { echec, succes, type Resultat } from "../resultat";
import { formatCodeValide, messagePourRaison, normaliserCode, type CalculPromo } from "../promo";

export type RemiseValide = Extract<CalculPromo, { valide: true }>;

/**
 * Calcule la remise d'un code pour une entreprise et un montant de forfait. C'est LA BASE qui calcule (fonction calculer_code_promo) :
 * le navigateur ne fournit que le code et le montant choisi, jamais un prix. Appelée à la fois par l'écran (pour afficher la remise)
 * et par le lancement du paiement (qui la recalcule : ce que l'écran a montré ne compte pas).
 * Limite : 40 vérifications par heure et par entreprise, contre quelqu'un qui essaierait des codes au hasard.
 */
export async function calculerRemise(entrepriseId: string, code: string, montant: number): Promise<Resultat<RemiseValide>> {
  if (!formatCodeValide(code)) return echec(messagePourRaison("inconnu"), "inconnu");

  const admin = creerClientAdmin();
  const { data: autorise } = await admin.rpc("verifier_limite", { p_cle: `promo:${entrepriseId}`, p_action: "verifier_code_promo", p_maximum: 40, p_fenetre: "1 hour" });
  if (autorise === false) return echec("Trop d'essais de codes. Patientez avant de réessayer.", "trop_de_tentatives");

  const { data, error } = await admin.rpc("calculer_code_promo", { p_entreprise: entrepriseId, p_code: normaliserCode(code), p_montant: montant });
  if (error || !data) {
    log.error("promo.calcul_impossible", { erreur: error?.message });
    return echec("Le code n'a pas pu être vérifié. Réessayez dans un instant.", "base");
  }
  const calcul = data as unknown as CalculPromo;
  if (!calcul.valide) return echec(messagePourRaison(calcul.raison, calcul.montant_min_fcfa), calcul.raison);
  return succes(calcul);
}

/** Réserve le code pour ce paiement, sous verrou : deux paiements simultanés ne dépassent pas le maximum d'utilisations. */
export async function reserverCode(entrepriseId: string, code: string, montant: number, paiementId: string): Promise<Resultat<RemiseValide>> {
  const { data, error } = await creerClientAdmin().rpc("reserver_code_promo", { p_entreprise: entrepriseId, p_code: normaliserCode(code), p_montant: montant, p_paiement: paiementId });
  if (error || !data) {
    log.error("promo.reservation_impossible", { erreur: error?.message });
    return echec("Le code n'a pas pu être appliqué. Réessayez dans un instant.", "base");
  }
  const calcul = data as unknown as CalculPromo;
  if (!calcul.valide) return echec(messagePourRaison(calcul.raison, calcul.montant_min_fcfa), calcul.raison);
  return succes(calcul);
}
