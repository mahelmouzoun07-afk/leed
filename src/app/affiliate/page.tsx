import type { Metadata } from "next";
import { AffiliatePage } from "./AffiliatePage";
import { BRAND } from "@/components/data";

export const metadata: Metadata = { title: `Affiliate program — ${BRAND}` };

export default function Page() {
  return <AffiliatePage />;
}
