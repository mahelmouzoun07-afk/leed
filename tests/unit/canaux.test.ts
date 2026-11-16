import { afterEach, beforeEach, describe, expect, it, vi, type MockedObject } from "vitest";

/**
 * Chantier 7 : la connexion des comptes (Unipile). Aucun test n'appelle Unipile : un faux réseau et un faux fournisseur répondent.
 * On vérifie les garde-fous : un faux appel ne crée rien, un compte refusé est supprimé chez Unipile (il serait facturé),
 * un compte débranché n'est marqué que si Unipile l'a vraiment supprimé, et aucune clé ne sort dans un message d'erreur.
 */
const envFaux = vi.hoisted(() => ({ valeurs: {} as Record<string, string | undefined> }));
const base = vi.hoisted(() => ({ admin: null as unknown }));
vi.mock("@/lib/env", () => ({ env: () => envFaux.valeurs, exigerEnv: () => "x" }));
vi.mock("@/lib/supabase/admin", () => ({ creerClientAdmin: () => base.admin }));

import { canalDuType, enteteValide, identifiantWhatsApp, lireEvenement, masquer, pireStatut, signatureLienValide, signerLien, statutDepuisUnipile } from "@/lib/canaux/regles";
import { creerFournisseurUnipile, ErreurUnipile, normaliserCompte, urlDeBase } from "@/lib/canaux/unipile";
import { debrancherCompte, debrancherComptesSansForfait, declarerWebhooks, traiterEvenement, traiterRetourConnexion, utiliserFournisseur, creerLienDeConnexion } from "@/lib/canaux/service";
import type { CompteDistant, FournisseurCanaux } from "@/lib/canaux/types";

const SECRET = "secret-de-test-assez-long-123";

// ───── 1. Les règles pures ─────

describe("canaux et états", () => {
  it("relie chaque type de compte Unipile à notre canal", () => {
    expect(canalDuType("WHATSAPP")).toBe("whatsapp");
    expect(canalDuType("GOOGLE_OAUTH")).toBe("email");
    expect(canalDuType("outlook")).toBe("email");
    expect(canalDuType("MESSENGER")).toBe("facebook");
    expect(canalDuType("TELEGRAM")).toBeNull();
    expect(canalDuType(undefined)).toBeNull();
  });
  it("traduit l'état annoncé par Unipile", () => {
    for (const s of ["OK", "RECONNECTED", "SYNC_SUCCESS"]) expect(statutDepuisUnipile(s)).toBe("actif");
    for (const s of ["CREDENTIALS", "PERMISSIONS"]) expect(statutDepuisUnipile(s)).toBe("a_rebrancher");
    for (const s of ["ERROR", "STOPPED"]) expect(statutDepuisUnipile(s)).toBe("suspendu");
    expect(statutDepuisUnipile("DELETED")).toBe("debranche");
  });
  it("ne change rien pour un état temporaire ou inconnu", () => {
    expect(statutDepuisUnipile("CONNECTING")).toBeNull();
    expect(statutDepuisUnipile("CREATION_SUCCESS")).toBeNull();
    expect(statutDepuisUnipile("QUELQUE_CHOSE")).toBeNull();
    expect(statutDepuisUnipile(null)).toBeNull();
  });
  it("retient le pire état quand un compte a plusieurs sources (boîte et agenda)", () => {
    expect(pireStatut(["OK", "CREDENTIALS"])).toBe("CREDENTIALS");
    expect(pireStatut(["OK", "OK"])).toBe("OK");
    expect(pireStatut(["CREDENTIALS", "ERROR"])).toBe("ERROR");
    expect(pireStatut([])).toBe("OK");
  });
});

describe("la sécurité des appels reçus", () => {
  it("accepte l'en-tête secret exact, refuse tout le reste", () => {
    expect(enteteValide(SECRET, SECRET)).toBe(true);
    expect(enteteValide(SECRET + "x", SECRET)).toBe(false);
    expect(enteteValide("autre", SECRET)).toBe(false);
    expect(enteteValide(null, SECRET)).toBe(false);
    expect(enteteValide(SECRET, undefined)).toBe(false);
    expect(enteteValide("", "")).toBe(false);
  });
  it("signe le lien de retour : un autre lien, une autre signature ou un autre secret sont refusés", () => {
    const s = signerLien("lien-1", SECRET);
    expect(signatureLienValide("lien-1", s, SECRET)).toBe(true);
    expect(signatureLienValide("lien-2", s, SECRET)).toBe(false);
    expect(signatureLienValide("lien-1", s.slice(1) + "0", SECRET)).toBe(false);
    expect(signatureLienValide("lien-1", s, "autre-secret")).toBe(false);
    expect(signatureLienValide(null, s, SECRET)).toBe(false);
    expect(signatureLienValide("lien-1", null, SECRET)).toBe(false);
  });
});

describe("ce qu'Unipile envoie", () => {
  it("lit un changement d'état", () => {
    expect(lireEvenement({ AccountStatus: { account_id: "ac1", account_type: "LINKEDIN", message: "CREDENTIALS" } })).toEqual({ type: "etat_compte", compteId: "ac1", statutBrut: "CREDENTIALS", typeCompte: "LINKEDIN" });
  });
  it("lit le retour d'une connexion", () => {
    expect(lireEvenement({ status: "CREATION_SUCCESS", account_id: "ac1", name: "lien-1" })).toEqual({ type: "retour_connexion", compteId: "ac1", nom: "lien-1", statutBrut: "CREATION_SUCCESS" });
    expect(lireEvenement({ status: "RECONNECTED", account_id: "ac1", name: "lien-1" }).type).toBe("retour_connexion");
  });
  it("lit un message reçu, sans en garder le contenu", () => {
    const e = lireEvenement({ event: "message_received", account_id: "ac1", chat_id: "c1", message_id: "m1", message: "Bonjour, un secret" });
    expect(e).toEqual({ type: "message_recu", compteId: "ac1", chatId: "c1", messageId: "m1" });
    expect(JSON.stringify(e)).not.toContain("secret");
  });
  it("ignore ce qu'il ne comprend pas, sans lever d'erreur", () => {
    for (const x of [null, undefined, "texte", 12, [], {}, { event: "message_reaction", account_id: "a" }, { AccountStatus: {} }, { status: "CREATION_SUCCESS" }]) expect(lireEvenement(x).type).toBe("ignore");
  });
});

describe("les adresses", () => {
  it("construit l'identifiant WhatsApp à partir d'un numéro", () => {
    expect(identifiantWhatsApp("+229 01 97 00 00 00")).toBe("2290197000000@s.whatsapp.net");
    expect(identifiantWhatsApp("0022997000000")).toBe("22997000000@s.whatsapp.net");
    expect(identifiantWhatsApp("123")).toBeNull();
    expect(identifiantWhatsApp("abc")).toBeNull();
  });
  it("masque un identifiant", () => {
    expect(masquer("ac1AbCdEfGh")).toBe("ac1…fGh");
    expect(masquer("abc")).toBe("••••");
  });
});

// ───── 2. Le client Unipile, avec un faux réseau ─────

describe("le client Unipile", () => {
  const vraiFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = vraiFetch;
  });
  const config = { dsn: "api8.unipile.com:13851", cle: "cle-tres-secrete-xyz" };
  const reponse = (corps: unknown, statut = 200) => new Response(JSON.stringify(corps), { status: statut, headers: { "content-type": "application/json" } });

  it("normalise l'adresse du service", () => {
    expect(urlDeBase("api8.unipile.com:13851")).toBe("https://api8.unipile.com:13851");
    expect(urlDeBase("https://api8.unipile.com:13851/")).toBe("https://api8.unipile.com:13851");
  });

  it("crée un lien de connexion avec la clé en en-tête, jamais dans l'adresse", async () => {
    const f = vi.fn().mockResolvedValue(reponse({ object: "HostedAuthURL", url: "https://account.unipile.com/abc" }));
    globalThis.fetch = f as unknown as typeof fetch;
    const r = await creerFournisseurUnipile(config).creerLienConnexion({ nom: "lien-1", canal: "whatsapp", adresseRetour: "https://leed/api/retour", succes: "https://leed/ok", echec: "https://leed/ko", expireDans: 30 });
    expect(r.url).toBe("https://account.unipile.com/abc");
    const [url, init] = f.mock.calls[0];
    expect(String(url)).toBe("https://api8.unipile.com:13851/api/v1/hosted/accounts/link");
    expect(String(url)).not.toContain(config.cle);
    expect(init.headers["X-API-KEY"]).toBe(config.cle);
    const corps = JSON.parse(init.body);
    expect(corps).toMatchObject({ type: "create", providers: ["WHATSAPP"], name: "lien-1", notify_url: "https://leed/api/retour", success_redirect_url: "https://leed/ok" });
    expect(new Date(corps.expiresOn).getTime()).toBeGreaterThan(Date.now());
  });

  it("rebrancher envoie le type « reconnect » et le compte à rebrancher", async () => {
    const f = vi.fn().mockResolvedValue(reponse({ url: "https://account.unipile.com/x" }));
    globalThis.fetch = f as unknown as typeof fetch;
    await creerFournisseurUnipile(config).creerLienConnexion({ nom: "l", canal: "email", adresseRetour: "a", succes: "b", echec: "c", expireDans: 10, rebrancher: "ac9" });
    expect(JSON.parse(f.mock.calls[0][1].body)).toMatchObject({ type: "reconnect", reconnect_account: "ac9", providers: ["GOOGLE", "OUTLOOK", "MAIL"] });
  });

  it("une erreur d'Unipile ne contient jamais la clé", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(reponse({ title: "Unauthorized", detail: "Invalid credentials" }, 401)) as unknown as typeof fetch;
    const e = await creerFournisseurUnipile(config).listerComptes().catch((x) => x);
    expect(e).toBeInstanceOf(ErreurUnipile);
    expect(e.statutHttp).toBe(401);
    expect(`${e.message}${e.stack}`).not.toContain(config.cle);
  });

  it("lit la liste des comptes (liste simple ou « items ») et normalise numéro, adresse et état", async () => {
    const comptes = [
      { id: "ac1", type: "WHATSAPP", name: "x", created_at: "2026-11-17T10:00:00Z", sources: [{ id: "s", status: "OK" }], connection_params: { im: { phone_number: "22997000000" } } },
      { id: "ac2", type: "GOOGLE_OAUTH", name: "m", sources: [{ status: "OK" }, { status: "CREDENTIALS" }], connection_params: { mail: { username: "a@gmail.com" } } },
    ];
    for (const corps of [{ object: "AccountList", items: comptes }, comptes]) {
      globalThis.fetch = vi.fn().mockResolvedValue(reponse(corps)) as unknown as typeof fetch;
      const l = await creerFournisseurUnipile(config).listerComptes();
      expect(l).toHaveLength(2);
      expect(l[0]).toMatchObject({ id: "ac1", canal: "whatsapp", identifiant: "22997000000", statutBrut: "OK" });
      expect(l[1]).toMatchObject({ canal: "email", identifiant: "a@gmail.com", statutBrut: "CREDENTIALS" });
    }
  });

  it("supprimer un compte déjà absent (404) n'est pas une erreur ; une autre erreur l'est", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(reponse({ title: "Not found" }, 404)) as unknown as typeof fetch;
    await expect(creerFournisseurUnipile(config).supprimerCompte("ac1")).resolves.toBeUndefined();
    globalThis.fetch = vi.fn().mockResolvedValue(reponse({ title: "Boom" }, 500)) as unknown as typeof fetch;
    await expect(creerFournisseurUnipile(config).supprimerCompte("ac1")).rejects.toBeInstanceOf(ErreurUnipile);
  });

  it("envoie un message WhatsApp avec l'identifiant construit, et un email en JSON", async () => {
    const f = vi.fn().mockResolvedValueOnce(reponse({ chat_id: "c1", message_id: "m1" })).mockResolvedValueOnce(reponse({ tracking_id: "t1" }));
    globalThis.fetch = f as unknown as typeof fetch;
    const u = creerFournisseurUnipile(config);
    const wa = await u.envoyer({ compteId: "ac1", destinataire: "+229 97 00 00 00", texte: "Bonjour" }, "whatsapp");
    expect(wa).toEqual({ chatId: "c1", messageId: "m1" });
    const form = f.mock.calls[0][1].body as FormData;
    expect(form.get("attendees_ids")).toBe("22997000000@s.whatsapp.net");
    expect(form.get("account_id")).toBe("ac1");
    const mail = await u.envoyer({ compteId: "ac2", destinataire: "moi@exemple.com", texte: "Test", objet: "Objet" }, "email");
    expect(mail.messageId).toBe("t1");
    expect(JSON.parse(f.mock.calls[1][1].body)).toMatchObject({ account_id: "ac2", to: [{ identifier: "moi@exemple.com" }], subject: "Objet" });
    await expect(u.envoyer({ compteId: "ac1", destinataire: "12", texte: "x" }, "whatsapp")).rejects.toBeInstanceOf(ErreurUnipile);
  });

  it("refuse de démarrer sans clé", () => {
    expect(() => creerFournisseurUnipile(null)).toThrow(ErreurUnipile);
    expect(normaliserCompte({ type: "X" })).toBeNull();
  });
});

// ───── 3. Le service, avec un faux fournisseur et une fausse base ─────

type Ligne = Record<string, unknown>;
function fauxAdmin(tables: Record<string, Ligne[]>, reponsesRpc: Record<string, unknown> = {}) {
  const rpcs: [string, Record<string, unknown>][] = [];
  const insertions: [string, Ligne][] = [];
  const constructeur = (table: string) => {
    const filtres: [string, unknown][] = [];
    const dans: [string, unknown[]][] = [];
    let mode: "select" | "insert" = "select";
    const lignes = () => (tables[table] ?? []).filter((l) => filtres.every(([k, v]) => l[k] === v) && dans.every(([k, vs]) => vs.includes(l[k])));
    const api: Record<string, unknown> = {
      select: () => api,
      eq: (k: string, v: unknown) => (filtres.push([k, v]), api),
      in: (k: string, vs: unknown[]) => (dans.push([k, vs]), api),
      insert: (v: Ligne) => ((mode = "insert"), insertions.push([table, v]), api),
      single: async () => ({ data: { id: "lien-neuf" }, error: null }),
      maybeSingle: async () => ({ data: lignes()[0] ?? null, error: null }),
      then: (ok: (v: unknown) => unknown) => ok({ data: mode === "insert" ? null : lignes(), error: null }),
    };
    return api;
  };
  return {
    from: constructeur,
    rpc: async (nom: string, args: Record<string, unknown>) => {
      rpcs.push([nom, args]);
      if (nom in reponsesRpc) return { data: reponsesRpc[nom], error: null };
      return { data: nom === "verifier_limite" ? true : null, error: null };
    },
    rpcs,
    insertions,
  };
}

function fauxFournisseur(o: Partial<FournisseurCanaux> = {}) {
  const f = {
    creerLienConnexion: vi.fn().mockResolvedValue({ url: "https://account.unipile.com/lien" }),
    lireCompte: vi.fn(),
    listerComptes: vi.fn().mockResolvedValue([]),
    supprimerCompte: vi.fn().mockResolvedValue(undefined),
    envoyer: vi.fn(),
    listerWebhooks: vi.fn().mockResolvedValue([]),
    creerWebhook: vi.fn().mockImplementation(async (d: { source: string; url: string; nom: string }) => ({ id: "wh-" + d.source, source: d.source, url: d.url, nom: d.nom })),
    ...o,
  };
  return f as unknown as MockedObject<FournisseurCanaux>;
}
const compteWa: CompteDistant = { id: "ac1", type: "WHATSAPP", canal: "whatsapp", identifiant: "+22997000000", statutBrut: "OK", creeLe: null };

beforeEach(() => {
  envFaux.valeurs = { UNIPILE_DSN: "api8.unipile.com:13851", UNIPILE_API_KEY: "k", UNIPILE_WEBHOOK_SECRET: SECRET, APP_URL: "https://leed-nine.vercel.app" };
});
afterEach(() => utiliserFournisseur(null));

describe("créer un lien de connexion", () => {
  const a = { entrepriseId: "ent-1", utilisateurId: "u1", canal: "whatsapp" as const };

  it("refuse tant que le client n'a pas payé (forfait requis), sans toucher à Unipile", async () => {
    const f = fauxFournisseur();
    utiliserFournisseur(f);
    base.admin = fauxAdmin({}, { verifier_branchement: "forfait_requis" });
    const r = await creerLienDeConnexion(a);
    expect(r).toMatchObject({ ok: false, code: "forfait_requis" });
    expect(f.creerLienConnexion).not.toHaveBeenCalled();
  });

  it("refuse au-delà de la limite de comptes du forfait", async () => {
    utiliserFournisseur(fauxFournisseur());
    base.admin = fauxAdmin({}, { verifier_branchement: "limite_comptes" });
    expect(await creerLienDeConnexion(a)).toMatchObject({ ok: false, code: "limite_comptes" });
  });

  it("crée le lien avec une adresse de retour signée, et un nom qui est l'identifiant du lien", async () => {
    const f = fauxFournisseur();
    utiliserFournisseur(f);
    base.admin = fauxAdmin({}, { verifier_branchement: "ok" });
    const r = await creerLienDeConnexion(a);
    expect(r).toMatchObject({ ok: true, donnees: { url: "https://account.unipile.com/lien" } });
    const d = f.creerLienConnexion.mock.calls[0][0];
    expect(d.nom).toBe("lien-neuf");
    const retour = new URL(d.adresseRetour);
    expect(retour.pathname).toBe("/api/webhooks/unipile/compte");
    expect(retour.searchParams.get("l")).toBe("lien-neuf");
    expect(signatureLienValide("lien-neuf", retour.searchParams.get("s"), SECRET)).toBe(true);
  });

  it("dit que la connexion n'est pas activée quand une variable manque", async () => {
    envFaux.valeurs = { ...envFaux.valeurs, UNIPILE_API_KEY: undefined };
    expect(await creerLienDeConnexion(a)).toMatchObject({ ok: false, code: "non_configure" });
  });
});

describe("le retour d'Unipile après la connexion", () => {
  const corps = { status: "CREATION_SUCCESS", account_id: "ac1", name: "lien-1" };
  const signe = () => ({ lienId: "lien-1", signature: signerLien("lien-1", SECRET), corps });

  it("refuse un appel sans bonne signature, sans rien enregistrer", async () => {
    const admin = fauxAdmin({});
    base.admin = admin;
    utiliserFournisseur(fauxFournisseur());
    expect((await traiterRetourConnexion({ lienId: "lien-1", signature: "faux", corps })).http).toBe(401);
    expect((await traiterRetourConnexion({ lienId: "lien-1", signature: null, corps })).http).toBe(401);
    expect(admin.rpcs.filter(([n]) => n === "enregistrer_compte_unipile")).toHaveLength(0);
  });

  it("refuse un retour dont le nom n'est pas le lien signé", async () => {
    base.admin = fauxAdmin({});
    utiliserFournisseur(fauxFournisseur());
    const r = await traiterRetourConnexion({ lienId: "lien-1", signature: signerLien("lien-1", SECRET), corps: { ...corps, name: "lien-2" } });
    expect(r.http).toBe(400);
  });

  it("relit le compte chez Unipile : un compte qui n'existe pas n'est pas enregistré", async () => {
    const admin = fauxAdmin({ liens_connexion: [{ id: "lien-1", canal: "whatsapp" }] });
    base.admin = admin;
    utiliserFournisseur(fauxFournisseur({ lireCompte: vi.fn().mockResolvedValue(null) }));
    expect((await traiterRetourConnexion(signe())).http).toBe(400);
    expect(admin.rpcs.filter(([n]) => n === "enregistrer_compte_unipile")).toHaveLength(0);
  });

  it("enregistre le compte quand tout concorde", async () => {
    const admin = fauxAdmin({ liens_connexion: [{ id: "lien-1", canal: "whatsapp" }] }, { enregistrer_compte_unipile: { ok: true, compte_id: "c1", canal: "whatsapp" } });
    base.admin = admin;
    const f = fauxFournisseur({ lireCompte: vi.fn().mockResolvedValue(compteWa) });
    utiliserFournisseur(f);
    const r = await traiterRetourConnexion(signe());
    expect(r).toEqual({ http: 200, corps: { ok: true } });
    expect(admin.rpcs.find(([n]) => n === "enregistrer_compte_unipile")?.[1]).toEqual({ p_lien: "lien-1", p_account_id: "ac1", p_identifiant: "+22997000000" });
    expect(f.supprimerCompte).not.toHaveBeenCalled();
  });

  it("supprime chez Unipile un compte que la base refuse (limite atteinte) : sinon il serait facturé pour rien", async () => {
    base.admin = fauxAdmin({ liens_connexion: [{ id: "lien-1", canal: "whatsapp" }] }, { enregistrer_compte_unipile: { ok: false, raison: "limite_comptes" } });
    const f = fauxFournisseur({ lireCompte: vi.fn().mockResolvedValue(compteWa) });
    utiliserFournisseur(f);
    const r = await traiterRetourConnexion(signe());
    expect(r.corps).toMatchObject({ ok: false, raison: "limite_comptes" });
    expect(f.supprimerCompte).toHaveBeenCalledWith("ac1");
  });

  it("supprime aussi un compte d'un autre canal que celui demandé", async () => {
    base.admin = fauxAdmin({ liens_connexion: [{ id: "lien-1", canal: "email" }] });
    const f = fauxFournisseur({ lireCompte: vi.fn().mockResolvedValue(compteWa) });
    utiliserFournisseur(f);
    expect((await traiterRetourConnexion(signe())).corps).toMatchObject({ ok: false, raison: "canal_different" });
    expect(f.supprimerCompte).toHaveBeenCalledWith("ac1");
  });

  it("demande à Unipile de réessayer (502) quand il ne répond pas, au lieu de perdre le compte", async () => {
    base.admin = fauxAdmin({ liens_connexion: [{ id: "lien-1", canal: "whatsapp" }] });
    utiliserFournisseur(fauxFournisseur({ lireCompte: vi.fn().mockRejectedValue(new ErreurUnipile("panne", 503)) }));
    expect((await traiterRetourConnexion(signe())).http).toBe(502);
  });
});

describe("les messages automatiques", () => {
  it("refuse un appel sans l'en-tête secret", async () => {
    const admin = fauxAdmin({});
    base.admin = admin;
    expect((await traiterEvenement({ entete: null, corps: { AccountStatus: { account_id: "ac1", message: "CREDENTIALS" } } })).http).toBe(401);
    expect((await traiterEvenement({ entete: "faux", corps: {} })).http).toBe(401);
    expect(admin.rpcs).toHaveLength(0);
  });

  it("applique un compte à rebrancher, suspendu ou rétabli", async () => {
    const admin = fauxAdmin({});
    base.admin = admin;
    for (const [brut, attendu] of [["CREDENTIALS", "a_rebrancher"], ["ERROR", "suspendu"], ["STOPPED", "suspendu"], ["OK", "actif"]] as const) {
      admin.rpcs.length = 0;
      const r = await traiterEvenement({ entete: SECRET, corps: { AccountStatus: { account_id: "ac1", account_type: "WHATSAPP", message: brut } } });
      expect(r).toEqual({ http: 200, resultat: "statut" });
      expect(admin.rpcs[0]).toEqual(["appliquer_statut_compte", { p_unipile_account_id: "ac1", p_statut: attendu, p_message: brut }]);
    }
  });

  it("ignore un état temporaire (CONNECTING) sans toucher à la base", async () => {
    const admin = fauxAdmin({});
    base.admin = admin;
    const r = await traiterEvenement({ entete: SECRET, corps: { AccountStatus: { account_id: "ac1", message: "CONNECTING" } } });
    expect(r).toEqual({ http: 200, resultat: "ignore" });
    expect(admin.rpcs).toHaveLength(0);
  });

  it("note une réponse reçue, sans son contenu", async () => {
    const admin = fauxAdmin({});
    base.admin = admin;
    await traiterEvenement({ entete: SECRET, corps: { event: "message_received", account_id: "ac1", chat_id: "c1", message_id: "m1", message: "Texte privé du prospect" } });
    expect(admin.rpcs[0]).toEqual(["enregistrer_message_recu", { p_unipile_account_id: "ac1", p_chat_id: "c1", p_message_id: "m1" }]);
    expect(JSON.stringify(admin.rpcs)).not.toContain("Texte privé");
  });

  it("répond 200 à ce qu'il ne comprend pas (pour qu'Unipile ne rejoue pas), 500 si notre base tombe", async () => {
    base.admin = fauxAdmin({});
    expect((await traiterEvenement({ entete: SECRET, corps: { quelque: "chose" } })).http).toBe(200);
    base.admin = { rpc: async () => ({ data: null, error: { message: "panne" } }), from: () => ({}) };
    expect((await traiterEvenement({ entete: SECRET, corps: { event: "message_received", account_id: "ac1", message_id: "m1" } })).http).toBe(500);
  });
});

describe("débrancher", () => {
  it("supprime chez Unipile PUIS marque débranché", async () => {
    const admin = fauxAdmin({ comptes_connectes: [{ id: "c1", unipile_account_id: "ac1", statut: "actif", entreprise_id: "ent-1" }] });
    base.admin = admin;
    const f = fauxFournisseur();
    utiliserFournisseur(f);
    expect(await debrancherCompte("c1", "demande du client", "ent-1")).toEqual({ ok: true, donnees: true });
    expect(f.supprimerCompte).toHaveBeenCalledWith("ac1");
    expect(admin.rpcs.find(([n]) => n === "marquer_compte_debranche")?.[1]).toEqual({ p_compte: "c1", p_motif: "demande du client" });
  });

  it("ne marque rien si Unipile n'a pas supprimé le compte : le client pourra réessayer", async () => {
    const admin = fauxAdmin({ comptes_connectes: [{ id: "c1", unipile_account_id: "ac1", statut: "actif", entreprise_id: "ent-1" }] });
    base.admin = admin;
    utiliserFournisseur(fauxFournisseur({ supprimerCompte: vi.fn().mockRejectedValue(new ErreurUnipile("panne", 503)) }));
    expect(await debrancherCompte("c1", "x", "ent-1")).toMatchObject({ ok: false, code: "fournisseur" });
    expect(admin.rpcs.filter(([n]) => n === "marquer_compte_debranche")).toHaveLength(0);
  });

  it("un client ne débranche pas le compte d'une autre entreprise", async () => {
    const admin = fauxAdmin({ comptes_connectes: [{ id: "c1", unipile_account_id: "ac1", statut: "actif", entreprise_id: "ent-AUTRE" }] });
    base.admin = admin;
    const f = fauxFournisseur();
    utiliserFournisseur(f);
    expect(await debrancherCompte("c1", "x", "ent-1")).toMatchObject({ ok: false, code: "compte_inconnu" });
    expect(f.supprimerCompte).not.toHaveBeenCalled();
  });

  it("à la fin du forfait, ne débranche que les entreprises sans forfait payant en cours", async () => {
    const admin = fauxAdmin({
      comptes_connectes: [
        { id: "c1", unipile_account_id: "ac1", statut: "actif", entreprise_id: "ent-payee" },
        { id: "c2", unipile_account_id: "ac2", statut: "actif", entreprise_id: "ent-finie" },
        { id: "c3", unipile_account_id: "ac3", statut: "a_rebrancher", entreprise_id: "ent-finie" },
      ],
      forfaits: [{ entreprise_id: "ent-payee", type: "payant", statut: "actif" }],
    });
    base.admin = admin;
    const f = fauxFournisseur();
    utiliserFournisseur(f);
    const r = await debrancherComptesSansForfait();
    expect(r).toEqual({ debranches: 2, echecs: 0 });
    expect(f.supprimerCompte.mock.calls.map((c) => c[0]).sort()).toEqual(["ac2", "ac3"]);
  });
});

describe("déclarer les webhooks", () => {
  it("crée les deux webhooks avec l'en-tête secret, sans doublon quand ils existent déjà", async () => {
    const f = fauxFournisseur();
    utiliserFournisseur(f);
    const r = await declarerWebhooks();
    expect(r).toMatchObject({ ok: true, donnees: { crees: ["messaging", "account_status"], existants: [], erreurs: [] } });
    expect(f.creerWebhook).toHaveBeenCalledWith(expect.objectContaining({ url: "https://leed-nine.vercel.app/api/webhooks/unipile", secret: SECRET }));

    const g = fauxFournisseur({ listerWebhooks: vi.fn().mockResolvedValue([{ id: "w", source: "messaging", url: "https://leed-nine.vercel.app/api/webhooks/unipile", nom: null }]) });
    utiliserFournisseur(g);
    const r2 = await declarerWebhooks();
    expect(r2).toMatchObject({ ok: true, donnees: { crees: ["account_status"], existants: ["messaging"] } });
  });

  it("rapporte l'erreur d'un webhook refusé par Unipile au lieu de la cacher", async () => {
    const f = fauxFournisseur({ creerWebhook: vi.fn().mockRejectedValue(new ErreurUnipile("source inconnue", 400)) });
    utiliserFournisseur(f);
    const r = await declarerWebhooks();
    expect(r.ok && r.donnees.erreurs[0]).toContain("source inconnue");
  });
});
