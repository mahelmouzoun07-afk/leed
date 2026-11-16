import { notFound } from "next/navigation";

/**
 * Aperçus de développement : les écrans du tableau de bord et de l'espace équipe avec le jeu d'exemple,
 * sans connexion. Cette partie du site n'existe PAS en production.
 */
export default function Layout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "production") notFound();
  return children;
}
