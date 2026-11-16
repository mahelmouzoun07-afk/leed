/**
 * Vérifie que la barre de navigation du bas colle bien au bas de l'écran du téléphone (position fixe réelle),
 * sur un écran de l'espace client et un de l'espace équipe.
 *   node scripts/verifier-nav.cjs http://localhost:3100
 */
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

function trouverChromium() {
  const base = path.join(process.env.LOCALAPPDATA || "", "ms-playwright");
  const versions = fs.readdirSync(base).filter((d) => /^chromium-\d+$/.test(d) && fs.existsSync(path.join(base, d, "INSTALLATION_COMPLETE"))).sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1]));
  return path.join(base, versions[0], "chrome-win64", "chrome.exe");
}

(async () => {
  const url = process.argv[2] || "http://localhost:3100";
  const nav = await chromium.launch({ executablePath: trouverChromium() });
  const page = await nav.newPage({ viewport: { width: 390, height: 800 } });
  let echec = false;
  for (const chemin of ["/dev/app/accueil", "/dev/app/decisions", "/dev/admin/accueil", "/dev/admin/clients"]) {
    await page.goto(url + chemin, { waitUntil: "networkidle" });
    await page.mouse.wheel(0, 400); // même après un défilement, la barre doit rester en bas
    await page.waitForTimeout(200);
    const r = await page.evaluate(() => {
      const barre = [...document.querySelectorAll("nav")].find((n) => getComputedStyle(n).position === "fixed");
      if (!barre) return null;
      const b = barre.getBoundingClientRect();
      return { bas: Math.round(b.bottom), haut: Math.round(b.top), hauteurEcran: window.innerHeight };
    });
    const ok = r && Math.abs(r.bas - r.hauteurEcran) <= 1;
    if (!ok) echec = true;
    console.log(`${ok ? "OK    " : "ECHEC "} ${chemin} : ${r ? `barre de ${r.haut} à ${r.bas} px (écran ${r.hauteurEcran} px)` : "aucune barre fixe trouvée"}`);
  }
  await page.screenshot({ path: path.join(__dirname, "..", "captures", "nav-bas-390.png") });
  await nav.close();
  process.exit(echec ? 1 : 0);
})().catch((e) => {
  console.error("ECHEC", String(e.message).split("\n")[0]);
  process.exit(1);
});
