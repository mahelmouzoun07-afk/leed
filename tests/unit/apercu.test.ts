import { describe, expect, it } from "vitest";
import { fusionnerApercus, paysDuVisiteur, type ReponseApercuSql } from "@/lib/annuaire/apercu";
import { SECTEURS, estSecteur } from "@/lib/annuaire/secteurs";

describe("le pays du visiteur", () => {
  it("vient d'abord de l'extension du site", () => {
    expect(paysDuVisiteur({ mode: "site", site: "studiokoffi.bj" })).toEqual(["BJ"]);
    expect(paysDuVisiteur({ mode: "site", site: "boutique.sn" }, { zone: "Abidjan", resume: "" })).toEqual(["SN"]);
  });
  it("sinon des villes ou pays cités dans la zone", () => {
    expect(paysDuVisiteur({ mode: "site", site: "exemple.com" }, { zone: "Cotonou et Porto-Novo", resume: "" })).toEqual(["BJ"]);
    expect(paysDuVisiteur(undefined, { zone: "Dakar, Abidjan", resume: "" }).sort()).toEqual(["CI", "SN"]);
    expect(paysDuVisiteur(undefined, { zone: "Côte d'Ivoire", resume: "" })).toEqual(["CI"]);
    expect(paysDuVisiteur(undefined, { zone: "Lomé", resume: "" })).toEqual(["TG"]);
  });
  it("à défaut, les quatre pays de l'annuaire", () => {
    expect(paysDuVisiteur({ mode: "site", site: "exemple.com" }, { zone: "Non précisée", resume: "" })).toHaveLength(4);
    expect(paysDuVisiteur()).toHaveLength(4);
  });
  it("lit la zone du formulaire quand il n'y a pas de site", () => {
    const formulaire = { vend: "Logos", client: "Restaurants", secteurs: [], taille: "", zone: "Lomé", prixMoyen: "", objectif: "" };
    expect(paysDuVisiteur({ mode: "formulaire", formulaire })).toEqual(["TG"]);
  });
});

describe("la fusion des pays", () => {
  const bj: ReponseApercuSql = { total: 120, canaux: { whatsapp: 80, email: 60, facebook: 100 }, exemples: [{ secteur: "Restauration", ville: "Cotonou", taille: null }] };
  const sn: ReponseApercuSql = { total: 300, canaux: { whatsapp: 200, email: 150, instagram: 10, facebook: 280 }, exemples: [{ secteur: "Restauration", ville: "Dakar", taille: null }, { secteur: null, ville: null, taille: null }] };

  it("additionne les totaux et les canaux, et ne montre que les canaux qui existent", () => {
    const a = fusionnerApercus([bj, sn]);
    expect(a.total).toBe(420);
    expect(a.canaux).toEqual([
      { canal: "WhatsApp", nombre: 280 },
      { canal: "Email", nombre: 210 },
      { canal: "Instagram", nombre: 10 },
      { canal: "Facebook", nombre: 380 },
    ]);
    expect(a.reel).toBe(true);
  });
  it("garde au plus trois exemples sans nom d'entreprise ni coordonnée", () => {
    const a = fusionnerApercus([bj, sn, sn]);
    expect(a.exemples.length).toBeLessThanOrEqual(3);
    for (const e of a.exemples) expect(Object.keys(e).sort()).toEqual(["secteur", "taille", "ville"]);
  });
  it("supporte une réponse vide", () => {
    expect(fusionnerApercus([{ total: 0, canaux: {}, exemples: [] }])).toMatchObject({ total: 0, canaux: [], exemples: [] });
  });
});

describe("la liste fermée des secteurs", () => {
  it("reconnaît exactement ses noms", () => {
    expect(estSecteur("Restauration")).toBe(true);
    expect(estSecteur("restauration")).toBe(false);
    expect(estSecteur("Restaurants")).toBe(false);
    expect(new Set(SECTEURS).size).toBe(SECTEURS.length);
  });
});
