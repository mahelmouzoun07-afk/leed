import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Connexion } from "./Connexion";
import { destinationApresConnexion, utilisateurCourant } from "@/lib/auth/session";
import { cheminRetourSur } from "@/lib/auth/redirection";

export const metadata: Metadata = { title: "Connexion | Leed" };

export default async function Page({ searchParams }: { searchParams: Promise<{ retour?: string; erreur?: string }> }) {
  const { retour, erreur } = await searchParams;
  const user = await utilisateurCourant();
  if (user) redirect(await destinationApresConnexion(user, retour));
  return <Connexion retour={cheminRetourSur(retour) ?? ""} erreur={erreur ?? ""} googleActif={process.env.NEXT_PUBLIC_GOOGLE_ACTIF === "true"} />;
}
