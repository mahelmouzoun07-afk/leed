/**
 * Les données de chaque écran de l'espace équipe, et un jeu d'exemple pour le voir rempli pendant le développement
 * (route /dev/admin, absente en production). Les chiffres d'exemple sont ceux de la maquette : ils sont fictifs.
 */

export type CanalNom = "whatsapp" | "instagram" | "facebook" | "linkedin" | "email";

export type AdminAccueilVue = {
  clients_actifs: number;
  comptes_branches: number;
  comptes_a_rebrancher: number;
  tickets_ouverts: number;
  messages_a_relire: number;
  paiements_en_attente: number;
  sources_annuaire: number;
  encaisse_mois: number;
  couts_mois: Record<string, number>;
  sante: { canal: CanalNom; comptes: number; alertes: number }[];
};

export type EtatClient = "actif" | "bientot_fini" | "essai" | "expire" | "aucun";
export type AdminClientLigne = {
  id: string;
  nom: string;
  ville: string | null;
  pays: string | null;
  cree_le: string;
  forfait_montant: number | null;
  forfait_type: "essai" | "payant" | null;
  forfait_statut: string | null;
  restantes: number | null;
  achetees: number | null;
  fin: string | null;
  etat: EtatClient;
  envoi_suspendu: boolean;
};

export type AdminClientVue = {
  id: string;
  nom: string;
  ville: string | null;
  pays: string | null;
  cree_le: string;
  envoi_suspendu: boolean;
  proprietaire: { prenom: string | null; nom: string | null; email: string | null; telephone: string | null } | null;
  forfait: { type: "essai" | "payant"; statut: string; montant: number; achetees: number; restantes: number; fin: string; par_jour: number } | null;
  comptes: { canal: CanalNom; identifiant: string; statut: string; note_sante: number }[];
  campagnes: number;
  prospects: number;
  encaisse_mois: number;
  couts_mois: Record<string, number>;
};

export type AdminComptesVue = {
  total_actifs: number;
  comptes: { entreprise: string; canal: CanalNom; identifiant: string; statut: string; note_sante: number; derniere_erreur: string | null; envois_aujourdhui: number; quota_jour: number; verifie_le: string | null }[];
};

export type AdminAnnuaireVue = {
  entreprises: number;
  pays: number;
  avec_telephone: number;
  avec_site: number;
  sources: { nom: string; licence: string | null; peut_stocker: boolean; fiches: number; derniere_maj: string | null }[];
};

export type AdminMessagesVue = {
  controles_semaine: number;
  bloques_semaine: number;
  liste: { id: string; cree_le: string; entreprise: string; canal: CanalNom; corps: string; motifs: string[] }[];
};

export type AdminPaiementsVue = {
  encaisse_mois: number;
  nombre_mois: number;
  en_attente: number;
  echoues: number;
  liste: { id: string; entreprise: string; montant: number; moyen: string; statut: string; cree_le: string; remise?: number; code?: string | null }[];
};

export type EtatCodePromo = "actif" | "desactive" | "expire" | "epuise" | "a_venir";
export type AdminCodePromo = {
  id: string;
  code: string;
  libelle: string | null;
  pourcentage: number;
  plafond_remise_fcfa: number | null;
  montant_min_fcfa: number;
  debut: string;
  fin: string | null;
  max_utilisations: number | null;
  max_par_entreprise: number;
  nouveaux_clients_seulement: boolean;
  pays: string[];
  actif: boolean;
  cree_le: string;
  utilisations: number;
  en_cours: number;
  remise_totale_fcfa: number;
  etat: EtatCodePromo;
};
export type AdminCodesPromoVue = {
  codes: AdminCodePromo[];
  recentes: { code: string; entreprise: string; remise_fcfa: number; a_payer_fcfa: number; statut: string; cree_le: string }[];
};

export type AdminCoutsVue = {
  encaisse: number;
  couts: Record<string, number>;
  paliers: { montant_min: number; clients: number }[];
};

export type AdminTicketLigne = { id: string; entreprise: string | null; sujet: string; statut: "ouvert" | "en_cours" | "attente_client" | "resolu"; priorite: number; cree_le: string };
export type AdminTicketVue = AdminTicketLigne & { messages: { id: string; auteur: "client" | "admin"; corps: string; cree_le: string }[] };
export type AdminJournalVue = { id: string; cree_le: string; admin: string | null; action: string; cible_type: string | null; cible_id: string | null; charge: Record<string, unknown> }[];

const ilYA = (min: number) => new Date(Date.now() - min * 60_000).toISOString();

export const ADMIN_DEMO = {
  accueil: {
    clients_actifs: 34,
    comptes_branches: 61,
    comptes_a_rebrancher: 2,
    tickets_ouverts: 7,
    messages_a_relire: 12,
    paiements_en_attente: 3,
    sources_annuaire: 5,
    encaisse_mois: 1_240_000,
    couts_mois: { unipile: 200_000, ia: 148_000, paiement: 37_000 },
    sante: [
      { canal: "whatsapp", comptes: 52, alertes: 1 },
      { canal: "email", comptes: 9, alertes: 0 },
    ],
  } satisfies AdminAccueilVue,

  clients: [
    { id: "a1", nom: "Studio Koffi", ville: "Cotonou", pays: "BJ", cree_le: ilYA(60 * 24 * 4), forfait_montant: 25000, forfait_type: "payant", forfait_statut: "actif", restantes: 34, achetees: 111, fin: ilYA(-60 * 24 * 19), etat: "actif", envoi_suspendu: false },
    { id: "a2", nom: "Traiteur Saveurs", ville: "Abidjan", pays: "CI", cree_le: ilYA(60 * 24 * 12), forfait_montant: 10000, forfait_type: "payant", forfait_statut: "actif", restantes: 4, achetees: 40, fin: ilYA(-60 * 24 * 3), etat: "bientot_fini", envoi_suspendu: false },
    { id: "a3", nom: "Agence Teranga", ville: "Dakar", pays: "SN", cree_le: ilYA(60 * 24 * 20), forfait_montant: 50000, forfait_type: "payant", forfait_statut: "actif", restantes: 180, achetees: 250, fin: ilYA(-60 * 24 * 11), etat: "actif", envoi_suspendu: false },
    { id: "a4", nom: "École Les Lauréats", ville: "Calavi", pays: "BJ", cree_le: ilYA(60 * 24 * 2), forfait_montant: 0, forfait_type: "essai", forfait_statut: "actif", restantes: 6, achetees: 10, fin: ilYA(-60 * 24 * 5), etat: "essai", envoi_suspendu: false },
    { id: "a5", nom: "Imprimerie Sogbo", ville: "Porto-Novo", pays: "BJ", cree_le: ilYA(60 * 24 * 40), forfait_montant: null, forfait_type: null, forfait_statut: null, restantes: 0, achetees: null, fin: null, etat: "expire", envoi_suspendu: false },
  ] satisfies AdminClientLigne[],

  client: {
    id: "a1",
    nom: "Studio Koffi",
    ville: "Cotonou",
    pays: "BJ",
    cree_le: ilYA(60 * 24 * 4),
    envoi_suspendu: false,
    proprietaire: { prenom: "Koffi", nom: "Adjovi", email: "koffi@studiokoffi.bj", telephone: "+229 01 97 ***" },
    forfait: { type: "payant", statut: "actif", montant: 25000, achetees: 111, restantes: 34, fin: ilYA(-60 * 24 * 19), par_jour: 20 },
    comptes: [
      { canal: "whatsapp", identifiant: "+229 97 00 00 00", statut: "actif", note_sante: 96 },
      { canal: "email", identifiant: "koffi@studiokoffi.bj", statut: "actif", note_sante: 100 },
    ],
    campagnes: 3,
    prospects: 186,
    encaisse_mois: 25000,
    couts_mois: { unipile: 6560, ia: 7440, paiement: 750 },
  } satisfies AdminClientVue,

  comptes: {
    total_actifs: 61,
    comptes: [
      { entreprise: "Traiteur Saveurs", canal: "whatsapp", identifiant: "+225 07 ** ** **", statut: "a_rebrancher", note_sante: 40, derniere_erreur: "Compte déconnecté", envois_aujourdhui: 0, quota_jour: 20, verifie_le: ilYA(120) },
      { entreprise: "Agence Teranga", canal: "whatsapp", identifiant: "+221 77 ** ** **", statut: "actif", note_sante: 62, derniere_erreur: "Taux de livraison en baisse (82 %)", envois_aujourdhui: 14, quota_jour: 20, verifie_le: ilYA(30) },
      { entreprise: "Studio Koffi", canal: "whatsapp", identifiant: "+229 97 ** ** **", statut: "actif", note_sante: 96, derniere_erreur: null, envois_aujourdhui: 24, quota_jour: 40, verifie_le: ilYA(10) },
    ],
  } satisfies AdminComptesVue,

  annuaire: {
    entreprises: 1_200_000,
    pays: 16,
    avec_telephone: 816_000,
    avec_site: 372_000,
    sources: [
      { nom: "Overture Maps", licence: "CDLA Permissive 2.0", peut_stocker: true, fiches: 640_000, derniere_maj: ilYA(60 * 24 * 3) },
      { nom: "OpenStreetMap", licence: "ODbL", peut_stocker: true, fiches: 310_000, derniere_maj: ilYA(60 * 24) },
      { nom: "GLEIF", licence: "CC0", peut_stocker: true, fiches: 4_200, derniere_maj: ilYA(60 * 24) },
    ],
  } satisfies AdminAnnuaireVue,

  messages: {
    controles_semaine: 2480,
    bloques_semaine: 31,
    liste: [
      { id: "b1", cree_le: ilYA(20), entreprise: "Studio Koffi", canal: "whatsapp", corps: "...je vous garantis une augmentation de vos ventes dès le premier mois.", motifs: ["Pas de fausse promesse (INTERDITS.md, section 1)"] },
      { id: "b2", cree_le: ilYA(60), entreprise: "Agence Teranga", canal: "email", corps: "Suite à notre échange de la semaine dernière...", motifs: ["Pas de fausse familiarité"] },
    ],
  } satisfies AdminMessagesVue,

  paiements: {
    encaisse_mois: 1_240_000,
    nombre_mois: 52,
    en_attente: 3,
    echoues: 1,
    liste: [
      { id: "q1", entreprise: "Traiteur Saveurs", montant: 10000, moyen: "wave", statut: "en_attente", cree_le: ilYA(80) },
      { id: "q2", entreprise: "Studio Koffi", montant: 25000, moyen: "mtn_momo", statut: "reussi", cree_le: ilYA(60 * 24) },
      { id: "q3", entreprise: "Agence Teranga", montant: 50000, moyen: "orange_money", statut: "reussi", cree_le: ilYA(60 * 30) },
      { id: "q4", entreprise: "Imprimerie Sogbo", montant: 10000, moyen: "moov_money", statut: "echoue", cree_le: ilYA(60 * 40) },
    ],
  } satisfies AdminPaiementsVue,

  codes_promo: {
    codes: [
      { id: "c1", code: "BIENVENUE26", libelle: "Cadeau de lancement", pourcentage: 20, plafond_remise_fcfa: null, montant_min_fcfa: 5000, debut: ilYA(60 * 24 * 10), fin: null, max_utilisations: 100, max_par_entreprise: 1, nouveaux_clients_seulement: true, pays: [], actif: true, cree_le: ilYA(60 * 24 * 10), utilisations: 14, en_cours: 1, remise_totale_fcfa: 61_500, etat: "actif" },
      { id: "c2", code: "RADIOCOTONOU", libelle: "Partenariat radio", pourcentage: 100, plafond_remise_fcfa: 25000, montant_min_fcfa: 5000, debut: ilYA(60 * 24 * 3), fin: ilYA(-60 * 24 * 27), max_utilisations: 5, max_par_entreprise: 1, nouveaux_clients_seulement: false, pays: ["BJ"], actif: true, cree_le: ilYA(60 * 24 * 3), utilisations: 2, en_cours: 0, remise_totale_fcfa: 50_000, etat: "actif" },
      { id: "c3", code: "NOEL2025A", libelle: "Fêtes de fin d'année", pourcentage: 15, plafond_remise_fcfa: 10000, montant_min_fcfa: 10000, debut: ilYA(60 * 24 * 320), fin: ilYA(60 * 24 * 290), max_utilisations: null, max_par_entreprise: 1, nouveaux_clients_seulement: false, pays: [], actif: true, cree_le: ilYA(60 * 24 * 320), utilisations: 31, en_cours: 0, remise_totale_fcfa: 189_000, etat: "expire" },
    ],
    recentes: [
      { code: "BIENVENUE26", entreprise: "Studio Koffi", remise_fcfa: 5000, a_payer_fcfa: 20000, statut: "confirme", cree_le: ilYA(60 * 5) },
      { code: "RADIOCOTONOU", entreprise: "École Les Lauréats", remise_fcfa: 25000, a_payer_fcfa: 0, statut: "confirme", cree_le: ilYA(60 * 30) },
      { code: "BIENVENUE26", entreprise: "Traiteur Saveurs", remise_fcfa: 2000, a_payer_fcfa: 8000, statut: "reserve", cree_le: ilYA(12) },
    ],
  } satisfies AdminCodesPromoVue,

  couts: {
    encaisse: 1_240_000,
    couts: { unipile: 167_000, ia: 148_000, paiement: 37_000 },
    paliers: [
      { montant_min: 5000, clients: 6 },
      { montant_min: 10000, clients: 11 },
      { montant_min: 25000, clients: 12 },
      { montant_min: 50000, clients: 4 },
      { montant_min: 100000, clients: 1 },
    ],
  } satisfies AdminCoutsVue,

  tickets: [
    { id: "t1", entreprise: "Traiteur Saveurs", sujet: "J'ai payé avec Wave mais mon forfait n'est pas crédité.", statut: "ouvert", priorite: 1, cree_le: ilYA(40) },
    { id: "t2", entreprise: "Agence Teranga", sujet: "Comment j'ajoute un collègue à mon compte ?", statut: "ouvert", priorite: 2, cree_le: ilYA(180) },
  ] satisfies AdminTicketLigne[],

  ticket: {
    id: "t1",
    entreprise: "Traiteur Saveurs",
    sujet: "J'ai payé avec Wave mais mon forfait n'est pas crédité.",
    statut: "ouvert",
    priorite: 1,
    cree_le: ilYA(40),
    messages: [{ id: "tm1", auteur: "client", corps: "Bonjour, j'ai payé 10 000 FCFA avec Wave il y a une heure et rien n'apparaît.", cree_le: ilYA(40) }],
  } satisfies AdminTicketVue,

  journal: [
    { id: "j1", cree_le: ilYA(25), admin: "equipe@exemple.com", action: "suspendre_envoi", cible_type: "entreprise", cible_id: "a2", charge: { motif: "compte déconnecté" } },
    { id: "j2", cree_le: ilYA(60 * 5), admin: "equipe@exemple.com", action: "offrir_entreprises", cible_type: "entreprise", cible_id: "a1", charge: { nombre: 10, motif: "geste commercial" } },
  ] satisfies AdminJournalVue,
};
