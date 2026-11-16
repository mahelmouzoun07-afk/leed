import type { Metadata } from "next";
import { AdminClients } from "@/components/admin/ecrans/clients";
import { chargerAdminClients, contexteAdmin } from "@/lib/admin/donnees";

export const metadata: Metadata = { title: "Clients | Équipe Leed", robots: { index: false, follow: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; etat?: string }> }) {
  const { q, etat } = await searchParams;
  const ctx = await contexteAdmin();
  return <AdminClients clients={await chargerAdminClients(ctx)} q={q ?? ""} etat={etat ?? ""} />;
}
