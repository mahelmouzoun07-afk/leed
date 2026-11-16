import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { log } from "@/lib/journal";
import { traiterRetourConnexion } from "@/lib/canaux/service";

/**
 * Le retour d'Unipile quand un client a relié son compte (« notify_url » de la connexion hébergée).
 * L'adresse porte l'identifiant du lien et sa signature : sans elles, l'appel est refusé. Le compte annoncé est ensuite relu
 * chez Unipile avec notre clé avant d'être enregistré ; refusé (pas de forfait payant, limite atteinte), il est supprimé chez Unipile.
 */
export const dynamic = "force-dynamic";

export async function POST(requete: NextRequest) {
  if (!env().UNIPILE_WEBHOOK_SECRET) return NextResponse.json({ ok: false }, { status: 503 });
  const brut = await requete.text();
  if (brut.length > 100_000) return NextResponse.json({ ok: false }, { status: 413 });
  let corps: unknown = null;
  try {
    corps = brut ? JSON.parse(brut) : null;
  } catch {
    corps = null;
  }
  const url = new URL(requete.url);
  const r = await traiterRetourConnexion({ lienId: url.searchParams.get("l"), signature: url.searchParams.get("s"), corps });
  if (r.http === 401) log.warn("canaux.retour_signature_fausse", {});
  return NextResponse.json(r.corps, { status: r.http });
}
