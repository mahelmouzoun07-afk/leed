import type { Metadata } from "next";
import { AdminAccueil } from "@/components/admin/ecrans/clients";
import { chargerAdminAccueil, contexteAdmin } from "@/lib/admin/donnees";

export const metadata: Metadata = { title: "Accueil | Équipe Leed", robots: { index: false, follow: false } };

export default async function Page() {
  const ctx = await contexteAdmin();
  return <AdminAccueil v={await chargerAdminAccueil(ctx)} />;
}
