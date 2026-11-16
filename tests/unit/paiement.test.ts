import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Paiement Mobile Money avec SasPay. Aucun test n'appelle SasPay pour de vrai (la clé est une clé RÉELLE) :
 * on remplace le réseau et la base par des faux, et on vérifie les règles qui protègent l'argent.
 */
const sas = vi.hoisted(() => ({
  verifier: vi.fn(),
  softpay: vi.fn(),
  reseaux: vi.fn(),
}));
const base = vi.hoisted(() => ({ admin: null as unknown }));

vi.mock("@/lib/env", () => ({ env: () => ({}), exigerEnv: () => "sk_live_cle_de_test" }));
vi.mock("@/lib/paiement/saspay", async (original) => {
  const vrai = await original<typeof import("@/lib/paiement/saspay")>();
  return { ...vrai, verifierPaiement: sas.verifier, lancerSoftpay: sas.softpay, lireReseaux: sas.reseaux };
});
vi.mock("@/lib/supabase/admin", () => ({ creerClientAdmin: () => base.admin }));

import { verifierWebhook } from "@/lib/paiement/webhook";
import { BASE_REEL, BASE_TEST, ErreurSasPay, montantEnChaine, urlDeBase } from "@/lib/paiement/saspay";
import { deviseDuPays, exigeCodeOtp, nomLisible, paysDuReseau, reseauxDuPays } from "@/lib/paiement/reseaux";
import { confirmerPaiement, demarrerPaiement, viderCacheReseaux } from "@/lib/paiement/service";

/** La vraie fonction softpay (celle du fichier saspay.ts, que les autres tests remplacent par un faux). */
const vraiSoftpay = async (...a: Parameters<typeof import("@/lib/paiement/saspay").lancerSoftpay>) => (await vi.importActual<typeof import("@/lib/paiement/saspay")>("@/lib/paiement/saspay")).lancerSoftpay(...a);

// ───── Un faux client de base de données, avec l'état d'un paiement ─────

type Paiement = { id: string; entreprise_id: string; montant_fcfa: number; statut: string; reference_prestataire: string | null; prestataire: string; details?: unknown; confirme_le?: string };

function fauxAdmin(p: Paiement | null) {
  const rpcs: [string, Record<string, unknown>][] = [];
  const insertions: [string, unknown][] = [];
  const miseAJour: [string, Record<string, unknown>][] = [];
  const constructeur = (table: string) => {
    let mode: "select" | "update" | "insert" = "select";
    let valeurs: Record<string, unknown> = {};
    const filtres: Record<string, unknown> = {};
    const api: Record<string, unknown> = {
      select: () => api,
      update: (v: Record<string, unknown>) => {
        mode = "update";
        valeurs = v;
        return api;
      },
      insert: (v: unknown) => {
        mode = "insert";
        insertions.push([table, v]);
        return api;
      },
      eq: (k: string, v: unknown) => {
        filtres[k] = v;
        return api;
      },
      single: async () => ({ data: { id: "pay-1" }, error: null }),
      maybeSingle: async () => ({ data: table === "paiements" && p && p.id === filtres.id ? { ...p } : null, error: null }),
      then: (ok: (v: unknown) => unknown) => {
        if (mode === "update" && table === "paiements" && p) {
          miseAJour.push([table, valeurs]);
          const correspond = Object.entries(filtres).every(([k, v]) => (p as Record<string, unknown>)[k] === v);
          if (correspond) Object.assign(p, valeurs);
          return ok({ data: correspond ? [{ id: p.id }] : [], error: null });
        }
        if (mode === "update") miseAJour.push([table, valeurs]);
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
  };
}

const paiement = (o: Partial<Paiement> = {}): Paiement => ({ id: "pay-1", entreprise_id: "ent-1", montant_fcfa: 25000, statut: "en_attente", reference_prestataire: "sp-1", prestataire: "saspay", ...o });
const ok = (o: Record<string, unknown> = {}) => ({ id: "sp-1", status: "SUCCESS", requested_amount: "25000.00", debited_amount: "25000.00", net_amount: "24375.00", currency: "XOF", ...o });

beforeEach(() => {
  vi.clearAllMocks();
  viderCacheReseaux();
});

describe("messages de SasPay : signature et âge", () => {
  const secret = "whsec_test";
  const corps = '{"event":"transaction.success","data":{"id":"sp-1"}}';
  const signer = (t: number, c = corps, s = secret) => createHmac("sha256", s).update(`${t}.${c}`).digest("hex");
  const maintenant = 1_800_000_000_000;
  const t = maintenant / 1000;

  it("accepte un message correctement signé, récent", () => {
    expect(verifierWebhook({ corps, signature: signer(t), horodatage: String(t), secret, maintenant })).toBe("ok");
  });
  it("refuse une mauvaise signature, un autre secret et un corps modifié", () => {
    expect(verifierWebhook({ corps, signature: "0".repeat(64), horodatage: String(t), secret, maintenant })).toBe("signature_fausse");
    expect(verifierWebhook({ corps, signature: signer(t, corps, "autre"), horodatage: String(t), secret, maintenant })).toBe("signature_fausse");
    expect(verifierWebhook({ corps: corps + " ", signature: signer(t), horodatage: String(t), secret, maintenant })).toBe("signature_fausse");
  });
  it("refuse un message de plus de 300 secondes (rejeu) ou venu du futur", () => {
    expect(verifierWebhook({ corps, signature: signer(t - 301), horodatage: String(t - 301), secret, maintenant })).toBe("trop_ancien");
    expect(verifierWebhook({ corps, signature: signer(t + 301), horodatage: String(t + 301), secret, maintenant })).toBe("trop_ancien");
    expect(verifierWebhook({ corps, signature: signer(t - 299), horodatage: String(t - 299), secret, maintenant })).toBe("ok");
  });
  it("refuse l'absence d'en-têtes ou un horodatage illisible", () => {
    expect(verifierWebhook({ corps, signature: null, horodatage: String(t), secret, maintenant })).toBe("signature_absente");
    expect(verifierWebhook({ corps, signature: signer(t), horodatage: null, secret, maintenant })).toBe("signature_absente");
    expect(verifierWebhook({ corps, signature: signer(t), horodatage: "hier", secret, maintenant })).toBe("horodatage_invalide");
  });
});

describe("client SasPay", () => {
  it("choisit le bac à sable pour une clé de test et le service réel sinon", () => {
    expect(urlDeBase("sk_test_abc")).toBe(BASE_TEST);
    expect(urlDeBase("sk_live_abc")).toBe(BASE_REEL);
  });

  it("écrit les montants en chaînes décimales et refuse un montant invalide", () => {
    expect(montantEnChaine(5000)).toBe("5000.00");
    expect(montantEnChaine(2500.5)).toBe("2500.50");
    expect(() => montantEnChaine(0)).toThrow();
    expect(() => montantEnChaine(NaN)).toThrow();
  });

  it("envoie la clé, l'idempotence, les frais à notre charge et le bon corps", async () => {
    const f = vi.fn(async () => new Response(JSON.stringify({ success: true, data: { id: "sp-9", status: "PENDING", checkout_url: "" } }), { status: 201 }));
    const r = await vraiSoftpay({ montant: 25000, devise: "XOF", pays: "BJ", reseau: "mtn_bj", description: "Forfait leed", client: { email: "k@exemple.com", first_name: "Koffi", last_name: "Adjovi", phone: "+22997505050" }, idempotence: "pay-1" }, f as unknown as typeof fetch);
    expect(r.id).toBe("sp-9");
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`${BASE_REEL}/payments/softpay/`);
    const entetes = init.headers as Record<string, string>;
    expect(entetes.Authorization).toBe("Bearer sk_live_cle_de_test");
    expect(entetes["Idempotency-Key"]).toBe("pay-1");
    const corps = JSON.parse(String(init.body));
    expect(corps).toMatchObject({ amount: "25000.00", currency: "XOF", country: "BJ", network: "mtn_bj", fee_charge_mode: "DEDUCTED" });
    expect(typeof corps.amount).toBe("string");
  });

  it("transforme une erreur de SasPay en erreur typée (statut, code)", async () => {
    const f = vi.fn(async () => new Response(JSON.stringify({ success: false, error: { message: "Solde insuffisant", code: "insufficient_balance" } }), { status: 422 }));
    await expect(vraiSoftpay({ montant: 5000, devise: "XOF", pays: "BJ", reseau: "mtn_bj", description: "x", client: { email: "a@b.c", first_name: "A", last_name: "B", phone: "+22997505050" }, idempotence: "k" }, f as unknown as typeof fetch)).rejects.toMatchObject({ statutHttp: 422, code: "insufficient_balance" });
    expect(new ErreurSasPay("x", 401).statutHttp).toBe(401);
  });
});

describe("pays, devises et opérateurs", () => {
  it("devise par pays : FCFA seulement", () => {
    expect(deviseDuPays("bj")).toBe("XOF");
    expect(deviseDuPays("CM")).toBe("XAF");
    expect(deviseDuPays("GH")).toBeNull();
    expect(deviseDuPays(null)).toBeNull();
  });
  it("retrouve le pays d'un réseau et filtre ceux du client", () => {
    expect(paysDuReseau("mtn_bj")).toBe("BJ");
    expect(paysDuReseau("wave")).toBeNull();
    const tous = [{ code: "mtn_bj", name: "MTN MoMo" }, { code: "moov_bj", name: "Moov Money" }, { code: "wave_sn", name: "Wave" }, { code: "celtiis_bj", name: "Celtiis", is_active: false }];
    expect(reseauxDuPays(tous, "BJ").map((r) => r.code)).toEqual(["moov_bj", "mtn_bj"]);
  });
  it("code à usage unique : Orange Côte d'Ivoire et Burkina Faso seulement", () => {
    expect(exigeCodeOtp("orange_ci")).toBe(true);
    expect(exigeCodeOtp("orange_bf")).toBe(true);
    expect(exigeCodeOtp("orange_sn")).toBe(false);
    expect(exigeCodeOtp("mtn_bj")).toBe(false);
    expect(nomLisible("mtn_momo")).toBe("MTN MoMo");
    expect(nomLisible("inconnu_xx")).toBe("INCONNU_XX");
  });
});

describe("confirmation d'un paiement : seul SUCCESS ouvre le forfait, une seule fois", () => {
  it("SUCCESS avec le bon montant : paiement réussi, forfait ouvert avec NOTRE montant, frais enregistrés", async () => {
    const p = paiement();
    const admin = fauxAdmin(p);
    base.admin = admin;
    sas.verifier.mockResolvedValue(ok());
    expect(await confirmerPaiement("pay-1")).toEqual({ etat: "reussi" });
    expect(p.statut).toBe("reussi");
    expect(admin.rpcs.filter(([n]) => n === "acheter_forfait")).toEqual([["acheter_forfait", { p_entreprise: "ent-1", p_montant: 25000, p_paiement: "pay-1" }]]);
    expect(admin.rpcs.find(([n]) => n === "ajouter_cout_client")?.[1]).toEqual({ p_entreprise: "ent-1", p_poste: "paiement", p_montant: 625 });
  });

  it("rejouer la confirmation ne compte pas les frais deux fois (le forfait est rejouable côté base)", async () => {
    const p = paiement({ statut: "reussi" });
    const admin = fauxAdmin(p);
    base.admin = admin;
    expect(await confirmerPaiement("pay-1")).toEqual({ etat: "reussi" });
    expect(admin.rpcs.some(([n]) => n === "ajouter_cout_client")).toBe(false);
    expect(sas.verifier).not.toHaveBeenCalled();
    expect(admin.rpcs.filter(([n]) => n === "acheter_forfait")).toHaveLength(1);
  });

  it("PENDING : on ne livre rien", async () => {
    const admin = fauxAdmin(paiement());
    base.admin = admin;
    sas.verifier.mockResolvedValue(ok({ status: "PENDING" }));
    expect(await confirmerPaiement("pay-1")).toEqual({ etat: "en_attente" });
    expect(admin.rpcs).toHaveLength(0);
  });

  it("FAILED ou CANCELLED : paiement échoué, rien n'est livré", async () => {
    for (const status of ["FAILED", "CANCELLED"]) {
      const p = paiement();
      const admin = fauxAdmin(p);
      base.admin = admin;
      sas.verifier.mockResolvedValue(ok({ status }));
      expect((await confirmerPaiement("pay-1")).etat).toBe("echoue");
      expect(p.statut).toBe("echoue");
      expect(admin.rpcs.some(([n]) => n === "acheter_forfait")).toBe(false);
    }
  });

  it("montant encaissé différent du montant attendu : refus, aucun forfait", async () => {
    const p = paiement();
    const admin = fauxAdmin(p);
    base.admin = admin;
    sas.verifier.mockResolvedValue(ok({ requested_amount: "5000.00" }));
    expect(await confirmerPaiement("pay-1")).toEqual({ etat: "echoue", alerte: "montant_different" });
    expect(admin.rpcs.some(([n]) => n === "acheter_forfait")).toBe(false);
  });

  it("sans référence SasPay, ou pour un paiement d'un autre prestataire : rien ne se passe", async () => {
    base.admin = fauxAdmin(paiement({ reference_prestataire: null }));
    expect(await confirmerPaiement("pay-1")).toEqual({ etat: "en_attente" });
    base.admin = fauxAdmin(paiement({ prestataire: "autre" }));
    expect(await confirmerPaiement("pay-1")).toEqual({ etat: "inconnu" });
    base.admin = fauxAdmin(null);
    expect(await confirmerPaiement("absent")).toEqual({ etat: "inconnu" });
    expect(sas.verifier).not.toHaveBeenCalled();
  });
});

describe("démarrer un paiement", () => {
  const entree = { entrepriseId: "ent-1", email: "k@exemple.com", prenom: "Koffi", nom: "Adjovi", pays: "BJ", montant: 25000, reseau: "mtn_bj", telephone: "+229 97 50 50 50" };

  it("refuse avant tout appel à SasPay : montant trop bas, trop haut, pays hors FCFA, numéro invalide", async () => {
    base.admin = fauxAdmin(null);
    expect((await demarrerPaiement({ ...entree, montant: 4999 })).ok).toBe(false);
    expect((await demarrerPaiement({ ...entree, montant: 500001 })).ok).toBe(false);
    expect((await demarrerPaiement({ ...entree, pays: "GH" })).ok).toBe(false);
    expect((await demarrerPaiement({ ...entree, telephone: "12" })).ok).toBe(false);
    expect(sas.softpay).not.toHaveBeenCalled();
  });

  it("refuse un opérateur qui n'existe pas dans le pays du client", async () => {
    base.admin = fauxAdmin(null);
    sas.reseaux.mockResolvedValue([{ code: "mtn_bj", name: "MTN MoMo", is_active: true }]);
    const r = await demarrerPaiement({ ...entree, reseau: "wave_sn" });
    expect(r.ok).toBe(false);
    expect(sas.softpay).not.toHaveBeenCalled();
  });

  it("crée le paiement en attente, appelle SasPay avec l'identifiant du paiement comme clé d'idempotence", async () => {
    const admin = fauxAdmin(null);
    base.admin = admin;
    sas.reseaux.mockResolvedValue([{ code: "mtn_bj", name: "MTN MoMo", is_active: true }]);
    sas.softpay.mockResolvedValue({ id: "sp-1", status: "PENDING", checkout_url: "" });
    const r = await demarrerPaiement({ ...entree, reseau: "mtn_bj" });
    expect(r).toEqual({ ok: true, donnees: { paiementId: "pay-1", redirection: null, gratuit: false } });
    expect(admin.insertions[0][1]).toMatchObject({ entreprise_id: "ent-1", montant_fcfa: 25000, moyen: "mtn_bj", prestataire: "saspay", statut: "en_attente" });
    expect(sas.softpay.mock.calls[0][0]).toMatchObject({ idempotence: "pay-1", montant: 25000, devise: "XOF", pays: "BJ", reseau: "mtn_bj" });
    expect(sas.softpay.mock.calls[0][0].client.phone).toBe("+22997505050");
  });

  it("si SasPay donne une adresse de paiement (Wave, Orange, carte), on y redirige le client", async () => {
    base.admin = fauxAdmin(null);
    sas.reseaux.mockResolvedValue([{ code: "wave_sn", name: "Wave", is_active: true }]);
    sas.softpay.mockResolvedValue({ id: "sp-2", status: "PENDING", checkout_url: "https://pay.exemple/abc" });
    const r = await demarrerPaiement({ ...entree, pays: "SN", reseau: "wave_sn", telephone: "+221 77 000 00 00" });
    expect(r.ok && r.donnees.redirection).toBe("https://pay.exemple/abc");
  });

  it("si SasPay refuse, le paiement passe en « échoué » et le client reçoit un message clair", async () => {
    const admin = fauxAdmin(null);
    base.admin = admin;
    sas.reseaux.mockResolvedValue([{ code: "mtn_bj", name: "MTN MoMo", is_active: true }]);
    sas.softpay.mockRejectedValue(new ErreurSasPay("Solde insuffisant", 422, "insufficient_balance"));
    const r = await demarrerPaiement({ ...entree, reseau: "mtn_bj" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erreur).toContain("solde");
    expect(admin.miseAJour.some(([, v]) => v.statut === "echoue")).toBe(true);
  });
});
