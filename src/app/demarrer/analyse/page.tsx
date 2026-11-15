import { Suspense } from "react";
import type { Metadata } from "next";
import { Analyse } from "./Analyse";

export const metadata: Metadata = { title: "Analyse de votre activité | Leed" };

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-[40vh]" />}>
      <Analyse />
    </Suspense>
  );
}
