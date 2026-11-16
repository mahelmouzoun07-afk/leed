import type { Metadata } from "next";
import { EcranPlus } from "@/components/app/ecrans/plus";
import { contexteApp } from "@/lib/app/donnees";

export const metadata: Metadata = { title: "Plus | Leed" };

export default async function Page() {
  const ctx = await contexteApp();
  return <EcranPlus demo={ctx.demo} />;
}
