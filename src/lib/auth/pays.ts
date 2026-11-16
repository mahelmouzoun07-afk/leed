/** Pays proposés à l'inscription : code ISO à 2 lettres, nom en français. */
export const PAYS = [
  { code: "BJ", nom: "Bénin" },
  { code: "CI", nom: "Côte d'Ivoire" },
  { code: "SN", nom: "Sénégal" },
  { code: "TG", nom: "Togo" },
  { code: "ML", nom: "Mali" },
  { code: "BF", nom: "Burkina Faso" },
  { code: "NE", nom: "Niger" },
  { code: "GN", nom: "Guinée" },
  { code: "CM", nom: "Cameroun" },
  { code: "GA", nom: "Gabon" },
  { code: "CG", nom: "Congo" },
  { code: "CD", nom: "RD Congo" },
  { code: "GH", nom: "Ghana" },
  { code: "NG", nom: "Nigeria" },
  { code: "ZZ", nom: "Autre pays" },
] as const;

export const CODES_PAYS = PAYS.map((p) => p.code) as [string, ...string[]];
