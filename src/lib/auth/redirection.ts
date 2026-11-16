/**
 * Une adresse de retour (« retour=/app/… ») ne doit jamais renvoyer hors du site :
 * sinon un lien piégé pourrait envoyer le client sur une fausse page de connexion.
 * On n'accepte qu'un chemin du site, qui commence par une seule barre oblique.
 */
export function cheminRetourSur(valeur: string | null | undefined, parDefaut: string | null = null): string | null {
  if (!valeur) return parDefaut;
  if (!valeur.startsWith("/") || valeur.startsWith("//") || valeur.startsWith("/\\")) return parDefaut;
  if (/[\u0000-\u001f]/.test(valeur)) return parDefaut;
  return valeur;
}
