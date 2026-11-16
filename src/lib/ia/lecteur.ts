import "server-only";
import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import { log } from "../journal";
import { echec, succes, type Resultat } from "../resultat";

/**
 * Le lecteur de sites. Il va chercher les pages publiques d'une entreprise pour que l'IA les lise.
 * Comme le visiteur choisit l'adresse, c'est un point d'attaque classique (SSRF : faire lire au serveur une adresse
 * interne, comme la base de données ou les métadonnées du fournisseur). Protections :
 *  - http et https seulement, ports 80 et 443 seulement, pas d'identifiants dans l'adresse ;
 *  - AUCUNE adresse interne : privée, locale, réservée (vérifié sur la résolution DNS à l'instant même de la connexion,
 *    donc un nom qui change de cible entre deux vérifications ne passe pas) ;
 *  - redirections suivies à la main (3 au plus), chacune revérifiée ;
 *  - délai court, taille limitée, seulement du HTML ;
 *  - robots.txt respecté.
 */

export const AGENT = "leedbot/1.0 (+https://leed-nine.vercel.app)";
const DELAI_MS = 8_000;
const TAILLE_MAX = 600_000;
const REDIRECTIONS_MAX = 3;
const TEXTE_PAR_PAGE = 3_500;
const TEXTE_TOTAL = 7_000;
const PAGES_UTILES = /(a-propos|apropos|about|qui-sommes|notre-histoire|services?|prestations?|produits?|offres?|solutions?|activites?|realisations?|contact|nos-)/i;

// ───── Adresses interdites ───────────────────────────────────────────────

/** Vrai si l'adresse IP est interne, privée, locale ou réservée. Inconnue = interdite. */
export function adresseInterdite(ip: string): boolean {
  const v = net.isIP(ip);
  if (v === 4) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0) ||
      (a === 198 && (b === 18 || b === 19))
    );
  }
  if (v === 6) {
    const s = ip.toLowerCase();
    const mappee = s.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mappee) return adresseInterdite(mappee[1]);
    return s === "::" || s === "::1" || s.startsWith("fc") || s.startsWith("fd") || /^fe[89ab]/.test(s) || s.startsWith("ff") || s.startsWith("64:ff9b") || s.startsWith("2001:db8");
  }
  return true;
}

/** Contrôle l'adresse d'une page AVANT de l'ouvrir. Renvoie la raison du refus, ou null si elle est acceptable. */
export function refuserUrl(url: URL): string | null {
  if (url.protocol !== "http:" && url.protocol !== "https:") return "protocole";
  if (url.username || url.password) return "identifiants";
  if (url.port && url.port !== "80" && url.port !== "443") return "port";
  const h = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal") || h.endsWith(".lan") || !h.includes(".") && net.isIP(h) === 0) return "nom_interne";
  if (net.isIP(h) !== 0 && adresseInterdite(h)) return "adresse_interne";
  return null;
}

/** Résolution DNS qui refuse toute adresse interne, au moment même de la connexion. */
const resoudreSur: typeof dns.lookup = ((hote: string, options: dns.LookupOptions | number | undefined, rappel: (...a: unknown[]) => void) => {
  const opts = typeof options === "object" && options ? options : {};
  dns.lookup(hote, { ...opts, all: true }, (erreur, adresses) => {
    if (erreur) return rappel(erreur);
    const liste = adresses as dns.LookupAddress[];
    if (liste.length === 0 || liste.some((a) => adresseInterdite(a.address))) return rappel(new Error("adresse_interne"));
    if (opts.all) return rappel(null, liste);
    return rappel(null, liste[0].address, liste[0].family);
  });
}) as typeof dns.lookup;

// ───── Une page, en sécurité ─────────────────────────────────────────────

type Page = { url: string; statut: number; type: string; corps: string };

function ouvrir(url: URL): Promise<Page & { lieu: string | null }> {
  return new Promise((resolve, reject) => {
    const moteur = url.protocol === "https:" ? https : http;
    const req = moteur.request(
      url,
      { method: "GET", lookup: resoudreSur, timeout: DELAI_MS, headers: { "User-Agent": AGENT, Accept: "text/html,application/xhtml+xml,text/plain;q=0.8", "Accept-Language": "fr,en;q=0.7" } },
      (res) => {
        const lieu = res.headers.location ?? null;
        const type = String(res.headers["content-type"] ?? "");
        const statut = res.statusCode ?? 0;
        if (lieu || statut >= 300 || !/text\/(html|plain)|application\/xhtml/i.test(type)) {
          res.resume();
          return resolve({ url: url.href, statut, type, corps: "", lieu });
        }
        const morceaux: Buffer[] = [];
        let taille = 0;
        res.on("data", (m: Buffer) => {
          taille += m.length;
          if (taille > TAILLE_MAX) {
            res.destroy();
            return;
          }
          morceaux.push(m);
        });
        const fin = () => resolve({ url: url.href, statut, type, corps: Buffer.concat(morceaux).toString("utf8"), lieu: null });
        res.on("end", fin);
        res.on("close", fin);
        res.on("error", reject);
      },
    );
    req.on("timeout", () => req.destroy(new Error("delai")));
    req.on("error", reject);
    req.end();
  });
}

/** Ouvre une page en suivant au plus 3 redirections, chacune revérifiée. Renvoie null si impossible ou interdit. */
export async function recupererPage(adresse: string): Promise<Page | null> {
  let courante: URL;
  try {
    courante = new URL(adresse);
  } catch {
    return null;
  }
  for (let i = 0; i <= REDIRECTIONS_MAX; i++) {
    const refus = refuserUrl(courante);
    if (refus) {
      log.warn("lecteur.refuse", { raison: refus });
      return null;
    }
    try {
      const p = await ouvrir(courante);
      if (p.lieu) {
        courante = new URL(p.lieu, courante);
        continue;
      }
      return p;
    } catch (e) {
      log.info("lecteur.echec", { raison: e instanceof Error ? e.message.slice(0, 60) : "inconnue" });
      return null;
    }
  }
  return null;
}

// ───── robots.txt ────────────────────────────────────────────────────────

/** Dit si le robots.txt autorise notre agent à lire ce chemin (règle la plus précise gagne ; en cas d'égalité, on autorise). */
export function robotsAutorise(robots: string, chemin: string): boolean {
  const regles: { chemin: string; permis: boolean }[] = [];
  let groupeActuel = false;
  let dansUnGroupe = false;
  for (const brute of robots.split(/\r?\n/)) {
    const ligne = brute.replace(/#.*/, "").trim();
    const m = ligne.match(/^([a-z-]+)\s*:\s*(.*)$/i);
    if (!m) continue;
    const cle = m[1].toLowerCase();
    const valeur = m[2].trim();
    if (cle === "user-agent") {
      const nom = valeur.toLowerCase();
      if (!dansUnGroupe) groupeActuel = false;
      if (nom === "*" || "leedbot".startsWith(nom) && nom.length > 0) groupeActuel = true;
      dansUnGroupe = true;
    } else if (cle === "allow" || cle === "disallow") {
      dansUnGroupe = false;
      if (groupeActuel && valeur !== "") regles.push({ chemin: valeur, permis: cle === "allow" });
    }
  }
  let meilleure: { longueur: number; permis: boolean } | null = null;
  for (const r of regles) {
    const motif = r.chemin.replace(/\*/g, ".*").replace(/\$$/, "$");
    const echape = motif.replace(/[.+?^{}()|[\]\\]/g, "\\$&").replace(/\\\.\*/g, ".*");
    let correspond = false;
    try {
      correspond = new RegExp("^" + echape).test(chemin);
    } catch {
      correspond = false;
    }
    if (correspond && (!meilleure || r.chemin.length > meilleure.longueur || (r.chemin.length === meilleure.longueur && r.permis))) meilleure = { longueur: r.chemin.length, permis: r.permis };
  }
  return meilleure ? meilleure.permis : true;
}

// ───── Du HTML au texte ──────────────────────────────────────────────────

const ENTITES: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&apos;": "'", "&nbsp;": " ", "&eacute;": "é", "&egrave;": "è", "&agrave;": "à", "&ecirc;": "ê", "&ccedil;": "ç", "&rsquo;": "'" };

export function htmlEnTexte(html: string): { titre: string; description: string; texte: string } {
  const titre = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").trim();
  const description = (html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1] ?? html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i)?.[1] ?? "").trim();
  const texte = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|svg|template|iframe|head)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/(p|div|li|h[1-6]|tr|section|article|br)>|<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;|&#\d+;/gi, (e) => ENTITES[e.toLowerCase()] ?? " ")
    .replace(/[ \t\f\v ]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
  const nettoye = (s: string) => s.replace(/&[a-z]+;|&#\d+;/gi, (e) => ENTITES[e.toLowerCase()] ?? " ").replace(/\s+/g, " ").trim();
  return { titre: nettoye(titre), description: nettoye(description), texte };
}

/** Les liens de la page qui mènent à une page utile (présentation, services, contact) du MÊME site. */
export function liensUtiles(html: string, base: URL, max = 2): string[] {
  const trouves: string[] = [];
  for (const m of html.matchAll(/<a\s[^>]*href=["']([^"'#]+)["']/gi)) {
    try {
      const u = new URL(m[1], base);
      if (u.hostname.replace(/^www\./, "") !== base.hostname.replace(/^www\./, "")) continue;
      if (!PAGES_UTILES.test(u.pathname) || /\.(pdf|jpe?g|png|gif|webp|zip|docx?|xlsx?)$/i.test(u.pathname)) continue;
      u.hash = "";
      if (u.pathname === base.pathname || trouves.includes(u.href)) continue;
      trouves.push(u.href);
    } catch {
      /* lien mal formé : ignoré */
    }
  }
  return trouves.slice(0, max);
}

// ───── Le site entier (accueil + deux pages utiles) ──────────────────────

export type SiteLu = { domaine: string; pages: { url: string; titre: string }[]; texte: string };

export async function lireSite(domaine: string): Promise<Resultat<SiteLu>> {
  const inaccessible = () => echec<SiteLu>("Nous n'avons pas pu ouvrir ce site. Vérifiez l'adresse, ou décrivez votre activité à la place.", "site_inaccessible");

  let accueil: Page | null = null;
  let base: URL | null = null;
  for (const protocole of ["https", "http"]) {
    const url = new URL(`${protocole}://${domaine}/`);
    if (refuserUrl(url)) return inaccessible();
    const p = await recupererPage(url.href);
    if (p && p.statut >= 200 && p.statut < 300 && p.corps) {
      accueil = p;
      base = new URL(p.url);
      break;
    }
  }
  if (!accueil || !base) return inaccessible();

  // robots.txt : s'il interdit l'accueil à notre agent, on s'arrête là, sans rien lire.
  const robots = await recupererPage(new URL("/robots.txt", base).href);
  const regles = robots && robots.statut >= 200 && robots.statut < 300 ? robots.corps : robots && robots.statut >= 500 ? "User-agent: *\nDisallow: /" : "";
  if (!robotsAutorise(regles, base.pathname || "/")) {
    return echec("Ce site demande aux robots de ne pas le lire. Décrivez votre activité à la place.", "site_interdit_aux_robots");
  }

  const pages = [{ url: accueil.url, ...htmlEnTexte(accueil.corps) }];
  for (const lien of liensUtiles(accueil.corps, base)) {
    const u = new URL(lien);
    if (!robotsAutorise(regles, u.pathname)) continue;
    const p = await recupererPage(lien);
    if (p && p.statut >= 200 && p.statut < 300 && p.corps) pages.push({ url: p.url, ...htmlEnTexte(p.corps) });
  }

  let texte = "";
  for (const p of pages) {
    const bloc = [p.titre && `Titre : ${p.titre}`, p.description && `Description : ${p.description}`, p.texte.slice(0, TEXTE_PAR_PAGE)].filter(Boolean).join("\n");
    texte += `\n--- ${p.url} ---\n${bloc}\n`;
    if (texte.length >= TEXTE_TOTAL) break;
  }
  texte = texte.trim().slice(0, TEXTE_TOTAL);
  // Une page vide (site fait en JavaScript pur, ou presque sans texte) ne donne rien à lire.
  if (texte.replace(/---[^\n]*---/g, "").replace(/\s/g, "").length < 120) {
    return echec("Nous n'avons presque rien pu lire sur ce site. Décrivez votre activité à la place.", "site_sans_texte");
  }
  return succes({ domaine, pages: pages.map((p) => ({ url: p.url, titre: p.titre })), texte });
}
