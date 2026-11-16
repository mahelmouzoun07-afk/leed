import type { Metadata } from "next";
import { AdminAnnuaire } from "@/components/admin/ecrans/exploitation";
import { chargerAdminAnnuaire, contexteAdmin } from "@/lib/admin/donnees";

export const metadata: Metadata = { title: "Annuaire | Équipe Leed", robots: { index: false, follow: false } };

export default async function Page() {
  const ctx = await contexteAdmin();
  return <AdminAnnuaire v={await chargerAdminAnnuaire(ctx)} />;
}
