import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { creerClientServeur } from "@/lib/supabase/server";
import { cheminRetourSur } from "@/lib/auth/redirection";
import { destinationApresConnexion } from "@/lib/auth/session";
import { env } from "@/lib/env";

/**
 * Retour des liens reçus par email (confirmation d'inscription, lien magique, mot de passe oublié).
 * Le modèle d'email de Supabase pointe ici avec `token_hash` et `type` : le lien fonctionne même
 * s'il est ouvert sur un autre appareil que celui de l'inscription (le client lit souvent ses
 * emails sur son téléphone).
 */
const TYPES_VALIDES: EmailOtpType[] = ["signup", "magiclink", "recovery", "email", "invite", "email_change"];

export async function GET(requete: NextRequest) {
  const base = (env().APP_URL ?? requete.nextUrl.origin).replace(/\/$/, "");
  const p = requete.nextUrl.searchParams;
  const tokenHash = p.get("token_hash");
  const type = p.get("type") as EmailOtpType | null;
  const suite = cheminRetourSur(p.get("next"));

  if (!tokenHash || !type || !TYPES_VALIDES.includes(type)) {
    return NextResponse.redirect(`${base}/connexion/?erreur=lien`);
  }

  const supabase = await creerClientServeur();
  const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  if (error || !data.user) return NextResponse.redirect(`${base}/connexion/?erreur=lien`);

  // Mot de passe oublié : on envoie vers le formulaire du nouveau mot de passe.
  if (type === "recovery") return NextResponse.redirect(`${base}/reinitialiser/`);

  const destination = await destinationApresConnexion(data.user, suite);
  return NextResponse.redirect(`${base}${destination}`);
}
