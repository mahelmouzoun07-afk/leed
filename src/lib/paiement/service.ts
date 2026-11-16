import "server-only";
import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";
import { creerClientAdmin } from "../supabase/admin";
import { log } from "../journal";
import { echec, succes, type Resultat } from "../resultat";
import { MONTANT_MIN } from "../forfait";
import { MONTANT_MAX_PAIEMENT, deviseDuPays, exigeCodeOtp, reseauxDuPays, type Reseau } from "./reseaux";
import { ErreurSasPay, lancerSoftpay, lireReseaux, verifierPaiement, type ReseauSasPay } from "./saspay";
import { calculerRemise, reserverCode, type RemiseValide } from "./promo";

/**
 * Le paiement d'un forfait, de bout en bout. Deux fonctions :
 *  - demarrerPaiement : crée le paiement « en attente » chez nous, puis demande à SasPay de le pousser sur le téléphone ;
 *  - confirmerPaiement : interroge SasPay (la seule source de vérité) et, sur SUCCESS seulement, ouvre le forfait.
 *    Appelée par le webhook, par la page de suivi du client et par le bouton « Revérifier » de l'équipe : rejouable sans danger.
 *
 * Le montant crédité vient TOUJOURS de notre base, jamais du client ni du contenu d'un message reçu.
 */

let cacheReseaux: { a: number; liste: ReseauSasPay[] } | null = null;
const DUREE_CACHE_MS = 10 * 60_000;

/** Vide la mémoire des opérateurs (utile aux tests, et après un changement chez SasPay). */
export function viderCacheReseaux(): void {
  cacheReseaux = null;
}

async function reseauxSasPay(): Promise<ReseauSasPay[]> {
  if (cacheReseaux && Date.now() - cacheReseaux.a < DUREE_CACHE_MS) return cacheReseaux.liste;
  const liste = await lireReseaux();
  cacheReseaux = { a: Date.now(), liste };
  return liste;
}

/** Les opérateurs de SasPay pour le pays du client, ou null si SasPay ne répond pas. */
export async function reseauxPourPays(pays: string | null | undefined): Promise<Reseau[] | null> {
  try {
    return reseauxDuPays(await reseauxSasPay(), pays);
  } catch (e) {
    log.error("paiement.reseaux_indisponibles", { erreur: e instanceof Error ? e.message : String(e) });
    return null;
  }
}

function messageClient(e: ErreurSasPay): string {
  if (e.statutHttp === 429) return "Trop de demandes. Patientez une minute avant de réessayer.";
  if (e.statutHttp === 401 || e.statutHttp === 403) return "Le paiement est momentanément indisponible. Notre équipe est prévenue.";
  if (e.code === "prepayment_otp_missing") return "Cet opérateur demande un code à usage unique : générez-le sur votre téléphone, puis recommencez.";
  if (e.code === "insufficient_balance") return "Le solde de votre compte mobile est insuffisant.";
  if (e.statutHttp === 422 || e.statutHttp === 400) return "L'opérateur a refusé la demande. Vérifiez votre numéro et le montant, puis réessayez.";
  return "Le paiement n'a pas pu être lancé. Réessayez dans un instant ou choisissez un autre opérateur.";
}

export type EntreePaiement = {
  entrepriseId: string;
  email: string;
  prenom: string | null;
  nom: string | null;
  pays: string | null;
  /** La valeur du forfait choisi (avant remise). Ce que le client PAIE est calculé ici, jamais fourni par lui. */
  montant: number;
  reseau: string;
  telephone: string;
  otp?: string;
  /** Un code promo, s'il en a saisi un. */
  code?: string;
};

export type DepartPaiement = { paiementId: string; redirection: string | null; gratuit: boolean };

/**
 * Lance un paiement. Avec un code promo : la base recalcule la remise (celle de l'écran ne compte pas), le prix payé est le prix remisé,
 * et le forfait ouvert a la valeur du forfait CHOISI. Si la remise couvre tout (code à 100 %), aucun paiement Mobile Money n'est lancé :
 * le forfait est ouvert tout de suite, avec toutes les fonctionnalités.
 */
export async function demarrerPaiement(e: EntreePaiement): Promise<Resultat<DepartPaiement>> {
  if (!Number.isInteger(e.montant) || e.montant < MONTANT_MIN) return echec(`Le montant minimum est de ${MONTANT_MIN.toLocaleString("fr-FR")} FCFA.`, "montant_trop_bas");
  if (e.montant > MONTANT_MAX_PAIEMENT) return echec(`Un paiement ne peut pas dépasser ${MONTANT_MAX_PAIEMENT.toLocaleString("fr-FR")} FCFA. Pour plus, écrivez-nous.`, "montant_trop_haut");

  // 1. Le prix : remisé par un code valide, sinon le montant choisi.
  let promo: RemiseValide | null = null;
  if (e.code?.trim()) {
    const r = await calculerRemise(e.entrepriseId, e.code, e.montant);
    if (!r.ok) return echec(r.erreur, r.code);
    promo = r.donnees;
  }
  const aPayer = promo ? promo.a_payer_fcfa : e.montant;
  const gratuit = aPayer === 0;

  // 2. Le moyen de paiement : seulement s'il y a quelque chose à payer.
  let devise: string | null = null;
  let telephone: string | null = null;
  if (!gratuit) {
    devise = deviseDuPays(e.pays);
    if (!devise || !e.pays) return echec("Le paiement n'est pas encore disponible dans votre pays. Écrivez-nous depuis la page Support.", "pays_non_pris_en_charge");
    const tel = parsePhoneNumberFromString(e.telephone, e.pays as CountryCode);
    if (!tel || !tel.isPossible()) return echec("Entrez le numéro de votre compte Mobile Money, avec ou sans l'indicatif.", "telephone_invalide");
    telephone = tel.number;
    if (exigeCodeOtp(e.reseau) && !e.otp?.trim()) return echec("Cet opérateur demande un code à usage unique : générez-le sur votre téléphone et saisissez-le.", "otp_manquant");
    const reseaux = await reseauxPourPays(e.pays);
    if (!reseaux) return echec("Le paiement est momentanément indisponible. Réessayez dans quelques minutes.", "reseaux_indisponibles");
    if (!reseaux.some((r) => r.code === e.reseau)) return echec("Cet opérateur n'est pas disponible dans votre pays.", "reseau_inconnu");
  }

  const admin = creerClientAdmin();
  const { data: autorise } = await admin.rpc("verifier_limite", { p_cle: `paiement:${e.entrepriseId}`, p_action: "paiement", p_maximum: 6, p_fenetre: "1 hour" });
  if (autorise === false) return echec("Trop de tentatives de paiement. Patientez avant de réessayer.", "trop_de_tentatives");

  const { data: ligne, error: erreurBase } = await admin
    .from("paiements")
    .insert({
      entreprise_id: e.entrepriseId,
      montant_fcfa: aPayer,
      montant_forfait_fcfa: promo ? e.montant : null,
      remise_fcfa: promo ? promo.remise_fcfa : 0,
      code_promo_id: promo ? promo.code_promo_id : null,
      moyen: gratuit ? "code_promo" : e.reseau,
      prestataire: gratuit ? "code_promo" : "saspay",
      statut: "en_attente",
    })
    .select("id")
    .single();
  if (erreurBase || !ligne) {
    log.error("paiement.creation_impossible", { erreur: erreurBase?.message });
    return echec("Le paiement n'a pas pu être préparé. Réessayez dans un instant.", "base");
  }

  // 3. Le code est RÉSERVÉ sous verrou (deux paiements en même temps ne dépassent pas son maximum) ; libéré si le paiement échoue.
  if (promo && e.code) {
    const reserve = await reserverCode(e.entrepriseId, e.code, e.montant, ligne.id);
    if (!reserve.ok) {
      await admin.from("paiements").update({ statut: "echoue", details: { erreur: "code_promo_refuse", code: reserve.code } }).eq("id", ligne.id).eq("statut", "en_attente");
      return echec(reserve.erreur, reserve.code);
    }
  }

  // 4. Rien à payer : le forfait s'ouvre tout de suite.
  if (gratuit) {
    const { data: passe } = await admin.from("paiements").update({ statut: "reussi", confirme_le: new Date().toISOString(), details: { gratuit: true } }).eq("id", ligne.id).eq("statut", "en_attente").select("id");
    if (passe && passe.length > 0) {
      await admin.from("journal_evenements").insert({ entreprise_id: e.entrepriseId, acteur: "systeme", action: "forfait_offert_code_promo", cible_type: "paiement", cible_id: ligne.id, charge: { valeur: e.montant } });
    }
    await ouvrirForfait(e.entrepriseId, e.montant, ligne.id); // si cela échoue, la page de suivi le rejoue (acheter_forfait est rejouable)
    return succes({ paiementId: ligne.id, redirection: null, gratuit: true });
  }

  // 5. Paiement Mobile Money du montant remisé.
  try {
    // Une clé d'idempotence par intention : si ce même paiement est rejoué, SasPay ne débite pas deux fois.
    const r = await lancerSoftpay({
      montant: aPayer,
      devise: devise as string,
      pays: e.pays as string,
      reseau: e.reseau,
      description: "Forfait leed",
      client: { email: e.email, first_name: e.prenom?.trim() || "Client", last_name: e.nom?.trim() || "leed", phone: telephone as string },
      otp: e.otp?.trim() || undefined,
      idempotence: ligne.id,
      metadata: { paiement_id: ligne.id, entreprise_id: e.entrepriseId },
    });
    await admin.from("paiements").update({ reference_prestataire: r.id, details: { checkout_url: r.checkout_url ?? null } }).eq("id", ligne.id);
    return succes({ paiementId: ligne.id, redirection: r.checkout_url?.trim() ? r.checkout_url : null, gratuit: false });
  } catch (erreur) {
    const err = erreur instanceof ErreurSasPay ? erreur : new ErreurSasPay("Erreur inconnue", 0);
    log.error("paiement.softpay_refuse", { statut: err.statutHttp, code: err.code });
    await admin.from("paiements").update({ statut: "echoue", details: { erreur: err.message, http: err.statutHttp } }).eq("id", ligne.id).eq("statut", "en_attente");
    return echec(messageClient(err), err.code ?? "softpay");
  }
}

export type EtatPaiement = "reussi" | "echoue" | "en_attente" | "inconnu";

/** Interroge SasPay et, si le paiement a réussi et correspond, ouvre le forfait (une seule fois). */
export async function confirmerPaiement(paiementId: string): Promise<{ etat: EtatPaiement; alerte?: string }> {
  const admin = creerClientAdmin();
  const { data: p } = await admin.from("paiements").select("id, entreprise_id, montant_fcfa, montant_forfait_fcfa, statut, reference_prestataire, prestataire").eq("id", paiementId).maybeSingle();
  if (!p) return { etat: "inconnu" };
  // La valeur du forfait à ouvrir : celle du forfait choisi (avant remise), enregistrée par nous au lancement du paiement.
  const valeur = p.montant_forfait_fcfa ?? p.montant_fcfa;

  // Déjà confirmé (Mobile Money ou code promo à 100 %) : on s'assure seulement que le forfait existe (acheter_forfait est rejouable).
  if (p.statut === "reussi") {
    await ouvrirForfait(p.entreprise_id, valeur, p.id);
    return { etat: "reussi" };
  }
  if (p.prestataire !== "saspay") return { etat: "inconnu" };
  if (p.statut !== "en_attente") return { etat: p.statut === "echoue" ? "echoue" : "inconnu" };
  if (!p.reference_prestataire) return { etat: "en_attente" };

  const v = await verifierPaiement(p.reference_prestataire);

  if (v.status === "SUCCESS") {
    // Le montant que SasPay a encaissé doit être EXACTEMENT celui que nous attendions (le prix remisé, s'il y a un code).
    if (Math.round(Number(v.requested_amount)) !== p.montant_fcfa) {
      log.error("paiement.montant_different", { paiement: p.id, attendu: p.montant_fcfa, recu: v.requested_amount });
      await admin.from("paiements").update({ statut: "echoue", details: { alerte: "montant_different", verification: v } }).eq("id", p.id).eq("statut", "en_attente");
      return { etat: "echoue", alerte: "montant_different" };
    }
    const { data: passe } = await admin
      .from("paiements")
      .update({ statut: "reussi", confirme_le: new Date().toISOString(), details: { verification: v } })
      .eq("id", p.id)
      .eq("statut", "en_attente")
      .select("id");
    if (passe && passe.length > 0) {
      // Frais à notre charge : on les range dans les coûts du mois du client.
      const frais = Math.round(Number(v.requested_amount) - Number(v.net_amount));
      if (Number.isFinite(frais) && frais > 0) await admin.rpc("ajouter_cout_client", { p_entreprise: p.entreprise_id, p_poste: "paiement", p_montant: frais });
      await admin.from("journal_evenements").insert({ entreprise_id: p.entreprise_id, acteur: "systeme", action: "paiement_confirme", cible_type: "paiement", cible_id: p.id, charge: { montant: p.montant_fcfa } });
    }
    await ouvrirForfait(p.entreprise_id, valeur, p.id);
    return { etat: "reussi" };
  }

  if (v.status === "FAILED" || v.status === "CANCELLED") {
    await admin.from("paiements").update({ statut: "echoue", details: { verification: v } }).eq("id", p.id).eq("statut", "en_attente");
    return { etat: "echoue" };
  }
  return { etat: "en_attente" }; // PENDING : on ne livre rien
}

async function ouvrirForfait(entrepriseId: string, montant: number, paiementId: string): Promise<boolean> {
  const { error } = await creerClientAdmin().rpc("acheter_forfait", { p_entreprise: entrepriseId, p_montant: montant, p_paiement: paiementId });
  if (error) log.error("paiement.forfait_non_ouvert", { paiement: paiementId, erreur: error.message });
  return !error;
}
