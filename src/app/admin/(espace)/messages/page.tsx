import type { Metadata } from "next";
import { AdminMessages } from "@/components/admin/ecrans/exploitation";
import { chargerAdminMessages, contexteAdmin } from "@/lib/admin/donnees";

export const metadata: Metadata = { title: "Messages bloqués | Équipe Leed", robots: { index: false, follow: false } };

export default async function Page() {
  const ctx = await contexteAdmin();
  return <AdminMessages v={await chargerAdminMessages(ctx)} />;
}
