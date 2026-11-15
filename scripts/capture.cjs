/**
 * Capture une page à plusieurs largeurs, pour la regarder avant de la montrer.
 *
 *   node scripts/capture.cjs <url> <nom> [largeurs]
 *   node scripts/capture.cjs http://localhost:3100/ accueil 1440,390
 *
 * Les images vont dans captures/<nom>-<largeur>.png (dossier ignoré par git).
 * Utilise le Chromium de Playwright le plus récent présent sur la machine,
 * même si ce n'est pas exactement la version attendue par le paquet.
 */
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

function trouverChromium() {
  const base = path.join(process.env.LOCALAPPDATA || "", "ms-playwright");
  if (!fs.existsSync(base)) return undefined;
  const versions = fs
    .readdirSync(base)
    .filter((d) => /^chromium-\d+$/.test(d))
    .filter((d) => fs.existsSync(path.join(base, d, "INSTALLATION_COMPLETE")))
    .sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1]));
  for (const v of versions) {
    const exe = path.join(base, v, "chrome-win64", "chrome.exe");
    if (fs.existsSync(exe)) return exe;
  }
  return undefined;
}

async function main() {
  const [url, nom = "page", largeursBrutes = "1440,390"] = process.argv.slice(2);
  if (!url) {
    console.error("Usage : node scripts/capture.cjs <url> <nom> [largeurs]");
    process.exit(1);
  }
  const largeurs = largeursBrutes.split(",").map(Number).filter(Boolean);
  const dossier = path.join(process.cwd(), "captures");
  fs.mkdirSync(dossier, { recursive: true });

  const navigateur = await chromium.launch({ executablePath: trouverChromium() });
  for (const largeur of largeurs) {
    const page = await navigateur.newPage({
      viewport: { width: largeur, height: largeur < 600 ? 844 : 900 },
      deviceScaleFactor: 1,
    });
    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    // Fait défiler toute la page pour déclencher les apparitions au défilement.
    await page.evaluate(async () => {
      const pas = window.innerHeight;
      for (let y = 0; y < document.body.scrollHeight; y += pas) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(400);
    const fichier = path.join(dossier, `${nom}-${largeur}.png`);
    await page.screenshot({ path: fichier, fullPage: true });
    console.log("capture :", fichier);
    await page.close();
  }
  await navigateur.close();
}

main().catch((e) => {
  console.error("Échec de la capture :", e.message.split("\n")[0]);
  process.exit(1);
});
