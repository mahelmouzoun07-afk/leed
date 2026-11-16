import { NextResponse, type NextRequest } from "next/server";
import { rafraichirSessionSupabase } from "@/lib/supabase/proxy";

/**
 * Proxy Next.js 16 (ancien « middleware »).
 *
 * 1. Rafraîchit la session Supabase à chaque requête.
 * 2. Renvoie vers la connexion tout visiteur non connecté qui demande un espace protégé.
 *
 * Ce proxy ne vérifie QUE « connecté ou non ». Le rôle administrateur, la double
 * authentification et l'appartenance à une entreprise sont revérifiés côté serveur,
 * page par page, dans src/lib/auth/session.ts : on ne fait jamais confiance au seul proxy.
 */
const ESPACES_PROTEGES = ["/app", "/admin", "/choisir", "/completer", "/reinitialiser"];
/** Pages de l'espace admin accessibles sans être connecté (la page de connexion elle-même). */
const PAGES_PUBLIQUES = ["/admin/connexion"];

function sansBarreFinale(chemin: string) {
  return chemin.length > 1 ? chemin.replace(/\/$/, "") : chemin;
}

function estProtege(chemin: string): boolean {
  const c = sansBarreFinale(chemin);
  if (PAGES_PUBLIQUES.includes(c)) return false;
  return ESPACES_PROTEGES.some((p) => c === p || c.startsWith(p + "/"));
}

export async function proxy(requete: NextRequest) {
  const chemin = requete.nextUrl.pathname;
  const session = await rafraichirSessionSupabase(requete);

  // Supabase pas configuré, ou pas connecté : on bloque les espaces protégés.
  if ((!session || !session.utilisateur) && estProtege(chemin)) {
    const vers = requete.nextUrl.clone();
    vers.search = "";
    if (sansBarreFinale(chemin).startsWith("/admin")) {
      vers.pathname = "/admin/connexion/";
    } else {
      vers.pathname = "/connexion/";
      vers.searchParams.set("retour", chemin);
    }
    return NextResponse.redirect(vers);
  }

  return session ? session.reponse : NextResponse.next();
}

/** Pas de proxy sur les fichiers statiques ni sur les webhooks (signés à part). */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|api/webhooks|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
