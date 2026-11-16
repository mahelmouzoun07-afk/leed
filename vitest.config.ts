import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const racine = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": racine("./src"),
      // « server-only » refuse de s'importer hors du serveur Next.js : on le neutralise pour les tests.
      "server-only": racine("./tests/unit/vide.ts"),
    },
  },
  test: { environment: "node", include: ["tests/unit/**/*.test.ts"] },
});
