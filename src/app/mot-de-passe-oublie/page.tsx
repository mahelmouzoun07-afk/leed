import type { Metadata } from "next";
import { MotDePasseOublie } from "./MotDePasseOublie";

export const metadata: Metadata = { title: "Mot de passe oublié | Leed" };

export default function Page() {
  return <MotDePasseOublie />;
}
