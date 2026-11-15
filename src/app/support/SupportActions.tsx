"use client";

import { MessageCircle } from "lucide-react";
import { BRAND_LOWER } from "@/components/data";

export function SupportActions() {
  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={() => document.querySelector<HTMLButtonElement>('button[aria-label="Open support chat"]')?.click()}
        className="cta-primary inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-medium"
      >
        <MessageCircle className="size-4" />
        Chat with support
      </button>
      <a href={`mailto:support@${BRAND_LOWER}.example`} className="inline-flex items-center justify-center rounded-xl border border-border px-5 py-3 font-medium text-foreground">
        Email support
      </a>
    </div>
  );
}
