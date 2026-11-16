import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { VerificationAdmin } from "./VerificationAdmin";
import { roleAdmin, utilisateurCourant } from "@/lib/auth/session";
import { creerClientServeur } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Vérification | Leed", robots: { index: false, follow: false } };

export default async function Page() {
  const user = await utilisateurCourant();
  if (!user) redirect("/admin/connexion/");
  if (!(await roleAdmin(user))) notFound();

  const supabase = await creerClientServeur();
  const { data: niveau } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (niveau?.currentLevel === "aal2") redirect("/admin/");

  // Un facteur déjà validé : on demande seulement le code. Sinon : première activation (QR code).
  const { data: facteurs } = await supabase.auth.mfa.listFactors();
  const facteurValide = facteurs?.totp?.[0]?.id ?? null;
  return <VerificationAdmin facteurId={facteurValide} />;
}
