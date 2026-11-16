"use server";

import { z } from "zod";
import { contexteApp } from "../app/donnees";
import { confirmerPaiement, demarrerPaiement, type EtatPaiement } from "./service";
import { calculerRemise } from "./promo";
import { resumeRemise } from "../promo";
import { MONTANT_MIN } from "../forfait";
import { MONTANT_MAX_PAIEMENT } from "./reseaux";

/** Actions du paiement côté client. Chacune revérifie qui est connecté et à quelle entreprise il appartient. */
export type EtatFormPaiement = { ok?: boolean; message?: string; paiementId?: string; redirection?: string | null; gratuit?: boolean };

const schema = z.object({
  montant: z.coerce.number().int(),
  reseau: z.string().trim().min(2).max(40),
  telephone: z.string().trim().min(6).max(30),
  otp: z.string().trim().max(20).optional(),
  code: z.string().trim().max(40).optional(),
});

export async function payerForfait(_prev: EtatFormPaiement, f: FormData): Promise<EtatFormPaiement> {
  const ctx = await contexteApp();
  if (ctx.demo) return { ok: false, message: "Mode démonstration : aucun paiement n'est lancé." };

  // Un forfait offert par un code à 100 % n'a besoin ni d'opérateur ni de numéro : ces champs sont alors facultatifs, la base décide.
  const lu = schema.safeParse({ montant: f.get("montant"), reseau: f.get("reseau") || "aucun", telephone: f.get("telephone") || "000000", otp: f.get("otp") || undefined, code: f.get("code") || undefined });
  if (!lu.success) return { ok: false, message: "Vérifiez le montant, l'opérateur et votre numéro de téléphone." };

  const [entreprise, profil] = await Promise.all([
    ctx.sb.from("entreprises").select("pays").eq("id", ctx.entrepriseId).maybeSingle(),
    ctx.sb.from("profils").select("prenom, nom").eq("id", ctx.user.id).maybeSingle(),
  ]);
  const r = await demarrerPaiement({
    entrepriseId: ctx.entrepriseId,
    email: ctx.user.email ?? "",
    prenom: profil.data?.prenom ?? null,
    nom: profil.data?.nom ?? null,
    pays: entreprise.data?.pays ?? null,
    montant: lu.data.montant,
    reseau: lu.data.reseau,
    telephone: lu.data.telephone,
    otp: lu.data.otp,
    code: lu.data.code,
  });
  if (!r.ok) return { ok: false, message: r.erreur };
  return { ok: true, paiementId: r.donnees.paiementId, redirection: r.donnees.redirection, gratuit: r.donnees.gratuit };
}

/** Appelée à intervalles réguliers par la page de suivi : interroge SasPay et, si c'est payé, ouvre le forfait. */
export async function suivrePaiement(paiementId: string): Promise<{ etat: EtatPaiement }> {
  const ctx = await contexteApp();
  if (ctx.demo || !z.string().uuid().safeParse(paiementId).success) return { etat: "inconnu" };
  // La sécurité par ligne ne montre que les paiements de l'entreprise du client.
  const { data } = await ctx.sb.from("paiements").select("id").eq("id", paiementId).eq("entreprise_id", ctx.entrepriseId).maybeSingle();
  if (!data) return { etat: "inconnu" };
  try {
    const { etat } = await confirmerPaiement(paiementId);
    return { etat };
  } catch {
    return { etat: "en_attente" }; // SasPay ne répond pas : on réessaiera au prochain passage
  }
}

export type EtatCode = { ok: boolean; message: string; remise?: number; aPayer?: number; pourcentage?: number; accesComplet?: boolean; plafond?: number | null };

/**
 * Vérifie un code pour le montant choisi et dit ce que le client paierait. C'est une INFORMATION : au lancement du paiement,
 * la base recalcule tout. Un client qui modifierait cette réponse n'obtiendrait aucune remise de plus.
 */
export async function verifierCodePromo(code: string, montant: number): Promise<EtatCode> {
  const ctx = await contexteApp();
  if (ctx.demo) return { ok: false, message: "Mode démonstration : les codes promo ne sont pas actifs." };
  const m = Number(montant);
  if (!Number.isInteger(m) || m < MONTANT_MIN || m > MONTANT_MAX_PAIEMENT) return { ok: false, message: "Choisissez d'abord un montant de forfait." };
  const r = await calculerRemise(ctx.entrepriseId, String(code ?? ""), m);
  if (!r.ok) return { ok: false, message: r.erreur };
  const c = r.donnees;
  return { ok: true, message: resumeRemise(c), remise: c.remise_fcfa, aPayer: c.a_payer_fcfa, pourcentage: c.pourcentage, accesComplet: c.acces_complet, plafond: c.plafond_remise_fcfa };
}
