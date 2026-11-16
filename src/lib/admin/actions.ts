"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { confirmerPaiement } from "../paiement/service";
import { formatCodeValide, genererCode } from "../promo";
import { creerClientAdmin } from "../supabase/admin";
import { debrancherComptesSansForfait, declarerWebhooks, envoyerMessageDeTest, listerComptesDistants, synchroniserComptes } from "../canaux/service";
import { identifiantWhatsApp } from "../canaux/regles";
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

// ───── Codes promo ─────────────────────────────────────────────────────────

const MESSAGES_PROMO: Record<string, string> = {
  role_insuffisant: "Seul un administrateur peut gérer les codes promo.",
  code_invalide: "Le code doit faire de 8 à 12 caractères, avec des lettres et des chiffres seulement.",
  code_existe: "Ce code existe déjà. Choisissez-en un autre.",
  pourcentage_invalide: "La réduction doit être comprise entre 1 et 100 %.",
  plafond_obligatoire: "Un code à 100 % exige un plafond de remise d'au moins 5 000 FCFA : c'est la valeur maximale du forfait offert.",
  plafond_invalide: "Le plafond de remise doit être d'au moins 100 FCFA.",
  dates_invalides: "La date de fin doit être après la date de début.",
  maximum_invalide: "Les nombres d'utilisations doivent être d'au moins 1.",
  code_inconnu: "Code introuvable.",
};

function messagePromo(message: string | undefined): string {
  const cle = Object.keys(MESSAGES_PROMO).find((k) => message?.includes(k));
  return cle ? MESSAGES_PROMO[cle] : "Une erreur est survenue.";
}

/** Un champ numérique facultatif : vide = null, sinon un entier (ou NaN, refusé plus bas). */
function entierOuNul(f: FormData, nom: string): number | null {
  const v = lire(f, nom).trim();
  return v === "" ? null : Number(v);
}

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** Une date de formulaire (« 2026-12-31 ») devient le début ou la fin de cette journée, heure de Cotonou, Dakar ou Abidjan (UTC+0/+1 : on prend UTC). */
function debutDeJournee(d: string) {
  return `${d}T00:00:00.000Z`;
}
function finDeJournee(d: string) {
  return `${d}T23:59:59.000Z`;
}

const PAYS_CODES = ["BJ", "SN", "CI", "TG"];

export async function creerCodePromo(f: FormData): Promise<void> {
  const ctx = await contexteAdmin();
  const chemin = "/admin/codes-promo";
  const echecForm = (message: string): never => retour(chemin, false, message);

  const pourcentage = entierOuNul(f, "pourcentage");
  if (pourcentage === null || !Number.isInteger(pourcentage)) return echecForm(MESSAGES_PROMO.pourcentage_invalide);
  const plafond = entierOuNul(f, "plafond");
  if (plafond !== null && !Number.isInteger(plafond)) return echecForm(MESSAGES_PROMO.plafond_invalide);
  const montantMin = entierOuNul(f, "montant_min") ?? 5000;
  const maxTotal = entierOuNul(f, "max_utilisations");
  const maxEntreprise = entierOuNul(f, "max_par_entreprise") ?? 1;
  if (!Number.isInteger(montantMin) || montantMin < 0 || (maxTotal !== null && !Number.isInteger(maxTotal)) || !Number.isInteger(maxEntreprise)) return echecForm(MESSAGES_PROMO.maximum_invalide);

  const debut = lire(f, "debut").trim();
  const fin = lire(f, "fin").trim();
  if ((debut && !date.safeParse(debut).success) || (fin && !date.safeParse(fin).success)) return echecForm(MESSAGES_PROMO.dates_invalides);
  const pays = f.getAll("pays").map(String).filter((p) => PAYS_CODES.includes(p));

  // Un code vide est généré ; un code saisi est nettoyé (espaces retirés). Si le code généré existe déjà, on en tire un autre.
  const saisi = lire(f, "code").replace(/\s+/g, "").toUpperCase();
  for (let essai = 0; essai < 5; essai++) {
    const code = saisi || genererCode(10);
    if (!formatCodeValide(code)) return echecForm(MESSAGES_PROMO.code_invalide);
    const { error } = await ctx.sb.rpc("admin_creer_code_promo", {
      p_code: code,
      p_libelle: lire(f, "libelle").trim().slice(0, 120),
      p_pourcentage: pourcentage,
      p_plafond: plafond as number,
      p_montant_min: montantMin,
      p_debut: debut ? debutDeJournee(debut) : new Date().toISOString(),
      p_fin: (fin ? finDeJournee(fin) : null) as string,
      p_max_utilisations: maxTotal as number,
      p_max_par_entreprise: maxEntreprise,
      p_nouveaux_seulement: lire(f, "nouveaux") === "on",
      p_pays: pays,
    });
    if (!error) {
      revalidatePath("/admin", "layout");
      redirect(`${chemin}?ok=1&nouveau=${encodeURIComponent(code)}`);
    }
    if (saisi || !error.message.includes("code_existe")) return echecForm(messagePromo(error.message));
  }
  return echecForm("Impossible de générer un code libre. Réessayez.");
}

/** Désactiver, réactiver ou ajuster un code (libellé, date de fin, maximum). Le pourcentage et le plafond ne changent jamais : on désactive et on en crée un autre. */
export async function modifierCodePromo(f: FormData): Promise<void> {
  const ctx = await contexteAdmin();
  const chemin = "/admin/codes-promo";
  const id = uuid.safeParse(lire(f, "id"));
  if (!id.success) return;
  const fin = lire(f, "fin").trim();
  if (fin && !date.safeParse(fin).success) retour(chemin, false, MESSAGES_PROMO.dates_invalides);
  const max = entierOuNul(f, "max_utilisations");
  if (max !== null && !Number.isInteger(max)) retour(chemin, false, MESSAGES_PROMO.maximum_invalide);
  const actif = lire(f, "actif");
  const { error } = await ctx.sb.rpc("admin_modifier_code_promo", {
    p_id: id.data,
    p_libelle: lire(f, "libelle").trim().slice(0, 120),
    p_fin: (fin ? (fin.includes("T") ? fin : finDeJournee(fin)) : null) as string,
    p_max_utilisations: max as number,
    p_actif: actif === "true" ? true : actif === "false" ? false : (null as unknown as boolean),
  });
  retour(chemin, !error, messagePromo(error?.message));
}

// ───── Unipile (page de l'équipe) ──────────────────────────────────────────

const RIEN = "00000000-0000-0000-0000-000000000000";

function retourInfo(chemin: string, info: string): never {
  revalidatePath("/admin", "layout");
  redirect(`${chemin}?ok=1&info=${encodeURIComponent(info.slice(0, 400))}`);
}

async function exigerAdminSeulement(chemin: string) {
  const ctx = await contexteAdmin();
  if (ctx.role !== "admin") retour(chemin, false, "Seul un administrateur peut faire cela.");
  return ctx;
}

/** Déclare chez Unipile les deux adresses qui nous préviennent (messages reçus, état des comptes). Sans doublon. */
export async function declarerLesWebhooks(): Promise<void> {
  const chemin = "/admin/unipile";
  const ctx = await exigerAdminSeulement(chemin);
  const r = await declarerWebhooks();
  await ctx.sb.rpc("admin_journaliser", { p_action: "declarer_webhooks_unipile", p_cible_type: "unipile", p_cible_id: RIEN, p_charge: { ok: r.ok } });
  if (!r.ok) retour(chemin, false, r.erreur);
  const { crees, existants, erreurs } = r.donnees;
  if (erreurs.length > 0) retour(chemin, false, `Échec : ${erreurs.join(" ; ")}`);
  retourInfo(chemin, `Webhooks : ${crees.length} créé(s) (${crees.join(", ") || "aucun"}), ${existants.length} déjà présent(s).`);
}

/** Compare Unipile et notre base : applique les états, repère les comptes facturés qui ne servent à rien. */
export async function synchroniserLesComptes(): Promise<void> {
  const chemin = "/admin/unipile";
  const ctx = await exigerAdminSeulement(chemin);
  const r = await synchroniserComptes();
  await ctx.sb.rpc("admin_journaliser", { p_action: "synchroniser_comptes_unipile", p_cible_type: "unipile", p_cible_id: RIEN, p_charge: { ok: r.ok } });
  if (!r.ok) retour(chemin, false, r.erreur);
  const { synchronises, orphelins, manquants } = r.donnees;
  retourInfo(chemin, `${synchronises} compte(s) synchronisé(s), ${manquants} disparu(s) chez Unipile, ${orphelins.length} compte(s) chez Unipile inconnu(s) de leed (facturés : à supprimer depuis le tableau de bord Unipile si ce sont des essais).`);
}

/** Fin de forfait : débranche chez Unipile les comptes des entreprises sans forfait payant en cours (ils ne coûtent plus rien). */
export async function debrancherLesComptesExpires(): Promise<void> {
  const chemin = "/admin/unipile";
  const ctx = await exigerAdminSeulement(chemin);
  const r = await debrancherComptesSansForfait();
  await ctx.sb.rpc("admin_journaliser", { p_action: "debrancher_comptes_expires", p_cible_type: "unipile", p_cible_id: RIEN, p_charge: { debranches: r.debranches, echecs: r.echecs } });
  retourInfo(chemin, `${r.debranches} compte(s) débranché(s)${r.echecs > 0 ? `, ${r.echecs} échec(s) à rejouer` : ""}.`);
}

/**
 * Test d'envoi (docs/UNIPILE.md §7) : un message à SOI-MÊME depuis un compte connecté, pour vérifier l'envoi et la réception.
 * Réservé aux administrateurs, limité à 10 par heure, inscrit au journal d'audit. WhatsApp et email seulement.
 */
export async function envoyerTestUnipile(f: FormData): Promise<void> {
  const chemin = "/admin/unipile";
  const ctx = await exigerAdminSeulement(chemin);
  const compteId = lire(f, "compte").trim();
  const destinataire = lire(f, "destinataire").trim();
  const texte = z.string().trim().min(3).max(300).safeParse(lire(f, "texte"));
  if (!compteId || !destinataire || !texte.success) retour(chemin, false, "Choisissez un compte, un destinataire et un message de 3 à 300 caractères.");

  const { data: autorise } = await creerClientAdmin().rpc("verifier_limite", { p_cle: `test-unipile:${ctx.user.id}`, p_action: "test_envoi_unipile", p_maximum: 10, p_fenetre: "1 hour" });
  if (autorise === false) retour(chemin, false, "Trop de tests d'envoi cette heure.");

  const comptes = await listerComptesDistants();
  if (!comptes.ok) retour(chemin, false, comptes.erreur);
  const compte = comptes.donnees.find((c) => c.id === compteId);
  if (!compte || (compte.canal !== "whatsapp" && compte.canal !== "email")) retour(chemin, false, "Ce compte ne peut pas servir au test (WhatsApp ou email seulement).");
  if (compte.canal === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(destinataire)) retour(chemin, false, "Adresse email invalide.");
  if (compte.canal === "whatsapp" && !identifiantWhatsApp(destinataire)) retour(chemin, false, "Numéro WhatsApp invalide (avec l'indicatif, par exemple +229...).");

  const r = await envoyerMessageDeTest({ compteId, canal: compte.canal, destinataire, texte: texte.data, objet: "Test leed" });
  await ctx.sb.rpc("admin_journaliser", { p_action: "test_envoi_unipile", p_cible_type: "unipile", p_cible_id: RIEN, p_charge: { canal: compte.canal, ok: r.ok } });
  if (!r.ok) retour(chemin, false, r.erreur);
  retourInfo(chemin, `Message envoyé (${compte.canal}). Vérifiez qu'il arrive, puis répondez-y : la réponse doit apparaître dans « Événements » ci-dessous.`);
}
