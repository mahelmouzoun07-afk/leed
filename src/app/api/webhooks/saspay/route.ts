import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { log } from "@/lib/journal";
import { creerClientAdmin } from "@/lib/supabase/admin";
import { confirmerPaiement } from "@/lib/paiement/service";
import { verifierWebhook } from "@/lib/paiement/webhook";

/**
 * Messages (« webhooks ») envoyés par SasPay. Adresse à déclarer dans leur tableau de bord (section Développeur) :
 *   https://<votre-site>/api/webhooks/saspay
 *
 * Règles : signature et âge vérifiés sur le CORPS BRUT ; on ne fait pas confiance au contenu du message : il sert
 * seulement à retrouver le paiement, dont l'état est ensuite VÉRIFIÉ directement auprès de SasPay.
 * Un message peut arriver plusieurs fois : le traitement est rejouable.
 */
export const dynamic = "force-dynamic";

export async function POST(requete: NextRequest) {
  const secret = env().SASPAY_WEBHOOK_SECRET;
  if (!secret) {
    log.error("paiement.webhook_sans_secret", {});
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  const corps = await requete.text();
  const verdict = verifierWebhook({ corps, signature: requete.headers.get("x-webhook-signature"), horodatage: requete.headers.get("x-webhook-timestamp"), secret });
  if (verdict !== "ok") {
    log.warn("paiement.webhook_refuse", { verdict });
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let message: { event?: string; data?: { id?: string } } = {};
  try {
    message = JSON.parse(corps);
  } catch {
    return NextResponse.json({ ok: true, ignore: "corps_illisible" });
  }

  if (message.event?.startsWith("transaction.") && message.data?.id) {
    const { data: p } = await creerClientAdmin().from("paiements").select("id").eq("prestataire", "saspay").eq("reference_prestataire", message.data.id).maybeSingle();
    if (p) {
      try {
        await confirmerPaiement(p.id);
      } catch (e) {
        // On répond quand même 200 : la page de suivi du client et le bouton « Revérifier » reprendront la vérification.
        log.error("paiement.webhook_verification_echec", { paiement: p.id, erreur: e instanceof Error ? e.message : String(e) });
      }
    }
  }
  return NextResponse.json({ ok: true });
}
