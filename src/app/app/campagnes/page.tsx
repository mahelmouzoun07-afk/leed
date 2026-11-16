import type { Metadata } from "next";
import { EcranCampagnes } from "@/components/app/ecrans/campagnes";
import { chargerCampagnes, contexteApp } from "@/lib/app/donnees";

export const metadata: Metadata = { title: "Campagnes | Leed" };

export default async function Page({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const { ok } = await searchParams;
  const ctx = await contexteApp();
  return <EcranCampagnes lignes={await chargerCampagnes(ctx)} ok={ok === "1"} />;
}
