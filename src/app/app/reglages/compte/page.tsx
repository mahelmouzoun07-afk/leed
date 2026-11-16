import type { Metadata } from "next";
import { EcranCompte } from "@/components/app/ecrans/reglages";
import { chargerReglages, contexteApp } from "@/lib/app/donnees";

export const metadata: Metadata = { title: "Mon compte | Leed" };

export default async function Page() {
  const ctx = await contexteApp();
  return <EcranCompte v={await chargerReglages(ctx)} />;
}
