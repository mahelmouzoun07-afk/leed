import type { Metadata } from "next";
import { AdminCodesPromo } from "@/components/admin/ecrans/promo";
import { chargerAdminCodesPromo, contexteAdmin } from "@/lib/admin/donnees";

export const metadata: Metadata = { title: "Codes promo | Équipe Leed", robots: { index: false, follow: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string; nouveau?: string }> }) {
  const { ok, erreur, nouveau } = await searchParams;
  const ctx = await contexteAdmin();
  // Le code affiché après la création ne vient que de l'adresse : on le revérifie (8 à 12 lettres ou chiffres) avant de l'afficher.
  const code = nouveau && /^[A-Za-z0-9]{8,12}$/.test(nouveau) ? nouveau.toUpperCase() : undefined;
  return <AdminCodesPromo v={await chargerAdminCodesPromo(ctx)} ok={ok === "1"} erreur={erreur} nouveau={code} />;
}
