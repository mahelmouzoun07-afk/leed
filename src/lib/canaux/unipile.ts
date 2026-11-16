import "server-only";
import { env } from "../env";
import { log } from "../journal";
import { canalDuType, identifiantWhatsApp, PROVIDERS_PAR_CANAL, pireStatut } from "./regles";
import type { Canal, CompteDistant, DemandeEnvoi, DemandeLien, FournisseurCanaux, LienConnexion, ResultatEnvoi, WebhookDistant } from "./types";

/**
 * L'implémentation Unipile de `FournisseurCanaux`. SEUL fichier qui connaît les routes et les mots d'Unipile.
 * La clé (UNIPILE_API_KEY) reste sur le serveur : jamais dans une réponse, un journal ou le navigateur.
 */
export class ErreurUnipile extends Error {
  constructor(
    message: string,
    readonly statutHttp: number,
    readonly type?: string,
  ) {
    super(message);
    this.name = "ErreurUnipile";
  }
}

/** « api8.unipile.com:13851 » ou « https://api8.unipile.com:13851/ » -> « https://api8.unipile.com:13851 ». */
export function urlDeBase(dsn: string): string {
  const propre = dsn.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  return `https://${propre}`;
}

type Requete = { methode?: "GET" | "POST" | "DELETE"; chemin: string; json?: unknown; form?: FormData; requete?: Record<string, string> };

type Config = { dsn: string; cle: string };

export function configurationUnipile(): Config | null {
  const e = env();
  return e.UNIPILE_DSN && e.UNIPILE_API_KEY ? { dsn: e.UNIPILE_DSN, cle: e.UNIPILE_API_KEY } : null;
}

export function unipileConfigure(): boolean {
  return configurationUnipile() !== null;
}

const texte = (v: unknown): string => (typeof v === "string" ? v : "");

/** Un compte tel que l'API le décrit, ramené à notre forme. Le numéro ou l'adresse est cherché dans les champs connus. */
export function normaliserCompte(brut: unknown): CompteDistant | null {
  if (!brut || typeof brut !== "object") return null;
  const a = brut as Record<string, unknown>;
  const id = texte(a.id);
  if (!id) return null;
  const type = texte(a.type);
  const p = (a.connection_params ?? {}) as Record<string, Record<string, unknown> | undefined>;
  const identifiant =
    texte(p.im?.phone_number) || texte(p.mail?.username) || texte(p.mail?.imap_user) || texte(p.im?.username) || texte(p.im?.publicIdentifier) || texte(p.im?.id) || texte(a.name) || "compte connecté";
  const sources = Array.isArray(a.sources) ? (a.sources as { status?: string }[]) : [];
  return {
    id,
    type,
    canal: canalDuType(type),
    identifiant,
    statutBrut: pireStatut(sources.map((s) => s?.status)),
    creeLe: texte(a.created_at) || null,
  };
}

export function creerFournisseurUnipile(config: Config | null = configurationUnipile()): FournisseurCanaux {
  if (!config) throw new ErreurUnipile("Unipile n'est pas configuré (UNIPILE_DSN ou UNIPILE_API_KEY manque).", 0, "non_configure");
  const base = urlDeBase(config.dsn);

  async function appeler<T>(r: Requete): Promise<T> {
    const url = new URL(base + r.chemin);
    for (const [k, v] of Object.entries(r.requete ?? {})) url.searchParams.set(k, v);
    const entetes: Record<string, string> = { "X-API-KEY": config!.cle, accept: "application/json" };
    let corps: BodyInit | undefined;
    if (r.json !== undefined) {
      entetes["content-type"] = "application/json";
      corps = JSON.stringify(r.json);
    } else if (r.form) corps = r.form;

    let reponse: Response;
    try {
      reponse = await fetch(url, { method: r.methode ?? "GET", headers: entetes, body: corps, signal: AbortSignal.timeout(25_000) });
    } catch (e) {
      throw new ErreurUnipile(e instanceof Error && e.name === "TimeoutError" ? "Unipile a mis trop de temps à répondre." : "Unipile est injoignable.", 0, "reseau");
    }
    const texteBrut = await reponse.text();
    let json: unknown = null;
    try {
      json = texteBrut ? JSON.parse(texteBrut) : null;
    } catch {
      json = null;
    }
    if (!reponse.ok) {
      const j = (json ?? {}) as Record<string, unknown>;
      const detail = texte(j.detail) || texte(j.title) || texte(j.message) || texteBrut.slice(0, 160);
      log.warn("unipile.refus", { chemin: r.chemin.replace(/\/[A-Za-z0-9_-]{12,}/g, "/…"), statut: reponse.status, type: texte(j.type) });
      throw new ErreurUnipile(detail || `Unipile a répondu ${reponse.status}.`, reponse.status, texte(j.type) || undefined);
    }
    return json as T;
  }

  const liste = (j: unknown): unknown[] => (Array.isArray(j) ? j : Array.isArray((j as { items?: unknown[] } | null)?.items) ? (j as { items: unknown[] }).items : []);

  return {
    async creerLienConnexion(d: DemandeLien): Promise<LienConnexion> {
      const rebrancher = !!d.rebrancher;
      const r = await appeler<{ url?: string }>({
        methode: "POST",
        chemin: "/api/v1/hosted/accounts/link",
        json: {
          type: rebrancher ? "reconnect" : "create",
          providers: PROVIDERS_PAR_CANAL[d.canal],
          api_url: base,
          expiresOn: new Date(Date.now() + d.expireDans * 60_000).toISOString(),
          notify_url: d.adresseRetour,
          name: d.nom,
          success_redirect_url: d.succes,
          failure_redirect_url: d.echec,
          ...(rebrancher ? { reconnect_account: d.rebrancher } : {}),
        },
      });
      if (!r?.url) throw new ErreurUnipile("Unipile n'a pas renvoyé de lien de connexion.", 502, "lien_absent");
      return { url: r.url };
    },

    async lireCompte(id) {
      try {
        return normaliserCompte(await appeler({ chemin: `/api/v1/accounts/${encodeURIComponent(id)}` }));
      } catch (e) {
        if (e instanceof ErreurUnipile && e.statutHttp === 404) return null;
        throw e;
      }
    },

    async listerComptes() {
      return liste(await appeler({ chemin: "/api/v1/accounts" }))
        .map(normaliserCompte)
        .filter((c): c is CompteDistant => c !== null);
    },

    async supprimerCompte(id) {
      try {
        await appeler({ methode: "DELETE", chemin: `/api/v1/accounts/${encodeURIComponent(id)}` });
      } catch (e) {
        if (e instanceof ErreurUnipile && e.statutHttp === 404) return; // déjà absent : le but est atteint
        throw e;
      }
    },

    async envoyer(d: DemandeEnvoi, canal: Canal): Promise<ResultatEnvoi> {
      if (canal === "email") {
        const r = await appeler<Record<string, unknown>>({
          methode: "POST",
          chemin: "/api/v1/emails",
          json: { account_id: d.compteId, to: [{ identifier: d.destinataire }], subject: d.objet ?? "", body: d.texte },
        });
        return { chatId: null, messageId: texte(r?.tracking_id) || texte(r?.provider_id) || texte(r?.id) || null };
      }
      let destinataire = d.destinataire;
      if (canal === "whatsapp") {
        const id = identifiantWhatsApp(d.destinataire);
        if (!id) throw new ErreurUnipile("Numéro WhatsApp invalide.", 400, "numero_invalide");
        destinataire = id;
      }
      const form = new FormData();
      form.set("account_id", d.compteId);
      form.set("attendees_ids", destinataire);
      form.set("text", d.texte);
      const r = await appeler<Record<string, unknown>>({ methode: "POST", chemin: "/api/v1/chats", form });
      return { chatId: texte(r?.chat_id) || null, messageId: texte(r?.message_id) || null };
    },

    async listerWebhooks() {
      return liste(await appeler({ chemin: "/api/v1/webhooks" })).map((w) => {
        const o = w as Record<string, unknown>;
        return { id: texte(o.id), source: texte(o.source), url: texte(o.request_url), nom: texte(o.name) || null };
      });
    },

    async creerWebhook(d): Promise<WebhookDistant> {
      const r = await appeler<Record<string, unknown>>({
        methode: "POST",
        chemin: "/api/v1/webhooks",
        json: {
          request_url: d.url,
          source: d.source,
          name: d.nom,
          headers: [
            { key: "Content-Type", value: "application/json" },
            { key: "Unipile-Auth", value: d.secret },
          ],
        },
      });
      return { id: texte(r?.webhook_id) || texte(r?.id), source: d.source, url: d.url, nom: d.nom };
    },
  };
}
