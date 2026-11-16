import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { EcranProspect } from "@/components/app/ecrans/prospects";
import { chargerProspect, contexteApp } from "@/lib/app/donnees";

export const metadata: Metadata = { title: "Fiche prospect | Leed" };

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string }> }) {
  const { id } = await params;
  const { ok } = await searchParams;
  const ctx = await contexteApp();
  const brut = ctx.demo ? "00000000-0000-4000-8000-000000000000" : id;
  if (!z.string().uuid().safeParse(brut).success) notFound();
  const v = await chargerProspect(ctx, brut);
  if (!v) notFound();
  return <EcranProspect v={v} ok={ok === "1"} />;
}
