/**
 * Journal minimal : une ligne JSON par événement, sur la sortie standard.
 * On branchera un vrai outil de suivi plus tard. Ne jamais y écrire de secret
 * ni de donnée personnelle complète (tronquer ou hacher).
 */
export type NiveauJournal = "debug" | "info" | "warn" | "error";

const RANG: Record<NiveauJournal, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function seuil(): number {
  const brut = process.env.NIVEAU_JOURNAL?.toLowerCase();
  if (brut === "debug" || brut === "info" || brut === "warn" || brut === "error") return RANG[brut];
  return process.env.NODE_ENV === "production" ? RANG.info : RANG.debug;
}

export function journal(niveau: NiveauJournal, message: string, contexte?: Record<string, unknown>): void {
  if (RANG[niveau] < seuil()) return;
  const ligne = JSON.stringify({
    horodatage: new Date().toISOString(),
    niveau,
    message,
    ...(contexte ? { contexte } : {}),
  });
  if (niveau === "error") console.error(ligne);
  else if (niveau === "warn") console.warn(ligne);
  else console.log(ligne);
}

export const log = {
  debug: (m: string, c?: Record<string, unknown>) => journal("debug", m, c),
  info: (m: string, c?: Record<string, unknown>) => journal("info", m, c),
  warn: (m: string, c?: Record<string, unknown>) => journal("warn", m, c),
  error: (m: string, c?: Record<string, unknown>) => journal("error", m, c),
};
