import type { Metadata } from "next";
import { EcranActivite } from "@/components/app/ecrans/reglages";
import { chargerReglages, contexteApp } from "@/lib/app/donnees";

export const metadata: Metadata = { title: "Mon activité | Leed" };

export default async function Page() {
  const ctx = await contexteApp();
  return <EcranActivite v={await chargerReglages(ctx)} />;
}
