import type { Metadata } from "next";
import { AdminPaiements } from "@/components/admin/ecrans/exploitation";
import { chargerAdminPaiements, contexteAdmin } from "@/lib/admin/donnees";

export const metadata: Metadata = { title: "Paiements | Équipe Leed", robots: { index: false, follow: false } };

export default async function Page() {
  const ctx = await contexteAdmin();
  return <AdminPaiements v={await chargerAdminPaiements(ctx)} />;
}
