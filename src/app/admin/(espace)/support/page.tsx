import type { Metadata } from "next";
import { AdminSupport } from "@/components/admin/ecrans/support";
import { chargerAdminTickets, contexteAdmin } from "@/lib/admin/donnees";

export const metadata: Metadata = { title: "Support | Équipe Leed", robots: { index: false, follow: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const ctx = await contexteAdmin();
  const resolus = tab === "resolus";
  return <AdminSupport tickets={await chargerAdminTickets(ctx, resolus ? "resolus" : "ouverts")} resolus={resolus} />;
}
