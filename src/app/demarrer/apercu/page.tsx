import type { Metadata } from "next";
import { Apercu } from "./Apercu";

export const metadata: Metadata = { title: "Vos futurs clients | Leed" };

export default function Page() {
  return <Apercu />;
}
