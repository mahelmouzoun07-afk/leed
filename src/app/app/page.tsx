import type { Metadata } from "next";
import { EcranAccueil } from "@/components/app/ecrans/accueil";
import { chargerAccueil, contexteApp } from "@/lib/app/donnees";

export const metadata: Metadata = { title: "Accueil | Leed" };

export default async function Page() {
  const ctx = await contexteApp();
  return <EcranAccueil v={await chargerAccueil(ctx)} />;
}
