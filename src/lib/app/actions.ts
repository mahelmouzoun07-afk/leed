"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { creerClientAdmin } from "../supabase/admin";
import { contexteApp } from "./donnees";
import { AUTONOMIE_PAR_NIVEAU, LIGNES_AUTONOMIE, type CleAutonomie } from "./vues";

/**
 * Actions du tableau de bord. Chacune revérifie qui est connecté et à quelle entreprise il appartient
 * (jamais de confiance au formulaire), et ne fait rien en mode démonstration.
 * Ce que la sécurité par ligne autorise au client (réglages, pause de campagne, exclusions, note) passe
 * par son propre client ; le reste (répondre à une décision, statut d'un prospect) passe par le serveur
 * APRÈS avoir vérifié que la ligne appartient bien à son entreprise.
 */

const uuid = z.string().uuid();
const lire = (f: FormData, nom: string) => String(f.get(nom) ?? "");

function terminer(chemin: string): never {
  revalidatePath("/app", "layout");
  redirect(`${chemin}${chemin.includes("?") ? "&" : "?"}ok=1`);
}

// ───── Décisions ─────────────────────────────────────────────────────────

export async function repondreDecision(f: FormData): Promise<void> {
  const ctx = await contexteApp();
  if (ctx.demo) terminer("/app/decisions");
  const id = uuid.safeParse(lire(f, "id"));
  const cle = z.string().min(1).max(40).safeParse(lire(f, "cle"));
  if (!id.success || !cle.success) return;

  const { data: d } = await ctx.sb.from("decisions").select("id, options").eq("id", id.data).eq("entreprise_id", ctx.entrepriseId).eq("statut", "ouverte").maybeSingle();
  if (!d) terminer("/app/decisions");
  const permises = Array.isArray(d.options) ? (d.options as { cle?: string }[]).map((o) => o.cle) : [];
  if (permises.length > 0 && !permises.includes(cle.data)) return;

  await creerClientAdmin()
    .from("decisions")
    .update({ statut: "repondue", reponse: { cle: cle.data, retenir: lire(f, "retenir") === "on" }, repondu_par: ctx.user.id, repondu_le: new Date().toISOString() })
    .eq("id", d.id)
    .eq("entreprise_id", ctx.entrepriseId)
    .eq("statut", "ouverte");
  terminer("/app/decisions");
}

// ───── Campagnes et pause de l'agent ─────────────────────────────────────

export async function basculerCampagne(f: FormData): Promise<void> {
  const ctx = await contexteApp();
  const id = uuid.safeParse(lire(f, "id"));
  const pause = lire(f, "pause") === "true";
  if (ctx.demo || !id.success) terminer("/app/campagnes");
  await ctx.sb.from("campagnes").update({ statut: pause ? "en_pause" : "active" }).eq("id", id.data).eq("entreprise_id", ctx.entrepriseId);
  terminer("/app/campagnes");
}

/** Le bouton « Pause » de l'accueil : met en pause toutes les campagnes actives, ou les reprend. */
export async function basculerAgent(f: FormData): Promise<void> {
  const ctx = await contexteApp();
  if (ctx.demo) terminer("/app");
  const pause = lire(f, "pause") === "true";
  await ctx.sb.from("campagnes").update({ statut: pause ? "en_pause" : "active" }).eq("entreprise_id", ctx.entrepriseId).eq("statut", pause ? "active" : "en_pause");
  terminer("/app");
}

// ───── Conversations et prospects ────────────────────────────────────────

export async function prendreLaMain(f: FormData): Promise<void> {
  const ctx = await contexteApp();
  const id = uuid.safeParse(lire(f, "id"));
  const reprise = lire(f, "reprise") === "true";
  if (ctx.demo || !id.success) terminer("/app/conversations");
  await ctx.sb.from("conversations").update({ reprise_par_client: reprise }).eq("id", id.data).eq("entreprise_id", ctx.entrepriseId);
  terminer(`/app/conversations/${id.data}`);
}

export async function noterProspect(f: FormData): Promise<void> {
  const ctx = await contexteApp();
  const id = uuid.safeParse(lire(f, "id"));
  const note = lire(f, "note").slice(0, 2000);
  if (ctx.demo || !id.success) terminer("/app/prospects");
  await ctx.sb.from("prospects").update({ note_client: note || null }).eq("id", id.data).eq("entreprise_id", ctx.entrepriseId);
  terminer(`/app/prospects/${id.data}`);
}

/** « Ne plus contacter » : le client exclut l'entreprise et l'agent ne lui écrit plus. */
export async function neplusContacter(f: FormData): Promise<void> {
  const ctx = await contexteApp();
  const id = uuid.safeParse(lire(f, "id"));
  if (ctx.demo || !id.success) terminer("/app/prospects");
  const { data: p } = await ctx.sb.from("prospects").select("id, nom").eq("id", id.data).eq("entreprise_id", ctx.entrepriseId).maybeSingle();
  if (!p) terminer("/app/prospects");
  await ctx.sb.from("exclusions_client").upsert({ entreprise_id: ctx.entrepriseId, type: "nom", valeur: p.nom, motif: "Ne plus contacter (depuis la fiche prospect)" }, { onConflict: "entreprise_id,type,valeur", ignoreDuplicates: true });
  await creerClientAdmin().from("prospects").update({ statut: "epuise" }).eq("id", p.id).eq("entreprise_id", ctx.entrepriseId);
  terminer(`/app/prospects/${p.id}`);
}

export async function marquerSigne(f: FormData): Promise<void> {
  const ctx = await contexteApp();
  const id = uuid.safeParse(lire(f, "id"));
  if (ctx.demo || !id.success) terminer("/app/prospects");
  const { data: p } = await ctx.sb.from("prospects").select("id").eq("id", id.data).eq("entreprise_id", ctx.entrepriseId).maybeSingle();
  if (!p) terminer("/app/prospects");
  const { data: rdv } = await ctx.sb.from("rendez_vous").select("id").eq("prospect_id", p.id).order("debut", { ascending: false }).limit(1).maybeSingle();
  if (rdv) await creerClientAdmin().from("rendez_vous").update({ resultat: "signe" }).eq("id", rdv.id).eq("entreprise_id", ctx.entrepriseId);
  terminer(`/app/prospects/${p.id}`);
}

// ───── Réglages ──────────────────────────────────────────────────────────

async function consignesActuelles(ctx: Awaited<ReturnType<typeof contexteApp>>): Promise<Record<string, unknown>> {
  const { data } = await ctx.sb.from("entreprises").select("consignes").eq("id", ctx.entrepriseId).maybeSingle();
  const c = data?.consignes;
  return c && typeof c === "object" && !Array.isArray(c) ? (c as Record<string, unknown>) : {};
}

export async function enregistrerAutonomie(f: FormData): Promise<void> {
  const ctx = await contexteApp();
  if (ctx.demo) terminer("/app/reglages/autonomie");
  const niveau = z.enum(["prudent", "equilibre", "autonome"]).safeParse(lire(f, "niveau"));
  if (!niveau.success) terminer("/app/reglages/autonomie");
  const lignes: Record<string, "agent" | "moi"> = { ...AUTONOMIE_PAR_NIVEAU[niveau.data] };
  // Le réglage ligne par ligne ne s'applique que si le client reste sur le niveau déjà choisi.
  if (lire(f, "detail") === "oui") {
    for (const [cle] of LIGNES_AUTONOMIE) {
      const v = lire(f, `ligne_${cle}`);
      if (v === "agent" || v === "moi") lignes[cle as CleAutonomie] = v;
    }
  }
  const consignes = await consignesActuelles(ctx);
  await ctx.sb.from("entreprises").update({ consignes: { ...consignes, autonomie: { niveau: niveau.data, lignes } } }).eq("id", ctx.entrepriseId);
  terminer("/app/reglages/autonomie");
}

export async function enregistrerMessages(f: FormData): Promise<void> {
  const ctx = await contexteApp();
  if (ctx.demo) terminer("/app/reglages/messages");
  const consignes = await consignesActuelles(ctx);
  await ctx.sb
    .from("entreprises")
    .update({
      nom_affiche: lire(f, "nomAffiche").trim().slice(0, 120) || null,
      consignes: { ...consignes, prix: lire(f, "prix").trim().slice(0, 600), interdits: lire(f, "interdits").trim().slice(0, 600) },
    })
    .eq("id", ctx.entrepriseId);
  terminer("/app/reglages/messages");
}

export async function enregistrerAlertes(f: FormData): Promise<void> {
  const ctx = await contexteApp();
  if (ctx.demo) terminer("/app/reglages/alertes");
  const heure = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
  const debut = heure.safeParse(lire(f, "debut"));
  const fin = heure.safeParse(lire(f, "fin"));
  const consignes = await consignesActuelles(ctx);
  await ctx.sb
    .from("entreprises")
    .update({ consignes: { ...consignes, alertes: { whatsapp: lire(f, "whatsapp") === "on", email: lire(f, "email") === "on", debut: debut.success ? debut.data : "08:00", fin: fin.success ? fin.data : "19:00" } } })
    .eq("id", ctx.entrepriseId);
  terminer("/app/reglages/alertes");
}

export async function ajouterExclusion(f: FormData): Promise<void> {
  const ctx = await contexteApp();
  if (ctx.demo) terminer("/app/reglages/exclusions");
  const type = z.enum(["domaine", "nom", "identifiant"]).safeParse(lire(f, "type"));
  const valeur = z.string().trim().min(2).max(160).safeParse(lire(f, "valeur"));
  if (!type.success || !valeur.success) terminer("/app/reglages/exclusions");
  await ctx.sb.from("exclusions_client").upsert({ entreprise_id: ctx.entrepriseId, type: type.data, valeur: valeur.data }, { onConflict: "entreprise_id,type,valeur", ignoreDuplicates: true });
  terminer("/app/reglages/exclusions");
}

export async function supprimerExclusion(f: FormData): Promise<void> {
  const ctx = await contexteApp();
  const id = uuid.safeParse(lire(f, "id"));
  if (ctx.demo || !id.success) terminer("/app/reglages/exclusions");
  await ctx.sb.from("exclusions_client").delete().eq("id", id.data).eq("entreprise_id", ctx.entrepriseId);
  terminer("/app/reglages/exclusions");
}
