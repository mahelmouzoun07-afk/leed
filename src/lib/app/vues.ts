/**
 * Les données que chaque écran du tableau de bord affiche (« vues »), et le jeu d'exemple de Koffi
 * utilisé par le mode démonstration. Aucun écran ne lit la base directement : il reçoit une vue.
 * Les chiffres de DEMO sont ceux de la maquette : ils sont fictifs et ne servent qu'à montrer l'écran rempli.
 */

export type CanalNom = "whatsapp" | "instagram" | "facebook" | "linkedin" | "email";
export const NOM_CANAL: Record<CanalNom, string> = { whatsapp: "WhatsApp", instagram: "Instagram", facebook: "Facebook", linkedin: "LinkedIn", email: "Email" };
export const CANAUX: CanalNom[] = ["whatsapp", "email", "instagram", "facebook", "linkedin"];

export type TypeDecision = "lead_chaud" | "question_prospect" | "confirmer_rdv" | "valider_information" | "note_vocale" | "forfait_bientot_fini" | "compte_a_rebrancher";
export const NOM_DECISION: Record<TypeDecision, string> = {
  lead_chaud: "Lead chaud",
  question_prospect: "Question",
  confirmer_rdv: "Rendez-vous",
  valider_information: "À valider",
  note_vocale: "Note vocale",
  forfait_bientot_fini: "Forfait",
  compte_a_rebrancher: "Compte à rebrancher",
};

export type DecisionVue = {
  id: string;
  type: TypeDecision;
  urgence: number;
  question: string;
  prospect: string | null;
  ville: string | null;
  canal: CanalNom | null;
  extrait: string | null;
  proposition: string | null;
  options: { cle: string; libelle: string }[];
  creeLe: string;
  echeance: string | null;
  statut: "ouverte" | "repondue" | "expiree" | "annulee";
  conversationId: string | null;
};

export type AccueilVue = {
  prenom: string;
  agentActif: boolean;
  decisionsNb: number;
  decisions: DecisionVue[];
  semaine: { contactes: number; reponses: number; interesses: number; rdv: number };
  forfait: { restantes: number; achetees: number; joursRestants: number | null; statut: string; type: string } | null;
  canaux: { canal: CanalNom; envoyes: number; reponses: number }[];
  aujourdhui: { heure: string; texte: string }[];
};

export type StatutProspect = "nouveau" | "analyse" | "en_sequence" | "en_conversation" | "interesse" | "rdv_pris" | "refuse" | "stop" | "epuise";
export const NOM_STATUT: Record<StatutProspect, string> = {
  nouveau: "À contacter",
  analyse: "À contacter",
  en_sequence: "Relance en cours",
  en_conversation: "En discussion",
  interesse: "Intéressé",
  rdv_pris: "Rendez-vous pris",
  refuse: "A refusé",
  stop: "A dit STOP",
  epuise: "Ne plus contacter",
};

/** `masque` : l'entreprise n'a pas encore été contactée, son nom et ses coordonnées restent cachés (règle du produit). */
export type ProspectLigne = { id: string; nom: string; ville: string | null; secteur: string | null; canal: CanalNom | null; statut: StatutProspect; score: number | null; masque: boolean };
export type ProspectsVue = {
  total: number;
  contactes: number;
  lignes: ProspectLigne[];
  filtres: { q: string; statut: string; canal: string; ville: string };
  villes: string[];
};
export type ProspectVue = {
  id: string;
  nom: string;
  ville: string | null;
  secteur: string | null;
  score: number | null;
  contact: { nom: string | null; role: string | null } | null;
  signal: string | null;
  identifiants: { canal: CanalNom; identifiant: string; utilise: boolean }[];
  historique: { quand: string; sens: "sortant" | "entrant"; canal: CanalNom; texte: string }[];
  conversationId: string | null;
  note: string;
  statut: StatutProspect;
  aRdv: boolean;
  masque: boolean;
};

export type ConversationLigne = { id: string; prospect: string; canal: CanalNom; dernierMessage: string; quand: string | null; reprise: boolean; enAttente: boolean };
export type ConversationVue = {
  id: string;
  prospect: string;
  canal: CanalNom;
  repriseParClient: boolean;
  messages: { id: string; sens: "sortant" | "entrant"; corps: string; quand: string | null; statut: string }[];
  preparation: { corps: string; dans: string } | null;
};

export type CampagneLigne = {
  id: string;
  nom: string;
  statut: "brouillon" | "active" | "en_pause" | "terminee";
  contactes: number;
  reponses: number;
  rdv: number;
  canaux: CanalNom[];
  plafondJour: number | null;
};
export type CampagneVue = CampagneLigne & { cible: { secteurs: string[]; villes: string[]; tailles: string[]; signaux: string[] } | null };

export type SimulateurVue = {
  /** Taux réellement mesurés sur nos envois, ou null tant qu'il n'y a pas assez de données. */
  taux: { reponse: number; rdv: number; echantillon: number; perimetre: string } | null;
};

export type RapportsVue = {
  entonnoir: { libelle: string; valeur: number }[];
  argent: { depenses: number; parRdv: number | null; gagnes: number | null };
  appris: string[];
  proposition: string | null;
};

export type ComptesVue = {
  inclus: number | null; // null = tous
  branches: number;
  comptes: { canal: CanalNom; identifiant: string; statut: "actif" | "a_rebrancher" | "suspendu" | "debranche"; quota: number; envois: number; note: number; joignables: number }[];
  autres: { canal: CanalNom; joignables: number }[];
};

export type MouvementVue = { quand: string; libelle: string; nombre: number };
export type ForfaitVue = {
  forfait: {
    type: "essai" | "payant";
    statut: "actif" | "grace" | "gele" | "epuise" | "expire";
    montant: number;
    achetees: number;
    restantes: number;
    parJour: number;
    debut: string;
    fin: string;
    joursRestants: number;
    joursTotal: number;
  } | null;
  plafondJour: number;
  historique: MouvementVue[];
};

export type NiveauAutonomie = "prudent" | "equilibre" | "autonome";
export const LIGNES_AUTONOMIE = [
  ["premier_message", "Écrire le premier message"],
  ["relance", "Relancer"],
  ["question_simple", "Répondre à une question simple"],
  ["prix", "Annoncer un prix"],
  ["rendez_vous", "Confirmer un rendez-vous"],
  ["lead_chaud", "Répondre à un lead chaud"],
] as const;
export type CleAutonomie = (typeof LIGNES_AUTONOMIE)[number][0];
export type Qui = "agent" | "moi";
export const AUTONOMIE_PAR_NIVEAU: Record<NiveauAutonomie, Record<CleAutonomie, Qui>> = {
  prudent: { premier_message: "moi", relance: "moi", question_simple: "moi", prix: "moi", rendez_vous: "moi", lead_chaud: "moi" },
  equilibre: { premier_message: "agent", relance: "agent", question_simple: "agent", prix: "moi", rendez_vous: "moi", lead_chaud: "moi" },
  autonome: { premier_message: "agent", relance: "agent", question_simple: "agent", prix: "agent", rendez_vous: "agent", lead_chaud: "agent" },
};

export type ReglagesVue = {
  prenom: string;
  email: string;
  entreprise: string;
  resume: string | null;
  offres: string[];
  nomAffiche: string;
  consignes: { prix: string; interdits: string };
  autonomie: { niveau: NiveauAutonomie; lignes: Record<CleAutonomie, Qui> };
  alertes: { whatsapp: boolean; email: boolean; debut: string; fin: string };
  exclusions: { id: string; type: "domaine" | "nom" | "identifiant"; valeur: string }[];
};

// ───── Jeu d'exemple : Koffi Adjovi, Studio Koffi, graphiste à Cotonou ─────

const maintenant = () => Date.now();
const ilY = (minutes: number) => new Date(maintenant() - minutes * 60_000).toISOString();

export const DEMO = {
  accueil: {
    prenom: "Koffi",
    agentActif: true,
    decisionsNb: 3,
    decisions: [
      { id: "d1", type: "lead_chaud", urgence: 1, question: "Mme Houngbo veut un devis", prospect: "Maquis Chez Tanti", ville: "Cotonou", canal: "whatsapp", extrait: "Oui ça m'intéresse, c'est combien pour un logo ?", proposition: "Donner votre fourchette (40 à 60 000 FCFA) et proposer un appel.", options: [{ cle: "moi", libelle: "Je m'en occupe" }, { cle: "agent", libelle: "Laisse l'agent" }], creeLe: ilY(12), echeance: null, statut: "ouverte", conversationId: "c1" },
      { id: "d2", type: "question_prospect", urgence: 2, question: "Faites-vous aussi les enseignes ?", prospect: "Boutique Awa", ville: "Porto-Novo", canal: "whatsapp", extrait: "Faites-vous aussi les enseignes ?", proposition: null, options: [{ cle: "oui", libelle: "Oui" }, { cle: "non", libelle: "Non" }], creeLe: ilY(60), echeance: new Date(maintenant() + 3.7 * 3600_000).toISOString(), statut: "ouverte", conversationId: null },
    ],
    semaine: { contactes: 86, reponses: 14, interesses: 5, rdv: 2 },
    forfait: { restantes: 34, achetees: 120, joursRestants: 19, statut: "actif", type: "payant" },
    canaux: [
      { canal: "whatsapp", envoyes: 62, reponses: 12 },
      { canal: "email", envoyes: 24, reponses: 2 },
    ],
    aujourdhui: [
      { heure: "10:42", texte: "A répondu à Boutique Awa" },
      { heure: "09:15", texte: "A écrit à 12 restaurants" },
      { heure: "08:30", texte: "A trouvé 18 nouveaux prospects" },
    ],
  } satisfies AccueilVue,

  decisions: [
    { id: "d1", type: "lead_chaud", urgence: 1, question: "Mme Houngbo veut un devis", prospect: "Maquis Chez Tanti", ville: "Cotonou", canal: "whatsapp", extrait: "Oui ça m'intéresse, c'est combien pour un logo ?", proposition: "Donner votre fourchette (40 à 60 000 FCFA) et proposer un appel.", options: [{ cle: "moi", libelle: "Je m'en occupe" }, { cle: "agent", libelle: "Laisse l'agent" }], creeLe: ilY(12), echeance: null, statut: "ouverte", conversationId: "c1" },
    { id: "d2", type: "question_prospect", urgence: 2, question: "Faites-vous aussi les enseignes ?", prospect: "Boutique Awa", ville: "Porto-Novo", canal: "whatsapp", extrait: "Faites-vous aussi les enseignes ?", proposition: null, options: [{ cle: "oui", libelle: "Oui" }, { cle: "non", libelle: "Non" }], creeLe: ilY(60), echeance: new Date(maintenant() + 3.7 * 3600_000).toISOString(), statut: "ouverte", conversationId: null },
    { id: "d3", type: "confirmer_rdv", urgence: 2, question: "Hôtel du Lac propose jeudi 15 h. Votre agenda est libre.", prospect: "Hôtel du Lac", ville: "Cotonou", canal: "email", extrait: null, proposition: null, options: [{ cle: "oui", libelle: "Oui, confirme" }, { cle: "autre", libelle: "Autre horaire" }], creeLe: ilY(150), echeance: null, statut: "ouverte", conversationId: null },
  ] satisfies DecisionVue[],

  decisionsRepondues: [
    { id: "d0", type: "question_prospect", urgence: 2, question: "Livrez-vous à Abomey-Calavi ?", prospect: "Salon Élégance", ville: "Cotonou", canal: "instagram", extrait: "Livrez-vous à Abomey-Calavi ?", proposition: null, options: [{ cle: "oui", libelle: "Oui" }], creeLe: ilY(60 * 30), echeance: null, statut: "repondue", conversationId: null },
  ] satisfies DecisionVue[],

  prospects: {
    total: 1240,
    contactes: 186,
    lignes: [
      { id: "p1", nom: "Maquis Chez Tanti", ville: "Cotonou", secteur: "Restaurant", masque: false, canal: "whatsapp", statut: "interesse", score: 92 },
      { id: "p2", nom: "Hôtel du Lac", ville: "Cotonou", secteur: "Hôtel", masque: false, canal: "email", statut: "rdv_pris", score: 88 },
      { id: "p3", nom: "Boutique Awa", ville: "Porto-Novo", secteur: "Boutique", masque: false, canal: "whatsapp", statut: "en_conversation", score: 85 },
      { id: "p4", nom: "Restaurant Le Privé", ville: "Cotonou", secteur: "Restaurant", masque: false, canal: "whatsapp", statut: "en_sequence", score: 81 },
      { id: "p5", nom: "École Les Lauréats", ville: "Abomey-Calavi", secteur: "École", masque: true, canal: "email", statut: "nouveau", score: 78 },
      { id: "p6", nom: "Salon Élégance", ville: "Cotonou", secteur: "Salon de beauté", masque: true, canal: "instagram", statut: "nouveau", score: 74 },
    ],
    filtres: { q: "", statut: "", canal: "", ville: "" },
    villes: ["Abomey-Calavi", "Cotonou", "Porto-Novo"],
  } satisfies ProspectsVue,

  prospect: {
    id: "p1",
    nom: "Maquis Chez Tanti",
    ville: "Cotonou",
    secteur: "Restaurant",
    score: 92,
    contact: { nom: "Mme Houngbo", role: "gérante" },
    signal: "Logo difficile à lire sur sa page Facebook. A ouvert un 2e point de vente en octobre.",
    identifiants: [
      { canal: "whatsapp", identifiant: "+229 96 ·· ·· ··", utilise: true },
      { canal: "email", identifiant: "non trouvé", utilise: false },
      { canal: "instagram", identifiant: "@chez_tanti", utilise: false },
    ],
    historique: [
      { quand: ilY(60 * 52), sens: "sortant", canal: "whatsapp", texte: "Premier message" },
      { quand: ilY(60 * 46), sens: "entrant", canal: "whatsapp", texte: "« Oui ça m'intéresse, c'est combien ? »" },
      { quand: ilY(60 * 45), sens: "sortant", canal: "whatsapp", texte: "Réponse de l'agent" },
    ],
    conversationId: "c1",
    note: "",
    statut: "interesse",
    aRdv: false,
    masque: false,
  } satisfies ProspectVue,

  conversations: [
    { id: "c1", prospect: "Maquis Chez Tanti", canal: "whatsapp", dernierMessage: "Entre 40 000 et 60 000 FCFA selon le projet. Je peux vous appeler demain matin ?", quand: ilY(45), reprise: false, enAttente: true },
    { id: "c2", prospect: "Boutique Awa", canal: "whatsapp", dernierMessage: "Faites-vous aussi les enseignes ?", quand: ilY(60), reprise: false, enAttente: true },
    { id: "c3", prospect: "Hôtel du Lac", canal: "email", dernierMessage: "Jeudi 15 h, cela nous convient.", quand: ilY(150), reprise: false, enAttente: false },
  ] satisfies ConversationLigne[],

  conversation: {
    id: "c1",
    prospect: "Maquis Chez Tanti",
    canal: "whatsapp",
    repriseParClient: false,
    messages: [
      { id: "m1", sens: "sortant", corps: "Bonjour Madame Houngbo, ici Koffi du Studio Koffi, graphiste à Cotonou. J'ai vu la carte du Maquis sur Facebook : le logo est difficile à lire sur téléphone. Je vous prépare 3 idées ?", quand: ilY(60 * 52), statut: "livre" },
      { id: "m2", sens: "entrant", corps: "Oui ça m'intéresse, c'est combien pour un logo ?", quand: ilY(60 * 46), statut: "livre" },
      { id: "m3", sens: "sortant", corps: "Entre 40 000 et 60 000 FCFA selon le projet. Je peux vous appeler demain matin ?", quand: ilY(60 * 45), statut: "livre" },
    ],
    preparation: { corps: "Parfait. Je vous envoie 3 pistes jeudi matin, et on en parle ensuite ?", dans: "8 min" },
  } satisfies ConversationVue,

  campagnes: [
    { id: "k1", nom: "Restaurants de Cotonou", statut: "active", contactes: 124, reponses: 19, rdv: 3, canaux: ["whatsapp", "email"], plafondJour: 10 },
    { id: "k2", nom: "Boutiques de mode", statut: "active", contactes: 62, reponses: 6, rdv: 1, canaux: ["instagram"], plafondJour: 10 },
    { id: "k3", nom: "Écoles privées", statut: "en_pause", contactes: 0, reponses: 0, rdv: 0, canaux: ["email"], plafondJour: null },
  ] satisfies CampagneLigne[],

  campagne: {
    id: "k1",
    nom: "Restaurants de Cotonou",
    statut: "active",
    contactes: 124,
    reponses: 19,
    rdv: 3,
    canaux: ["whatsapp", "email"],
    plafondJour: 10,
    cible: { secteurs: ["Restaurants", "Maquis", "Traiteurs"], villes: ["Cotonou", "Abomey-Calavi"], tailles: ["1-10", "11-50"], signaux: ["Pas de logo professionnel", "Ouverture récente"] },
  } satisfies CampagneVue,

  simulateur: { taux: { reponse: 0.15, rdv: 0.035, echantillon: 1240, perimetre: "ce secteur et ce pays, ces 90 derniers jours" } } satisfies SimulateurVue,

  rapports: {
    entonnoir: [
      { libelle: "Trouvés", valeur: 1240 },
      { libelle: "Contactés", valeur: 186 },
      { libelle: "Ont répondu", valeur: 25 },
      { libelle: "Intéressés", valeur: 9 },
      { libelle: "Rendez-vous", valeur: 4 },
      { libelle: "Signés", valeur: 1 },
    ],
    argent: { depenses: 23400, parRdv: 5850, gagnes: 60000 },
    appris: ["Les restaurants répondent surtout le mardi entre 9 h et 11 h.", "L'accroche « logo illisible sur téléphone » marche deux fois mieux."],
    proposition: "Mettre le budget des écoles sur les restaurants.",
  } satisfies RapportsVue,

  comptes: {
    inclus: 3,
    branches: 2,
    comptes: [
      { canal: "whatsapp", identifiant: "+229 97 00 00 00", statut: "actif", quota: 40, envois: 24, note: 96, joignables: 820 },
      { canal: "email", identifiant: "koffi@studiokoffi.bj", statut: "actif", quota: 30, envois: 12, note: 100, joignables: 310 },
    ],
    autres: [
      { canal: "instagram", joignables: 140 },
      { canal: "facebook", joignables: 95 },
    ],
  } satisfies ComptesVue,

  forfait: {
    forfait: { type: "payant", statut: "actif", montant: 25000, achetees: 120, restantes: 34, parJour: 10, debut: ilY(60 * 24 * 11), fin: new Date(maintenant() + 19 * 86400_000).toISOString(), joursRestants: 19, joursTotal: 30 },
    plafondJour: 10,
    historique: [
      { quand: ilY(60 * 24), libelle: "Maquis Chez Tanti, WhatsApp", nombre: -1 },
      { quand: ilY(60 * 24), libelle: "Hôtel du Lac, Email", nombre: -1 },
      { quand: ilY(60 * 24 * 3), libelle: "Forfait 10 000 FCFA, MTN", nombre: 40 },
      { quand: ilY(60 * 24 * 4), libelle: "Le Privé : non livré, rendue", nombre: 1 },
    ],
  } satisfies ForfaitVue,

  reglages: {
    prenom: "Koffi",
    email: "koffi@studiokoffi.bj",
    entreprise: "Studio Koffi",
    resume: "Studio Koffi crée des logos, des affiches et des visuels pour les commerces de Cotonou.",
    offres: ["Identité visuelle et logo", "Affiches et supports imprimés", "Contenus pour les réseaux sociaux"],
    nomAffiche: "Koffi, du Studio Koffi",
    consignes: { prix: "Un logo coûte entre 40 000 et 60 000 FCFA.", interdits: "Ne jamais promettre de délai de moins de 5 jours." },
    autonomie: { niveau: "equilibre", lignes: AUTONOMIE_PAR_NIVEAU.equilibre },
    alertes: { whatsapp: true, email: false, debut: "08:00", fin: "19:00" },
    exclusions: [{ id: "x1", type: "nom", valeur: "Imprimerie Sogbo" }],
  } satisfies ReglagesVue,
};
