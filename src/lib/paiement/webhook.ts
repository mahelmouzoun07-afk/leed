import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Vérification d'un message (« webhook ») de SasPay, dans l'ordre exigé par leur documentation :
 *  1. l'horodatage (secondes Unix, en-tête X-Webhook-Timestamp) ne doit pas s'écarter de plus de 300 s de l'heure du serveur ;
 *  2. la signature (X-Webhook-Signature, HMAC SHA-256 en hexadécimal) est recalculée sur `horodatage.corps`, avec le
 *     CORPS BRUT reçu (jamais un corps re-sérialisé), et comparée en temps constant.
 */
export const TOLERANCE_SECONDES = 300;

export type VerdictWebhook = "ok" | "signature_absente" | "horodatage_invalide" | "trop_ancien" | "signature_fausse";

export function verifierWebhook(args: { corps: string; signature: string | null; horodatage: string | null; secret: string; maintenant?: number }): VerdictWebhook {
  const { corps, signature, horodatage, secret } = args;
  if (!signature || !horodatage) return "signature_absente";
  const t = Number(horodatage);
  if (!Number.isInteger(t)) return "horodatage_invalide";
  const maintenant = args.maintenant ?? Date.now();
  if (Math.abs(maintenant / 1000 - t) > TOLERANCE_SECONDES) return "trop_ancien";

  const attendue = createHmac("sha256", secret).update(`${horodatage}.${corps}`).digest("hex");
  const recue = signature.trim().toLowerCase();
  const a = Buffer.from(attendue, "utf8");
  const b = Buffer.from(recue, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return "signature_fausse";
  return "ok";
}
