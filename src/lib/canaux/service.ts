import "server-only";
import { creerClientAdmin } from "../supabase/admin";
import { env } from "../env";
import { log } from "../journal";
import { echec, succes, type Resultat } from "../resultat";
import { enteteValide, lireEvenement, signatureLienValide, signerLien, statutDepuisUnipile } from "./regles";
import { creerFournisseurUnipile, ErreurUnipile, unipileConfigure } from "./unipile";
import type { Canal, CompteDistant, FournisseurCanaux, WebhookDistant } from "./types";

/**
 * Les opérations de connexion des comptes, au-dessus de l'interface `FournisseurCanaux` (jamais d'appel direct à Unipile ici :
 * on passe par le fournisseur, que les tests remplacent par un faux).
 * Règles : le client paie AVANT de brancher ; un compte refusé au retour est supprimé chez Unipile (il coûterait un mois plein) ;
 * l'identifiant Unipile ne sort jamais d'ici vers le navigateur.
 */

let remplacant: FournisseurCanaux | null = null;
/** Pour les tests : remplace Unipile par un faux. */
export function utiliserFournisseur(f: FournisseurCanaux | null): void {
  remplacant = f;
}
function fournisseur(): FournisseurCanaux {
  return remplacant ?? creerFournisseurUnipile();
}

const MESSAGES_REFUS: Record<string, string> = {
  forfait_requis: "Choisissez d'abord un forfait payant : les comptes se connectent après le paiement.",
  canal_deja_branche: "Un compte est déjà connecté pour ce canal. Débranchez-le d'abord pour en connecter un autre.",
  limite_comptes: "Votre forfait ne comprend pas de compte de plus. Débranchez un compte ou passez à un forfait supérieur.",
};

export function messagePourRefus(raison: string): string {
  return MESSAGES_REFUS[raison] ?? "Ce compte ne peut pas être connecté pour le moment.";
}

function adresseSite(): string | null {
  const a = env().APP_URL;
  return a ? a.replace(/\/$/, "") : null;
}

/** La connexion est-elle prête : clé, adresse, secret, adresse du site. */
export function connexionPrete(): boolean {
  const e = env();
  return unipileConfigure() && !!e.UNIPILE_WEBHOOK_SECRET && !!e.APP_URL;
}

// ───── Brancher ─────────────────────────────────────────────────────────────

export async function creerLienDeConnexion(a: { entrepriseId: string; utilisateurId: string; canal: Canal; rebrancherCompteId?: string }): Promise<Resultat<{ url: string }>> {
  const site = adresseSite();
  const secret = env().UNIPILE_WEBHOOK_SECRET;
  if (!connexionPrete() || !site || !secret) return echec("La connexion des comptes n'est pas encore activée. Écrivez-nous depuis la page Support.", "non_configure");

  const admin = creerClientAdmin();
  let compteDistantId: string | undefined;
  if (a.rebrancherCompteId) {
    const { data } = await admin.from("comptes_connectes").select("id, canal, unipile_account_id, statut").eq("id", a.rebrancherCompteId).eq("entreprise_id", a.entrepriseId).maybeSingle();
    if (!data || data.statut === "debranche") return echec("Ce compte est introuvable.", "compte_inconnu");
    compteDistantId = data.unipile_account_id;
    if (data.canal !== a.canal) return echec("Ce compte est introuvable.", "compte_inconnu");
  } else {
    const { data: verdict } = await admin.rpc("verifier_branchement", { p_entreprise: a.entrepriseId, p_canal: a.canal });
    if (verdict !== "ok") return echec(messagePourRefus(String(verdict)), String(verdict ?? "refus"));
  }

  const { data: autorise } = await admin.rpc("verifier_limite", { p_cle: `lien:${a.entrepriseId}`, p_action: "lien_connexion", p_maximum: 10, p_fenetre: "1 hour" });
  if (autorise === false) return echec("Trop de tentatives de connexion. Patientez avant de réessayer.", "trop_de_tentatives");

  const { data: lien, error } = await admin
    .from("liens_connexion")
    .insert({ entreprise_id: a.entrepriseId, canal: a.canal, type: compteDistantId ? "reconnect" : "create", compte_id: a.rebrancherCompteId ?? null, cree_par: a.utilisateurId, expire_le: new Date(Date.now() + 30 * 60_000).toISOString() })
    .select("id")
    .single();
  if (error || !lien) {
    log.error("canaux.lien_impossible", { erreur: error?.message });
    return echec("La connexion n'a pas pu être préparée. Réessayez dans un instant.", "base");
  }

  try {
    const r = await fournisseur().creerLienConnexion({
      nom: lien.id,
      canal: a.canal,
      adresseRetour: `${site}/api/webhooks/unipile/compte?l=${lien.id}&s=${signerLien(lien.id, secret)}`,
      succes: `${site}/app/comptes?connexion=ok`,
      echec: `${site}/app/comptes?connexion=echec`,
      expireDans: 30,
      rebrancher: compteDistantId,
    });
    return succes({ url: r.url });
  } catch (e) {
    log.error("canaux.lien_refuse", { statut: e instanceof ErreurUnipile ? e.statutHttp : 0, canal: a.canal });
    return echec("Le service de connexion ne répond pas. Réessayez dans un instant.", "fournisseur");
  }
}

/**
 * Le retour d'Unipile après la connexion. Trois barrières : la signature de l'adresse, un lien connu et neuf, et un compte
 * qui existe VRAIMENT chez Unipile (on le relit avec notre clé). Un compte refusé est supprimé chez Unipile pour ne pas être facturé.
 */
export async function traiterRetourConnexion(a: { lienId: string | null; signature: string | null; corps: unknown }): Promise<{ http: number; corps: Record<string, unknown> }> {
  const secret = env().UNIPILE_WEBHOOK_SECRET;
  if (!signatureLienValide(a.lienId, a.signature, secret)) return { http: 401, corps: { ok: false } };
  const ev = lireEvenement(a.corps);
  if (ev.type !== "retour_connexion" || ev.nom !== a.lienId) return { http: 400, corps: { ok: false } };

  const admin = creerClientAdmin();
  const f = fournisseur();
  let compte: CompteDistant | null;
  try {
    compte = await f.lireCompte(ev.compteId);
  } catch {
    return { http: 502, corps: { ok: false } }; // Unipile réessaiera
  }
  if (!compte) return { http: 400, corps: { ok: false } };

  const { data: lien } = await admin.from("liens_connexion").select("canal").eq("id", a.lienId as string).maybeSingle();
  const refuser = async (raison: string) => {
    if (raison !== "compte_different" && raison !== "lien_inconnu") {
      try {
        await f.supprimerCompte(ev.compteId);
      } catch (e) {
        log.error("canaux.suppression_orpheline_impossible", { erreur: e instanceof Error ? e.message : "inconnue" });
      }
    }
    log.warn("canaux.retour_refuse", { raison });
    return { http: 200, corps: { ok: false, raison } };
  };
  if (!lien) return refuser("lien_inconnu");
  if (compte.canal !== lien.canal) return refuser("canal_different");

  const { data, error } = await admin.rpc("enregistrer_compte_unipile", { p_lien: a.lienId as string, p_account_id: compte.id, p_identifiant: compte.identifiant });
  if (error || !data) {
    log.error("canaux.enregistrement_impossible", { erreur: error?.message });
    return { http: 500, corps: { ok: false } };
  }
  const r = data as { ok?: boolean; raison?: string };
  if (!r.ok) return refuser(String(r.raison ?? "refus"));
  return { http: 200, corps: { ok: true } };
}

// ───── Les messages automatiques d'Unipile ─────────────────────────────────

export async function traiterEvenement(a: { entete: string | null; corps: unknown }): Promise<{ http: number; resultat: string }> {
  if (!enteteValide(a.entete, env().UNIPILE_WEBHOOK_SECRET)) return { http: 401, resultat: "refuse" };
  const ev = lireEvenement(a.corps);
  const admin = creerClientAdmin();

  if (ev.type === "etat_compte") {
    const statut = statutDepuisUnipile(ev.statutBrut);
    if (!statut) return { http: 200, resultat: "ignore" };
    const { error } = await admin.rpc("appliquer_statut_compte", { p_unipile_account_id: ev.compteId, p_statut: statut, p_message: ev.statutBrut });
    if (error) {
      log.error("canaux.statut_impossible", { erreur: error.message });
      return { http: 500, resultat: "erreur" };
    }
    return { http: 200, resultat: "statut" };
  }
  if (ev.type === "message_recu") {
    const { error } = await admin.rpc("enregistrer_message_recu", { p_unipile_account_id: ev.compteId, p_chat_id: ev.chatId ?? "", p_message_id: ev.messageId ?? "" });
    if (error) {
      log.error("canaux.message_impossible", { erreur: error.message });
      return { http: 500, resultat: "erreur" };
    }
    return { http: 200, resultat: "message" };
  }
  return { http: 200, resultat: "ignore" };
}

// ───── Débrancher ──────────────────────────────────────────────────────────

/** Supprime le compte chez Unipile PUIS le marque débranché : si Unipile ne répond pas, rien ne change et on peut réessayer. */
export async function debrancherCompte(compteId: string, motif: string, entrepriseId?: string): Promise<Resultat<true>> {
  const admin = creerClientAdmin();
  let requete = admin.from("comptes_connectes").select("id, unipile_account_id, statut").eq("id", compteId);
  if (entrepriseId) requete = requete.eq("entreprise_id", entrepriseId);
  const { data } = await requete.maybeSingle();
  if (!data) return echec("Ce compte est introuvable.", "compte_inconnu");
  if (data.statut === "debranche") return succes(true);
  try {
    await fournisseur().supprimerCompte(data.unipile_account_id);
  } catch (e) {
    log.error("canaux.debranchement_impossible", { statut: e instanceof ErreurUnipile ? e.statutHttp : 0 });
    return echec("Le compte n'a pas pu être débranché pour le moment. Réessayez dans un instant.", "fournisseur");
  }
  await admin.rpc("marquer_compte_debranche", { p_compte: compteId, p_motif: motif });
  return succes(true);
}

/**
 * Fin de forfait : débranche les comptes des entreprises qui n'ont plus de forfait payant en cours (actif ou en grâce).
 * Chaque compte débranché ne coûte plus rien chez Unipile. Rejouable : un compte déjà débranché est ignoré.
 */
export async function debrancherComptesSansForfait(): Promise<{ debranches: number; echecs: number }> {
  const admin = creerClientAdmin();
  const { data: comptes } = await admin.from("comptes_connectes").select("id, entreprise_id").in("statut", ["actif", "a_rebrancher", "suspendu"]);
  const { data: vivants } = await admin.from("forfaits").select("entreprise_id").eq("type", "payant").in("statut", ["actif", "grace"]);
  const ok = new Set((vivants ?? []).map((v) => v.entreprise_id));
  let debranches = 0;
  let echecs = 0;
  for (const c of (comptes ?? []).filter((x) => !ok.has(x.entreprise_id))) {
    const r = await debrancherCompte(c.id, "fin du forfait");
    if (r.ok) debranches++;
    else echecs++;
  }
  return { debranches, echecs };
}

// ───── Surveillance et mise en place (équipe) ──────────────────────────────

export type RapportSynchro = { synchronises: number; orphelins: { id: string; type: string; identifiant: string }[]; manquants: number };

/**
 * Compare ce que dit Unipile à ce que nous savons : applique les états, repère les comptes qui existent chez Unipile mais pas chez nous
 * (ils sont FACTURÉS sans servir : à supprimer) et ceux qui ont disparu chez Unipile.
 */
export async function synchroniserComptes(): Promise<Resultat<RapportSynchro>> {
  let distants: CompteDistant[];
  try {
    distants = await fournisseur().listerComptes();
  } catch (e) {
    return echec(e instanceof ErreurUnipile ? e.message : "Unipile ne répond pas.", "fournisseur");
  }
  const admin = creerClientAdmin();
  const { data: locaux } = await admin.from("comptes_connectes").select("id, unipile_account_id, statut").in("statut", ["actif", "a_rebrancher", "suspendu"]);
  const parId = new Map(distants.map((d) => [d.id, d]));
  let synchronises = 0;
  let manquants = 0;
  for (const l of locaux ?? []) {
    const d = parId.get(l.unipile_account_id);
    if (!d) {
      manquants++;
      await admin.rpc("appliquer_statut_compte", { p_unipile_account_id: l.unipile_account_id, p_statut: "a_rebrancher", p_message: "ABSENT" });
      continue;
    }
    const statut = statutDepuisUnipile(d.statutBrut);
    if (statut && statut !== "debranche") {
      await admin.rpc("appliquer_statut_compte", { p_unipile_account_id: l.unipile_account_id, p_statut: statut, p_message: d.statutBrut });
      synchronises++;
    }
  }
  const connus = new Set((locaux ?? []).map((l) => l.unipile_account_id));
  const { data: tous } = await admin.from("comptes_connectes").select("unipile_account_id");
  for (const t of tous ?? []) connus.add(t.unipile_account_id);
  const orphelins = distants.filter((d) => !connus.has(d.id)).map((d) => ({ id: d.id, type: d.type, identifiant: d.identifiant }));
  return succes({ synchronises, orphelins, manquants });
}

export type RapportWebhooks = { crees: string[]; existants: string[]; erreurs: string[]; liste: WebhookDistant[] };

/** Déclare chez Unipile les deux adresses qui nous préviennent (messages reçus, état des comptes), avec l'en-tête secret. Sans doublon. */
export async function declarerWebhooks(): Promise<Resultat<RapportWebhooks>> {
  const site = adresseSite();
  const secret = env().UNIPILE_WEBHOOK_SECRET;
  if (!connexionPrete() || !site || !secret) return echec("Il manque UNIPILE_DSN, UNIPILE_API_KEY, UNIPILE_WEBHOOK_SECRET ou APP_URL.", "non_configure");
  const f = fournisseur();
  const url = `${site}/api/webhooks/unipile`;
  let existants: WebhookDistant[];
  try {
    existants = await f.listerWebhooks();
  } catch (e) {
    return echec(e instanceof ErreurUnipile ? e.message : "Unipile ne répond pas.", "fournisseur");
  }
  const rapport: RapportWebhooks = { crees: [], existants: [], erreurs: [], liste: existants };
  for (const source of ["messaging", "account_status"] as const) {
    if (existants.some((w) => w.url === url && w.source === source)) {
      rapport.existants.push(source);
      continue;
    }
    try {
      const w = await f.creerWebhook({ source, url, secret, nom: `leed-${source}` });
      rapport.crees.push(source);
      rapport.liste.push(w);
    } catch (e) {
      rapport.erreurs.push(`${source} : ${e instanceof ErreurUnipile ? e.message : "échec"}`);
    }
  }
  return succes(rapport);
}

export async function listerComptesDistants(): Promise<Resultat<CompteDistant[]>> {
  try {
    return succes(await fournisseur().listerComptes());
  } catch (e) {
    return echec(e instanceof ErreurUnipile ? `${e.message}${e.statutHttp ? ` (code ${e.statutHttp})` : ""}` : "Unipile ne répond pas.", "fournisseur");
  }
}

export async function listerWebhooksDistants(): Promise<Resultat<WebhookDistant[]>> {
  try {
    return succes(await fournisseur().listerWebhooks());
  } catch (e) {
    return echec(e instanceof ErreurUnipile ? e.message : "Unipile ne répond pas.", "fournisseur");
  }
}

/** Test d'envoi réservé à l'équipe (docs/UNIPILE.md §7) : un message à NOUS-MÊMES, jamais à un prospect. */
export async function envoyerMessageDeTest(a: { compteId: string; canal: Canal; destinataire: string; texte: string; objet?: string }): Promise<Resultat<{ chatId: string | null; messageId: string | null }>> {
  try {
    const r = await fournisseur().envoyer({ compteId: a.compteId, destinataire: a.destinataire, texte: a.texte, objet: a.objet }, a.canal);
    return succes(r);
  } catch (e) {
    return echec(e instanceof ErreurUnipile ? `${e.message}${e.statutHttp ? ` (code ${e.statutHttp})` : ""}` : "L'envoi a échoué.", "fournisseur");
  }
}
