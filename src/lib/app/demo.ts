import "server-only";
import { cookies } from "next/headers";

/**
 * Mode démonstration : le client peut voir son tableau de bord rempli avec le jeu d'exemple de Koffi
 * (fictif), sans rien enregistrer. Un simple cookie, posé par /app/demo et retiré par /app/demo/quitter.
 */
export const COOKIE_DEMO = "leed_demo";

export async function estDemo(): Promise<boolean> {
  return (await cookies()).get(COOKIE_DEMO)?.value === "1";
}
