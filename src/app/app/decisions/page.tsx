import type { Metadata } from "next";
import { EcranDecisions } from "@/components/app/ecrans/decisions";
import { chargerDecisions, contexteApp } from "@/lib/app/donnees";

export const metadata: Metadata = { title: "Décisions | Leed" };

export default async function Page({ searchParams }: { searchParams: Promise<{ tab?: string; ok?: string }> }) {
  const { tab, ok } = await searchParams;
  const ctx = await contexteApp();
  const repondues = tab === "repondues";
  return <EcranDecisions decisions={await chargerDecisions(ctx, repondues)} repondues={repondues} ok={ok === "1"} />;
}
