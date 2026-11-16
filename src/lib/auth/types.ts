/** Ce qu'une action de formulaire renvoie à la page : un message, ou des erreurs champ par champ. */
export type EtatFormulaire = {
  ok?: boolean;
  message?: string;
  erreurs?: Record<string, string>;
  /** Étape suivante à afficher (ex. « verifier_email »). */
  etape?: string;
};

export const ETAT_VIDE: EtatFormulaire = {};
