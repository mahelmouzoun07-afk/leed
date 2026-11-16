import type { Metadata } from "next";
import { EcranWhatsapp } from "@/components/app/ecrans/plus";

export const metadata: Metadata = { title: "Piloter depuis WhatsApp | Leed" };

export default function Page() {
  return <EcranWhatsapp />;
}
