import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { envPublic, supabaseEstConfigure } from "../env-public";

/**
 * Rafraîchit la session Supabase à chaque requête (sans cela la session se
 * perd sans bruit). Appelé par src/proxy.ts, le « proxy » de Next.js 16.
 *
 * Renvoie `null` si Supabase n'est pas encore configuré : le site doit pouvoir
 * se lancer et se montrer avant que la base existe.
 */
export async function rafraichirSessionSupabase(requete: NextRequest) {
  if (!supabaseEstConfigure()) return null;
  const e = envPublic();

  let reponse = NextResponse.next({ request: requete });

  const client = createServerClient(e.NEXT_PUBLIC_SUPABASE_URL!, e.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return requete.cookies.getAll();
      },
      setAll(aEcrire) {
        for (const { name, value } of aEcrire) requete.cookies.set(name, value);
        reponse = NextResponse.next({ request: requete });
        for (const { name, value, options } of aEcrire) reponse.cookies.set(name, value, options);
      },
    },
  });

  const {
    data: { user },
  } = await client.auth.getUser();

  return { reponse, utilisateur: user };
}
