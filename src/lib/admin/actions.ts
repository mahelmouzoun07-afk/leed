"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { confirmerPaiement } from "../paiement/service";
import { contexteAdmin } from "./donnees";

/**
 * Actions de l'équipe. Chaque action rejoue la garde administrateur (connecté, rôle, double authentification),
 * et la base inscrit chaque écriture dans le journal d'audit. Un client qui appellerait ces actions n'obtiendrait rien.
 */
const uuid = z.string().uuid();
const lire = (f: FormData, nom: string) => String(f.get(nom) ?? "");

const MESSAGES: Record<string, string> = {
  motif_obligatoire: "Indiquez un motif (3 caractères au moins).",
  role_insuffisant: "Seul un administrateur peut offrir des entreprises.",
  nombre_invalide: "Le nombre doit être compris entre 1 et 500.",
  aucun_forfait_vivant: "Ce client n'a pas de forfait en cours.",
  client_inconnu: "Client introuvable.",
};

function retour(chemin: string, ok: boolean, erreur?: string): never {
  revalidatePath("/admin", "layout");
  const q = ok ? "ok=1" : `erreur=${encodeURIComponent(erreur ?? "Une erreur est survenue.")}`;
  redirect(`${chemin}?${q}`);
}

function messageErreur(message: string | undefined): string {
  const cle = Object.keys(MESSAGES).find((k) => message?.includes(k));
  return cle ? MESSAGES[cle] : "Une erreur est survenue.";
}

export async function suspendreEnvoi(f: FormData): Promise<void> {
  const ctx = await contexteAdmin();
  const id = uuid.safeParse(lire(f, "id"));
  if (!id.success) return;
  const chemin = `/admin/clients/${id.data}`;
  const { error } = await ctx.sb.rpc("admin_suspendre_envoi", { p_entreprise: id.data, p_suspendre: lire(f, "suspendre") === "true", p_motif: lire(f, "motif").trim() });
  retour(chemin, !error, messageErreur(error?.message));
}

export async function offrirEntreprises(f: FormData): Promise<void> {
  const ctx = await contexteAdmin();
  const id = uuid.safeParse(lire(f, "id"));
  const nombre = z.coerce.number().int().safeParse(lire(f, "nombre"));
  if (!id.success) return;
  const chemin = `/admin/clients/${id.data}`;
  if (!nombre.success) retour(chemin, false, MESSAGES.nombre_invalide);
  const { error } = await ctx.sb.rpc("admin_offrir_entreprises", { p_entreprise: id.data, p_nombre: nombre.data, p_motif: lire(f, "motif").trim() });
  retour(chemin, !error, messageErreur(error?.message));
}

export async function repondreTicket(f: FormData): Promise<void> {
  const ctx = await contexteAdmin();
  const id = uuid.safeParse(lire(f, "id"));
  const corps = z.string().trim().min(2).max(4000).safeParse(lire(f, "corps"));
  if (!id.success) return;
  const chemin = `/admin/support/${id.data}`;
  if (!corps.success) retour(chemin, false, "Écrivez votre réponse (2 caractères au moins).");
  const { error } = await ctx.sb.from("messages_ticket").insert({ ticket_id: id.data, auteur: "admin", auteur_id: ctx.user.id, corps: corps.data });
  if (error) retour(chemin, false);
  await ctx.sb.from("tickets_support").update({ statut: "attente_client" }).eq("id", id.data);
  await ctx.sb.rpc("admin_journaliser", { p_action: "repondre_ticket", p_cible_type: "ticket", p_cible_id: id.data, p_charge: {} });
  retour(chemin, true);
}

export async function resoudreTicket(f: FormData): Promise<void> {
  const ctx = await contexteAdmin();
  const id = uuid.safeParse(lire(f, "id"));
  if (!id.success) return;
  const chemin = `/admin/support/${id.data}`;
  const { error } = await ctx.sb.from("tickets_support").update({ statut: "resolu", resolu_le: new Date().toISOString() }).eq("id", id.data);
  if (error) retour(chemin, false);
  await ctx.sb.rpc("admin_journaliser", { p_action: "resoudre_ticket", p_cible_type: "ticket", p_cible_id: id.data, p_charge: {} });
  retour(chemin, true);
}

/** « Revérifier » un paiement en attente : interroge SasPay ; s'il est payé, le forfait s'ouvre (rejouable sans danger). */
export async function reverifierPaiement(f: FormData): Promise<void> {
  const ctx = await contexteAdmin();
  const id = uuid.safeParse(lire(f, "id"));
  if (!id.success) return;
  let etat = "erreur";
  try {
    etat = (await confirmerPaiement(id.data)).etat;
  } catch {
    /* SasPay ne répond pas : l'état reste inchangé */
  }
  await ctx.sb.rpc("admin_journaliser", { p_action: "reverifier_paiement", p_cible_type: "paiement", p_cible_id: id.data, p_charge: { etat } });
  retour("/admin/paiements", etat !== "erreur", "SasPay ne répond pas pour le moment. Réessayez dans quelques minutes.");
}
