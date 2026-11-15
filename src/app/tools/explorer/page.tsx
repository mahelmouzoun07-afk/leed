import { Suspense } from "react";
import type { Metadata } from "next";
import { Explorer } from "./Explorer";
import { BRAND } from "@/components/data";

export const metadata: Metadata = { title: `Segments Explorer — ${BRAND}` };

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <Explorer />
    </Suspense>
  );
}
