import type { Metadata } from "next";
import { Simulateur } from "@/components/app/ecrans/Simulateur";
import { chargerSimulateur, contexteApp } from "@/lib/app/donnees";

export const metadata: Metadata = { title: "Nouvelle campagne | Leed" };

export default async function Page() {
  const ctx = await contexteApp();
  return <Simulateur v={await chargerSimulateur(ctx)} />;
}
