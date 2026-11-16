/**
 * Ce que coûte Unipile pour un nombre de comptes connectés en même temps (docs/OFFRE-ET-PRIX.md, section 5).
 * La vraie facture suit le PIC de comptes du mois, même si certains sont débranchés ensuite : ce calcul est
 * une estimation sur le nombre de comptes actuel.
 */
export const FCFA_PAR_EURO = 656;

export function coutUnipileEuros(comptes: number): number {
  if (comptes <= 0) return 0;
  if (comptes <= 10) return 49;
  if (comptes <= 50) return comptes * 5;
  if (comptes <= 200) return comptes * 4.5;
  if (comptes <= 1000) return comptes * 4;
  if (comptes <= 5000) return comptes * 3.5;
  return comptes * 3;
}

export const coutUnipileFcfa = (comptes: number) => Math.round(coutUnipileEuros(comptes) * FCFA_PAR_EURO);
