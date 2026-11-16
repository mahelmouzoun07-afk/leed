import type { Metadata } from "next";
import { EcranAutonomie } from "@/components/app/ecrans/reglages";
import { chargerReglages, contexteApp } from "@/lib/app/donnees";

export const metadata: Metadata = { title: "Autonomie | Leed" };

export default async function Page({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const { ok } = await searchParams;
  const ctx = await contexteApp();
  return <EcranAutonomie v={await chargerReglages(ctx)} ok={ok === "1"} />;
}
