import "server-only";
import { exigerEnv } from "../env";

/**
 * Client de l'API SasPay. Tout part du SERVEUR : la clé ne doit jamais atteindre le navigateur ni les journaux.
 * La spécification fait foi (https://docs.saspay.me/api-reference/openapi.json) : on n'invente ni route, ni champ, ni statut.
 *
 * Règles appliquées :
 *  - montants en chaînes décimales (« 5000.00 »), jamais en nombres à virgule ;
 *  - une clé d'idempotence par intention de paiement, réutilisée à l'identique à chaque nouvel essai ;
 *  - frais à notre charge (« DEDUCTED ») : le client paie exactement le montant choisi ;
 *  - ne jamais livrer sur autre chose que le statut SUCCESS rendu par la vérification.
 */
export const BASE_REEL = "https://api.saspay.me/api/v1";
export const BASE_TEST = "https://sandbox-api.saspay.me/api/v1";

/** Une clé « sk_test_… » parle au bac à sable, toute autre au service réel. */
export function urlDeBase(cle: string): string {
  return cle.startsWith("sk_test_") ? BASE_TEST : BASE_REEL;
}

export class ErreurSasPay extends Error {
  constructor(
    message: string,
    public statutHttp: number,
    public code?: string,
  ) {
    super(message);
  }
}

type Corps = Record<string, unknown>;

async function appel<T>(chemin: string, options: { methode?: "GET" | "POST"; corps?: Corps; idempotence?: string; fetchImpl?: typeof fetch } = {}): Promise<T> {
  const cle = exigerEnv("SASPAY_API_KEY");
  const f = options.fetchImpl ?? fetch;
  const entetes: Record<string, string> = { Authorization: `Bearer ${cle}`, Accept: "application/json" };
  if (options.corps) entetes["Content-Type"] = "application/json";
  if (options.idempotence) entetes["Idempotency-Key"] = options.idempotence;

  const reponse = await f(`${urlDeBase(cle)}${chemin}`, {
    method: options.methode ?? "GET",
    headers: entetes,
    body: options.corps ? JSON.stringify(options.corps) : undefined,
    cache: "no-store",
  });
  const texte = await reponse.text();
  let json: Record<string, unknown> = {};
  try {
    json = texte ? (JSON.parse(texte) as Record<string, unknown>) : {};
  } catch {
    /* réponse non JSON : on garde le code HTTP */
  }
  if (!reponse.ok || json.success === false) {
    const err = (json.error ?? {}) as { message?: string; code?: string };
    // Erreur de validation : { "champ": ["message"] }
    const premierChamp = Object.entries(json).find(([, v]) => Array.isArray(v));
    const message = err.message ?? (premierChamp ? `${premierChamp[0]} : ${String((premierChamp[1] as unknown[])[0])}` : `HTTP ${reponse.status}`);
    throw new ErreurSasPay(message, reponse.status, err.code);
  }
  // Succès : soit { success: true, data: {...} }, soit l'objet directement.
  return ((json.data as T | undefined) ?? (json as unknown as T)) as T;
}

/** Montant décimal en chaîne : 5000 → « 5000.00 ». */
export function montantEnChaine(n: number): string {
  if (!Number.isFinite(n) || n <= 0) throw new Error("Montant invalide");
  return n.toFixed(2);
}

export type ClientPaiement = { email: string; first_name: string; last_name: string; phone: string };

export type SoftpayReponse = { id: string; status: string; checkout_url?: string | null; message?: string };

/** Demande de paiement directe sur le téléphone du client. */
export function lancerSoftpay(
  d: { montant: number; devise: string; pays: string; reseau: string; description: string; client: ClientPaiement; otp?: string; idempotence: string; metadata?: Corps },
  fetchImpl?: typeof fetch,
): Promise<SoftpayReponse> {
  return appel<SoftpayReponse>("/payments/softpay/", {
    methode: "POST",
    idempotence: d.idempotence,
    fetchImpl,
    corps: {
      amount: montantEnChaine(d.montant),
      currency: d.devise,
      country: d.pays,
      network: d.reseau,
      description: d.description,
      fee_charge_mode: "DEDUCTED",
      customer: d.client,
      ...(d.otp ? { otp: d.otp } : {}),
      ...(d.metadata ? { metadata: d.metadata } : {}),
    },
  });
}

export type VerificationPaiement = {
  id: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED" | string;
  requested_amount?: string;
  debited_amount?: string;
  net_amount?: string;
  currency?: string;
  fee_charge_mode?: string | null;
  client_fee?: string;
  gateway_fee?: string;
  platform_fee?: string;
};

/** L'état réel d'un paiement : la seule source de vérité pour livrer. */
export function verifierPaiement(idPaiement: string, fetchImpl?: typeof fetch): Promise<VerificationPaiement> {
  return appel<VerificationPaiement>(`/payments/${encodeURIComponent(idPaiement)}/verify/`, { fetchImpl });
}

export type ReseauSasPay = { id?: string; code: string; name: string; is_active?: boolean };

/** Tous les réseaux de SasPay (la liste est paginée : on lit jusqu'à 5 pages de 100). */
export async function lireReseaux(fetchImpl?: typeof fetch): Promise<ReseauSasPay[]> {
  const tous: ReseauSasPay[] = [];
  for (let page = 1; page <= 5; page++) {
    const r = await appel<{ results?: ReseauSasPay[]; next?: string | null } | ReseauSasPay[]>(`/networks/?page=${page}&page_size=100`, { fetchImpl });
    const liste = Array.isArray(r) ? r : (r.results ?? []);
    tous.push(...liste);
    if (Array.isArray(r) || !r.next || liste.length === 0) break;
  }
  return tous;
}
