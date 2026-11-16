/**
 * Capture tous les écrans d'aperçu (/dev/app/* et /dev/admin/*) en téléphone et en bureau, dans captures/.
 *   node scripts/apercus.cjs http://localhost:3100 [app|admin] [largeurs]
 * Les routes /dev n'existent qu'en développement.
 */
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const APP = ["accueil", "accueil-vide", "decisions", "decisions-repondues", "decisions-vide", "prospects", "prospects-vide", "prospect", "prospect-masque", "conversations", "conversations-vide", "conversation", "campagnes", "campagnes-vide", "campagne", "simulateur", "simulateur-sans-donnees", "rapports", "rapports-vide", "comptes", "forfait", "forfait-vide", "recharge", "recharge-pays-non-pris", "paiement-reussi", "paiement-echoue", "reglages", "activite", "messages", "autonomie", "alertes", "horaires", "exclusions", "compte", "plus", "whatsapp"];
const ADMIN = ["accueil", "accueil-vide", "clients", "clients-vide", "client", "comptes", "comptes-vide", "annuaire", "annuaire-vide", "messages", "paiements", "couts", "support", "ticket", "journal", "plus"];

function trouverChromium() {
  const base = path.join(process.env.LOCALAPPDATA || "", "ms-playwright");
  const versions = fs.readdirSync(base).filter((d) => /^chromium-\d+$/.test(d) && fs.existsSync(path.join(base, d, "INSTALLATION_COMPLETE"))).sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1]));
  return path.join(base, versions[0], "chrome-win64", "chrome.exe");
}

(async () => {
  const url = process.argv[2] || "http://localhost:3100";
  const quoi = process.argv[3] || "app";
  const largeurs = (process.argv[4] || "390").split(",").map(Number);
  const liste = quoi === "admin" ? ADMIN : APP;
  const dossier = path.join(__dirname, "..", "captures");
  fs.mkdirSync(dossier, { recursive: true });
  const nav = await chromium.launch({ executablePath: trouverChromium() });
  const erreurs = [];
  for (const l of largeurs) {
    const page = await nav.newPage({ viewport: { width: l, height: 800 } });
    page.on("pageerror", (e) => erreurs.push(`${l}: ${e}`));
    page.on("console", (m) => m.type() === "error" && erreurs.push(`${l}: ${m.text().slice(0, 140)}`));
    for (const e of liste) {
      const r = await page.goto(`${url}/dev/${quoi}/${e}`, { waitUntil: "networkidle" });
      if (!r || r.status() !== 200) erreurs.push(`${l}: /dev/${quoi}/${e} -> ${r && r.status()}`);
      await page.screenshot({ path: path.join(dossier, `d-${quoi}-${e}-${l}.png`), fullPage: true });
      // pas de défilement horizontal de la page
      const debord = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      if (debord) erreurs.push(`${l}: /dev/${quoi}/${e} déborde horizontalement`);
    }
    await page.close();
  }
  console.log(erreurs.length ? "PROBLEMES :\n" + [...new Set(erreurs)].join("\n") : "OK : aucun problème détecté");
  await nav.close();
})().catch((e) => {
  console.error("ECHEC", String(e.message).split("\n")[0]);
  process.exit(1);
});
