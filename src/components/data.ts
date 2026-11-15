// Contenu de la marque leed. Les exemples (Studio Koffi, ses prospects) sont
// des illustrations du produit, pas des clients réels ni des résultats.
export const BRAND = "Leed";
export const BRAND_LOWER = "leed";

export type Testimonial = {
  quote: string;
  name: string;
  company: string;
  initials: string;
  color: string;
  href?: string;
  noName?: boolean;
};

// Témoignages : volontairement vides. On n'en affiche que de vrais
// (docs/INTERDITS.md). Les emplacements restent pour garder la mise en page.
export const ROWS: Testimonial[][] = [[], [], []];
export const MOBILE_ORDER: Testimonial[] = [];
export const TESTIMONIAL_SLOTS = 5;

// Pastille du haut de page : uniquement des faits de notre offre.
export const STATS = [
  { value: "Essai gratuit", label: "10 entreprises contactées par email" },
  { value: "Dès 5 000 FCFA", label: "en Mobile Money, sans abonnement" },
];

export const COMPETITORS = [
  { domain: "atelier-graphique.bj", color: "#a3a3a3" },
  { domain: "studio-creation.ci", color: "#2a2e8c" },
  { domain: "agence-visuelle.sn", color: "#1f7a50" },
  { domain: "print-et-design.tg", color: "#f4a51c" },
  { domain: "logo-express.bj", color: "#6b6b6b" },
  { domain: "maison-identite.ci", color: "#111111" },
];

export const FIT_ROWS = [
  ["Restaurants et maquis", 92],
  ["Boutiques de mode", 85],
  ["Écoles privées", 78],
  ["Hôtels et résidences", 74],
  ["Salons de beauté", 71],
] as const;

// `email` porte ici le canal par lequel le prospect est joignable.
export const PEOPLE = [
  { i: "RH", name: "Rosine Houngbo", role: "Gérante", company: "Maquis Chez Tanti", email: "WhatsApp · Facebook" },
  { i: "MD", name: "Moussa Diallo", role: "Fondateur", company: "Boutique Teranga", email: "Instagram · WhatsApp" },
  { i: "AK", name: "Aïcha Koné", role: "Directrice", company: "École Les Lauréats", email: "Email · LinkedIn" },
  { i: "YA", name: "Yao Amoussou", role: "Gérant", company: "Résidence Le Palmier", email: "WhatsApp · Email" },
  { i: "FS", name: "Fatou Sow", role: "Propriétaire", company: "Salon Élégance", email: "Instagram · Facebook" },
  { i: "KM", name: "Kévin Mensah", role: "Responsable", company: "Traiteur Saveurs", email: "WhatsApp · Email" },
];

export const CAMPAIGNS = [
  ["Restaurants et maquis", "En hausse", "WhatsApp", true],
  ["Boutiques de mode", "En hausse", "Instagram", true],
  ["Écoles privées", "Stable", "Email", true],
  ["Hôtels et résidences", "En pause", "LinkedIn", false],
  ["Salons de beauté", "En pause", "Facebook", false],
] as const;

export const FOOTER = {
  products: [
    { label: "Agent de prospection", href: "/" },
    { label: "Explorateur de cibles", href: "/tools/explorer/" },
    { label: "Annuaire d'entreprises", badge: "bientôt", href: "/b2b-database/" },
  ] as ReadonlyArray<{ label: string; href: string; badge?: string }>,
  // [libellé affiché, identifiant de page] — les pages par pays viendront avec l'annuaire.
  regions: [
    ["au Bénin", "benin"],
    ["au Sénégal", "senegal"],
    ["en Côte d'Ivoire", "cote-d-ivoire"],
    ["au Togo", "togo"],
    ["au Burkina Faso", "burkina-faso"],
    ["au Mali", "mali"],
    ["au Niger", "niger"],
    ["en Guinée", "guinee"],
    ["au Ghana", "ghana"],
    ["au Nigeria", "nigeria"],
  ] as const,
  resources: [
    { label: "À propos", href: "/about/" },
    { label: "Tarifs", href: "/pricing/" },
    { label: "Parrainage", href: "/affiliate/?src=footer" },
    { label: "Questions sur la conformité", href: "/compliance-faq/" },
    { label: "Support", href: "/support/" },
  ],
};
