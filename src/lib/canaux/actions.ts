"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { contexteApp } from "../app/donnees";
import { creerClientAdmin } from "../supabase/admin";
import { debrancherCompte, creerLienDeConnexion } from "./service";
import { estCanal } from "./types";

/**
 * Actions de l'espace client pour ses comptes. Chacune revérifie qui est connecté et à quelle entreprise il appartient ;
 * le forfait payant et la limite de comptes sont revérifiés par la base, jamais par l'écran.
 */
const lire = (f: FormData, nom: string) => String(f.get(nom) ?? "");

function retourPage(chemin: string, erreur: string): never {
  redirect(`${chemin}?erreur=${encodeURIComponent(erreur)}`);
}

/** Le client a lu l'avertissement et l'a accepté : on le garde (journal), puis on l'envoie chez Unipile relier son compte. */
export async function connecterCompte(f: FormData): Promise<void> {
  const canal = lire(f, "canal");
  if (!estCanal(canal)) redirect("/app/comptes");
  const page = `/app/comptes/connecter/${canal}`;
  const ctx = await contexteApp();
  if (ctx.demo) retourPage(page, "Mode démonstration : aucune connexion n'est lancée.");
  if (lire(f, "accepte") !== "on") retourPage(page, "Cochez la case pour confirmer que vous avez compris, puis continuez.");

  const rebrancher = lire(f, "rebrancher");
  if (rebrancher && !z.string().uuid().safeParse(rebrancher).success) redirect("/app/comptes");

  const r = await creerLienDeConnexion({ entrepriseId: ctx.entrepriseId, utilisateurId: ctx.user.id, canal, rebrancherCompteId: rebrancher || undefined });
  if (!r.ok) retourPage(page, r.erreur);

  await creerClientAdmin().from("journal_evenements").insert({ entreprise_id: ctx.entrepriseId, acteur: "client", action: "avertissement_connexion_accepte", cible_type: "canal", charge: { canal, rebrancher: !!rebrancher } });
  redirect(r.donnees.url);
}

export async function debrancherMonCompte(f: FormData): Promise<void> {
  const id = z.string().uuid().safeParse(lire(f, "id"));
  if (!id.success) redirect("/app/comptes");
  const ctx = await contexteApp();
  if (ctx.demo) retourPage("/app/comptes", "Mode démonstration : aucun compte n'est débranché.");
  const r = await debrancherCompte(id.data, "demande du client", ctx.entrepriseId);
  revalidatePath("/app/comptes");
  if (!r.ok) retourPage("/app/comptes", r.erreur);
  redirect("/app/comptes?debranche=1");
}
