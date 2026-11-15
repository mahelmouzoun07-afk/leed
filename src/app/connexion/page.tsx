import type { Metadata } from "next";
import { Connexion } from "./Connexion";

export const metadata: Metadata = { title: "Connexion | Leed" };

export default function Page() {
  return <Connexion />;
}
