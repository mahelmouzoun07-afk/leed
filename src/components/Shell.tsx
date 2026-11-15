"use client";

import type { ReactNode } from "react";
import { UIProvider } from "./ui";
import { Header } from "./Header";
import { Overlays } from "./Overlays";

export function Shell({ children, footer }: { children: ReactNode; footer: ReactNode }) {
  return (
    <UIProvider render={(s) => <Overlays {...s} />}>
      <div className="landing flex min-h-screen flex-col bg-background text-foreground">
        <Header />
        <main className="flex-1">{children}</main>
        {footer}
      </div>
    </UIProvider>
  );
}
