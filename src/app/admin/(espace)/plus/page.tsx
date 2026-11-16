import type { Metadata } from "next";
import { AdminPlus } from "@/components/admin/ecrans/exploitation";
import { contexteAdmin } from "@/lib/admin/donnees";

export const metadata: Metadata = { title: "Plus | Équipe Leed", robots: { index: false, follow: false } };

export default async function Page() {
  await contexteAdmin();
  return <AdminPlus />;
}
