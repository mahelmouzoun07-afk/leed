import { Suspense } from "react";
import type { Metadata } from "next";
import { StartFlow } from "./StartFlow";
import { BRAND } from "@/components/data";

export const metadata: Metadata = { title: `Finding your leads — ${BRAND}` };

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <StartFlow />
    </Suspense>
  );
}
