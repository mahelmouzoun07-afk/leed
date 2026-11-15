"use client";

import type { ReactNode } from "react";
import { Header } from "./Header";

export function Shell({ children, footer }: { children: ReactNode; footer: ReactNode }) {
  return (
    <div className="landing flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1">{children}</main>
      {footer}
    </div>
  );
}
