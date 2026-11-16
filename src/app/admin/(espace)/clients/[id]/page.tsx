import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { AdminClient } from "@/components/admin/ecrans/clients";
import { chargerAdminClient, contexteAdmin } from "@/lib/admin/donnees";

export const metadata: Metadata = { title: "Fiche client | Équipe Leed", robots: { index: false, follow: false } };

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  const { id } = await params;
  const { ok, erreur } = await searchParams;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const ctx = await contexteAdmin();
  const v = await chargerAdminClient(ctx, id);
  if (!v) notFound();
  return <AdminClient v={v} role={ctx.role} ok={ok === "1"} erreur={erreur} />;
}
