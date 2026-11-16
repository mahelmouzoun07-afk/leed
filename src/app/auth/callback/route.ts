import { NextResponse, type NextRequest } from "next/server";
import { creerClientServeur } from "@/lib/supabase/server";
import { cheminRetourSur } from "@/lib/auth/redirection";
import { destinationApresConnexion } from "@/lib/auth/session";
import { env } from "@/lib/env";

/** Retour de Google (connexion « OAuth ») : échange le code contre une session. */
export async function GET(requete: NextRequest) {
  const base = (env().APP_URL ?? requete.nextUrl.origin).replace(/\/$/, "");
  const code = requete.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.redirect(`${base}/connexion/?erreur=google`);

  const supabase = await creerClientServeur();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return NextResponse.redirect(`${base}/connexion/?erreur=google`);

  const destination = await destinationApresConnexion(data.user, cheminRetourSur(requete.nextUrl.searchParams.get("next")));
  return NextResponse.redirect(`${base}${destination}`);
}
