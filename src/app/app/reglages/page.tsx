import type { Metadata } from "next";
import { EcranReglages } from "@/components/app/ecrans/reglages";
import { chargerReglages, contexteApp } from "@/lib/app/donnees";

export const metadata: Metadata = { title: "Réglages | Leed" };

export default async function Page() {
  const ctx = await contexteApp();
  return <EcranReglages v={await chargerReglages(ctx)} />;
}
