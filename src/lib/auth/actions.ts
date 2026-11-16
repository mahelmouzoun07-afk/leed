"use server";

import { createHash, randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { creerClientServeur } from "../supabase/server";
import { creerClientAdmin } from "../supabase/admin";
import { env } from "../env";
import { log } from "../journal";
import { MSG_CONNEXION_REFUSEE, MSG_EMAIL_ENVOYE, MSG_GENERIQUE_ECHEC, MSG_TROP_DE_TENTATIVES } from "./messages";
import { CODES_PAYS } from "./pays";
import { schemaMotDePasse } from "./mot-de-passe";
import { cheminRetourSur } from "./redirection";
import { assurerEntreprise, destinationApresConnexion, exigerUtilisateur } from "./session";
import type { EtatFormulaire } from "./types";

/**
 * Actions d'authentification (Server Actions).
 *
 * RÈGLE : aucune réponse ne révèle si une adresse email a déjà un compte.
 *  - inscription, lien magique, mot de passe oublié : même message dans tous les cas ;
 *  - connexion : même message pour « adresse inconnue » et « mauvais mot de passe ».
 * Le test tests/unit/auth-enumeration.test.ts le vérifie.
 */


const email = z.string().trim().toLowerCase().email("Entrez une adresse email valide.").max(254);

// ───── Outils internes ───────────────────────────────────────────────────

async function ipHachee(): Promise<string> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "inconnue";
  return createHash("sha256").update(`${env().SEL_EMPREINTE_IP ?? "leed"}:${ip}`).digest("hex");
}

async function urlSite(): Promise<string> {
  const configuree = env().APP_URL;
  if (configuree) return configuree.replace(/\/$/, "");
  const h = await headers();
  const hote = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (hote.startsWith("localhost") ? "http" : "https");
  return `${proto}://${hote}`;
}

/**
 * Limite de fréquence (fonction SQL verifier_limite). Renvoie true si l'action est autorisée.
 * Sans clé de service (développement local), on ne limite pas, mais on le dit dans le journal.
 */
async function autorise(action: string, cles: string[], maximum: number, fenetre: string): Promise<boolean> {
  if (!env().SUPABASE_SERVICE_ROLE_KEY) {
    log.warn("auth.limite_ignoree", { action, raison: "SUPABASE_SERVICE_ROLE_KEY absente" });
    return true;
  }
  const admin = creerClientAdmin();
  for (const cle of cles) {
    const { data, error } = await admin.rpc("verifier_limite", { p_cle: cle, p_action: action, p_maximum: maximum, p_fenetre: fenetre });
    if (error) {
      log.error("auth.limite_erreur", { action, erreur: error.message });
      return true; // une panne de la limite ne doit pas bloquer tous les clients
    }
    if (data === false) return false;
  }
  return true;
}

function erreursZod(e: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of e.issues) {
    const cle = String(i.path[0] ?? "formulaire");
    if (!out[cle]) out[cle] = i.message;
  }
  return out;
}

const texte = (f: FormData, nom: string) => String(f.get(nom) ?? "");

// ───── Inscription ───────────────────────────────────────────────────────

const schemaAnalyse = z.object({
  entree: z.record(z.string(), z.unknown()),
  fiche: z.record(z.string(), z.unknown()).optional(),
  profils: z.array(z.record(z.string(), z.unknown())).max(20).optional(),
  apercu: z.record(z.string(), z.unknown()).optional(),
});

const schemaInscription = z.object({
  prenomNom: z.string().trim().min(2, "Entrez votre prénom et votre nom.").max(120),
  entreprise: z.string().trim().min(2, "Entrez le nom de votre entreprise : il apparaît dans vos messages.").max(120),
  email,
  motDePasse: schemaMotDePasse,
  whatsapp: z.string().trim().refine((v) => {
    const n = parsePhoneNumberFromString(v);
    return !!n && n.isPossible();
  }, "Entrez un numéro WhatsApp valide, avec l'indicatif, par exemple +229 01 23 45 67 89."),
  pays: z.enum(CODES_PAYS, "Choisissez votre pays."),
  cgu: z.literal("on", "Vous devez accepter les conditions pour continuer."),
});

/** Garde l'analyse faite avant l'inscription pour la rattacher au compte. Renvoie son jeton, ou null. */
async function sauvegarderAnalyse(brut: string, pays: string | null): Promise<string | null> {
  if (!brut || brut.length > 200_000) return null;
  try {
    const a = schemaAnalyse.parse(JSON.parse(brut));
    const jeton = randomBytes(32).toString("base64url");
    const mode = a.entree.mode === "formulaire" ? "formulaire" : "site";
    const { error } = await creerClientAdmin().from("analyses_anonymes").insert({
      jeton,
      mode,
      entree: a.entree as never,
      fiche: (a.fiche ?? null) as never,
      profils: (a.profils ?? null) as never,
      apercu: (a.apercu ?? null) as never,
      pays,
      ip_hash: await ipHachee(),
    });
    return error ? null : jeton;
  } catch {
    return null; // une analyse illisible ne doit jamais empêcher l'inscription
  }
}

export async function inscrire(_prev: EtatFormulaire, f: FormData): Promise<EtatFormulaire> {
  const lu = schemaInscription.safeParse({
    prenomNom: texte(f, "prenomNom"),
    entreprise: texte(f, "entreprise"),
    email: texte(f, "email"),
    motDePasse: texte(f, "motDePasse"),
    whatsapp: texte(f, "whatsapp"),
    pays: texte(f, "pays"),
    cgu: texte(f, "cgu"),
  });
  if (!lu.success) return { ok: false, erreurs: erreursZod(lu.error) };
  const d = lu.data;

  if (!(await autorise("inscription", [`ip:${await ipHachee()}`, `email:${d.email}`], 5, "1 hour"))) {
    return { ok: false, message: MSG_TROP_DE_TENTATIVES };
  }

  const pays = d.pays === "ZZ" ? null : d.pays;
  const jeton = await sauvegarderAnalyse(texte(f, "analyse"), pays);
  const [prenom, ...reste] = d.prenomNom.split(/\s+/);
  const telephone = parsePhoneNumberFromString(d.whatsapp)?.number ?? d.whatsapp;

  const supabase = await creerClientServeur();
  const { data, error } = await supabase.auth.signUp({
    email: d.email,
    password: d.motDePasse,
    options: {
      emailRedirectTo: `${await urlSite()}/auth/confirmer?next=${encodeURIComponent("/choisir/")}`,
      data: { prenom, nom: reste.join(" ") || null, telephone_whatsapp: telephone, entreprise_nom: d.entreprise, pays, analyse_jeton: jeton },
    },
  });

  // Une erreur n'est jamais détaillée : on ne dit pas « adresse déjà utilisée ».
  if (error) {
    log.warn("auth.inscription_erreur", { code: error.code ?? error.status });
    if (error.status === 429) return { ok: false, message: MSG_TROP_DE_TENTATIVES };
    if (error.code === "weak_password") return { ok: false, erreurs: { motDePasse: "Ce mot de passe est trop faible ou trop courant. Choisissez-en un autre." } };
    return { ok: true, etape: "verifier_email", message: MSG_EMAIL_ENVOYE };
  }

  // Si la confirmation d'email est désactivée côté Supabase, la session existe déjà.
  if (data.session && data.user) {
    await assurerEntreprise(data.user);
    redirect("/choisir/");
  }
  return { ok: true, etape: "verifier_email", message: MSG_EMAIL_ENVOYE };
}

// ───── Connexion ─────────────────────────────────────────────────────────

export async function connecter(_prev: EtatFormulaire, f: FormData): Promise<EtatFormulaire> {
  const adresse = email.safeParse(texte(f, "email"));
  const motDePasse = texte(f, "motDePasse");
  if (!adresse.success || motDePasse.length === 0) return { ok: false, message: MSG_CONNEXION_REFUSEE };

  if (!(await autorise("connexion", [`ip:${await ipHachee()}`, `email:${adresse.data}`], 8, "15 minutes"))) {
    return { ok: false, message: MSG_TROP_DE_TENTATIVES };
  }

  const supabase = await creerClientServeur();
  const { data, error } = await supabase.auth.signInWithPassword({ email: adresse.data, password: motDePasse });
  if (error || !data.user) {
    // Supabase ne renvoie « email non confirmé » qu'avec le BON mot de passe : on peut le dire sans rien révéler.
    if (error?.code === "email_not_confirmed") {
      return { ok: false, message: "Confirmez d'abord votre adresse avec le lien reçu par email, puis reconnectez-vous." };
    }
    return { ok: false, message: MSG_CONNEXION_REFUSEE };
  }

  if (env().SUPABASE_SERVICE_ROLE_KEY) {
    await creerClientAdmin().rpc("reinitialiser_limite", { p_cle: `email:${adresse.data}`, p_action: "connexion" });
  }
  redirect(await destinationApresConnexion(data.user, texte(f, "retour")));
}

// ───── Lien magique ──────────────────────────────────────────────────────

export async function envoyerLienMagique(_prev: EtatFormulaire, f: FormData): Promise<EtatFormulaire> {
  const adresse = email.safeParse(texte(f, "email"));
  if (!adresse.success) return { ok: false, erreurs: { email: "Entrez une adresse email valide." } };

  if (!(await autorise("lien_magique", [`ip:${await ipHachee()}`, `email:${adresse.data}`], 3, "1 hour"))) {
    return { ok: false, message: MSG_TROP_DE_TENTATIVES };
  }
  const supabase = await creerClientServeur();
  const retour = cheminRetourSur(texte(f, "retour"));
  // shouldCreateUser: false → un lien magique ne crée jamais de compte (l'inscription a son propre écran).
  const { error } = await supabase.auth.signInWithOtp({
    email: adresse.data,
    options: { shouldCreateUser: false, emailRedirectTo: `${await urlSite()}/auth/confirmer${retour ? `?next=${encodeURIComponent(retour)}` : ""}` },
  });
  if (error) log.warn("auth.lien_magique_erreur", { code: error.code ?? error.status });
  // Même réponse que l'adresse existe ou non, et même en cas d'erreur d'envoi.
  return { ok: true, etape: "verifier_email", message: MSG_EMAIL_ENVOYE };
}

// ───── Mot de passe oublié, puis nouveau mot de passe ────────────────────

export async function demanderReinitialisation(_prev: EtatFormulaire, f: FormData): Promise<EtatFormulaire> {
  const adresse = email.safeParse(texte(f, "email"));
  if (!adresse.success) return { ok: false, erreurs: { email: "Entrez une adresse email valide." } };

  if (!(await autorise("reinitialisation", [`ip:${await ipHachee()}`, `email:${adresse.data}`], 3, "1 hour"))) {
    return { ok: false, message: MSG_TROP_DE_TENTATIVES };
  }
  const supabase = await creerClientServeur();
  const { error } = await supabase.auth.resetPasswordForEmail(adresse.data, {
    redirectTo: `${await urlSite()}/auth/confirmer?next=${encodeURIComponent("/reinitialiser/")}`,
  });
  if (error) log.warn("auth.reinitialisation_erreur", { code: error.code ?? error.status });
  return { ok: true, etape: "verifier_email", message: MSG_EMAIL_ENVOYE };
}

export async function changerMotDePasse(_prev: EtatFormulaire, f: FormData): Promise<EtatFormulaire> {
  const user = await exigerUtilisateur("/reinitialiser/");
  const mdp = schemaMotDePasse.safeParse(texte(f, "motDePasse"));
  if (!mdp.success) return { ok: false, erreurs: { motDePasse: mdp.error.issues[0].message } };
  if (texte(f, "confirmation") !== mdp.data) return { ok: false, erreurs: { confirmation: "Les deux mots de passe ne sont pas identiques." } };

  const supabase = await creerClientServeur();
  const { error } = await supabase.auth.updateUser({ password: mdp.data });
  if (error) {
    if (error.code === "weak_password") return { ok: false, erreurs: { motDePasse: "Ce mot de passe est trop faible ou trop courant." } };
    if (error.code === "same_password") return { ok: false, erreurs: { motDePasse: "Choisissez un mot de passe différent de l'ancien." } };
    return { ok: false, message: MSG_GENERIQUE_ECHEC };
  }
  redirect(await destinationApresConnexion(user));
}

// ───── Google ────────────────────────────────────────────────────────────

export async function connexionGoogle(): Promise<void> {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${await urlSite()}/auth/callback` },
  });
  if (error || !data.url) redirect("/connexion/?erreur=google");
  redirect(data.url);
}

// ───── Compléter son profil (arrivée par Google : pas encore d'entreprise) ─

const schemaCompletion = z.object({
  entreprise: z.string().trim().min(2, "Entrez le nom de votre entreprise.").max(120),
  whatsapp: schemaInscription.shape.whatsapp,
  pays: schemaInscription.shape.pays,
});

export async function completerProfil(_prev: EtatFormulaire, f: FormData): Promise<EtatFormulaire> {
  const user = await exigerUtilisateur("/completer/");
  const lu = schemaCompletion.safeParse({ entreprise: texte(f, "entreprise"), whatsapp: texte(f, "whatsapp"), pays: texte(f, "pays") });
  if (!lu.success) return { ok: false, erreurs: erreursZod(lu.error) };

  const pays = lu.data.pays === "ZZ" ? null : lu.data.pays;
  const telephone = parsePhoneNumberFromString(lu.data.whatsapp)?.number ?? lu.data.whatsapp;
  const admin = creerClientAdmin();
  const { error: e1 } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, entreprise_nom: lu.data.entreprise, pays, telephone_whatsapp: telephone },
  });
  if (e1) return { ok: false, message: MSG_GENERIQUE_ECHEC };
  const { error: e2 } = await admin.rpc("creer_entreprise_inscription", { p_user: user.id });
  if (e2) return { ok: false, message: MSG_GENERIQUE_ECHEC };
  redirect("/choisir/");
}

// ───── Déconnexion ───────────────────────────────────────────────────────

export async function deconnecter(): Promise<void> {
  const supabase = await creerClientServeur();
  await supabase.auth.signOut();
  redirect("/");
}
