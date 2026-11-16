import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { log } from "@/lib/journal";
import { traiterEvenement } from "@/lib/canaux/service";

/**
 * Messages automatiques d'Unipile : état d'un compte (bon, à rebrancher, suspendu) et messages reçus.
 * Adresse déclarée chez Unipile par la page « Unipile » de l'espace équipe :
 *   https://<votre-site>/api/webhooks/unipile
 *
 * Unipile n'a pas de signature : il ajoute à chaque appel l'en-tête secret `Unipile-Auth` (UNIPILE_WEBHOOK_SECRET), comparé en temps constant.
 * Il réessaie 5 fois si on ne répond pas 200 en moins de 30 secondes : on répond 200 pour tout ce qu'on ne comprend pas,
 * et 500 seulement pour une panne de notre base (pour qu'il réessaie). Le contenu des messages n'est jamais gardé ici.
 */
export const dynamic = "force-dynamic";

const TAILLE_MAX = 1_000_000;

export async function POST(requete: NextRequest) {
  if (!env().UNIPILE_WEBHOOK_SECRET) {
    log.error("canaux.webhook_sans_secret", {});
    return NextResponse.json({ ok: false }, { status: 503 });
  }
  const brut = await requete.text();
  if (brut.length > TAILLE_MAX) return NextResponse.json({ ok: false }, { status: 413 });

  let corps: unknown = null;
  try {
    corps = brut ? JSON.parse(brut) : null;
  } catch {
    corps = null;
  }
  const r = await traiterEvenement({ entete: requete.headers.get("unipile-auth"), corps });
  if (r.http === 401) log.warn("canaux.webhook_refuse", {});
  return NextResponse.json({ ok: r.http === 200, resultat: r.resultat }, { status: r.http });
}
