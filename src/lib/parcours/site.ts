/** Nettoie ce que le visiteur a collé et renvoie le nom de domaine, ou null si ce n'est pas une adresse. */
export function normaliserSite(v: string): string | null {
  const s = v.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/?#\s]/)[0];
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(s) ? s : null;
}
