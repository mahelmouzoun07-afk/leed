import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Codes promo. Deux parties :
 *  1. les règles « pures » (format du code, génération, messages) ;
 *  2. le paiement avec un code : le prix payé vient de la base, un forfait offert ne lance aucun paiement,
 *     un code refusé ou volé de justesse par un autre paiement ne laisse rien partir, et le forfait ouvert a la valeur du forfait CHOISI.
 * Aucun appel réel : SasPay et la base sont remplacés par des faux. Les règles de calcul elles-mêmes sont testées dans la base (tests/db/promo.sql).
 */
const sas = vi.hoisted(() => ({ verifier: vi.fn(), softpay: vi.fn(), reseaux: vi.fn() }));
const promo = vi.hoisted(() => ({ calculer: vi.fn(), reserver: vi.fn() }));
const base = vi.hoisted(() => ({ admin: null as unknown }));

vi.mock("@/lib/env", () => ({ env: () => ({}), exigerEnv: () => "sk_live_cle_de_test" }));
vi.mock("@/lib/paiement/saspay", async (original) => {
  const vrai = await original<typeof import("@/lib/paiement/saspay")>();
  return { ...vrai, verifierPaiement: sas.verifier, lancerSoftpay: sas.softpay, lireReseaux: sas.reseaux };
});
vi.mock("@/lib/paiement/promo", () => ({ calculerRemise: promo.calculer, reserverCode: promo.reserver }));
vi.mock("@/lib/supabase/admin", () => ({ creerClientAdmin: () => base.admin }));

import { CODE_MAX, CODE_MIN, formatCodeValide, genererCode, messagePourRaison, normaliserCode, resumeRemise, type CalculPromo } from "@/lib/promo";
import { confirmerPaiement, demarrerPaiement, viderCacheReseaux } from "@/lib/paiement/service";

// ───── 1. Les règles pures ─────

describe("le format du code", () => {
  it("accepte 8 à 12 lettres ou chiffres, majuscules ou minuscules", () => {
    for (const c of ["ABCD1234", "abcd1234", "AbCd1234Ef", "a1b2c3d4e5f6", "12345678", "ABCDEFGH"]) expect(formatCodeValide(c)).toBe(true);
  });
  it("refuse moins de 8, plus de 12, et tout caractère qui n'est pas une lettre ou un chiffre", () => {
    for (const c of ["ABC1234", "ABCD1234E5F6G", "", "ABCD-1234", "ABCD_1234", "ÉTÉ12345", "ABCD123!"]) expect(formatCodeValide(c)).toBe(false);
  });
  it("traite « abc12345 » et « ABC12345 » comme le même code, et ignore les espaces (recopiés d'un message)", () => {
    expect(normaliserCode("  abc12345 ")).toBe("ABC12345");
    expect(normaliserCode("ab c1 2345")).toBe("ABC12345");
    expect(formatCodeValide(" abc12345 ")).toBe(true);
  });
});

describe("la génération d'un code", () => {
  it("fait de 8 à 12 caractères, tous valides, sans caractère ambigu", () => {
    for (const n of [1, 8, 10, 12, 40]) {
      const c = genererCode(n);
      expect(c.length).toBeGreaterThanOrEqual(CODE_MIN);
      expect(c.length).toBeLessThanOrEqual(CODE_MAX);
      expect(formatCodeValide(c)).toBe(true);
      expect(c).not.toMatch(/[01OIL]/);
    }
  });
  it("ne donne pas deux fois le même code", () => {
    expect(new Set(Array.from({ length: 200 }, () => genererCode())).size).toBe(200);
  });
  it("n'utilise que des octets sans biais (les octets trop hauts sont rejetés)", () => {
    const octets = [255, 254, 253, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    expect(genererCode(8, () => octets)).toHaveLength(8);
  });
});

describe("les messages montrés au client", () => {
  it("un code inconnu, désactivé, expiré ou épuisé reçoit le même message : on ne révèle pas quels codes existent", () => {
    const m = messagePourRaison("inconnu");
    expect(messagePourRaison("expire")).toBe(m);
    expect(messagePourRaison("epuise")).toBe(m);
    expect(messagePourRaison("pas_commence")).toBe(m);
  });
  it("les autres refus disent pourquoi", () => {
    expect(messagePourRaison("montant_trop_bas", 25000)).toMatch(/25 000 FCFA/);
    expect(messagePourRaison("deja_utilise")).toMatch(/déjà utilisé/);
    expect(messagePourRaison("nouveaux_clients")).toMatch(/nouveaux clients/);
    expect(messagePourRaison("pays")).toMatch(/pays/);
  });
  it("résume la remise, ou le forfait offert", () => {
    const base = { valide: true as const, code_promo_id: "c", libelle: null, montant_forfait_fcfa: 25000, plafond_remise_fcfa: null, acces_complet: false };
    expect(resumeRemise({ ...base, pourcentage: 20, remise_fcfa: 5000, a_payer_fcfa: 20000 })).toMatch(/5 000 FCFA de remise \(20 %\)/);
    expect(resumeRemise({ ...base, pourcentage: 100, remise_fcfa: 25000, a_payer_fcfa: 0, acces_complet: true })).toMatch(/rien à payer/);
  });
});

// ───── 2. Le paiement avec un code ─────

type Ligne = Record<string, unknown>;

function fauxAdmin(paiementExistant: Ligne | null = null) {
  const rpcs: [string, Record<string, unknown>][] = [];
  const insertions: [string, Ligne][] = [];
  const miseAJour: [string, Ligne][] = [];
  const etat: { ligne: Ligne | null } = { ligne: paiementExistant };
  const constructeur = (table: string) => {
    let mode: "select" | "update" | "insert" = "select";
    let valeurs: Ligne = {};
    const api: Record<string, unknown> = {
      select: () => api,
      insert: (v: Ligne) => {
        mode = "insert";
        insertions.push([table, v]);
        if (table === "paiements") etat.ligne = { id: "pay-1", ...v };
        return api;
      },
      update: (v: Ligne) => {
        mode = "update";
        valeurs = v;
        return api;
      },
      eq: () => api,
      single: async () => ({ data: { id: "pay-1" }, error: null }),
      maybeSingle: async () => ({ data: table === "paiements" ? etat.ligne : null, error: null }),
      then: (ok: (v: unknown) => unknown) => {
        if (mode === "update") {
          miseAJour.push([table, valeurs]);
          if (table === "paiements" && etat.ligne) Object.assign(etat.ligne, valeurs);
          return ok({ data: [{ id: "pay-1" }], error: null });
        }
        return ok({ data: null, error: null });
      },
    };
    return api;
  };
  return {
    from: constructeur,
    rpc: async (nom: string, args: Record<string, unknown>) => {
      rpcs.push([nom, args]);
      return { data: nom === "verifier_limite" ? true : null, error: null };
    },
    rpcs,
    insertions,
    miseAJour,
    etat,
  };
}

const remise = (o: Partial<Extract<CalculPromo, { valide: true }>> = {}): Extract<CalculPromo, { valide: true }> => ({
  valide: true,
  code_promo_id: "code-1",
  pourcentage: 20,
  libelle: null,
  montant_forfait_fcfa: 25000,
  remise_fcfa: 5000,
  a_payer_fcfa: 20000,
  plafond_remise_fcfa: null,
  acces_complet: false,
  ...o,
});

const entree = { entrepriseId: "ent-1", email: "a@b.bj", prenom: "Ama", nom: "Koffi", pays: "BJ", montant: 25000, reseau: "mtn_bj", telephone: "+229 01 97 00 00 00" };
const valeur = (a: ReturnType<typeof fauxAdmin>, nom: string) => a.rpcs.filter(([n]) => n === nom);

beforeEach(() => {
  vi.clearAllMocks();
  viderCacheReseaux();
  sas.reseaux.mockResolvedValue([{ id: "1", country: "x", code: "mtn_bj", name: "MTN", is_active: true }]);
  sas.softpay.mockResolvedValue({ id: "sp-1", status: "PENDING", checkout_url: "" });
});

describe("payer avec un code promo", () => {
  it("fait payer le prix remisé, et garde la valeur du forfait choisi", async () => {
    const admin = fauxAdmin();
    base.admin = admin;
    promo.calculer.mockResolvedValue({ ok: true, donnees: remise() });
    promo.reserver.mockResolvedValue({ ok: true, donnees: remise() });
    const r = await demarrerPaiement({ ...entree, code: "abcd1234" });
    expect(r).toMatchObject({ ok: true, donnees: { paiementId: "pay-1", gratuit: false } });
    const [, insere] = admin.insertions.find(([t]) => t === "paiements")!;
    expect(insere).toMatchObject({ montant_fcfa: 20000, montant_forfait_fcfa: 25000, remise_fcfa: 5000, code_promo_id: "code-1", prestataire: "saspay" });
    expect(sas.softpay).toHaveBeenCalledWith(expect.objectContaining({ montant: 20000 }));
    expect(promo.reserver).toHaveBeenCalledWith("ent-1", "abcd1234", 25000, "pay-1");
    expect(valeur(admin, "acheter_forfait")).toHaveLength(0); // le forfait ne s'ouvre qu'à la confirmation de SasPay
  });

  it("ne prend jamais un prix venu du client : la remise est recalculée à chaque paiement", async () => {
    base.admin = fauxAdmin();
    promo.calculer.mockResolvedValue({ ok: true, donnees: remise({ remise_fcfa: 2500, a_payer_fcfa: 22500 }) });
    promo.reserver.mockResolvedValue({ ok: true, donnees: remise({ remise_fcfa: 2500, a_payer_fcfa: 22500 }) });
    await demarrerPaiement({ ...entree, code: "abcd1234" });
    expect(promo.calculer).toHaveBeenCalledWith("ent-1", "abcd1234", 25000);
    expect(sas.softpay).toHaveBeenCalledWith(expect.objectContaining({ montant: 22500 }));
  });

  it("sans code, le paiement est inchangé : le montant choisi, aucune valeur de forfait à part", async () => {
    const admin = fauxAdmin();
    base.admin = admin;
    await demarrerPaiement(entree);
    const [, insere] = admin.insertions.find(([t]) => t === "paiements")!;
    expect(insere).toMatchObject({ montant_fcfa: 25000, montant_forfait_fcfa: null, remise_fcfa: 0, code_promo_id: null });
    expect(promo.calculer).not.toHaveBeenCalled();
    expect(sas.softpay).toHaveBeenCalledWith(expect.objectContaining({ montant: 25000 }));
  });

  it("refuse un code invalide sans rien créer ni rien envoyer à SasPay", async () => {
    const admin = fauxAdmin();
    base.admin = admin;
    promo.calculer.mockResolvedValue({ ok: false, erreur: "Ce code n'existe pas ou n'est plus valable.", code: "inconnu" });
    const r = await demarrerPaiement({ ...entree, code: "zzzz9999" });
    expect(r).toMatchObject({ ok: false, code: "inconnu" });
    expect(admin.insertions.filter(([t]) => t === "paiements")).toHaveLength(0);
    expect(sas.softpay).not.toHaveBeenCalled();
  });

  it("si un autre paiement a pris la dernière utilisation du code, le paiement est annulé avant tout envoi", async () => {
    const admin = fauxAdmin();
    base.admin = admin;
    promo.calculer.mockResolvedValue({ ok: true, donnees: remise() });
    promo.reserver.mockResolvedValue({ ok: false, erreur: "Ce code n'existe pas ou n'est plus valable.", code: "epuise" });
    const r = await demarrerPaiement({ ...entree, code: "abcd1234" });
    expect(r).toMatchObject({ ok: false, code: "epuise" });
    expect(sas.softpay).not.toHaveBeenCalled();
    expect(admin.miseAJour.some(([t, v]) => t === "paiements" && v.statut === "echoue")).toBe(true);
  });

  it("libère le code (paiement échoué) quand SasPay refuse la demande", async () => {
    const admin = fauxAdmin();
    base.admin = admin;
    promo.calculer.mockResolvedValue({ ok: true, donnees: remise() });
    promo.reserver.mockResolvedValue({ ok: true, donnees: remise() });
    sas.softpay.mockRejectedValue(Object.assign(new Error("refus"), { name: "ErreurSasPay", statutHttp: 422 }));
    const r = await demarrerPaiement({ ...entree, code: "abcd1234" });
    expect(r.ok).toBe(false);
    expect(admin.miseAJour.some(([t, v]) => t === "paiements" && v.statut === "echoue")).toBe(true);
  });
});

describe("un code à 100 % : rien à payer, toutes les fonctionnalités", () => {
  const gratuit = remise({ pourcentage: 100, remise_fcfa: 25000, a_payer_fcfa: 0, plafond_remise_fcfa: 25000, acces_complet: true });

  it("n'appelle pas SasPay, n'exige ni opérateur ni numéro, et ouvre tout de suite le forfait de la valeur choisie", async () => {
    const admin = fauxAdmin();
    base.admin = admin;
    promo.calculer.mockResolvedValue({ ok: true, donnees: gratuit });
    promo.reserver.mockResolvedValue({ ok: true, donnees: gratuit });
    const r = await demarrerPaiement({ ...entree, reseau: "aucun", telephone: "000000", code: "GRATUIT2026" });
    expect(r).toMatchObject({ ok: true, donnees: { paiementId: "pay-1", redirection: null, gratuit: true } });
    expect(sas.softpay).not.toHaveBeenCalled();
    expect(sas.reseaux).not.toHaveBeenCalled();
    const [, insere] = admin.insertions.find(([t]) => t === "paiements")!;
    expect(insere).toMatchObject({ montant_fcfa: 0, montant_forfait_fcfa: 25000, remise_fcfa: 25000, moyen: "code_promo", prestataire: "code_promo" });
    expect(admin.miseAJour.some(([t, v]) => t === "paiements" && v.statut === "reussi")).toBe(true);
    expect(valeur(admin, "acheter_forfait")).toEqual([["acheter_forfait", { p_entreprise: "ent-1", p_montant: 25000, p_paiement: "pay-1" }]]);
  });

  it("fonctionne même dans un pays où le paiement Mobile Money n'existe pas encore", async () => {
    base.admin = fauxAdmin();
    promo.calculer.mockResolvedValue({ ok: true, donnees: gratuit });
    promo.reserver.mockResolvedValue({ ok: true, donnees: gratuit });
    const r = await demarrerPaiement({ ...entree, pays: "NG", code: "GRATUIT2026" });
    expect(r).toMatchObject({ ok: true, donnees: { gratuit: true } });
  });

  it("au-dessus du plafond, le client paie la différence par Mobile Money", async () => {
    base.admin = fauxAdmin();
    const partiel = remise({ pourcentage: 100, montant_forfait_fcfa: 50000, remise_fcfa: 25000, a_payer_fcfa: 25000, plafond_remise_fcfa: 25000, acces_complet: true });
    promo.calculer.mockResolvedValue({ ok: true, donnees: partiel });
    promo.reserver.mockResolvedValue({ ok: true, donnees: partiel });
    const r = await demarrerPaiement({ ...entree, montant: 50000, code: "GRATUIT2026" });
    expect(r).toMatchObject({ ok: true, donnees: { gratuit: false } });
    expect(sas.softpay).toHaveBeenCalledWith(expect.objectContaining({ montant: 25000 }));
  });

  it("la page de suivi rejoue l'ouverture du forfait si elle avait échoué (le paiement est déjà « reçu »)", async () => {
    const admin = fauxAdmin({ id: "pay-1", entreprise_id: "ent-1", montant_fcfa: 0, montant_forfait_fcfa: 25000, statut: "reussi", reference_prestataire: null, prestataire: "code_promo" });
    base.admin = admin;
    const r = await confirmerPaiement("pay-1");
    expect(r.etat).toBe("reussi");
    expect(valeur(admin, "acheter_forfait")).toEqual([["acheter_forfait", { p_entreprise: "ent-1", p_montant: 25000, p_paiement: "pay-1" }]]);
    expect(sas.verifier).not.toHaveBeenCalled();
  });
});

describe("confirmer un paiement remisé", () => {
  const remisé = { id: "pay-1", entreprise_id: "ent-1", montant_fcfa: 20000, montant_forfait_fcfa: 25000, statut: "en_attente", reference_prestataire: "sp-1", prestataire: "saspay" };

  it("compare l'encaissement au prix REMISÉ, puis ouvre le forfait de la valeur choisie", async () => {
    const admin = fauxAdmin({ ...remisé });
    base.admin = admin;
    sas.verifier.mockResolvedValue({ id: "sp-1", status: "SUCCESS", requested_amount: "20000.00", debited_amount: "20000.00", net_amount: "19500.00", currency: "XOF" });
    const r = await confirmerPaiement("pay-1");
    expect(r.etat).toBe("reussi");
    expect(valeur(admin, "acheter_forfait")).toEqual([["acheter_forfait", { p_entreprise: "ent-1", p_montant: 25000, p_paiement: "pay-1" }]]);
  });

  it("refuse un encaissement qui n'est pas le prix remisé (ni plus, ni moins) et n'ouvre rien", async () => {
    for (const montant of ["25000.00", "5000.00"]) {
      const admin = fauxAdmin({ ...remisé });
      base.admin = admin;
      sas.verifier.mockResolvedValue({ id: "sp-1", status: "SUCCESS", requested_amount: montant, debited_amount: montant, net_amount: montant, currency: "XOF" });
      const r = await confirmerPaiement("pay-1");
      expect(r).toMatchObject({ etat: "echoue", alerte: "montant_different" });
      expect(valeur(admin, "acheter_forfait")).toHaveLength(0);
    }
  });
});
