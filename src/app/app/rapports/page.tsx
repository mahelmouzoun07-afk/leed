import type { Metadata } from "next";
import { EcranRapports } from "@/components/app/ecrans/rapports";
import { chargerRapports, contexteApp } from "@/lib/app/donnees";

export const metadata: Metadata = { title: "Rapports | Leed" };

export default async function Page() {
  const ctx = await contexteApp();
  return <EcranRapports v={await chargerRapports(ctx)} />;
}
