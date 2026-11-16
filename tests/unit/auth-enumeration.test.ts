import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Aucun message ne doit révéler si une adresse email a déjà un compte.
 * On remplace Supabase par un faux client dont on contrôle les réponses, puis on compare
 * ce que les actions renvoient dans le cas « adresse connue » et « adresse inconnue ».
 */
const fake = vi.hoisted(() => ({
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  signInWithOtp: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  limiteAutorisee: true,
}));

vi.mock("next/headers", () => ({ headers: async () => new Headers({ host: "localhost:3000", "x-forwarded-for": "1.2.3.4" }) }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
  notFound: () => {
    throw new Error("NOTFOUND");
  },
}));
vi.mock("@/lib/env", () => ({ env: () => ({ APP_URL: "http://localhost:3000", SUPABASE_SERVICE_ROLE_KEY: "cle-de-test" }) }));
vi.mock("@/lib/supabase/server", () => ({
  creerClientServeur: async () => ({
    auth: {
      signUp: fake.signUp,
      signInWithPassword: fake.signInWithPassword,
      signInWithOtp: fake.signInWithOtp,
      resetPasswordForEmail: fake.resetPasswordForEmail,
      signOut: async () => ({}),
    },
  }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  creerClientAdmin: () => ({
    rpc: async (nom: string) => ({ data: nom === "verifier_limite" ? fake.limiteAutorisee : null, error: null }),
    from: () => ({ insert: async () => ({ error: null }) }),
  }),
}));
vi.mock("@/lib/auth/session", () => ({
  assurerEntreprise: async () => "entreprise-1",
  destinationApresConnexion: async () => "/choisir/",
  exigerUtilisateur: async () => ({ id: "u1", user_metadata: {} }),
}));

import { connecter, demanderReinitialisation, envoyerLienMagique, inscrire } from "@/lib/auth/actions";
import { MSG_CONNEXION_REFUSEE, MSG_EMAIL_ENVOYE, MSG_TROP_DE_TENTATIVES } from "@/lib/auth/messages";

const formulaire = (valeurs: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(valeurs)) f.set(k, v);
  return f;
};

const inscriptionValide = {
  prenomNom: "Koffi Adjovi",
  entreprise: "Studio Koffi",
  email: "koffi@exemple.com",
  motDePasse: "Dadit906,5",
  whatsapp: "+229 01 23 45 67 89",
  pays: "BJ",
  cgu: "on",
  analyse: "",
};

beforeEach(() => {
  vi.clearAllMocks();
  fake.limiteAutorisee = true;
});

describe("connexion", () => {
  it("renvoie le même message pour une adresse inconnue et pour un mauvais mot de passe", async () => {
    fake.signInWithPassword.mockResolvedValueOnce({ data: { user: null }, error: { code: "invalid_credentials", status: 400, message: "Invalid login credentials" } });
    const inconnue = await connecter({}, formulaire({ email: "personne@exemple.com", motDePasse: "Nimporte1," }));
    fake.signInWithPassword.mockResolvedValueOnce({ data: { user: null }, error: { code: "invalid_credentials", status: 400, message: "Invalid login credentials" } });
    const mauvais = await connecter({}, formulaire({ email: "koffi@exemple.com", motDePasse: "Faux1,motdepasse" }));
    expect(inconnue).toEqual(mauvais);
    expect(inconnue.message).toBe(MSG_CONNEXION_REFUSEE);
  });

  it("ne dit rien de plus pour un email mal formé ou un mot de passe vide", async () => {
    expect((await connecter({}, formulaire({ email: "pas-un-email", motDePasse: "x" }))).message).toBe(MSG_CONNEXION_REFUSEE);
    expect((await connecter({}, formulaire({ email: "a@b.com", motDePasse: "" }))).message).toBe(MSG_CONNEXION_REFUSEE);
    expect(fake.signInWithPassword).not.toHaveBeenCalled();
  });

  it("bloque après trop de tentatives, sans appeler Supabase", async () => {
    fake.limiteAutorisee = false;
    const r = await connecter({}, formulaire({ email: "a@b.com", motDePasse: "Abcdef1," }));
    expect(r.message).toBe(MSG_TROP_DE_TENTATIVES);
    expect(fake.signInWithPassword).not.toHaveBeenCalled();
  });

  it("une connexion réussie redirige vers la bonne page", async () => {
    fake.signInWithPassword.mockResolvedValueOnce({ data: { user: { id: "u1" } }, error: null });
    await expect(connecter({}, formulaire({ email: "koffi@exemple.com", motDePasse: "Dadit906,5" }))).rejects.toThrow("REDIRECT:/choisir/");
  });
});

describe("inscription", () => {
  it("répond pareil pour une adresse nouvelle, déjà inscrite ou en erreur", async () => {
    fake.signUp.mockResolvedValueOnce({ data: { user: { id: "nouveau" }, session: null }, error: null });
    const nouvelle = await inscrire({}, formulaire(inscriptionValide));
    fake.signUp.mockResolvedValueOnce({ data: { user: { id: "faux", identities: [] }, session: null }, error: null });
    const existanteMasquee = await inscrire({}, formulaire(inscriptionValide));
    fake.signUp.mockResolvedValueOnce({ data: { user: null, session: null }, error: { status: 422, code: "user_already_exists", message: "User already registered" } });
    const existanteEnErreur = await inscrire({}, formulaire(inscriptionValide));
    expect(existanteMasquee).toEqual(nouvelle);
    expect(existanteEnErreur).toEqual(nouvelle);
    expect(nouvelle).toEqual({ ok: true, etape: "verifier_email", message: MSG_EMAIL_ENVOYE });
  });

  it("refuse un mot de passe faible avant d'appeler Supabase, et nomme ce qui manque", async () => {
    const r = await inscrire({}, formulaire({ ...inscriptionValide, motDePasse: "motdepasse" }));
    expect(r.ok).toBe(false);
    expect(r.erreurs?.motDePasse).toContain("majuscule");
    expect(fake.signUp).not.toHaveBeenCalled();
  });

  it("refuse un numéro sans indicatif et l'absence d'acceptation des conditions", async () => {
    const r = await inscrire({}, formulaire({ ...inscriptionValide, whatsapp: "0123456789", cgu: "" }));
    expect(r.erreurs?.whatsapp).toBeTruthy();
    expect(r.erreurs?.cgu).toBeTruthy();
    expect(fake.signUp).not.toHaveBeenCalled();
  });

  it("transmet à Supabase les informations qui créeront l'entreprise", async () => {
    fake.signUp.mockResolvedValueOnce({ data: { user: { id: "n" }, session: null }, error: null });
    await inscrire({}, formulaire(inscriptionValide));
    const options = fake.signUp.mock.calls[0][0].options;
    expect(options.data).toMatchObject({ prenom: "Koffi", nom: "Adjovi", entreprise_nom: "Studio Koffi", pays: "BJ" });
    expect(options.emailRedirectTo).toBe("http://localhost:3000/auth/confirmer?next=%2Fchoisir%2F");
  });

  it("bloque après trop de tentatives", async () => {
    fake.limiteAutorisee = false;
    const r = await inscrire({}, formulaire(inscriptionValide));
    expect(r.message).toBe(MSG_TROP_DE_TENTATIVES);
    expect(fake.signUp).not.toHaveBeenCalled();
  });
});

describe("lien magique et mot de passe oublié", () => {
  it("lien magique : même réponse que l'adresse existe ou non, et même en cas d'erreur d'envoi", async () => {
    fake.signInWithOtp.mockResolvedValueOnce({ error: null });
    const connue = await envoyerLienMagique({}, formulaire({ email: "koffi@exemple.com" }));
    fake.signInWithOtp.mockResolvedValueOnce({ error: { status: 400, code: "otp_disabled", message: "Signups not allowed for otp" } });
    const inconnue = await envoyerLienMagique({}, formulaire({ email: "personne@exemple.com" }));
    expect(inconnue).toEqual(connue);
    expect(connue.message).toBe(MSG_EMAIL_ENVOYE);
  });

  it("lien magique : ne crée jamais de compte", async () => {
    fake.signInWithOtp.mockResolvedValueOnce({ error: null });
    await envoyerLienMagique({}, formulaire({ email: "koffi@exemple.com" }));
    expect(fake.signInWithOtp.mock.calls[0][0].options.shouldCreateUser).toBe(false);
  });

  it("mot de passe oublié : même réponse que l'adresse existe ou non", async () => {
    fake.resetPasswordForEmail.mockResolvedValueOnce({ error: null });
    const connue = await demanderReinitialisation({}, formulaire({ email: "koffi@exemple.com" }));
    fake.resetPasswordForEmail.mockResolvedValueOnce({ error: { status: 400, code: "user_not_found", message: "User not found" } });
    const inconnue = await demanderReinitialisation({}, formulaire({ email: "personne@exemple.com" }));
    expect(inconnue).toEqual(connue);
    expect(connue.message).toBe(MSG_EMAIL_ENVOYE);
  });
});
