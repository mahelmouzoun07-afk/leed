import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Les options `cacheComponents` et `partialPrefetching` (ajoutées par défaut à
  // la création du projet) obligent chaque page qui lit l'adresse ou la session
  // à être enveloppée dans un bloc d'attente. Les pages reprises du format
  // d'Explee n'ont pas été écrites ainsi : on les retire. À réactiver plus
  // tard, page par page, si on veut ce mode de cache.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
