import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_DEMO } from "@/lib/app/demo";
import { env } from "@/lib/env";

/** Quitte le mode démonstration. */
export async function GET(requete: NextRequest) {
  const base = (env().APP_URL ?? requete.nextUrl.origin).replace(/\/$/, "");
  const reponse = NextResponse.redirect(`${base}/app`);
  reponse.cookies.set(COOKIE_DEMO, "", { path: "/app", maxAge: 0 });
  return reponse;
}
