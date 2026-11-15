/**
 * Fonctions « factices » du parcours : elles renvoient des EXEMPLES, jamais de
 * vraies données. Chaque fonction a la forme finale qu'auront les vraies
 * (chantiers 5, 6 et 10) : on remplacera le corps, pas les écrans.
 * Un site dont le nom contient « erreur » déclenche l'état d'erreur, pour
 * pouvoir tester cet écran.
 */
import { echec, succes, type Resultat } from "@/lib/resultat";
import type { Apercu, Entree, Fiche, Profil, Question } from "./types";

const attendre = (ms: number) => new Promise((r) => setTimeout(r, ms));

function nomDepuisSite(site: string) {
  const base = site.split(".")[0].replace(/[-_]/g, " ");
  return base.charAt(0).toUpperCase() + base.slice(1);
}

export async function analyserActivite(entree: Entree): Promise<Resultat<Fiche>> {
  await attendre(900);
  if (entree.mode === "site" && entree.site.includes("erreur")) {
    return echec("Nous n'avons pas pu ouvrir ce site. Vérifiez l'adresse, ou décrivez votre activité à la place.", "site_inaccessible");
  }
  const nom = entree.mode === "site" ? nomDepuisSite(entree.site) : "Votre entreprise";
  const decrit = entree.mode === "formulaire" ? entree.formulaire.vend : "";
  return succes({
    nom,
    resume: decrit || `${nom} propose des services aux entreprises de sa région. Voici ce que l'agent a compris en lisant votre site.`,
    offres: ["Identité visuelle et logo", "Affiches et supports imprimés", "Contenus pour les réseaux sociaux"],
    zone: entree.mode === "formulaire" && entree.formulaire.zone ? entree.formulaire.zone : "Bénin et pays voisins",
    forces: ["Prix clairs", "Réponse rapide", "Réalisations visibles en ligne"],
    concurrents: ["atelier-graphique.bj", "studio-creation.ci", "agence-visuelle.sn", "print-et-design.tg"],
  });
}

export async function poserQuestions(entree: Entree): Promise<Resultat<Question[]>> {
  await attendre(300);
  if (entree.mode === "formulaire") return succes([]);
  return succes([
    { id: "prix", texte: "Vos clients vous demandent-ils d'abord un devis ?", choix: ["Oui, toujours", "Parfois", "Non, mes prix sont affichés"] },
    { id: "objectif", texte: "Que voulez-vous obtenir en premier ?", choix: ["Des rendez-vous", "Des demandes de devis", "Des commandes directes"] },
  ]);
}

export async function proposerProfils(): Promise<Resultat<Profil[]>> {
  await attendre(700);
  return succes([
    { id: "restos", nom: "Restaurants et maquis sans logo professionnel", raison: "Forte demande de visuels, budgets compatibles", note: 92, actif: true },
    { id: "mode", nom: "Boutiques de mode", raison: "Besoin de nouveaux visuels chaque semaine", note: 85, actif: true },
    { id: "ecoles", nom: "Écoles privées", raison: "Affiches et flyers à chaque rentrée", note: 78, actif: true },
    { id: "hotels", nom: "Hôtels et résidences", raison: "Supports d'accueil et signalétique à refaire", note: 74, actif: false },
  ]);
}

export async function chercherProspects(profils: Profil[]): Promise<Resultat<Apercu>> {
  await attendre(1100);
  const actifs = profils.filter((p) => p.actif);
  if (actifs.length === 0) return echec("Gardez au moins un profil de client pour lancer la recherche.", "aucun_profil");
  const facteur = actifs.length;
  return succes({
    total: 410 * facteur,
    exemples: [
      { secteur: "Restaurant", ville: "Cotonou", taille: "1 à 10 personnes", indice: "pas de logo professionnel" },
      { secteur: "Boutique", ville: "Porto-Novo", taille: "1 à 10 personnes", indice: "vient d'ouvrir" },
      { secteur: "École privée", ville: "Abomey-Calavi", taille: "11 à 50 personnes", indice: "rentrée dans six semaines" },
    ],
    canaux: [
      { canal: "WhatsApp", nombre: 270 * facteur },
      { canal: "Email", nombre: 100 * facteur },
      { canal: "Instagram", nombre: 47 * facteur },
      { canal: "Facebook", nombre: 31 * facteur },
      { canal: "LinkedIn", nombre: 20 * facteur },
    ],
  });
}

export type DonneesCompte = { prenom: string; entreprise: string; email: string; pays: string; motDePasse?: string };

export async function creerCompte(d: DonneesCompte): Promise<Resultat<{ email: string }>> {
  await attendre(600);
  if (d.email.endsWith("@erreur.test")) return echec("Cette adresse est déjà utilisée. Connectez-vous plutôt.", "email_pris");
  return succes({ email: d.email });
}

export async function seConnecter(email: string): Promise<Resultat<{ email: string }>> {
  await attendre(500);
  if (email.endsWith("@erreur.test")) return echec("Nous n'arrivons pas à envoyer le lien pour le moment. Réessayez dans quelques minutes.", "envoi_impossible");
  return succes({ email });
}

export async function choisirOffre(choix: { type: "essai" } | { type: "forfait"; montant: number; moyen: string }): Promise<Resultat<{ suite: string }>> {
  await attendre(600);
  return succes({ suite: choix.type });
}
