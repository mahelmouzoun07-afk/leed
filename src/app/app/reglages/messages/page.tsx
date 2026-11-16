import type { Metadata } from "next";
import { EcranMessages } from "@/components/app/ecrans/reglages";
import { chargerReglages, contexteApp } from "@/lib/app/donnees";

export const metadata: Metadata = { title: "Ce que l'agent dit | Leed" };

export default async function Page({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const { ok } = await searchParams;
  const ctx = await contexteApp();
  return <EcranMessages v={await chargerReglages(ctx)} ok={ok === "1"} />;
}
