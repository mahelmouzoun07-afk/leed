import type { Metadata } from "next";
import { EcranForfait } from "@/components/app/ecrans/compte";
import { chargerForfait, contexteApp } from "@/lib/app/donnees";

export const metadata: Metadata = { title: "Forfait | Leed" };

export default async function Page() {
  const ctx = await contexteApp();
  return <EcranForfait v={await chargerForfait(ctx)} />;
}
