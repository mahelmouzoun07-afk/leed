import type { Metadata } from "next";
import { Recharge } from "@/components/app/ecrans/Recharge";
import { chargerForfait, contexteApp } from "@/lib/app/donnees";

export const metadata: Metadata = { title: "Recharger | Leed" };

export default async function Page() {
  const ctx = await contexteApp();
  const f = (await chargerForfait(ctx)).forfait;
  return <Recharge restantes={f?.restantes ?? 0} avantLaFin={f?.statut === "actif"} />;
}
