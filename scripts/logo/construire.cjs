/**
 * Construit les concepts de logo « leed » en SVG géométrique, puis une planche
 * de comparaison (grande taille, 64 / 32 / 16 px, version inversée).
 *
 *   node scripts/logo/construire.cjs
 *
 * Méthode : skill logo-design (kaankiziltug/logo-design-skill) — noir d'abord,
 * peu de points, angles exacts, lettres construites en formes et non en texte.
 */
const fs = require("node:fs");
const path = require("node:path");

// Grille : hauteur d'x 140, ascendante 180, graisse 32, ligne de base à y=216.
const S = 32; // épaisseur des fûts
const R = 54; // rayon de l'axe des rondes (extérieur 70, intérieur 38)
const BASE = 216;
const CY = BASE - 70;
const HAUT = BASE - 180;
const BARRE = 26; // horizontales un peu plus fines (correction optique)
const ANGLE = (38 * Math.PI) / 180; // ouverture du « e »

const f = (n) => Number(n.toFixed(2));

function lettreE(cx, encre, avecBarre = true) {
  const ex = f(cx + R * Math.cos(ANGLE));
  const ey = f(CY + R * Math.sin(ANGLE));
  const arc = `<path d="M${cx + R} ${CY} A${R} ${R} 0 1 0 ${ex} ${ey}" fill="none" stroke="${encre}" stroke-width="${S}"/>`;
  const barre = avecBarre
    ? `<path d="M${cx - R} ${CY} H${cx + R + S / 2}" fill="none" stroke="${encre}" stroke-width="${BARRE}"/>`
    : "";
  return arc + barre;
}

function motLeed({ encre = "#111111", lien = null, disque = null, variante = "A" }) {
  const xl = 0;
  const e1 = 32 + 20 + 70;
  const e2 = e1 + 140 + 12;
  const d = e2 + 140 + 12;
  let s = "";
  // l
  s += `<rect x="${xl}" y="${HAUT}" width="${S}" height="${BASE - HAUT}" fill="${encre}"/>`;
  if (variante === "A") {
    // Les deux « e » partagent une seule barre : le fil qui relie deux personnes.
    s += lettreE(e1, encre, false) + lettreE(e2, encre, false);
    s += `<path d="M${e1 - R} ${CY} H${e2 + R + S / 2}" fill="none" stroke="${lien || encre}" stroke-width="${BARRE}"/>`;
  } else {
    s += lettreE(e1, encre) + lettreE(e2, encre);
  }
  // d
  if (variante === "C") {
    s += `<circle cx="${d}" cy="${CY}" r="70" fill="${disque || encre}"/>`;
  } else {
    s += `<circle cx="${d}" cy="${CY}" r="${R}" fill="none" stroke="${encre}" stroke-width="${S}"/>`;
  }
  s += `<rect x="${d + 70 - S}" y="${HAUT}" width="${S}" height="${BASE - HAUT}" fill="${encre}"/>`;
  return { contenu: s, largeur: d + 70 };
}

/** Symbole B : un L dont le pied s'est détaché en point — le chemin jusqu'au contact. */
function symboleL({ encre = "#111111", point = null }) {
  const w = 44;
  const x = 74;
  const haut = 40;
  const bas = 216;
  const r = w / 2;
  return (
    `<rect x="${x}" y="${haut}" width="${w}" height="${bas - haut}" fill="${encre}"/>` +
    `<circle cx="${x + w + 34 + r}" cy="${bas - r}" r="${r}" fill="${point || encre}"/>`
  );
}

function svg(contenu, largeur, hauteur = 256, marge = 16, fond = null) {
  const W = largeur + marge * 2;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${hauteur}" role="img" aria-label="leed">` +
    (fond ? `<rect width="${W}" height="${hauteur}" fill="${fond}"/>` : "") +
    `<g transform="translate(${marge} 0)">${contenu}</g></svg>`
  );
}

const sortie = path.join(process.cwd(), "captures", "logo");
fs.mkdirSync(sortie, { recursive: true });

const NOIR = "#111111";
const INDIGO = "#2A2E8C";
const SAFRAN = "#F4A51C";

const concepts = [
  {
    id: "a",
    nom: "A — Le fil",
    idee: "Les deux « e » partagent une seule barre : le fil de la conversation entre vous et votre client.",
    noir: () => { const m = motLeed({ variante: "A" }); return svg(m.contenu, m.largeur); },
    couleur: () => { const m = motLeed({ variante: "A", lien: INDIGO }); return svg(m.contenu, m.largeur); },
    inverse: () => { const m = motLeed({ variante: "A", encre: "#FFFFFF", lien: SAFRAN }); return svg(m.contenu, m.largeur, 256, 16, NOIR); },
  },
  {
    id: "b",
    nom: "B — Le point de contact",
    idee: "Un L dont le pied devient un point : le chemin que Leed parcourt jusqu'au prospect.",
    noir: () => svg(symboleL({}), 224, 256, 16),
    couleur: () => svg(symboleL({ encre: INDIGO, point: SAFRAN }), 224, 256, 16),
    inverse: () => svg(symboleL({ encre: "#FFFFFF", point: SAFRAN }), 224, 256, 16, NOIR),
  },
  {
    id: "c",
    nom: "C — La cible pleine",
    idee: "Le « d » final est un disque plein : le point d'arrivée, le client trouvé.",
    noir: () => { const m = motLeed({ variante: "C" }); return svg(m.contenu, m.largeur); },
    couleur: () => { const m = motLeed({ variante: "C", disque: SAFRAN }); return svg(m.contenu, m.largeur); },
    inverse: () => { const m = motLeed({ variante: "C", encre: "#FFFFFF", disque: SAFRAN }); return svg(m.contenu, m.largeur, 256, 16, NOIR); },
  },
];

for (const c of concepts) {
  fs.writeFileSync(path.join(sortie, `concept-${c.id}-noir.svg`), c.noir());
  fs.writeFileSync(path.join(sortie, `concept-${c.id}-couleur.svg`), c.couleur());
  fs.writeFileSync(path.join(sortie, `concept-${c.id}-inverse.svg`), c.inverse());
}

const bloc = (c) => `
  <section>
    <h2>${c.nom}</h2><p>${c.idee}</p>
    <div class="rang">
      <div class="grand">${c.noir()}</div>
      <div class="grand">${c.couleur()}</div>
      <div class="grand nuit">${c.inverse()}</div>
    </div>
    <div class="tailles">
      <span class="t" style="height:64px">${c.noir()}</span>
      <span class="t" style="height:32px">${c.noir()}</span>
      <span class="t" style="height:16px">${c.noir()}</span>
      <span class="etq">64 · 32 · 16 px</span>
    </div>
  </section>`;

fs.writeFileSync(
  path.join(sortie, "planche.html"),
  `<!doctype html><meta charset="utf-8"><title>Concepts leed</title>
<style>
 body{font:15px/1.5 system-ui,sans-serif;margin:32px;color:#111;background:#fff}
 h2{font-size:18px;margin:0 0 2px} p{margin:0 0 14px;color:#555;max-width:70ch}
 section{padding:22px 0;border-top:1px solid #e5e5e5}
 .rang{display:flex;gap:16px;align-items:center}
 .grand{flex:1;border:1px solid #e5e5e5;border-radius:10px;padding:18px;display:flex;justify-content:center}
 .grand svg{height:110px;width:auto}
 .nuit{background:#111;border-color:#111;padding:0;overflow:hidden}
 .nuit svg{height:146px}
 .tailles{display:flex;align-items:flex-end;gap:22px;margin-top:16px}
 .t{display:inline-flex} .t svg{height:100%;width:auto}
 .etq{color:#888;font-size:12px}
</style>
<h1 style="font-size:22px;margin:0 0 6px">leed — trois concepts</h1>
<p>Noir, couleur, inversé ; puis les vraies petites tailles.</p>
${concepts.map(bloc).join("")}`,
);
console.log("planche :", path.join(sortie, "planche.html"));
