"use server";

import { z } from "zod";
import { contexteApp } from "../app/donnees";
import { confirmerPaiement, demarrerPaiement, type EtatPaiement } from "./service";

/** Actions du paiement côté client. Chacune revérifie qui est connecté et à quelle entreprise il appartient. */
export type EtatFormPaiement = { ok?: boolean; message?: string; paiementId?: string; redirection?: string | null };

const schema = z.object({
  montant: z.coerce.number().int(),
  reseau: z.string().trim().min(2).max(40),
  telephone: z.string().trim().min(6).max(30),
  otp: z.string().trim().max(20).optional(),
});

export async function payerForfait(_prev: EtatFormPaiement, f: FormData): Promise<EtatFormPaiement> {
  const ctx = await contexteApp();
  if (ctx.demo) return { ok: false, message: "Mode démonstration : aucun paiement n'est lancé." };

  const lu = schema.safeParse({ montant: f.get("montant"), reseau: f.get("reseau"), telephone: f.get("telephone"), otp: f.get("otp") || undefined });
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
  });
  if (!r.ok) return { ok: false, message: r.erreur };
  return { ok: true, paiementId: r.donnees.paiementId, redirection: r.donnees.redirection };
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
