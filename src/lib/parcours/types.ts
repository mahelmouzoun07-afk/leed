/** Les données du parcours du visiteur, de « décrire son activité » à l'aperçu. */
export type Formulaire = {
  vend: string;
  client: string;
  secteurs: string[];
  taille: string;
  zone: string;
  prixMoyen: string;
  objectif: string;
};

export type Entree =
  | { mode: "site"; site: string }
  | { mode: "formulaire"; formulaire: Formulaire };

export type Fiche = {
  nom: string;
  resume: string;
  offres: string[];
  zone: string;
  forces: string[];
  concurrents: string[];
};

export type Question = { id: string; texte: string; choix: string[] };

export type Profil = {
  id: string;
  nom: string;
  raison: string;
  note: number;
  actif: boolean;
  /** Les secteurs de l'annuaire qui correspondent à ce profil (liste fermée, voir lib/annuaire/secteurs.ts) */
  secteurs?: string[];
};

export type Canal = "WhatsApp" | "Email" | "Instagram" | "Facebook" | "LinkedIn";

export type Apercu = {
  total: number;
  exemples: { secteur: string; ville?: string | null; taille?: string | null; indice?: string | null }[];
  canaux: { canal: Canal; nombre: number }[];
  /** Vrai quand le nombre vient de la vraie base d'entreprises, faux pour les exemples de démonstration */
  reel?: boolean;
};

export type Etat = {
  entree?: Entree;
  fiche?: Fiche;
  questions?: Question[];
  reponses?: Record<string, string>;
  profils?: Profil[];
  apercu?: Apercu;
  compte?: { prenom: string; entreprise: string; email: string; pays: string };
};
