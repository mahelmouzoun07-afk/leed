import type { Metadata } from "next";
import { EcranHoraires } from "@/components/app/ecrans/reglages";

export const metadata: Metadata = { title: "Horaires et agenda | Leed" };

export default function Page() {
  return <EcranHoraires />;
}
