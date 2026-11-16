import type { CanalRedaction } from "./prompts";

/**
 * Le choix du canal, EN CODE et pas par l'IA (règles de VISION.md §5), puis pondéré par les taux de réponse mesurés.
 * Le client ne connecte que certains canaux : on ne propose jamais un canal qu'il n'a pas relié, ni qu'on ne peut pas joindre.
 */

export type TypeProspect = "local" | "instagram_seul" | "structure" | "occidental";

/** Les voies par lesquelles on peut joindre CE prospect, selon l'annuaire. */
export type Joignable = Partial<Record<CanalRedaction, boolean>>;

const ORDRE: Record<TypeProspect, CanalRedaction[]> = {
  local: ["WhatsApp", "Instagram"],
  instagram_seul: ["Instagram", "WhatsApp"],
  structure: ["Email", "LinkedIn", "WhatsApp"],
  occidental: ["LinkedIn", "Email"],
};

/** Ce qu'on sait des résultats passés d'un canal : assez de messages pour que le taux compte. */
export type Taux = Partial<Record<CanalRedaction, { envoyes: number; reponses: number }>>;
const ECHANTILLON_MIN = 50;

export function choisirCanal(a: { type: TypeProspect; joignable: Joignable; connectes: Joignable; taux?: Taux }): CanalRedaction | null {
  const candidats = ORDRE[a.type].filter((c) => a.joignable[c] && a.connectes[c]);
  if (candidats.length === 0) return null;
  if (!a.taux) return candidats[0];
  // Quand deux canaux ont tous deux un échantillon solide, le meilleur taux de réponse passe devant.
  const solide = (c: CanalRedaction) => (a.taux?.[c]?.envoyes ?? 0) >= ECHANTILLON_MIN;
  const taux = (c: CanalRedaction) => (a.taux?.[c]?.reponses ?? 0) / Math.max(1, a.taux?.[c]?.envoyes ?? 1);
  const mesures = candidats.filter(solide);
  if (mesures.length < 2) return candidats[0];
  const meilleur = [...mesures].sort((x, y) => taux(y) - taux(x))[0];
  return meilleur;
}
