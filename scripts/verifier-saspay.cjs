/**
 * Vérifie la configuration SasPay SANS dépenser un franc : lecture seulement (liste des opérateurs).
 *   npm run paiement:verifier
 * Lit D:\leed\.env.local. N'affiche JAMAIS la clé ni le secret : seulement si elles sont présentes et de quel type.
 */
const fs = require("node:fs");
const path = require("node:path");

const fichier = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(fichier)) process.loadEnvFile(fichier);

const cle = process.env.SASPAY_API_KEY || "";
const secret = process.env.SASPAY_WEBHOOK_SECRET || "";
const url = process.env.APP_URL || "";

const ligne = (ok, texte) => console.log(`${ok ? "OK    " : "A FAIRE"}  ${texte}`);
const reel = cle.startsWith("sk_live_");
const test = cle.startsWith("sk_test_");

ligne(!!cle && (reel || test), cle ? `SASPAY_API_KEY présente (${reel ? "clé RÉELLE : de vrais paiements" : test ? "clé de TEST : bac à sable" : "préfixe inattendu"})` : "SASPAY_API_KEY absente dans .env.local");
ligne(!!secret, secret ? "SASPAY_WEBHOOK_SECRET présent" : "SASPAY_WEBHOOK_SECRET absent : le webhook sera refusé (503)");
ligne(!!url, url ? `APP_URL = ${url}` : "APP_URL absente");
if (url) console.log(`         Adresse du webhook à déclarer chez SasPay : ${url.replace(/\/$/, "")}/api/webhooks/saspay`);

(async () => {
  if (!cle) process.exit(1);
  const base = test ? "https://sandbox-api.saspay.me/api/v1" : "https://api.saspay.me/api/v1";
  const pays = ["BJ", "SN", "CI", "TG", "ML", "BF", "NE", "CM"];
  const tous = [];
  for (let page = 1; page <= 5; page++) {
    const r = await fetch(`${base}/networks/?page=${page}&page_size=100`, { headers: { Authorization: `Bearer ${cle}`, Accept: "application/json" } });
    if (r.status === 401) {
      ligne(false, "SasPay refuse la clé (401) : elle est fausse, révoquée ou d'un autre environnement");
      process.exit(1);
    }
    const j = await r.json().catch(() => ({}));
    const corps = j.data ?? j;
    const liste = Array.isArray(corps) ? corps : (corps.results ?? []);
    tous.push(...liste);
    if (Array.isArray(corps) || !corps.next || liste.length === 0) break;
  }
  ligne(tous.length > 0, `${tous.length} opérateurs lus chez SasPay`);
  for (const p of pays) {
    const noms = tous.filter((n) => n.is_active !== false && String(n.code).toLowerCase().endsWith("_" + p.toLowerCase())).map((n) => n.name || n.code);
    console.log(`         ${p} : ${noms.length ? noms.join(", ") : "aucun opérateur"}`);
  }
})().catch((e) => {
  console.error("ECHEC", String(e.message).split("\n")[0]);
  process.exit(1);
});
