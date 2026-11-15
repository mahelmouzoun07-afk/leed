import "server-only";
import { createClient } from "@supabase/supabase-js";
import { exigerEnv } from "../env";
import { exigerEnvPublic } from "../env-public";

/**
 * Client Supabase ADMIN : clé `service_role`, CONTOURNE la sécurité par ligne.
 *
 * À utiliser seulement dans les tâches de fond, les webhooks et les scripts.
 * L'import de "server-only" fait échouer la compilation si ce fichier est
 * importé depuis un composant client : la clé ne peut pas finir dans le
 * navigateur.
 */
export function creerClientAdmin() {
  return createClient(
    exigerEnvPublic("NEXT_PUBLIC_SUPABASE_URL"),
    exigerEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
