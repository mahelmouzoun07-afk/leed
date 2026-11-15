/**
 * `Resultat<T>` : façon uniforme de renvoyer un succès ou une erreur depuis
 * une Server Action ou une fonction métier, sans lancer d'exception.
 * Le message d'erreur est en français : il peut être montré au client.
 */
export type Resultat<T> =
  | { ok: true; donnees: T }
  | { ok: false; erreur: string; code?: string };

export function succes<T>(donnees: T): Resultat<T> {
  return { ok: true, donnees };
}

export function echec<T = never>(erreur: string, code?: string): Resultat<T> {
  return { ok: false, erreur, code };
}

export function estSucces<T>(r: Resultat<T>): r is { ok: true; donnees: T } {
  return r.ok;
}

export function estEchec<T>(r: Resultat<T>): r is { ok: false; erreur: string; code?: string } {
  return !r.ok;
}
