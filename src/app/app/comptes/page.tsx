import type { Metadata } from "next";
import { EcranComptes } from "@/components/app/ecrans/compte";
import { chargerComptes, contexteApp } from "@/lib/app/donnees";

export const metadata: Metadata = { title: "Comptes connectés | Leed" };

export default async function Page() {
  const ctx = await contexteApp();
  return <EcranComptes v={await chargerComptes(ctx)} />;
}
