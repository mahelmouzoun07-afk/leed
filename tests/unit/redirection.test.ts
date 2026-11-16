import { describe, expect, it } from "vitest";
import { cheminRetourSur } from "@/lib/auth/redirection";

describe("adresse de retour", () => {
  it("accepte un chemin du site", () => {
    expect(cheminRetourSur("/app/")).toBe("/app/");
    expect(cheminRetourSur("/choisir/?x=1")).toBe("/choisir/?x=1");
  });

  it("refuse tout ce qui mène hors du site", () => {
    for (const piege of ["https://pirate.example", "//pirate.example", "/\\pirate.example", "javascript:alert(1)", "pirate.example", "/ok\r\nLocation: x"]) {
      expect(cheminRetourSur(piege, "/par-defaut"), piege).toBe("/par-defaut");
    }
  });

  it("renvoie la valeur par défaut quand il n'y a rien", () => {
    expect(cheminRetourSur(null)).toBeNull();
    expect(cheminRetourSur("", "/a")).toBe("/a");
  });
});
