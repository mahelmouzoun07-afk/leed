import { NextResponse, type NextRequest } from "next/server";
import { rafraichirSessionSupabase } from "@/lib/supabase/proxy";

/**
 * Proxy Next.js 16 (ancien « middleware »).
 *
 * 1. Rafraîchit la session Supabase à chaque requête.
 * 2. Renvoie vers /connexion tout visiteur non connecté qui demande l'espace
 *    client (/app) ou l'espace admin (/admin).
 *
 * Deux espaces, deux préfixes : une seule règle à surveiller par espace.
 * Ce proxy ne vérifie QUE « connecté ou non ». Le rôle administrateur et
 * l'appartenance à une entreprise sont revérifiés côté serveur, page par
 * page (chantier 4) : on ne fait jamais confiance au seul proxy.
 */
const ESPACES_PROTEGES = ["/app", "/admin"];

function estProtege(chemin: string): boolean {
  return ESPACES_PROTEGES.some((p) => chemin === p || chemin.startsWith(p + "/"));
}

export async function proxy(requete: NextRequest) {
  const chemin = requete.nextUrl.pathname;
  const session = await rafraichirSessionSupabase(requete);

  // Supabase pas configuré, ou pas connecté : on bloque les espaces protégés.
  if ((!session || !session.utilisateur) && estProtege(chemin)) {
    const vers = requete.nextUrl.clone();
    vers.pathname = "/connexion";
    vers.search = "";
    vers.searchParams.set("retour", chemin);
    return NextResponse.redirect(vers);
  }

  return session ? session.reponse : NextResponse.next();
}

/** Pas de proxy sur les fichiers statiques ni sur les webhooks (signés à part). */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|api/webhooks|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
