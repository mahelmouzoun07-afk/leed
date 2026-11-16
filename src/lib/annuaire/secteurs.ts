/**
 * La liste fermée des secteurs de l'annuaire. C'est elle que les scripts de préparation (scripts/annuaire/preparer_*.py)
 * écrivent dans la colonne `secteur`, et c'est parmi ces noms que l'IA choisit les secteurs d'un profil de client :
 * la recherche compare des noms exacts (apercu_annuaire : secteur = any(...)). Si l'on change un nom ici, il faut le changer dans les scripts.
 */
export const SECTEURS = [
  "Commerce",
  "Restauration",
  "Éducation et formation",
  "Hôtellerie",
  "Services aux entreprises",
  "Santé",
  "Finance et assurance",
  "Beauté et bien-être",
  "Immobilier",
  "Automobile",
  "Stations-service",
  "Communication et impression",
  "Voyage et tourisme",
  "Loisirs et sorties",
  "Bâtiment et travaux",
  "Événementiel",
  "Informatique",
  "Sport et fitness",
  "Agriculture",
  "Transport et logistique",
  "Artisanat",
] as const;

export type Secteur = (typeof SECTEURS)[number];

const CONNUS = new Set<string>(SECTEURS);
export const estSecteur = (s: string): s is Secteur => CONNUS.has(s);
