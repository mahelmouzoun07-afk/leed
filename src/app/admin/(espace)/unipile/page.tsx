import type { Metadata } from "next";
import { AdminUnipile } from "@/components/admin/ecrans/unipile";
import { chargerAdminUnipile, contexteAdmin } from "@/lib/admin/donnees";

export const metadata: Metadata = { title: "Unipile | Équipe Leed", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string; info?: string }> }) {
  const { ok, erreur, info } = await searchParams;
  const ctx = await contexteAdmin();
  return <AdminUnipile v={await chargerAdminUnipile(ctx)} ok={ok === "1"} erreur={erreur} info={info} />;
}
