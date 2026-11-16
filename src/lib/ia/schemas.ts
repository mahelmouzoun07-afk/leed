import { z } from "zod";

/**
 * Les formes que l'IA a le droit de produire. Tout ce qui sort d'elle est vérifié contre ces schémas :
 * un champ trop long, un nombre d'éléments faux ou un type inattendu est refusé et corrigé (voir json.ts).
 */

const court = (max: number) => z.string().trim().min(1).max(max);
const listeDe = (max: number, taille: number, min = 0) => z.array(court(max)).min(min).max(taille);

/** La fiche de l'activité du client. Même forme que `Fiche` dans parcours/types.ts. */
export const schemaFiche = z.object({
  nom: court(120),
  resume: court(500),
  offres: listeDe(90, 6, 1),
  zone: court(120),
  forces: listeDe(90, 5),
  concurrents: listeDe(80, 5),
});
export type FicheIA = z.infer<typeof schemaFiche>;

export const schemaProfils = z.object({
  profils: z
    .array(z.object({ nom: court(90), raison: court(140), note: z.number().int().min(0).max(100) }))
    .min(3)
    .max(5),
});

/** Ce que l'IA tire d'un prospect. `accroche` vaut null quand rien de précis n'a été trouvé : alors on n'écrit pas. */
export const schemaAnalyseProspect = z.object({
  accroche: z.string().trim().min(1).max(220).nullable(),
  pourquoiMaintenant: z.string().trim().max(240).nullable(),
  faitsCites: listeDe(160, 4),
});
export type AnalyseProspect = z.infer<typeof schemaAnalyseProspect>;

export const schemaMessage = z.object({
  objet: z.string().trim().max(90).nullable(),
  texte: court(1200),
});
export type MessageRedige = z.infer<typeof schemaMessage>;

export const schemaRelecture = z.object({
  conforme: z.boolean(),
  problemes: z.array(z.string().trim().max(200)).max(8),
});
