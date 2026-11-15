import { z } from "zod";

/**
 * Variables PUBLIQUES (préfixe NEXT_PUBLIC_) : elles finissent dans le code
 * envoyé au navigateur. Jamais de secret ici.
 */
const schemaPublic = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url("NEXT_PUBLIC_SUPABASE_URL doit être une URL complète")
    .optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
});

type EnvPublic = z.infer<typeof schemaPublic>;

let cache: EnvPublic | null = null;

export function envPublic(): EnvPublic {
  if (cache) return cache;

  // Next.js remplace les NEXT_PUBLIC_* à la compilation : on doit les écrire
  // en toutes lettres, pas avec process.env[cle].
  const brut = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || undefined,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || undefined,
  };

  const resultat = schemaPublic.safeParse(brut);
  if (!resultat.success) {
    const problemes = resultat.error.issues
      .map((p) => `  - ${p.path.join(".") || "variable"} : ${p.message}`)
      .join("\n");
    throw new Error(
      `Les variables d'environnement publiques sont invalides :\n${problemes}\n\n` +
        `Copie .env.example vers .env.local et renseigne les valeurs manquantes.`,
    );
  }

  cache = resultat.data;
  return cache;
}

/** Vrai si Supabase est configuré (le site doit pouvoir se lancer sans). */
export function supabaseEstConfigure(): boolean {
  const e = envPublic();
  return Boolean(e.NEXT_PUBLIC_SUPABASE_URL && e.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function exigerEnvPublic<K extends keyof EnvPublic>(cle: K): NonNullable<EnvPublic[K]> {
  const valeur = envPublic()[cle];
  if (valeur === undefined || valeur === null || valeur === "") {
    throw new Error(
      `La variable d'environnement publique "${cle}" est requise. ` +
        `Ajoute-la dans .env.local (voir .env.example).`,
    );
  }
  return valeur as NonNullable<EnvPublic[K]>;
}
