import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_DEMO } from "@/lib/app/demo";
import { env } from "@/lib/env";

/** Active le mode démonstration (le proxy a déjà exigé d'être connecté). */
export async function GET(requete: NextRequest) {
  const base = (env().APP_URL ?? requete.nextUrl.origin).replace(/\/$/, "");
  const reponse = NextResponse.redirect(`${base}/app`);
  reponse.cookies.set(COOKIE_DEMO, "1", { path: "/app", httpOnly: true, sameSite: "lax", secure: base.startsWith("https"), maxAge: 60 * 60 * 6 });
  return reponse;
}
