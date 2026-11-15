import type { Metadata } from "next";
import { PricingPage } from "./PricingPage";
import { BRAND } from "@/components/data";

export const metadata: Metadata = { title: `Pricing | ${BRAND}` };

export default function Page() {
  return <PricingPage />;
}
