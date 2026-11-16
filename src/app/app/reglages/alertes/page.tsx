import type { Metadata } from "next";
import { EcranAlertes } from "@/components/app/ecrans/reglages";
import { chargerReglages, contexteApp } from "@/lib/app/donnees";

export const metadata: Metadata = { title: "Alertes | Leed" };

export default async function Page({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const { ok } = await searchParams;
  const ctx = await contexteApp();
  return <EcranAlertes v={await chargerReglages(ctx)} ok={ok === "1"} />;
}
