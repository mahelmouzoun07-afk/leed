import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * Chantier 7 : « ne jamais exposer l'identifiant de compte Unipile au navigateur » et « la clé reste sur le serveur ».
 * Ce test parcourt le code : l'identifiant ne doit apparaître que dans les fichiers serveur autorisés, jamais dans un composant ni une page,
 * et aucune variable UNIPILE_ ne doit être lue dans du code qui part au navigateur.
 */
const RACINE = join(__dirname, "..", "..", "src");

function fichiers(dossier: string): string[] {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) return fichiers(chemin);
    return /\.(ts|tsx)$/.test(nom) ? [chemin] : [];
  });
}
const rel = (f: string) => relative(RACINE, f).replace(/\\/g, "/");
const tous = fichiers(RACINE).map((f) => ({ chemin: rel(f), texte: readFileSync(f, "utf8") }));

/** Les seuls endroits qui connaissent l'identifiant Unipile : le service des canaux, et les types de la base. */
const AUTORISES_IDENTIFIANT = new Set(["lib/canaux/service.ts", "lib/supabase/database.types.ts"]);

describe("l'identifiant de compte Unipile ne sort pas du serveur", () => {
  it("n'apparaît dans aucun composant, aucune page ni aucune action visible du client", () => {
    const fautifs = tous.filter((f) => /unipile_account_id/.test(f.texte) && !AUTORISES_IDENTIFIANT.has(f.chemin)).map((f) => f.chemin);
    expect(fautifs).toEqual([]);
  });

  it("la vue du client sur ses comptes ne le sélectionne pas", () => {
    const donnees = tous.find((f) => f.chemin === "lib/app/donnees.ts")!.texte;
    const requetes = donnees.match(/from\("mes_comptes"\)\.select\("([^"]*)"\)/g) ?? [];
    expect(requetes.length).toBeGreaterThan(0);
    for (const r of requetes) expect(r).not.toContain("unipile");
  });
});

describe("la clé Unipile ne part jamais au navigateur", () => {
  it("n'est lue que par des fichiers serveur (jamais « use client », jamais une variable NEXT_PUBLIC_)", () => {
    const lecteurs = tous.filter((f) => /UNIPILE_(API_KEY|DSN|WEBHOOK_SECRET)/.test(f.texte));
    expect(lecteurs.length).toBeGreaterThan(0);
    for (const f of lecteurs) {
      expect(f.texte.startsWith('"use client"'), `${f.chemin} est un composant client`).toBe(false);
      expect(f.texte, `${f.chemin} expose une variable publique`).not.toMatch(/NEXT_PUBLIC_UNIPILE/);
    }
    expect(tous.some((f) => /NEXT_PUBLIC_UNIPILE/.test(f.texte))).toBe(false);
  });

  it("les composants client n'importent pas le client Unipile", () => {
    const clients = tous.filter((f) => f.texte.startsWith('"use client"'));
    for (const f of clients) expect(f.texte, f.chemin).not.toMatch(/canaux\/(unipile|service)/);
  });
});
