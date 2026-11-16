/**
 * Vérifie la configuration de l'IA SANS rien dépenser (lecture de la liste des modèles, gratuite) :
 *   npm run ia:verifier
 * Lit D:\leed\.env.local. N'affiche JAMAIS la clé.
 */
const fs = require("node:fs");
const path = require("node:path");

const fichier = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(fichier)) process.loadEnvFile(fichier);

const cle = process.env.IA_CLE_API || process.env.GROQ_API_KEY || "";
const base = (process.env.IA_URL_BASE || "https://api.groq.com/openai/v1").replace(/\/$/, "");
const fort = process.env.IA_MODELE_FORT || "llama-3.3-70b-versatile";
const rapide = process.env.IA_MODELE_RAPIDE || "llama-3.1-8b-instant";

const ligne = (ok, texte) => console.log(`${ok ? "OK     " : "A FAIRE"}  ${texte}`);

(async () => {
  ligne(!!cle, cle ? "Clé de l'IA présente (IA_CLE_API ou GROQ_API_KEY)" : "Aucune clé : posez GROQ_API_KEY dans .env.local (gratuite sur console.groq.com)");
  console.log(`         Service : ${base}`);
  if (!cle) process.exit(1);

  const r = await fetch(`${base}/models`, { headers: { Authorization: `Bearer ${cle}` } });
  if (r.status === 401 || r.status === 403) {
    ligne(false, "Le service refuse la clé : elle est fausse, révoquée ou d'un autre service");
    process.exit(1);
  }
  const j = await r.json().catch(() => ({}));
  const ids = (j.data || []).map((m) => m.id);
  ligne(ids.length > 0, `${ids.length} modèles disponibles avec cette clé`);
  ligne(ids.includes(fort), `Modèle fort : ${fort}${ids.includes(fort) ? "" : " (introuvable : choisissez-en un dans la liste ci-dessous avec IA_MODELE_FORT)"}`);
  ligne(ids.includes(rapide), `Modèle rapide : ${rapide}${ids.includes(rapide) ? "" : " (introuvable : choisissez-en un avec IA_MODELE_RAPIDE)"}`);
  if (!ids.includes(fort) || !ids.includes(rapide)) console.log("         Modèles proposés : " + ids.filter((i) => !/whisper|guard|tts/i.test(i)).join(", "));
})().catch((e) => {
  console.error("ECHEC", String(e.message).split("\n")[0]);
  process.exit(1);
});
