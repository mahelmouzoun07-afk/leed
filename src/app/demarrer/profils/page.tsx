import type { Metadata } from "next";
import { Profils } from "./Profils";

export const metadata: Metadata = { title: "Vos clients idéaux | Leed" };

export default function Page() {
  return <Profils />;
}
