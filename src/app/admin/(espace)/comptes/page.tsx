import type { Metadata } from "next";
import { AdminComptes } from "@/components/admin/ecrans/exploitation";
import { chargerAdminComptes, contexteAdmin } from "@/lib/admin/donnees";

export const metadata: Metadata = { title: "Santé des comptes | Équipe Leed", robots: { index: false, follow: false } };

export default async function Page() {
  const ctx = await contexteAdmin();
  return <AdminComptes v={await chargerAdminComptes(ctx)} />;
}
