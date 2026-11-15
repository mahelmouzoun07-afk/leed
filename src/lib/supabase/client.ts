"use client";

import { createBrowserClient } from "@supabase/ssr";
import { exigerEnvPublic } from "../env-public";

/** Client Supabase pour un composant client. Les cookies sont gérés seuls. */
export function creerClientNavigateur() {
  return createBrowserClient(
    exigerEnvPublic("NEXT_PUBLIC_SUPABASE_URL"),
    exigerEnvPublic("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );
}
