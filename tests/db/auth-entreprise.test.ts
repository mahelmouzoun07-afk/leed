/**
 * Tests du module 04 contre une vraie base Supabase :
 *   - création de l'entreprise à l'inscription ;
 *   - rattachement de l'analyse faite AVANT l'inscription ;
 *   - isolation entre deux utilisateurs ;
 *   - limite de fréquence.
 *
 * Ce sont les tests obligatoires du module 04.
 * Sautés si TEST_SUPABASE_* ne sont pas définis (voir tests/db/README.md).
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  configTestOuNull,
  clientAdmin,
  clientAnon,
  creerUtilisateurEtClient,
} from "./helpers";

const config = configTestOuNull();
const describeSiDb = config ? describe : describe.skip;

/** Préfixe commun : sert au nettoyage entre deux exécutions. */
const PREFIXE = "test-auth-";

interface LigneEntreprise {
  nom: string;
  pays: string | null;
  site_web: string | null;
  description: string | null;
  analyse_ia: unknown;
  analyse_le: string | null;
}

interface LigneAnalyse {
  rattachee_a: string | null;
  rattachee_le: string | null;
}

/** Vide les lignes de test. Les analyses d'abord : elles pointent vers les entreprises. */
async function nettoyer(admin: SupabaseClient): Promise<void> {
  await admin.from("analyses_anonymes").delete().ilike("jeton", `${PREFIXE}%`);
  await admin.from("entreprises").delete().ilike("nom", `${PREFIXE}%`);
  await admin.from("tentatives").delete().ilike("cle", `%${PREFIXE}%`);
}

describeSiDb("Création de l'entreprise à l'inscription (module 04)", () => {
  let admin: SupabaseClient;
  let compteur = 0;

  /**
   * Un utilisateur neuf à chaque fois : `creer_entreprise_pour_utilisateur`
   * ne crée qu'une seule entreprise par utilisateur, donc un test qui
   * réutiliserait le même compte testerait autre chose que ce qu'il annonce.
   */
  async function nouvelUtilisateur() {
    compteur += 1;
    return creerUtilisateurEtClient(
      config!,
      `${PREFIXE}u${compteur}@djeli.test`,
    );
  }

  beforeAll(async () => {
    if (!config) return;
    admin = clientAdmin(config);
    await nettoyer(admin);
  }, 30_000);

  afterAll(async () => {
    if (!config) return;
    await nettoyer(admin);
  }, 30_000);

  it("jeton valide : l'analyse faite avant l'inscription est rattachée", async () => {
    const u = await nouvelUtilisateur();
    const jeton = `${PREFIXE}jeton-valide`;
    const resultat = {
      secteur: "artisanat",
      profils_cibles: ["hôtels", "boutiques de décoration"],
    };

    await admin.from("analyses_anonymes").insert({
      jeton,
      entree: "https://exemple-artisanat.bj",
      type_entree: "lien",
      pays: "BJ",
      resultat,
      etat: "pret",
    });

    const { data: entrepriseId, error } = await u.client.rpc(
      "creer_entreprise_pour_utilisateur",
      { nom: `${PREFIXE}avec-analyse`, pays: "BJ", jeton_analyse: jeton },
    );

    expect(error).toBeNull();
    expect(entrepriseId).toBeTruthy();

    // L'entreprise reprend l'analyse et le site donné par le visiteur :
    // il n'a rien à refaire après son inscription.
    const { data: entreprise } = await admin
      .from("entreprises")
      .select("nom, pays, site_web, description, analyse_ia, analyse_le")
      .eq("id", entrepriseId)
      .single<LigneEntreprise>();

    expect(entreprise!.analyse_ia).toEqual(resultat);
    expect(entreprise!.site_web).toBe("https://exemple-artisanat.bj");
    expect(entreprise!.description).toBeNull(); // c'était un lien, pas un texte
    expect(entreprise!.analyse_le).not.toBeNull();
    expect(entreprise!.pays).toBe("BJ");

    // L'analyse est marquée comme rattachée : elle ne pourra pas resservir.
    const { data: analyse } = await admin
      .from("analyses_anonymes")
      .select("rattachee_a, rattachee_le")
      .eq("jeton", jeton)
      .single<LigneAnalyse>();

    expect(analyse!.rattachee_a).toBe(entrepriseId);
    expect(analyse!.rattachee_le).not.toBeNull();

    // L'utilisateur est propriétaire, et son solde de crédits démarre à 0.
    const { data: membre } = await admin
      .from("membres")
      .select("role, profil_id")
      .eq("entreprise_id", entrepriseId)
      .single<{ role: string; profil_id: string }>();

    expect(membre!.role).toBe("proprietaire");
    expect(membre!.profil_id).toBe(u.userId);

    const { data: solde } = await admin
      .from("soldes_credits")
      .select("solde")
      .eq("entreprise_id", entrepriseId)
      .single<{ solde: number }>();

    expect(solde!.solde).toBe(0);
  }, 30_000);

  it("une description (et non un lien) va dans `description`", async () => {
    const u = await nouvelUtilisateur();
    const jeton = `${PREFIXE}jeton-description`;

    await admin.from("analyses_anonymes").insert({
      jeton,
      entree: "Je vends des tissus wax au marché Dantokpa.",
      type_entree: "description",
      resultat: { secteur: "textile" },
      etat: "pret",
    });

    const { data: entrepriseId } = await u.client.rpc(
      "creer_entreprise_pour_utilisateur",
      { nom: `${PREFIXE}avec-description`, pays: "BJ", jeton_analyse: jeton },
    );

    const { data: entreprise } = await admin
      .from("entreprises")
      .select("nom, pays, site_web, description, analyse_ia, analyse_le")
      .eq("id", entrepriseId)
      .single<LigneEntreprise>();

    expect(entreprise!.description).toBe(
      "Je vends des tissus wax au marché Dantokpa.",
    );
    expect(entreprise!.site_web).toBeNull();
  }, 30_000);

  it("jeton expiré : l'inscription réussit, sans rattachement", async () => {
    const u = await nouvelUtilisateur();
    const jeton = `${PREFIXE}jeton-expire`;
    const hier = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

    await admin.from("analyses_anonymes").insert({
      jeton,
      entree: "https://exemple-expire.bj",
      type_entree: "lien",
      resultat: { secteur: "test" },
      etat: "pret",
      expire_le: hier,
    });

    const { data: entrepriseId, error } = await u.client.rpc(
      "creer_entreprise_pour_utilisateur",
      { nom: `${PREFIXE}jeton-perime`, pays: "BJ", jeton_analyse: jeton },
    );

    // Point important : l'inscription ne doit PAS échouer pour autant.
    expect(error).toBeNull();
    expect(entrepriseId).toBeTruthy();

    const { data: entreprise } = await admin
      .from("entreprises")
      .select("nom, pays, site_web, description, analyse_ia, analyse_le")
      .eq("id", entrepriseId)
      .single<LigneEntreprise>();

    expect(entreprise!.analyse_ia).toBeNull();
    expect(entreprise!.site_web).toBeNull();
    expect(entreprise!.analyse_le).toBeNull();

    const { data: analyse } = await admin
      .from("analyses_anonymes")
      .select("rattachee_a, rattachee_le")
      .eq("jeton", jeton)
      .single<LigneAnalyse>();

    expect(analyse!.rattachee_a).toBeNull();
  }, 30_000);

  it("jeton déjà utilisé : l'inscription réussit, sans rattachement", async () => {
    const jeton = `${PREFIXE}jeton-reutilise`;
    const resultat = { secteur: "premier arrivé" };

    await admin.from("analyses_anonymes").insert({
      jeton,
      entree: "https://exemple-partage.bj",
      type_entree: "lien",
      resultat,
      etat: "pret",
    });

    // Le premier utilisateur s'approprie l'analyse.
    const premier = await nouvelUtilisateur();
    const { data: premiereEntreprise } = await premier.client.rpc(
      "creer_entreprise_pour_utilisateur",
      { nom: `${PREFIXE}premier`, pays: "BJ", jeton_analyse: jeton },
    );

    // Le second présente le même jeton (lien partagé, rejeu) : il s'inscrit
    // bien, mais ne récupère pas l'analyse de quelqu'un d'autre.
    const second = await nouvelUtilisateur();
    const { data: secondeEntreprise, error } = await second.client.rpc(
      "creer_entreprise_pour_utilisateur",
      { nom: `${PREFIXE}second`, pays: "BJ", jeton_analyse: jeton },
    );

    expect(error).toBeNull();
    expect(secondeEntreprise).toBeTruthy();
    expect(secondeEntreprise).not.toBe(premiereEntreprise);

    const { data: entrepriseDuSecond } = await admin
      .from("entreprises")
      .select("nom, pays, site_web, description, analyse_ia, analyse_le")
      .eq("id", secondeEntreprise)
      .single<LigneEntreprise>();

    expect(entrepriseDuSecond!.analyse_ia).toBeNull();
    expect(entrepriseDuSecond!.site_web).toBeNull();

    // L'analyse reste la propriété du premier.
    const { data: analyse } = await admin
      .from("analyses_anonymes")
      .select("rattachee_a, rattachee_le")
      .eq("jeton", jeton)
      .single<LigneAnalyse>();

    expect(analyse!.rattachee_a).toBe(premiereEntreprise);
  }, 40_000);

  it("deux utilisateurs n'ont jamais accès à la même entreprise", async () => {
    const a = await nouvelUtilisateur();
    const b = await nouvelUtilisateur();

    const { data: idA } = await a.client.rpc(
      "creer_entreprise_pour_utilisateur",
      { nom: `${PREFIXE}societe-a`, pays: "BJ", jeton_analyse: null },
    );
    const { data: idB } = await b.client.rpc(
      "creer_entreprise_pour_utilisateur",
      { nom: `${PREFIXE}societe-b`, pays: "SN", jeton_analyse: null },
    );

    expect(idA).toBeTruthy();
    expect(idB).toBeTruthy();
    expect(idA).not.toBe(idB);

    // A ne voit que son entreprise.
    const { data: vueA } = await a.client.from("entreprises").select("id");
    const idsVusParA = (vueA ?? []).map((e: { id: string }) => e.id);
    expect(idsVusParA).toContain(idA);
    expect(idsVusParA).not.toContain(idB);

    // A ne voit pas le solde de crédits de B.
    const { data: soldeDeB } = await a.client
      .from("soldes_credits")
      .select("entreprise_id")
      .eq("entreprise_id", idB);
    expect(soldeDeB ?? []).toEqual([]);

    // A ne voit pas qui sont les membres de B.
    const { data: membresDeB } = await a.client
      .from("membres")
      .select("id")
      .eq("entreprise_id", idB);
    expect(membresDeB ?? []).toEqual([]);

    // A ne peut pas se rattacher de force à l'entreprise de B.
    const { error: erreurRattachement } = await a.client.from("membres").insert({
      entreprise_id: idB,
      profil_id: a.userId,
      role: "proprietaire",
    });
    expect(erreurRattachement).not.toBeNull();

    // A ne peut pas renommer l'entreprise de B.
    const { data: renommee } = await a.client
      .from("entreprises")
      .update({ nom: `${PREFIXE}pirate` })
      .eq("id", idB)
      .select("id");
    expect(renommee ?? []).toEqual([]);
  }, 40_000);

  it("un deuxième appel ne crée pas une deuxième entreprise", async () => {
    const u = await nouvelUtilisateur();

    const { data: premier } = await u.client.rpc(
      "creer_entreprise_pour_utilisateur",
      { nom: `${PREFIXE}unique`, pays: "BJ", jeton_analyse: null },
    );
    const { data: second } = await u.client.rpc(
      "creer_entreprise_pour_utilisateur",
      { nom: `${PREFIXE}unique-bis`, pays: "SN", jeton_analyse: null },
    );

    expect(second).toBe(premier);

    const { count } = await admin
      .from("membres")
      .select("id", { count: "exact", head: true })
      .eq("profil_id", u.userId);
    expect(count).toBe(1);
  }, 30_000);

  it("un nom d'entreprise vide est refusé", async () => {
    const u = await nouvelUtilisateur();

    const { error } = await u.client.rpc("creer_entreprise_pour_utilisateur", {
      nom: "   ",
      pays: "BJ",
      jeton_analyse: null,
    });

    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/nom_entreprise_obligatoire/);
  }, 30_000);

  it("la table des analyses anonymes est inaccessible depuis le client", async () => {
    const u = await nouvelUtilisateur();
    const jeton = `${PREFIXE}jeton-prive`;

    await admin.from("analyses_anonymes").insert({
      jeton,
      entree: "https://exemple-prive.bj",
      type_entree: "lien",
      resultat: { secteur: "confidentiel" },
    });

    // Ni connecté, ni visiteur : la table est réservée au service.
    const { data: vueConnecte } = await u.client
      .from("analyses_anonymes")
      .select("jeton");
    expect(vueConnecte ?? []).toEqual([]);

    const { data: vueVisiteur } = await clientAnon(config!)
      .from("analyses_anonymes")
      .select("jeton");
    expect(vueVisiteur ?? []).toEqual([]);
  }, 30_000);

  it("un visiteur non connecté ne peut pas créer d'entreprise", async () => {
    const { error } = await clientAnon(config!).rpc(
      "creer_entreprise_pour_utilisateur",
      { nom: `${PREFIXE}visiteur`, pays: "BJ", jeton_analyse: null },
    );

    // Droit d'exécution retiré à `anon` par la migration.
    expect(error).not.toBeNull();
  }, 30_000);
});

describeSiDb("Limite de fréquence (module 04)", () => {
  let admin: SupabaseClient;

  const ACTION = "connexion";
  const FENETRE = "15 minutes";
  const MAXIMUM = 5;

  beforeAll(async () => {
    if (!config) return;
    admin = clientAdmin(config);
    await nettoyer(admin);
  }, 30_000);

  afterAll(async () => {
    if (!config) return;
    await nettoyer(admin);
  }, 30_000);

  async function essayer(cle: string): Promise<boolean> {
    const { data, error } = await admin.rpc("verifier_limite", {
      cle,
      action: ACTION,
      maximum: MAXIMUM,
      fenetre: FENETRE,
    });
    expect(error).toBeNull();
    return data === true;
  }

  async function nombreDeTentatives(cle: string): Promise<number | null> {
    const { count } = await admin
      .from("tentatives")
      .select("id", { count: "exact", head: true })
      .eq("cle", cle);
    return count;
  }

  it("5 tentatives de connexion passent, la 6ᵉ est refusée", async () => {
    const cle = `${ACTION}:${PREFIXE}limite-simple@djeli.test`;

    const resultats: boolean[] = [];
    for (let i = 0; i < 6; i++) {
      resultats.push(await essayer(cle));
    }

    expect(resultats.slice(0, MAXIMUM)).toEqual([true, true, true, true, true]);
    expect(resultats[5]).toBe(false);
  }, 30_000);

  it("une tentative refusée ne prolonge pas le blocage", async () => {
    const cle = `${ACTION}:${PREFIXE}limite-prolongee@djeli.test`;

    for (let i = 0; i < MAXIMUM; i++) {
      expect(await essayer(cle)).toBe(true);
    }
    // Trois tentatives refusées de plus : elles ne doivent pas être comptées,
    // sinon un attaquant prolongerait le blocage du compte indéfiniment.
    expect(await essayer(cle)).toBe(false);
    expect(await essayer(cle)).toBe(false);
    expect(await essayer(cle)).toBe(false);

    expect(await nombreDeTentatives(cle)).toBe(MAXIMUM);
  }, 30_000);

  it("après une connexion réussie, le compteur repart de zéro", async () => {
    const cle = `${ACTION}:${PREFIXE}limite-reset@djeli.test`;

    for (let i = 0; i < MAXIMUM; i++) {
      expect(await essayer(cle)).toBe(true);
    }
    expect(await essayer(cle)).toBe(false);

    const { error } = await admin.rpc("reinitialiser_limite", {
      cle,
      action: ACTION,
    });
    expect(error).toBeNull();
    expect(await nombreDeTentatives(cle)).toBe(0);

    expect(await essayer(cle)).toBe(true);
  }, 30_000);

  it("deux emails différents ont chacun leur compteur", async () => {
    const cleA = `${ACTION}:${PREFIXE}limite-a@djeli.test`;
    const cleB = `${ACTION}:${PREFIXE}limite-b@djeli.test`;

    for (let i = 0; i < MAXIMUM; i++) {
      expect(await essayer(cleA)).toBe(true);
    }
    expect(await essayer(cleA)).toBe(false);

    // B n'est pas bloqué par les tentatives de A.
    expect(await essayer(cleB)).toBe(true);
  }, 30_000);

  it("le client ne peut pas appeler les fonctions de limite lui-même", async () => {
    const u = await creerUtilisateurEtClient(
      config!,
      `${PREFIXE}limite-client@djeli.test`,
    );

    const { error: erreurVerif } = await u.client.rpc("verifier_limite", {
      cle: `${ACTION}:${PREFIXE}triche@djeli.test`,
      action: ACTION,
      maximum: 999,
      fenetre: FENETRE,
    });
    expect(erreurVerif).not.toBeNull();

    const { error: erreurReset } = await u.client.rpc("reinitialiser_limite", {
      cle: `${ACTION}:${PREFIXE}triche@djeli.test`,
      action: ACTION,
    });
    expect(erreurReset).not.toBeNull();

    // Et la table elle-même reste invisible.
    const { data } = await u.client.from("tentatives").select("id");
    expect(data ?? []).toEqual([]);
  }, 30_000);
});
