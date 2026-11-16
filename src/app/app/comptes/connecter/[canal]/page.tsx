import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ConnecterCompte } from "@/components/app/ecrans/connecter";
import { contexteApp } from "@/lib/app/donnees";
import { creerClientAdmin } from "@/lib/supabase/admin";
import { messagePourRefus } from "@/lib/canaux/service";
import { estCanal } from "@/lib/canaux/types";

export const metadata: Metadata = { title: "Connecter un compte | Leed" };

export default async function Page({ params, searchParams }: { params: Promise<{ canal: string }>; searchParams: Promise<{ erreur?: string; rebrancher?: string }> }) {
  const { canal } = await params;
  const { erreur, rebrancher } = await searchParams;
  if (!estCanal(canal)) notFound();
  const ctx = await contexteApp();
  const rebranche = rebrancher && z.string().uuid().safeParse(rebrancher).success ? rebrancher : undefined;

  // On dit tout de suite au client s'il ne peut pas connecter (pas de forfait payant, limite atteinte), avant de lui faire lire l'avertissement.
  let refus: string | undefined;
  if (!ctx.demo && !rebranche) {
    const { data } = await creerClientAdmin().rpc("verifier_branchement", { p_entreprise: ctx.entrepriseId, p_canal: canal });
    if (data !== "ok") refus = String(data ?? "refus");
  }
  return <ConnecterCompte canal={canal} rebrancher={rebranche} erreur={erreur} refus={refus ? { code: refus, message: messagePourRefus(refus) } : undefined} demo={ctx.demo} />;
}
