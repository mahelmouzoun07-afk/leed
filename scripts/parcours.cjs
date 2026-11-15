/**
 * Parcourt le site comme un visiteur (accueil -> choix de l'offre) et capture chaque écran.
 *   node scripts/parcours.cjs http://localhost:3100 [largeur]
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
  const largeur = Number(process.argv[3] || 390);
  const dossier = path.join(__dirname, "..", "captures");
  fs.mkdirSync(dossier, { recursive: true });
  const nav = await chromium.launch({ executablePath: trouverChromium() });
  const page = await nav.newPage({ viewport: { width: largeur, height: 800 } });
  const erreurs = [];
  page.on("pageerror", (e) => erreurs.push(String(e)));
  page.on("console", (m) => m.type() === "error" && erreurs.push(m.text()));
  const photo = async (nom) => page.screenshot({ path: path.join(dossier, `p-${nom}-${largeur}.png`), fullPage: true });

  await page.goto(url + "/");
  await page.fill("#hero-website-input", "studiokoffi.bj");
  await page.keyboard.press("Enter");
  console.log("photo 1");
  await page.waitForFunction((p) => location.pathname.includes(p), "demarrer/analyse", { timeout: 20000 }).catch(async (e) => { console.error("URL actuelle:", page.url()); await photo("echec"); throw e; });
  await page.waitForSelector("text=Voici ce que Leed a", { timeout: 15000 });
  console.log("photo 2");
  await photo("1-analyse");
  await page.click("text=C'est bien ça, continuer");
  console.log("photo 3");
  await page.waitForFunction((p) => location.pathname.includes(p), "demarrer/questions", { timeout: 20000 }).catch(async (e) => { console.error("URL actuelle:", page.url()); await photo("echec"); throw e; });
  console.log("photo 4");
  await photo("2-questions");
  for (const t of ["Oui, toujours", "Des rendez-vous"]) await page.click(`role=radio[name="${t}"]`);
  await page.click("text=Continuer");
  console.log("photo 5");
  await page.waitForFunction((p) => location.pathname.includes(p), "demarrer/profils", { timeout: 20000 }).catch(async (e) => { console.error("URL actuelle:", page.url()); await photo("echec"); throw e; });
  await page.waitForSelector("text=Boutiques de mode");
  console.log("photo 6");
  await photo("3-profils");
  await page.click("text=Chercher ces entreprises");
  await page.waitForURL((u) => u.pathname.includes("demarrer/apercu"), { timeout: 15000 });
  await page.waitForSelector("text=Par où les joindre");
  console.log("photo 7");
  await photo("4-apercu");
  await page.click("text=Créer mon compte pour commencer");
  console.log("photo 8");
  await page.waitForFunction((p) => location.pathname.includes(p), "inscription", { timeout: 20000 }).catch(async (e) => { console.error("URL actuelle:", page.url()); await photo("echec"); throw e; });
  await page.getByRole("button", { name: /Créer mon compte/ }).click({ force: true });
  console.log("photo 9");
  await photo("5-inscription-erreurs");
  await page.fill("#prenom", "Koffi Adjovi");
  await page.fill("#entreprise", "Studio Koffi");
  await page.fill("#email", "koffi@exemple.com");
  await page.fill("#motDePasse", "motdepasse1");
  await page.fill("#whatsapp", "+229 01 23 45 67 89");
  await page.locator("input[type=checkbox]").check({ force: true });
  await page.getByRole("button", { name: /Créer mon compte/ }).click({ force: true });
  console.log("photo 10");
  await page.waitForFunction((p) => location.pathname.includes(p), "choisir", { timeout: 20000 }).catch(async (e) => { console.error("URL actuelle:", page.url()); await photo("echec"); throw e; });
  await page.waitForSelector("text=Payer et commencer");
  console.log("photo 11");
  await photo("6-choisir");
  await page.getByRole("button", { name: /Payer et commencer/ }).click({ force: true });
  await page.waitForSelector("text=Aucun paiement n'a été pris");
  console.log("photo 12");
  await photo("7-fin");
  console.log("OK. Erreurs console :", erreurs.length ? erreurs : "aucune");
  await nav.close();
})().catch((e) => { console.error("ECHEC", String(e.message).split("\n")[0]); process.exit(1); });
