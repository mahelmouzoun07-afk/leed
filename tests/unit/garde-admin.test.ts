import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * La garde de l'espace admin (exigerAdmin) est rappelée par chaque page /admin.
 * Elle doit refuser : un visiteur, un client (404), et un administrateur sans double authentification.
 */
const etat = vi.hoisted(() => ({
  user: null as { id: string; email: string } | null,
  ligneAdmin: null as { role: "admin" | "support"; mfa_exige: boolean } | null,
  niveau: "aal1" as "aal1" | "aal2",
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
  notFound: () => {
    throw new Error("NOTFOUND");
  },
}));
vi.mock("@/lib/supabase/admin", () => ({ creerClientAdmin: () => ({}) }));
vi.mock("@/lib/supabase/server", () => ({
  creerClientServeur: async () => ({
    auth: {
      getUser: async () => ({ data: { user: etat.user } }),
      mfa: { getAuthenticatorAssuranceLevel: async () => ({ data: { currentLevel: etat.niveau } }) },
    },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: etat.ligneAdmin }) }) }) }),
  }),
}));

import { exigerAdmin } from "@/lib/auth/session";

beforeEach(() => {
  etat.user = null;
  etat.ligneAdmin = null;
  etat.niveau = "aal1";
});

describe("garde de l'espace admin", () => {
  it("renvoie un visiteur non connecté vers la connexion admin", async () => {
    await expect(exigerAdmin()).rejects.toThrow("REDIRECT:/admin/connexion/");
  });

  it("donne une 404 à un client connecté qui n'est pas administrateur", async () => {
    etat.user = { id: "client-1", email: "client@exemple.com" };
    await expect(exigerAdmin()).rejects.toThrow("NOTFOUND");
  });

  it("exige la double authentification d'un administrateur qui ne l'a pas validée", async () => {
    etat.user = { id: "admin-1", email: "admin@exemple.com" };
    etat.ligneAdmin = { role: "admin", mfa_exige: true };
    etat.niveau = "aal1";
    await expect(exigerAdmin()).rejects.toThrow("REDIRECT:/admin/verification/");
  });

  it("laisse entrer un administrateur dont la double authentification est validée", async () => {
    etat.user = { id: "admin-1", email: "admin@exemple.com" };
    etat.ligneAdmin = { role: "admin", mfa_exige: true };
    etat.niveau = "aal2";
    await expect(exigerAdmin()).resolves.toMatchObject({ role: "admin" });
  });

  it("n'exige pas la double authentification si elle est désactivée pour ce compte", async () => {
    etat.user = { id: "support-1", email: "support@exemple.com" };
    etat.ligneAdmin = { role: "support", mfa_exige: false };
    await expect(exigerAdmin()).resolves.toMatchObject({ role: "support" });
  });
});
