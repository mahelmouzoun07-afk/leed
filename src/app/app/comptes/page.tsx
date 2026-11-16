import type { Metadata } from "next";
import { EcranComptes } from "@/components/app/ecrans/compte";
import { chargerComptes, contexteApp } from "@/lib/app/donnees";

export const metadata: Metadata = { title: "Comptes connectés | Leed" };

export default async function Page({ searchParams }: { searchParams: Promise<{ connexion?: string; debranche?: string; erreur?: string }> }) {
  const { connexion, debranche, erreur } = await searchParams;
  const ctx = await contexteApp();
  return <EcranComptes v={await chargerComptes(ctx)} connexion={connexion === "ok" ? "ok" : connexion === "echec" ? "echec" : undefined} debranche={debranche === "1"} erreur={erreur} />;
}
