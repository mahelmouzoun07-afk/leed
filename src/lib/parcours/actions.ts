"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { z } from "zod";
import { creerClientAdmin } from "../supabase/admin";
import { env } from "../env";
import { log } from "../journal";
import { echec, succes, type Resultat } from "../resultat";
import { creerClientIA, iaDisponible, messagePourErreurIA } from "../ia/client";
import { faireFiche, proposerProfilsIA } from "../ia/agent";
import { lireSite } from "../ia/lecteur";
import { schemaFiche } from "../ia/schemas";
import * as factice from "./factice";
import { normaliserSite } from "./site";
import { estSecteur } from "../annuaire/secteurs";
import { fusionnerApercus, paysDuVisiteur, PAYS_ANNUAIRE, type ReponseApercuSql } from "../annuaire/apercu";
import type { Apercu, Entree, Fiche, Profil, Question } from "./types";

/**
 * Les vraies fonctions du parcours « décrire son activité » (Server Actions, appelées par les écrans).
 * Elles remplacent les fonctions factices de factice.ts, avec la même forme.
 * Tant qu'aucune clé d'IA n'est posée (IA_CLE_API ou GROQ_API_KEY), on se rabat sur les exemples factices
 * pour que le site ne casse jamais : le journal le dit.
 */

const texteCourt = (max: number) => z.string().trim().max(max);
const schemaEntree = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("site"), site: texteCourt(120) }),
  z.object({
    mode: z.literal("formulaire"),
    formulaire: z.object({
      vend: texteCourt(600).min(3),
      client: texteCourt(400),
      secteurs: z.array(texteCourt(80)).max(10),
      taille: texteCourt(80),
      zone: texteCourt(160),
      prixMoyen: texteCourt(80),
      objectif: texteCourt(200),
    }),
  }),
]);

/** L'empreinte (hachée) de l'adresse du visiteur, pour limiter les abus sans garder son adresse. */
async function empreinte(): Promise<string> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "inconnue";
  return createHash("sha256").update(`${env().SEL_EMPREINTE_IP ?? "leed"}:${ip}`).digest("hex");
}

/**
 * L'IA gratuite a un quota (environ 1 000 demandes par jour chez Groq) : on le protège de deux façons,
 * quelques analyses par heure et par visiteur, et un plafond global par jour.
 */
async function quotaOk(): Promise<boolean> {
  if (!env().SUPABASE_SERVICE_ROLE_KEY) return true;
  try {
    const admin = creerClientAdmin();
    const parVisiteur = await admin.rpc("verifier_limite", { p_cle: `ia:${await empreinte()}`, p_action: "analyse_ia", p_maximum: 8, p_fenetre: "1 hour" });
    if (parVisiteur.data === false) return false;
    const global = await admin.rpc("verifier_limite", { p_cle: "ia:global", p_action: "analyse_ia_jour", p_maximum: 400, p_fenetre: "1 day" });
    return global.data !== false;
  } catch (e) {
    log.error("parcours.quota_erreur", { erreur: e instanceof Error ? e.message : String(e) });
    return true; // une panne du compteur ne doit pas bloquer tous les visiteurs
  }
}

const TROP = "Beaucoup de personnes essaient leed en ce moment. Réessayez dans un moment, ou décrivez votre activité à la place.";

export async function analyserActivite(brute: Entree): Promise<Resultat<Fiche>> {
  const entree = schemaEntree.safeParse(brute);
  if (!entree.success) return echec("Vérifiez ce que vous avez saisi, puis réessayez.", "entree_invalide");
  let e: Entree = entree.data;

  if (e.mode === "site") {
    const domaine = normaliserSite(e.site);
    if (!domaine) return echec("Entrez une adresse de site valide, par exemple studiokoffi.bj.", "site_invalide");
    e = { mode: "site", site: domaine };
  }

  if (!iaDisponible()) {
    log.warn("parcours.ia_absente", { action: "analyserActivite" });
    return factice.analyserActivite(e);
  }
  if (!(await quotaOk())) return echec(TROP, "quota");

  let texteSite: string | undefined;
  if (e.mode === "site") {
    const lu = await lireSite(e.site);
    if (!lu.ok) return echec(lu.erreur, lu.code);
    texteSite = lu.donnees.texte;
  }

  try {
    const r = await faireFiche(creerClientIA(), e, texteSite);
    if (!r.ok) return echec(r.erreur, r.code);
    return succes(r.donnees.fiche);
  } catch (erreur) {
    log.error("parcours.fiche_erreur", { erreur: erreur instanceof Error ? erreur.message : String(erreur) });
    return echec(messagePourErreurIA(erreur), "ia_erreur");
  }
}

/** Les questions de précision : fixes, rédigées une fois (aucun appel à l'IA, donc aucun coût ni attente). */
export async function poserQuestions(entree: Entree): Promise<Resultat<Question[]>> {
  if (entree.mode === "formulaire") return succes([]);
  return succes([
    { id: "prix", texte: "Vos clients vous demandent-ils d'abord un devis ?", choix: ["Oui, toujours", "Parfois", "Non, mes prix sont affichés"] },
    { id: "objectif", texte: "Que voulez-vous obtenir en premier ?", choix: ["Des rendez-vous", "Des demandes de devis", "Des commandes directes"] },
  ]);
}

export async function proposerProfils(fiche?: Fiche, reponses?: Record<string, string>): Promise<Resultat<Profil[]>> {
  if (!iaDisponible()) {
    log.warn("parcours.ia_absente", { action: "proposerProfils" });
    return factice.proposerProfils();
  }
  // La fiche vient du navigateur : on la revérifie comme n'importe quelle entrée.
  const f = schemaFiche.safeParse(fiche);
  if (!f.success) return echec("Nous avons perdu votre fiche. Recommencez l'analyse de votre activité.", "fiche_invalide");
  const rep = z.record(z.string().max(40), texteCourt(200)).refine((o) => Object.keys(o).length <= 10).safeParse(reponses ?? {});
  if (!(await quotaOk())) return echec(TROP, "quota");

  try {
    const r = await proposerProfilsIA(creerClientIA(), f.data, rep.success ? rep.data : undefined);
    if (!r.ok) return echec(r.erreur, r.code);
    return succes(r.donnees.profils);
  } catch (erreur) {
    log.error("parcours.profils_erreur", { erreur: erreur instanceof Error ? erreur.message : String(erreur) });
    return echec(messagePourErreurIA(erreur), "ia_erreur");
  }
}

/** Moins d'entreprises que cela dans tout l'annuaire : on considère qu'il n'est pas encore chargé (il ne contient alors que des exemples). */
const ANNUAIRE_CHARGE_MIN = 200;

/**
 * Le vrai nombre d'entreprises de l'annuaire pour les profils gardés (fonction SQL apercu_annuaire, réservée au serveur).
 * Aucun nom ni coordonnée ne sort d'ici : un total, la répartition par canal, trois lignes sans nom.
 * Tant que l'annuaire n'est pas chargé, on se rabat sur les exemples factices (la bannière du parcours le dit).
 */
export async function chercherProspects(profils: Profil[], entree?: Entree, fiche?: Fiche): Promise<Resultat<Apercu>> {
  const actifs = (Array.isArray(profils) ? profils : []).filter((p) => p && p.actif);
  if (actifs.length === 0) return echec("Gardez au moins un profil de client pour lancer la recherche.", "aucun_profil");
  if (!env().SUPABASE_SERVICE_ROLE_KEY) {
    log.warn("parcours.annuaire_absent", { action: "chercherProspects" });
    return factice.chercherProspects(profils);
  }

  // Ce qui vient du navigateur est revérifié : la fiche et l'entrée servent seulement à deviner le pays.
  const e = schemaEntree.safeParse(entree);
  const f = schemaFiche.safeParse(fiche);
  const secteurs = [...new Set(actifs.flatMap((p) => (Array.isArray(p.secteurs) ? p.secteurs : []).filter((s) => typeof s === "string" && estSecteur(s))))];
  if (secteurs.length === 0) return echec("Vos profils datent d'avant une mise à jour. Revenez à l'étape précédente pour les recalculer.", "profils_sans_secteur");
  const pays = paysDuVisiteur(e.success ? e.data : undefined, f.success ? f.data : undefined);

  try {
    const admin = creerClientAdmin();
    const demander = async (liste: readonly string[], filtre: string[] | undefined) =>
      Promise.all(
        liste.map(async (p) => {
          const { data, error } = await admin.rpc("apercu_annuaire", { p_pays: p, ...(filtre ? { p_secteurs: filtre } : {}) });
          if (error) throw new Error(error.message);
          return data as unknown as ReponseApercuSql;
        }),
      );

    const apercu = fusionnerApercus(await demander(pays, secteurs));
    if (apercu.total > 0) return succes(apercu);

    // Aucun résultat : soit l'annuaire n'est pas chargé, soit ces profils sont trop rares dans cette zone.
    const tout = (await demander(PAYS_ANNUAIRE, undefined)).reduce((s, r) => s + (r.total ?? 0), 0);
    if (tout < ANNUAIRE_CHARGE_MIN) {
      log.warn("parcours.annuaire_vide", { total: tout });
      return factice.chercherProspects(profils);
    }
    return echec("Notre annuaire ne contient pas encore d'entreprises pour ces profils dans votre zone. Élargissez vos profils pour continuer.", "aucun_resultat");
  } catch (erreur) {
    log.error("parcours.apercu_erreur", { erreur: erreur instanceof Error ? erreur.message : String(erreur) });
    return echec("La recherche est momentanément indisponible. Réessayez dans un instant.", "annuaire_indisponible");
  }
}
