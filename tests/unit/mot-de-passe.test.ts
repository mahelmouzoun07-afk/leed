import { describe, expect, it } from "vitest";
import { reglesManquantes, schemaMotDePasse } from "@/lib/auth/mot-de-passe";

describe("mot de passe", () => {
  it("accepte l'exemple donné par le client", () => {
    expect(schemaMotDePasse.safeParse("Dadit906,5").success).toBe(true);
  });

  it("refuse chaque règle manquante, avec un message qui la nomme", () => {
    const cas: [string, string][] = [
      ["Ab1,", "8 caractères"],
      ["dadit906,5", "majuscule"],
      ["DADIT906,5", "minuscule"],
      ["Dadit,,,,,", "chiffre"],
      ["Dadit9065", "symbole"],
    ];
    for (const [valeur, attendu] of cas) {
      const r = schemaMotDePasse.safeParse(valeur);
      expect(r.success, valeur).toBe(false);
      if (!r.success) expect(r.error.issues[0].message).toContain(attendu);
    }
  });

  it("n'impose pas de plafond à 12 caractères (phrases de passe autorisées)", () => {
    expect(schemaMotDePasse.safeParse("Une phrase de passe longue, 2026!").success).toBe(true);
  });

  it("refuse au-delà de 72 caractères (limite du hachage)", () => {
    expect(schemaMotDePasse.safeParse("Aa1," + "x".repeat(70)).success).toBe(false);
  });

  it("liste exactement les règles manquantes", () => {
    expect(reglesManquantes("abc").map((r) => r.id)).toEqual(["longueur", "majuscule", "chiffre", "symbole"]);
  });
});
