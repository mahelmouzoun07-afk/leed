import "server-only";
import { z } from "zod";

/**
 * Variables d'environnement côté SERVEUR (secrets).
 * Ne jamais importer ce fichier depuis un composant client.
 *
 * Tout est optionnel ici : chaque chantier rend obligatoires, au moment de
 * s'en servir, les clés dont il a besoin (voir `exigerEnv`). Le site se lance
 * donc même quand une clé n'est pas encore là, et l'erreur dit laquelle manque.
 */
const schemaServeur = z.object({
  // Supabase (clé service_role : contourne la sécurité par ligne, JAMAIS au navigateur)
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  // URL publique du site, sans barre finale
  APP_URL: z
    .string()
    .url("APP_URL doit être une URL complète, par exemple http://localhost:3000")
    .optional(),

  // Emails d'authentification et reçus (chantier 4)
  RESEND_API_KEY: z.string().min(1).optional(),

  // IA (chantier 6) : une coquille interchangeable (src/lib/ia/client.ts). Par défaut Groq, gratuit, avec GROQ_API_KEY.
  IA_URL_BASE: z.string().url().optional(),
  IA_CLE_API: z.string().min(1).optional(),
  IA_MODELE_FORT: z.string().min(1).optional(),
  IA_MODELE_RAPIDE: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),

  // Tâches de fond (chantiers 6 et 8)
  TRIGGER_SECRET_KEY: z.string().min(1).optional(),

  // Connexion des comptes du client (chantier 7)
  UNIPILE_DSN: z.string().min(1).optional(),
  UNIPILE_API_KEY: z.string().min(1).optional(),
  UNIPILE_WEBHOOK_SECRET: z.string().min(1).optional(),

  // Transcription des notes vocales (chantier 9)
  GROQ_API_KEY: z.string().min(1).optional(),

  // Paiement Mobile Money (chantier 10)
  PAIEMENT_PRESTATAIRE: z.enum(["saspay", "saaspay", "fedapay"]).optional(),
  // SasPay : clé API (sk_test_... pour le bac à sable, sk_live_... pour le réel) et secret de signature des webhooks
  SASPAY_API_KEY: z.string().min(1).optional(),
  SASPAY_WEBHOOK_SECRET: z.string().min(1).optional(),
  FEDAPAY_SECRET_KEY: z.string().min(1).optional(),
  FEDAPAY_WEBHOOK_SECRET: z.string().min(1).optional(),
  FEDAPAY_ENV: z.enum(["sandbox", "live"]).optional(),

  // Limite de fréquence : sel du hachage des adresses IP (chantier 4)
  SEL_EMPREINTE_IP: z.string().min(8).optional(),

  NIVEAU_JOURNAL: z.enum(["debug", "info", "warn", "error"]).optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

type EnvServeur = z.infer<typeof schemaServeur>;

let cache: EnvServeur | null = null;

/** Lit et valide les variables du serveur. Message d'erreur en français. */
export function env(): EnvServeur {
  if (cache) return cache;

  const resultat = schemaServeur.safeParse(process.env);
  if (!resultat.success) {
    const problemes = resultat.error.issues
      .map((p) => `  - ${p.path.join(".") || "variable"} : ${p.message}`)
      .join("\n");
    throw new Error(
      `Les variables d'environnement du serveur sont invalides :\n${problemes}\n\n` +
        `Copie .env.example vers .env.local et renseigne les valeurs manquantes.`,
    );
  }

  cache = resultat.data;
  return cache;
}

/** Rend une variable obligatoire, à appeler par le chantier qui s'en sert. */
export function exigerEnv<K extends keyof EnvServeur>(cle: K): NonNullable<EnvServeur[K]> {
  const valeur = env()[cle];
  if (valeur === undefined || valeur === null || valeur === "") {
    throw new Error(
      `La variable d'environnement "${cle}" est requise pour cette fonctionnalité. ` +
        `Ajoute-la dans .env.local (voir .env.example).`,
    );
  }
  return valeur as NonNullable<EnvServeur[K]>;
}
