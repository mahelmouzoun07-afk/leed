import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { EcranCampagne } from "@/components/app/ecrans/campagnes";
import { chargerCampagne, contexteApp } from "@/lib/app/donnees";

export const metadata: Metadata = { title: "Campagne | Leed" };

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ onglet?: string; ok?: string }> }) {
  const { id } = await params;
  const { onglet, ok } = await searchParams;
  const ctx = await contexteApp();
  if (!ctx.demo && !z.string().uuid().safeParse(id).success) notFound();
  const v = await chargerCampagne(ctx, id);
  if (!v) notFound();
  return <EcranCampagne v={v} onglet={onglet ?? "cible"} ok={ok === "1"} />;
}
