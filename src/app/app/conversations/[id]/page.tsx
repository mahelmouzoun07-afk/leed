import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { EcranConversation } from "@/components/app/ecrans/conversations";
import { chargerConversation, contexteApp } from "@/lib/app/donnees";

export const metadata: Metadata = { title: "Conversation | Leed" };

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string }> }) {
  const { id } = await params;
  const { ok } = await searchParams;
  const ctx = await contexteApp();
  if (!ctx.demo && !z.string().uuid().safeParse(id).success) notFound();
  const v = await chargerConversation(ctx, id);
  if (!v) notFound();
  return <EcranConversation v={v} ok={ok === "1"} />;
}
