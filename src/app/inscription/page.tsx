import type { Metadata } from "next";
import { Inscription } from "./Inscription";

export const metadata: Metadata = { title: "Créer mon compte | Leed" };

export default function Page() {
  return <Inscription />;
}
