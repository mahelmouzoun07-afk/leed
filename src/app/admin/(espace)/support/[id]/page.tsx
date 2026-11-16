import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { AdminTicket } from "@/components/admin/ecrans/support";
import { chargerAdminTicket, contexteAdmin } from "@/lib/admin/donnees";

export const metadata: Metadata = { title: "Ticket | Équipe Leed", robots: { index: false, follow: false } };

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  const { id } = await params;
  const { ok, erreur } = await searchParams;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const ctx = await contexteAdmin();
  const v = await chargerAdminTicket(ctx, id);
  if (!v) notFound();
  return <AdminTicket v={v} ok={ok === "1"} erreur={erreur} />;
}
