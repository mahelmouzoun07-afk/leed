import type { Metadata } from "next";
import { ConnexionAdmin } from "./ConnexionAdmin";

export const metadata: Metadata = { title: "Équipe | Leed", robots: { index: false, follow: false } };

export default function Page() {
  return <ConnexionAdmin />;
}
