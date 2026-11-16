import type { Metadata } from "next";
import { EcranConversations } from "@/components/app/ecrans/conversations";
import { chargerConversations, contexteApp } from "@/lib/app/donnees";

export const metadata: Metadata = { title: "Conversations | Leed" };

export default async function Page() {
  const ctx = await contexteApp();
  return <EcranConversations lignes={await chargerConversations(ctx)} />;
}
