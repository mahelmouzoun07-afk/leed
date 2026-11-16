import type { Metadata } from "next";
import { Reinitialiser } from "./Reinitialiser";
import { exigerUtilisateur } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Nouveau mot de passe | Leed" };

export default async function Page() {
  await exigerUtilisateur("/reinitialiser/");
  return <Reinitialiser />;
}
