/**
 * Barème du forfait : source unique, issue de docs/OFFRE-ET-PRIX.md.
 * Tout écran qui parle de prix, de comptes ou de rythme passe par ici.
 */
export const MONTANT_MIN = 5000;
export const MONTANT_MAX = 150000;
export const MONTANT_PAR_DEFAUT = 25000;
export const PRIX_DE_BASE = 250;

type Palier = {
  min: number;
  prix: number;
  comptes: number | "tous";
  parJour: number;
  cibles: number | "illimitees";
};

export const PALIERS: readonly Palier[] = [
  { min: 5000, prix: 250, comptes: 1, parJour: 5, cibles: 1 },
  { min: 10000, prix: 250, comptes: 2, parJour: 10, cibles: 2 },
  { min: 25000, prix: 225, comptes: 3, parJour: 20, cibles: 3 },
  { min: 50000, prix: 200, comptes: "tous", parJour: 40, cibles: "illimitees" },
  { min: 100000, prix: 175, comptes: "tous", parJour: 40, cibles: "illimitees" },
];

export function formaterFcfa(n: number): string {
  return n.toLocaleString("fr-FR").replace(/[  ]/g, " ");
}

export function palierPour(fcfa: number): Palier {
  let courant = PALIERS[0];
  for (const p of PALIERS) if (fcfa >= p.min) courant = p;
  return courant;
}

export function bareme(fcfa: number) {
  const p = palierPour(fcfa);
  return {
    prix: p.prix,
    comptes: p.comptes === "tous" ? "Tous" : String(p.comptes),
    parJour: p.parJour,
    entreprises: Math.floor(fcfa / p.prix),
    palier: p,
  };
}

/** Ce que le client gagne par rapport au prix de base, en FCFA (0 au palier de base). */
export function economie(fcfa: number): number {
  const { entreprises } = bareme(fcfa);
  return Math.max(0, entreprises * PRIX_DE_BASE - fcfa);
}

/** La marche suivante à afficher sous le montant, ou null au dernier palier. */
export function marcheSuivante(fcfa: number): string | null {
  const suivant = PALIERS.find((p) => p.min > fcfa);
  if (!suivant) return null;
  const actuel = palierPour(fcfa);
  const ajout = suivant.min - fcfa;
  const morceaux: string[] = [];
  if (suivant.prix !== actuel.prix) morceaux.push(`${suivant.prix} FCFA l'entreprise`);
  if (suivant.comptes !== actuel.comptes) morceaux.push(suivant.comptes === "tous" ? "tous vos comptes" : `${suivant.comptes} comptes`);
  if (suivant.parJour !== actuel.parJour) morceaux.push(`${suivant.parJour} entreprises par jour`);
  const liste = morceaux.length > 1 ? `${morceaux.slice(0, -1).join(", ")} et ${morceaux[morceaux.length - 1]}` : morceaux[0] ?? "plus de vitesse";
  return `Ajoutez ${formaterFcfa(ajout)} FCFA : vous passez à ${liste}.`;
}

/* Position du curseur (0 à 100) -> montant. Le curseur démarre sur 25 000 FCFA (position 50). */
const POINTS: [number, number][] = [
  [0, 5000],
  [25, 10000],
  [50, 25000],
  [75, 50000],
  [100, 150000],
];

export function montantDepuisPosition(pos: number): number {
  for (let i = 1; i < POINTS.length; i++) {
    const [p0, v0] = POINTS[i - 1];
    const [p1, v1] = POINTS[i];
    if (pos <= p1) {
      const v = v0 + ((pos - p0) / (p1 - p0)) * (v1 - v0);
      return v < 25000 ? Math.round(v / 1000) * 1000 : Math.round(v / 5000) * 5000;
    }
  }
  return MONTANT_MAX;
}
