import type { Metadata } from "next";
import { AdminJournal } from "@/components/admin/ecrans/exploitation";
import { chargerAdminJournal, contexteAdmin } from "@/lib/admin/donnees";

export const metadata: Metadata = { title: "Journal d'audit | Équipe Leed", robots: { index: false, follow: false } };

export default async function Page() {
  const ctx = await contexteAdmin();
  return <AdminJournal v={await chargerAdminJournal(ctx)} />;
}
