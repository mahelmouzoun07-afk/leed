import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { exigerEnvPublic } from "../env-public";

/**
 * Client Supabase pour un composant serveur, une Server Action ou une route.
 * Il respecte la sécurité par ligne (clé « anon ») et lit la session dans les
 * cookies. À créer une fois par requête, jamais à la racine d'un module.
 *
 * Les types de la base seront ajoutés au chantier 3 (génération depuis le
 * schéma) : d'ici là, le client n'est pas typé.
 */
export async function creerClientServeur() {
  const biscuits = await cookies();

  return createServerClient(
    exigerEnvPublic("NEXT_PUBLIC_SUPABASE_URL"),
    exigerEnvPublic("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return biscuits.getAll();
        },
        setAll(aEcrire) {
          try {
            for (const { name, value, options } of aEcrire) {
              biscuits.set(name, value, options);
            }
          } catch {
            // Appelé depuis un composant serveur : pas d'écriture de cookie
            // possible. Le proxy rafraîchit déjà la session, on peut ignorer.
          }
        },
      },
    },
  );
}
