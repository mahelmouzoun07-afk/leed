import type { Metadata } from "next";
import { Recherche } from "./Recherche";

export const metadata: Metadata = { title: "Recherche de vos clients | Leed" };

export default function Page() {
  return <Recherche />;
}
