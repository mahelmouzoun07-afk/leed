import { Suspense } from "react";
import type { Metadata } from "next";
import { DecrireActivite } from "./DecrireActivite";

export const metadata: Metadata = { title: "Décrivez votre activité | Leed" };

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-[40vh]" />}>
      <DecrireActivite />
    </Suspense>
  );
}
