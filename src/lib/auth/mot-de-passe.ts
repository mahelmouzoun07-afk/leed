import { z } from "zod";

/**
 * Règle du mot de passe d'un client : 8 caractères au moins, avec une majuscule,
 * une minuscule, un chiffre et un symbole (exemple valide : « Dadit906,5 »).
 *
 * Pas de plafond à 12 : un plafond interdit les phrases de passe longues et ne
 * protège rien. 72 est la limite technique du hachage de Supabase.
 * Les mêmes règles sont à régler côté Supabase (Authentication → Sign In / Providers).
 */
export const MOT_DE_PASSE_MIN = 8;
export const MOT_DE_PASSE_MAX = 72;

export const REGLES_MOT_DE_PASSE = [
  { id: "longueur", libelle: `${MOT_DE_PASSE_MIN} caractères au moins`, ok: (s: string) => s.length >= MOT_DE_PASSE_MIN },
  { id: "majuscule", libelle: "une majuscule", ok: (s: string) => /\p{Lu}/u.test(s) },
  { id: "minuscule", libelle: "une minuscule", ok: (s: string) => /\p{Ll}/u.test(s) },
  { id: "chiffre", libelle: "un chiffre", ok: (s: string) => /\p{N}/u.test(s) },
  { id: "symbole", libelle: "un symbole (par exemple , . ! ? # @)", ok: (s: string) => /[^\p{L}\p{N}]/u.test(s) },
] as const;

/** Les règles que ce mot de passe ne respecte pas encore. */
export function reglesManquantes(motDePasse: string) {
  return REGLES_MOT_DE_PASSE.filter((r) => !r.ok(motDePasse));
}

export const schemaMotDePasse = z
  .string()
  .max(MOT_DE_PASSE_MAX, `Le mot de passe ne peut pas dépasser ${MOT_DE_PASSE_MAX} caractères.`)
  .superRefine((valeur, ctx) => {
    const manque = reglesManquantes(valeur);
    if (manque.length > 0) {
      ctx.addIssue({ code: "custom", message: `Le mot de passe doit contenir ${manque.map((r) => r.libelle).join(", ")}.` });
    }
  });
