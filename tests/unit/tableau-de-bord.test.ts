import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));
vi.mock("@/lib/auth/session", () => ({ exigerEntreprise: async () => ({ user: { id: "u1", email: "k@exemple.com" }, entreprise: { id: "e1", nom: "Studio Koffi" } }) }));
vi.mock("@/lib/supabase/server", () => ({ creerClientServeur: async () => ({}) }));
vi.mock("@/lib/supabase/admin", () => ({ creerClientAdmin: () => ({}) }));

import { chargerProspect, chargerProspects, type Ctx } from "@/lib/app/donnees";
import { coutUnipileEuros, coutUnipileFcfa } from "@/lib/admin/unipile";
import { joursAvant } from "@/components/app/kit";

/** Un faux client Supabase : chaque requête renvoie les lignes prévues pour sa table, quelle que soit la chaîne d'appels. */
function fauxClient(tables: Record<string, unknown[]>) {
  const requete = (lignes: unknown[]): unknown =>
    new Proxy(
      {},
      {
        get: (_c, nom) => {
          if (nom === "then") return (ok: (v: unknown) => unknown) => ok({ data: lignes, count: lignes.length, error: null });
          if (nom === "maybeSingle" || nom === "single") return async () => ({ data: lignes[0] ?? null, error: null });
          return () => requete(lignes);
        },
      },
    );
  return { from: (table: string) => requete(tables[table] ?? []) } as unknown as Ctx["sb"];
}

const ctx = (tables: Record<string, unknown[]>): Ctx => ({ sb: fauxClient(tables), user: { id: "u1" } as Ctx["user"], entrepriseId: "e1", entrepriseNom: "Studio Koffi", demo: false });

describe("tableau de bord : le nom d'une entreprise non contactée ne quitte jamais le serveur", () => {
  const lignes = [
    { id: "p1", nom: "Maquis Chez Tanti", ville: "Cotonou", secteur: "Restaurant", canal_choisi: "whatsapp", statut: "en_conversation", score: 92, contacte_le: "2026-11-14T09:00:00Z" },
    { id: "p2", nom: "Salon Secret", ville: "Cotonou", secteur: "Beauté", canal_choisi: null, statut: "nouveau", score: 70, contacte_le: null },
  ];

  it("liste : le nom de l'entreprise pas encore contactée est vide", async () => {
    const v = await chargerProspects(ctx({ prospects: lignes }), {});
    const secret = v.lignes.find((l) => l.id === "p2");
    expect(secret?.masque).toBe(true);
    expect(secret?.nom).toBe("");
    expect(JSON.stringify(v)).not.toContain("Salon Secret");
    expect(v.lignes.find((l) => l.id === "p1")?.nom).toBe("Maquis Chez Tanti");
  });

  it("fiche : ni nom, ni coordonnées, ni raison d'écrire pour une entreprise pas encore contactée", async () => {
    const v = await chargerProspect(ctx({ prospects: [{ ...lignes[1], contact_nom: "Mme X", contact_role: "gérante", signal: "Logo illisible", note_client: null }] }), "p2");
    expect(v?.masque).toBe(true);
    expect(v?.nom).toBe("");
    expect(v?.contact).toBeNull();
    expect(v?.signal).toBeNull();
    expect(v?.identifiants).toEqual([]);
    expect(JSON.stringify(v)).not.toContain("Salon Secret");
  });
});

describe("espace équipe : estimation de la facture Unipile", () => {
  it("applique les paliers du document OFFRE-ET-PRIX", () => {
    expect(coutUnipileEuros(0)).toBe(0);
    expect(coutUnipileEuros(1)).toBe(49);
    expect(coutUnipileEuros(10)).toBe(49);
    expect(coutUnipileEuros(11)).toBe(55);
    expect(coutUnipileEuros(50)).toBe(250);
    expect(coutUnipileEuros(61)).toBe(274.5);
    expect(coutUnipileFcfa(10)).toBe(Math.round(49 * 656));
  });
});

describe("kit", () => {
  it("joursAvant ne descend jamais sous zéro", () => {
    const maintenant = Date.parse("2026-11-16T12:00:00Z");
    expect(joursAvant("2026-11-26T12:00:00Z", maintenant)).toBe(10);
    expect(joursAvant("2026-11-10T12:00:00Z", maintenant)).toBe(0);
    expect(joursAvant(null, maintenant)).toBe(0);
  });
});
