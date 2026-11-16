import { LIMITES_CANAL, type CanalRedaction } from "./prompts";

/**
 * Les contrôles faits PAR LE CODE sur un message rédigé. L'IA propose, le code décide :
 * un message n'est jamais envoyé parce que l'IA l'a jugé bon, mais parce qu'il passe ces contrôles
 * (puis la relecture d'une seconde IA). Chaque contrôle rend une raison claire, montrée à l'équipe.
 */

export type Violation = { code: string; raison: string };

const LIEN = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|bj|ci|sn|tg|ml|bf|ne|cm|ga|cg|td|fr|io|app|me|co|africa)\b)/i;
const FAUX_RE = /^\s*(re|tr|fw|fwd)\s*:/i;
const FAMILIARITE = /(suite à (notre|votre) (échange|conversation|appel|rencontre|entretien|discussion)|comme (convenu|discuté|promis|évoqué)|comme nous en avons parlé|je reviens vers vous (suite|après)|notre dernier échange|ravi de notre|as discussed|following our (call|chat|conversation))/i;
const PRESSION = /(dernière chance|derniers? jours?|aujourd'hui seulement|seulement aujourd'hui|offre (valable|limitée)|plus que \d+|urgent|ne manquez pas|dépêchez|avant qu'il soit trop tard|places limitées)/i;
const PROMESSE = /(garanti|garantie|100 ?%|sans risque|doubl\w* (vos|votre|le) |tripl\w* (vos|votre)|résultats? assurés?|satisfait ou remboursé|gratuit(ement)? à vie)/i;
const SUJETS_INTERDITS = /(religion|religieu|politique|parti politique|élections?|présidentielle|homosexu|ethnie)/i;
const CONCURRENCE = /(mieux que (vos|les) concurrents|vos concurrents (sont|font) (nuls|mauvais)|contrairement à (vos|les) concurrents)/i;
// La majuscule du prénom compte (« Bonjour, j'ai vu » n'a pas de prénom) : le premier mot est donc écrit sans l'option « i ».
const SALUT = /^\s*(?:[Bb]onjour|[Bb]onsoir|[Ss]alut|[Hh]ello|[Cc]her|[Cc]hère|[Mm]adame|[Mm]onsieur)\b[\s,]*([A-ZÀ-ÖØ-Þ][\p{L}'’-]+)?/u;
const MOTS_NEUTRES = new Set(["madame", "monsieur", "à", "tous", "toute", "l'équipe", "l’équipe", "et", "chers", "chères", "cher", "chère"]);

/** Les nombres écrits dans un texte (« 5 000 », « 25% », « 3 jours »), réduits à leurs chiffres. */
export function nombresDuTexte(texte: string): string[] {
  return (texte.match(/\d[\d\s.,]*\d|\d/g) ?? []).map((n) => n.replace(/\D/g, "")).filter(Boolean);
}

export type EntreeControle = {
  canal: CanalRedaction;
  objet: string | null;
  texte: string;
  /** Tout le texte vrai dont le message peut s'inspirer : fiche du client, accroche, faits cités. Un chiffre doit en venir. */
  sourcesVraies: string;
  /** Les prénoms réellement connus du destinataire (vide : seule la salutation neutre est permise). */
  prenomsConnus: string[];
  /** Vrai pour un premier message : pas de lien. */
  premier?: boolean;
};

export function controlerMessage(m: EntreeControle): Violation[] {
  const v: Violation[] = [];
  const ajouter = (code: string, raison: string) => v.push({ code, raison });
  const tout = `${m.objet ?? ""}\n${m.texte}`;

  const limite = LIMITES_CANAL[m.canal];
  if (m.texte.length > limite) ajouter("trop_long", `Le message fait ${m.texte.length} caractères ; ${m.canal} accepte ${limite} au plus.`);
  if (m.texte.trim().length < 40) ajouter("trop_court", "Le message est trop court pour être personnel.");
  if (m.canal === "Email" && !m.objet) ajouter("objet_manquant", "Un email a besoin d'un objet.");
  if (m.canal !== "Email" && m.objet) ajouter("objet_inattendu", "Seul l'email a un objet.");
  if (m.objet && m.objet.length > 70) ajouter("objet_trop_long", "L'objet dépasse 70 caractères.");
  if (m.objet && FAUX_RE.test(m.objet)) ajouter("faux_re", "L'objet commence par « RE: » ou « TR: » comme si la conversation existait déjà.");
  if (m.premier !== false && LIEN.test(tout)) ajouter("lien_premier_message", "Le premier message contient un lien ou une adresse de site.");
  if (FAMILIARITE.test(tout)) ajouter("fausse_familiarite", "Le message fait croire à un échange qui n'a pas eu lieu.");
  if (PRESSION.test(tout)) ajouter("pression", "Le message met une pression sur le destinataire.");
  if (PROMESSE.test(tout)) ajouter("promesse", "Le message promet un résultat ou une garantie.");
  if (SUJETS_INTERDITS.test(tout)) ajouter("sujet_interdit", "Le message touche à la politique, à la religion ou à un sujet qui divise.");
  if (CONCURRENCE.test(tout)) ajouter("critique_concurrent", "Le message critique des concurrents.");
  if (/[A-ZÀ-ÖØ-Þ]{5,}/.test(m.texte.replace(/\b(WhatsApp|LinkedIn|FCFA|SARL|PME|SAS|SA|CEO|CI)\b/g, ""))) ajouter("majuscules", "Le message contient des mots entiers en majuscules.");
  if (/!{2,}|\?{3,}/.test(m.texte)) ajouter("ponctuation", "Le message abuse des points d'exclamation ou d'interrogation.");

  // Un chiffre doit venir de la fiche du client ou des faits connus : jamais inventé.
  const permis = new Set(nombresDuTexte(m.sourcesVraies));
  const inventes = nombresDuTexte(tout).filter((n) => !permis.has(n));
  if (inventes.length > 0) ajouter("chiffre_invente", `Le message cite un chiffre qui ne vient pas de la fiche du client (${[...new Set(inventes)].slice(0, 3).join(", ")}).`);

  // Un prénom n'est utilisé que s'il est connu : sinon « Bonjour, ».
  const salut = m.texte.match(SALUT);
  const nom = salut?.[1]?.toLowerCase();
  if (nom && !MOTS_NEUTRES.has(nom) && !m.prenomsConnus.some((p) => p.toLowerCase() === nom)) ajouter("nom_inconnu", `Le message s'adresse à « ${salut?.[1]} », un nom que nous ne connaissons pas.`);

  return v;
}
