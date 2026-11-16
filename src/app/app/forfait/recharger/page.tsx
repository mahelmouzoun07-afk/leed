import type { Metadata } from "next";
import { Recharge } from "@/components/app/ecrans/Recharge";
import { chargerForfait, contexteApp } from "@/lib/app/donnees";
import { reseauxPourPays } from "@/lib/paiement/service";
import { MONTANT_MIN } from "@/lib/forfait";
import { MONTANT_MAX_PAIEMENT } from "@/lib/paiement/reseaux";

export const metadata: Metadata = { title: "Recharger | Leed" };

export default async function Page({ searchParams }: { searchParams: Promise<{ montant?: string }> }) {
  const { montant } = await searchParams;
  const ctx = await contexteApp();
  const f = (await chargerForfait(ctx)).forfait;
  const demandé = Number(montant);
  const montantInitial = Number.isInteger(demandé) && demandé >= MONTANT_MIN && demandé <= MONTANT_MAX_PAIEMENT ? demandé : undefined;

  let pays: string | null = null;
  let reseaux = null;
  if (ctx.demo) {
    pays = "BJ";
    reseaux = [{ code: "mtn_bj", nom: "MTN MoMo" }, { code: "moov_bj", nom: "Moov Money" }];
  } else {
    const { data } = await ctx.sb.from("entreprises").select("pays").eq("id", ctx.entrepriseId).maybeSingle();
    pays = data?.pays ?? null;
    reseaux = pays ? await reseauxPourPays(pays) : [];
  }
  return <Recharge restantes={f?.restantes ?? 0} avantLaFin={f?.statut === "actif"} reseaux={reseaux} pays={pays} montantInitial={montantInitial} demo={ctx.demo} />;
}
