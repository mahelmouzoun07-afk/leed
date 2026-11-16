import type { Apercu, Canal, Entree, Fiche } from "../parcours/types";

/**
 * Les parties « pures » de l'aperçu réel (sans base de données, donc testables) :
 *  - deviner le ou les pays du visiteur ;
 *  - fusionner les réponses de la base, pays par pays, en un seul aperçu.
 */

export type PaysAnnuaire = "BJ" | "SN" | "CI" | "TG";
export const PAYS_ANNUAIRE: PaysAnnuaire[] = ["BJ", "SN", "CI", "TG"];

const PAR_EXTENSION: Record<string, PaysAnnuaire> = { bj: "BJ", sn: "SN", ci: "CI", tg: "TG" };
const PAR_MOT: [RegExp, PaysAnnuaire][] = [
  // « \b » ne reconnaît pas une lettre accentuée en fin de mot (« Lomé ») : on borne avec « pas une lettre avant ni après ».
  [/(?<![\p{L}])(b[ée]nin|cotonou|porto[- ]?novo|parakou|abomey|calavi|ouidah|bohicon|djougou)(?![\p{L}])/iu, "BJ"],
  [/(?<![\p{L}])(s[ée]n[ée]gal|dakar|thi[èe]s|saint[- ]louis|touba|kaolack|ziguinchor|mbour|pikine|rufisque)(?![\p{L}])/iu, "SN"],
  [/(?<![\p{L}])(c[ôo]te d['’]ivoire|abidjan|yamoussoukro|bouak[ée]|san[- ]?p[ée]dro|korhogo|daloa|cocody|yopougon)(?![\p{L}])/iu, "CI"],
  [/(?<![\p{L}])(togo|lom[ée]|kara|sokod[ée]|ats?ou|kpalim[ée]|tsevi[ée])(?![\p{L}])/iu, "TG"],
];

/** Les pays à interroger : d'abord l'extension du site (.bj), puis les villes ou pays cités dans la zone ; à défaut, les quatre. */
export function paysDuVisiteur(entree?: Entree, fiche?: Pick<Fiche, "zone" | "resume">): PaysAnnuaire[] {
  if (entree?.mode === "site") {
    const ext = entree.site.toLowerCase().split(".").pop() ?? "";
    if (PAR_EXTENSION[ext]) return [PAR_EXTENSION[ext]];
  }
  const texte = [fiche?.zone ?? "", entree?.mode === "formulaire" ? entree.formulaire.zone : ""].join(" ");
  const trouves = new Set<PaysAnnuaire>();
  for (const [motif, pays] of PAR_MOT) if (motif.test(texte)) trouves.add(pays);
  return trouves.size > 0 ? [...trouves] : PAYS_ANNUAIRE;
}

/** Ce que renvoie la fonction SQL apercu_annuaire pour un pays. */
export type ReponseApercuSql = {
  total: number;
  canaux: { whatsapp?: number; email?: number; instagram?: number; facebook?: number; linkedin?: number };
  exemples: { secteur: string | null; ville: string | null; taille: string | null }[];
};

const NOMS_CANAUX: [keyof ReponseApercuSql["canaux"], Canal][] = [
  ["whatsapp", "WhatsApp"],
  ["email", "Email"],
  ["instagram", "Instagram"],
  ["facebook", "Facebook"],
  ["linkedin", "LinkedIn"],
];

/** Additionne les réponses de plusieurs pays ; garde jusqu'à trois exemples, sans nom ni coordonnée. */
export function fusionnerApercus(reponses: ReponseApercuSql[]): Apercu {
  const total = reponses.reduce((s, r) => s + (r.total ?? 0), 0);
  const canaux = NOMS_CANAUX.map(([cle, canal]) => ({ canal, nombre: reponses.reduce((s, r) => s + (r.canaux?.[cle] ?? 0), 0) })).filter((c) => c.nombre > 0);
  const exemples = reponses
    .flatMap((r) => r.exemples ?? [])
    .filter((e) => e.secteur)
    .slice(0, 3)
    .map((e) => ({ secteur: e.secteur as string, ville: e.ville, taille: e.taille }));
  return { total, canaux, exemples, reel: true };
}
