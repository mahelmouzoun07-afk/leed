"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { creerClientServeur } from "../supabase/server";
import { log } from "../journal";
import { MSG_CONNEXION_REFUSEE, MSG_GENERIQUE_ECHEC } from "./messages";
import { roleAdmin, utilisateurCourant } from "./session";
import type { EtatFormulaire } from "./types";

/**
 * Connexion de l'équipe leed : un autre espace, une autre adresse (/admin/connexion).
 * Même message d'échec pour « adresse inconnue », « mauvais mot de passe » et
 * « compte non administrateur » : on ne révèle pas qui est administrateur.
 */

const schemaConnexion = z.object({ email: z.string().trim().toLowerCase().email(), motDePasse: z.string().min(1) });

export async function connecterAdmin(_prev: EtatFormulaire, f: FormData): Promise<EtatFormulaire> {
  const lu = schemaConnexion.safeParse({ email: f.get("email"), motDePasse: f.get("motDePasse") });
  if (!lu.success) return { ok: false, message: MSG_CONNEXION_REFUSEE };

  const supabase = await creerClientServeur();
  const { data, error } = await supabase.auth.signInWithPassword({ email: lu.data.email, password: lu.data.motDePasse });
  if (error || !data.user) return { ok: false, message: MSG_CONNEXION_REFUSEE };

  const role = await roleAdmin(data.user);
  if (!role) {
    await supabase.auth.signOut();
    log.warn("admin.connexion_refusee", { raison: "pas administrateur" });
    return { ok: false, message: MSG_CONNEXION_REFUSEE };
  }
  redirect("/admin/verification/");
}

/** Prépare l'application d'authentification : renvoie le QR code et la clé à saisir à la main. */
export async function preparerTotp(): Promise<{ ok: boolean; message?: string; qrCode?: string; secret?: string; facteurId?: string }> {
  const user = await utilisateurCourant();
  if (!user || !(await roleAdmin(user))) return { ok: false, message: MSG_CONNEXION_REFUSEE };
  const supabase = await creerClientServeur();

  // Les facteurs jamais validés sont supprimés : un seul reste à la fois.
  const { data: liste } = await supabase.auth.mfa.listFactors();
  for (const fa of liste?.all ?? []) {
    if (fa.factor_type === "totp" && fa.status === "unverified") await supabase.auth.mfa.unenroll({ factorId: fa.id });
  }
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Application d'authentification" });
  if (error || !data) return { ok: false, message: MSG_GENERIQUE_ECHEC };
  return { ok: true, qrCode: data.totp.qr_code, secret: data.totp.secret, facteurId: data.id };
}

const schemaCode = z.object({ code: z.string().trim().regex(/^\d{6}$/, "Entrez les 6 chiffres affichés par votre application."), facteurId: z.string().min(1) });

/** Valide le code à 6 chiffres (première activation ou connexion suivante) : la session passe au niveau aal2. */
export async function verifierTotp(_prev: EtatFormulaire, f: FormData): Promise<EtatFormulaire> {
  const user = await utilisateurCourant();
  if (!user || !(await roleAdmin(user))) redirect("/admin/connexion/");
  const lu = schemaCode.safeParse({ code: f.get("code"), facteurId: f.get("facteurId") });
  if (!lu.success) return { ok: false, erreurs: { code: lu.error.issues[0].message } };

  const supabase = await creerClientServeur();
  const { data: defi, error: e1 } = await supabase.auth.mfa.challenge({ factorId: lu.data.facteurId });
  if (e1 || !defi) return { ok: false, message: MSG_GENERIQUE_ECHEC };
  const { error: e2 } = await supabase.auth.mfa.verify({ factorId: lu.data.facteurId, challengeId: defi.id, code: lu.data.code });
  if (e2) return { ok: false, erreurs: { code: "Ce code n'est pas bon, ou il a expiré. Réessayez avec le code actuel." } };
  redirect("/admin/");
}

export async function deconnecterAdmin(): Promise<void> {
  const supabase = await creerClientServeur();
  await supabase.auth.signOut();
  redirect("/admin/connexion/");
}
