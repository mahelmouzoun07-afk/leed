import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { SuiviPaiement } from "@/components/app/ecrans/SuiviPaiement";
import { contexteApp } from "@/lib/app/donnees";

export const metadata: Metadata = { title: "Votre paiement | Leed" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const ctx = await contexteApp();
  const { data } = await ctx.sb.from("paiements").select("id, montant_fcfa, montant_forfait_fcfa, statut").eq("id", id).eq("entreprise_id", ctx.entrepriseId).maybeSingle();
  if (!data) notFound();
  return <SuiviPaiement id={data.id} montant={data.montant_forfait_fcfa ?? data.montant_fcfa} offert={data.montant_fcfa === 0} initial={data.statut === "reussi" ? "reussi" : data.statut === "echoue" ? "echoue" : "en_attente"} />;
}
