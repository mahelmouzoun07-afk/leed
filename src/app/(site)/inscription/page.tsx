import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Inscription } from "./Inscription";
import { destinationApresConnexion, utilisateurCourant } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Créer mon compte | Leed" };

export default async function Page() {
  const user = await utilisateurCourant();
  if (user) redirect(await destinationApresConnexion(user));
  return <Inscription googleActif={process.env.NEXT_PUBLIC_GOOGLE_ACTIF === "true"} />;
}
