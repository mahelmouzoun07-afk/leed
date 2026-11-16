import type { Metadata } from "next";
import { EcranProspects } from "@/components/app/ecrans/prospects";
import { chargerProspects, contexteApp } from "@/lib/app/donnees";

export const metadata: Metadata = { title: "Prospects | Leed" };

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; statut?: string; canal?: string; ville?: string }> }) {
  const f = await searchParams;
  const ctx = await contexteApp();
  return <EcranProspects v={await chargerProspects(ctx, f)} />;
}
