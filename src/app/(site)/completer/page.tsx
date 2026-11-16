import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Completer } from "./Completer";
import { entrepriseDe, exigerUtilisateur } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Votre entreprise | Leed" };

export default async function Page() {
  const user = await exigerUtilisateur("/completer/");
  if (await entrepriseDe(user)) redirect("/choisir/");
  return <Completer />;
}
