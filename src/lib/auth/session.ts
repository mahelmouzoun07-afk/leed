import "server-only";
import { redirect, notFound } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { creerClientServeur } from "../supabase/server";
import { creerClientAdmin } from "../supabase/admin";
import { cheminRetourSur } from "./redirection";

/**
 * Qui est connecté, et que peut-il voir ?
 *
 * Règle d'or : ne jamais faire confiance au seul proxy (src/proxy.ts), qui ne
 * vérifie que « connecté ou non ». Chaque page et chaque action de l'espace
 * protégé rappelle l'une de ces fonctions : le rôle et l'entreprise sont
 * revérifiés côté serveur à chaque requête.
 */

/** L'utilisateur connecté (vérifié auprès de Supabase), ou null. */
export async function utilisateurCourant(): Promise<User | null> {
  const supabase = await creerClientServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function exigerUtilisateur(retour?: string): Promise<User> {
  const user = await utilisateurCourant();
  if (!user) {
    const sur = cheminRetourSur(retour);
    redirect(sur ? `/connexion/?retour=${encodeURIComponent(sur)}` : "/connexion/");
  }
  return user;
}

/** L'entreprise de l'utilisateur (la RLS ne renvoie que la sienne), ou null. */
export async function entrepriseDe(user: User): Promise<{ id: string; nom: string } | null> {
  const supabase = await creerClientServeur();
  const { data } = await supabase
    .from("membres")
    .select("entreprise_id, entreprises(id, nom)")
    .eq("profil_id", user.id)
    .limit(1)
    .maybeSingle();
  const e = data?.entreprises;
  return e ? { id: e.id, nom: e.nom } : null;
}

export async function exigerEntreprise(): Promise<{ user: User; entreprise: { id: string; nom: string } }> {
  const user = await exigerUtilisateur("/app/");
  const entreprise = await entrepriseDe(user);
  if (!entreprise) redirect("/completer/");
  return { user, entreprise };
}

/**
 * Crée l'entreprise du client si elle n'existe pas encore, d'après ce qu'il a saisi
 * à l'inscription (fonction SQL rejouable). Renvoie son id, ou null s'il manque le nom
 * de l'entreprise (cas d'une inscription par Google : on le lui demandera).
 */
export async function assurerEntreprise(user: User): Promise<string | null> {
  const existante = await entrepriseDe(user);
  if (existante) return existante.id;
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  if (typeof meta?.entreprise_nom !== "string" || meta.entreprise_nom.trim() === "") return null;
  const admin = creerClientAdmin();
  const { data, error } = await admin.rpc("creer_entreprise_inscription", { p_user: user.id });
  if (error) throw new Error(`Création de l'entreprise impossible : ${error.message}`);
  return data;
}

/** Où envoyer le client après une connexion réussie. */
export async function destinationApresConnexion(user: User, retour?: string | null): Promise<string> {
  const entrepriseId = await assurerEntreprise(user);
  if (!entrepriseId) return "/completer/";
  const sur = cheminRetourSur(retour);
  if (sur) return sur;
  return "/app/";
}

// ───── Espace admin ──────────────────────────────────────────────────────

/** Le rôle administrateur de l'utilisateur. La RLS ne montre cette ligne qu'à un administrateur. */
export async function roleAdmin(user: User): Promise<{ role: "admin" | "support"; mfaExige: boolean } | null> {
  const supabase = await creerClientServeur();
  const { data } = await supabase.from("administrateurs").select("role, mfa_exige").eq("profil_id", user.id).maybeSingle();
  return data ? { role: data.role, mfaExige: data.mfa_exige } : null;
}

/**
 * Garde de l'espace admin, rappelée par CHAQUE page admin :
 *  1. pas connecté → connexion admin ;
 *  2. connecté mais pas administrateur → 404 (on ne révèle même pas que l'espace existe) ;
 *  3. administrateur sans double authentification validée → étape de vérification.
 */
export async function exigerAdmin(): Promise<{ user: User; role: "admin" | "support" }> {
  const user = await utilisateurCourant();
  if (!user) redirect("/admin/connexion/");
  const r = await roleAdmin(user);
  if (!r) notFound();
  if (r.mfaExige) {
    const supabase = await creerClientServeur();
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (data?.currentLevel !== "aal2") redirect("/admin/verification/");
  }
  return { user, role: r.role };
}
