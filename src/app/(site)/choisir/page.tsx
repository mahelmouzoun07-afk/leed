import type { Metadata } from "next";
import { Choisir } from "./Choisir";

export const metadata: Metadata = { title: "Essai gratuit ou forfait | Leed" };

export default function Page() {
  return <Choisir />;
}
