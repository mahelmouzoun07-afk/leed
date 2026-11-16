import type { Metadata } from "next";
import { AdminCouts } from "@/components/admin/ecrans/exploitation";
import { chargerAdminCouts, contexteAdmin } from "@/lib/admin/donnees";

export const metadata: Metadata = { title: "Coûts et marges | Équipe Leed", robots: { index: false, follow: false } };

export default async function Page() {
  const ctx = await contexteAdmin();
  return <AdminCouts v={await chargerAdminCouts(ctx)} />;
}
