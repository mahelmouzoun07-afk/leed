import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { creerClientServeur } from "../supabase/server";
import { creerClientAdmin } from "../supabase/admin";
import type { Database } from "../supabase/database.types";
import { exigerEntreprise } from "../auth/session";
import { estDemo } from "./demo";
import {
  AUTONOMIE_PAR_NIVEAU,
  DEMO,
  type AccueilVue,
  type CampagneLigne,
  type CampagneVue,
  type CanalNom,
  type ComptesVue,
  type ConversationLigne,
  type ConversationVue,
  type DecisionVue,
  type ForfaitVue,
  type NiveauAutonomie,
  type ProspectLigne,
  type ProspectVue,
  type ProspectsVue,
  type RapportsVue,
  type ReglagesVue,
  type SimulateurVue,
  type StatutProspect,
} from "./vues";

/**
 * Lecture des données de chaque écran du tableau de bord. Tout passe par le client de l'utilisateur :
 * la sécurité par ligne de la base garantit qu'il ne voit que son entreprise. En mode démonstration,
 * on renvoie le jeu d'exemple de Koffi sans toucher à la base.
 */
export type Ctx = { sb: SupabaseClient<Database>; user: User; entrepriseId: string; entrepriseNom: string; demo: boolean };

export async function contexteApp(): Promise<Ctx> {
  const { user, entreprise } = await exigerEntreprise();
  return { sb: await creerClientServeur(), user, entrepriseId: entreprise.id, entrepriseNom: entreprise.nom, demo: await estDemo() };
}

const ilYAJours = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
const canalOu = (c: string | null | undefined): CanalNom | null => (c ? (c as CanalNom) : null);
const json = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const texte = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);

type LigneDecision = {
  id: string;
  type: DecisionVue["type"];
  urgence: number;
  question: string;
  options: unknown;
  contexte: unknown;
  statut: DecisionVue["statut"];
  cree_le: string;
  echeance: string | null;
  conversation_id: string | null;
  prospects: { nom: string; ville: string | null } | null;
  conversations: { canal: string } | null;
};
const COLONNES_DECISION = "id, type, urgence, question, options, contexte, statut, cree_le, echeance, conversation_id, prospects(nom, ville), conversations(canal)";

function versDecision(d: LigneDecision): DecisionVue {
  const c = json(d.contexte);
  const options = Array.isArray(d.options) ? (d.options as { cle: string; libelle: string }[]) : [];
  return {
    id: d.id,
    type: d.type,
    urgence: d.urgence,
    question: d.question,
    prospect: d.prospects?.nom ?? null,
    ville: d.prospects?.ville ?? null,
    canal: canalOu(d.conversations?.canal),
    extrait: texte(c.extrait),
    proposition: texte(c.proposition),
    options,
    creeLe: d.cree_le,
    echeance: d.echeance,
    statut: d.statut,
    conversationId: d.conversation_id,
  };
}

// ───── Accueil ───────────────────────────────────────────────────────────

export async function chargerAccueil(ctx: Ctx): Promise<AccueilVue> {
  if (ctx.demo) return DEMO.accueil;
  const { sb, entrepriseId: id } = ctx;
  const depuis = ilYAJours(7);
  const minuit = new Date();
  minuit.setHours(0, 0, 0, 0);

  const [profil, decisions, contactes, reponses, interesses, rdv, forfait, messages, actives, entreprise] = await Promise.all([
    sb.from("profils").select("prenom").eq("id", ctx.user.id).maybeSingle(),
    sb.from("decisions").select(COLONNES_DECISION, { count: "exact" }).eq("entreprise_id", id).eq("statut", "ouverte").order("urgence").order("cree_le", { ascending: false }).limit(2),
    sb.from("prospects").select("id", { count: "exact", head: true }).eq("entreprise_id", id).gte("contacte_le", depuis),
    sb.from("prospects").select("id", { count: "exact", head: true }).eq("entreprise_id", id).gte("repondu_le", depuis),
    sb.from("prospects").select("id", { count: "exact", head: true }).eq("entreprise_id", id).eq("statut", "interesse"),
    sb.from("rendez_vous").select("id", { count: "exact", head: true }).eq("entreprise_id", id).gte("cree_le", depuis),
    sb.from("mon_forfait").select("*").eq("entreprise_id", id).in("statut", ["actif", "grace"]).order("fin", { ascending: false }).limit(1).maybeSingle(),
    sb.from("messages").select("canal, sens, envoye_le, cree_le").eq("entreprise_id", id).gte("cree_le", depuis).order("cree_le", { ascending: false }).limit(3000),
    sb.from("campagnes").select("id", { count: "exact", head: true }).eq("entreprise_id", id).eq("statut", "active"),
    sb.from("entreprises").select("envoi_suspendu").eq("id", id).maybeSingle(),
  ]);

  const parCanal = new Map<CanalNom, { envoyes: number; reponses: number }>();
  for (const m of messages.data ?? []) {
    const c = m.canal as CanalNom;
    const l = parCanal.get(c) ?? { envoyes: 0, reponses: 0 };
    if (m.sens === "sortant") l.envoyes += 1;
    else l.reponses += 1;
    parCanal.set(c, l);
  }
  const f = forfait.data;
  const aujourdhui = (messages.data ?? [])
    .filter((m) => new Date(m.cree_le) >= minuit)
    .slice(0, 3)
    .map((m) => ({
      heure: new Date(m.cree_le).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      texte: m.sens === "sortant" ? `A écrit à un prospect (${m.canal})` : `Un prospect a répondu (${m.canal})`,
    }));

  return {
    prenom: profil.data?.prenom ?? "",
    agentActif: (actives.count ?? 0) > 0 && !entreprise.data?.envoi_suspendu,
    decisionsNb: decisions.count ?? 0,
    decisions: ((decisions.data ?? []) as unknown as LigneDecision[]).map(versDecision),
    semaine: { contactes: contactes.count ?? 0, reponses: reponses.count ?? 0, interesses: interesses.count ?? 0, rdv: rdv.count ?? 0 },
    forfait: f
      ? {
          restantes: f.entreprises_restantes ?? 0,
          achetees: f.entreprises_achetees ?? 0,
          joursRestants: f.fin ? Math.max(0, Math.ceil((new Date(f.fin).getTime() - Date.now()) / 86_400_000)) : null,
          statut: f.statut ?? "actif",
          type: f.type ?? "payant",
        }
      : null,
    canaux: [...parCanal.entries()].map(([canal, v]) => ({ canal, ...v })),
    aujourdhui,
  };
}

// ───── Décisions ─────────────────────────────────────────────────────────

export async function chargerDecisions(ctx: Ctx, repondues: boolean): Promise<DecisionVue[]> {
  if (ctx.demo) return repondues ? DEMO.decisionsRepondues : DEMO.decisions;
  const requete = ctx.sb.from("decisions").select(COLONNES_DECISION).eq("entreprise_id", ctx.entrepriseId);
  const { data } = repondues
    ? await requete.neq("statut", "ouverte").order("repondu_le", { ascending: false, nullsFirst: false }).limit(50)
    : await requete.eq("statut", "ouverte").order("urgence").order("cree_le", { ascending: false }).limit(50);
  return ((data ?? []) as unknown as LigneDecision[]).map(versDecision);
}

// ───── Prospects ─────────────────────────────────────────────────────────

export async function chargerProspects(ctx: Ctx, filtres: { q?: string; statut?: string; canal?: string; ville?: string }): Promise<ProspectsVue> {
  const f = { q: filtres.q ?? "", statut: filtres.statut ?? "", canal: filtres.canal ?? "", ville: filtres.ville ?? "" };
  if (ctx.demo) {
    const lignes = DEMO.prospects.lignes.filter(
      (l) => (!f.q || l.nom.toLowerCase().includes(f.q.toLowerCase())) && (!f.statut || l.statut === f.statut) && (!f.canal || l.canal === f.canal) && (!f.ville || l.ville === f.ville),
    );
    return { ...DEMO.prospects, lignes, filtres: f };
  }
  const { sb, entrepriseId: id } = ctx;
  let requete = sb.from("prospects").select("id, nom, ville, secteur, canal_choisi, statut, score, contacte_le").eq("entreprise_id", id).order("score", { ascending: false, nullsFirst: false }).limit(100);
  if (f.q) requete = requete.ilike("nom", `%${f.q.replace(/[%_,]/g, " ")}%`);
  if (f.statut) requete = requete.eq("statut", f.statut as StatutProspect);
  if (f.canal) requete = requete.eq("canal_choisi", f.canal as CanalNom);
  if (f.ville) requete = requete.eq("ville", f.ville);
  const [liste, total, contactes, villes] = await Promise.all([
    requete,
    sb.from("prospects").select("id", { count: "exact", head: true }).eq("entreprise_id", id),
    sb.from("prospects").select("id", { count: "exact", head: true }).eq("entreprise_id", id).not("contacte_le", "is", null),
    sb.from("prospects").select("ville").eq("entreprise_id", id).not("ville", "is", null).limit(1000),
  ]);
  // Le nom d'une entreprise pas encore contactée ne quitte jamais le serveur : l'écran reçoit une chaîne vide.
  const lignes: ProspectLigne[] = (liste.data ?? []).map((p) => {
    const masque = !p.contacte_le;
    return { id: p.id, nom: masque ? "" : p.nom, ville: p.ville, secteur: p.secteur, canal: canalOu(p.canal_choisi), statut: p.statut, score: p.score, masque };
  });
  return {
    total: total.count ?? 0,
    contactes: contactes.count ?? 0,
    lignes,
    filtres: f,
    villes: [...new Set((villes.data ?? []).map((v) => v.ville as string))].sort(),
  };
}

export async function chargerProspect(ctx: Ctx, prospectId: string): Promise<ProspectVue | null> {
  if (ctx.demo) return DEMO.prospect;
  const { sb, entrepriseId: id } = ctx;
  const { data: p } = await sb.from("prospects").select("id, nom, ville, secteur, score, contact_nom, contact_role, signal, statut, note_client, canal_choisi, contacte_le").eq("id", prospectId).eq("entreprise_id", id).maybeSingle();
  if (!p) return null;
  if (!p.contacte_le) {
    return { id: p.id, nom: "", ville: p.ville, secteur: p.secteur, score: p.score, contact: null, signal: null, identifiants: [], historique: [], conversationId: null, note: p.note_client ?? "", statut: p.statut, aRdv: false, masque: true };
  }
  const [ident, conv, rdv] = await Promise.all([
    sb.from("prospects_identifiants").select("canal, identifiant").eq("prospect_id", p.id),
    sb.from("conversations").select("id").eq("prospect_id", p.id).order("dernier_message_le", { ascending: false, nullsFirst: false }).limit(1).maybeSingle(),
    sb.from("rendez_vous").select("id", { count: "exact", head: true }).eq("prospect_id", p.id),
  ]);
  const msgs = conv.data
    ? (await sb.from("messages").select("id, sens, canal, corps, cree_le").eq("conversation_id", conv.data.id).order("cree_le", { ascending: true }).limit(100)).data ?? []
    : [];
  return {
    id: p.id,
    nom: p.nom,
    ville: p.ville,
    secteur: p.secteur,
    score: p.score,
    contact: p.contact_nom || p.contact_role ? { nom: p.contact_nom, role: p.contact_role } : null,
    signal: p.signal,
    identifiants: (ident.data ?? []).map((i) => ({ canal: i.canal as CanalNom, identifiant: i.identifiant, utilise: i.canal === p.canal_choisi })),
    historique: msgs.map((m) => ({ quand: m.cree_le, sens: m.sens, canal: m.canal as CanalNom, texte: m.corps.length > 140 ? `${m.corps.slice(0, 140)}...` : m.corps })),
    conversationId: conv.data?.id ?? null,
    note: p.note_client ?? "",
    statut: p.statut,
    aRdv: (rdv.count ?? 0) > 0,
    masque: false,
  };
}

// ───── Conversations ─────────────────────────────────────────────────────

export async function chargerConversations(ctx: Ctx): Promise<ConversationLigne[]> {
  if (ctx.demo) return DEMO.conversations;
  const { data } = await ctx.sb
    .from("conversations")
    .select("id, canal, statut, dernier_message_le, reprise_par_client, prospects(nom)")
    .eq("entreprise_id", ctx.entrepriseId)
    .order("dernier_message_le", { ascending: false, nullsFirst: false })
    .limit(50);
  const lignes = (data ?? []) as unknown as { id: string; canal: string; statut: string; dernier_message_le: string | null; reprise_par_client: boolean; prospects: { nom: string } | null }[];
  const derniers = await Promise.all(
    lignes.map((c) => ctx.sb.from("messages").select("corps").eq("conversation_id", c.id).order("cree_le", { ascending: false }).limit(1).maybeSingle()),
  );
  return lignes.map((c, i) => ({
    id: c.id,
    prospect: c.prospects?.nom ?? "Entreprise",
    canal: c.canal as CanalNom,
    dernierMessage: derniers[i].data?.corps ?? "",
    quand: c.dernier_message_le,
    reprise: c.reprise_par_client,
    enAttente: c.statut === "en_attente_client",
  }));
}

export async function chargerConversation(ctx: Ctx, conversationId: string): Promise<ConversationVue | null> {
  if (ctx.demo) return DEMO.conversation;
  const { data: c } = await ctx.sb.from("conversations").select("id, canal, reprise_par_client, prospects(nom)").eq("id", conversationId).eq("entreprise_id", ctx.entrepriseId).maybeSingle();
  if (!c) return null;
  const { data: msgs } = await ctx.sb.from("messages").select("id, sens, corps, envoye_le, cree_le, statut").eq("conversation_id", c.id).order("cree_le", { ascending: true }).limit(200);
  const liste = msgs ?? [];
  const prepare = [...liste].reverse().find((m) => m.sens === "sortant" && (m.statut === "planifie" || m.statut === "en_attente"));
  return {
    id: c.id,
    prospect: (c as unknown as { prospects: { nom: string } | null }).prospects?.nom ?? "Entreprise",
    canal: c.canal as CanalNom,
    repriseParClient: c.reprise_par_client,
    messages: liste.filter((m) => m !== prepare).map((m) => ({ id: m.id, sens: m.sens, corps: m.corps, quand: m.envoye_le ?? m.cree_le, statut: m.statut })),
    preparation: prepare ? { corps: prepare.corps, dans: "bientôt" } : null,
  };
}

// ───── Campagnes ─────────────────────────────────────────────────────────

export async function chargerCampagnes(ctx: Ctx): Promise<CampagneLigne[]> {
  if (ctx.demo) return DEMO.campagnes;
  const { data } = await ctx.sb.from("campagnes").select("id, nom, statut, entreprises_contactees, canaux_autorises, plafond_jour").eq("entreprise_id", ctx.entrepriseId).order("cree_le", { ascending: false });
  const lignes = await Promise.all(
    (data ?? []).map(async (c) => {
      const [rep, rdv] = await Promise.all([
        ctx.sb.from("prospects").select("id", { count: "exact", head: true }).eq("campagne_id", c.id).not("repondu_le", "is", null),
        ctx.sb.from("prospects").select("id", { count: "exact", head: true }).eq("campagne_id", c.id).eq("statut", "rdv_pris"),
      ]);
      return { id: c.id, nom: c.nom, statut: c.statut, contactes: c.entreprises_contactees, reponses: rep.count ?? 0, rdv: rdv.count ?? 0, canaux: c.canaux_autorises as CanalNom[], plafondJour: c.plafond_jour || null } satisfies CampagneLigne;
    }),
  );
  return lignes;
}

export async function chargerCampagne(ctx: Ctx, campagneId: string): Promise<CampagneVue | null> {
  if (ctx.demo) return DEMO.campagne;
  const liste = await chargerCampagnes(ctx);
  const c = liste.find((x) => x.id === campagneId);
  if (!c) return null;
  const { data } = await ctx.sb.from("campagnes").select("profils_cibles(secteurs, villes, tailles, signaux_recherches)").eq("id", campagneId).maybeSingle();
  const pc = (data as unknown as { profils_cibles: { secteurs: string[]; villes: string[]; tailles: string[]; signaux_recherches: string[] } | null } | null)?.profils_cibles;
  return { ...c, cible: pc ? { secteurs: pc.secteurs, villes: pc.villes, tailles: pc.tailles, signaux: pc.signaux_recherches } : null };
}

/** Taux mesurés sur nos envois (partagés entre clients), seulement s'il y en a assez pour être crédibles. */
export async function chargerSimulateur(ctx: Ctx): Promise<SimulateurVue> {
  if (ctx.demo) return DEMO.simulateur;
  const { data } = await creerClientAdmin().from("stats_canal").select("envoyes, reponses, rdv").gte("periode", ilYAJours(90).slice(0, 10));
  const lignes = data ?? [];
  const envoyes = lignes.reduce((s, l) => s + l.envoyes, 0);
  if (envoyes < 300) return { taux: null };
  return {
    taux: {
      reponse: lignes.reduce((s, l) => s + l.reponses, 0) / envoyes,
      rdv: lignes.reduce((s, l) => s + l.rdv, 0) / envoyes,
      echantillon: envoyes,
      perimetre: "tous secteurs et pays confondus, ces 90 derniers jours",
    },
  };
}

// ───── Rapports ──────────────────────────────────────────────────────────

export async function chargerRapports(ctx: Ctx): Promise<RapportsVue> {
  if (ctx.demo) return DEMO.rapports;
  const { sb, entrepriseId: id } = ctx;
  const compte = (q: PromiseLike<{ count: number | null }>) => Promise.resolve(q).then((r) => r.count ?? 0);
  const [trouves, contactes, repondus, interesses, rdv, signes, paiements] = await Promise.all([
    compte(sb.from("prospects").select("id", { count: "exact", head: true }).eq("entreprise_id", id)),
    compte(sb.from("prospects").select("id", { count: "exact", head: true }).eq("entreprise_id", id).not("contacte_le", "is", null)),
    compte(sb.from("prospects").select("id", { count: "exact", head: true }).eq("entreprise_id", id).not("repondu_le", "is", null)),
    compte(sb.from("prospects").select("id", { count: "exact", head: true }).eq("entreprise_id", id).in("statut", ["interesse", "rdv_pris"])),
    compte(sb.from("rendez_vous").select("id", { count: "exact", head: true }).eq("entreprise_id", id)),
    compte(sb.from("rendez_vous").select("id", { count: "exact", head: true }).eq("entreprise_id", id).eq("resultat", "signe")),
    sb.from("paiements").select("montant_fcfa").eq("entreprise_id", id).eq("statut", "reussi"),
  ]);
  const depenses = (paiements.data ?? []).reduce((s, p) => s + p.montant_fcfa, 0);
  return {
    entonnoir: [
      { libelle: "Trouvés", valeur: trouves },
      { libelle: "Contactés", valeur: contactes },
      { libelle: "Ont répondu", valeur: repondus },
      { libelle: "Intéressés", valeur: interesses },
      { libelle: "Rendez-vous", valeur: rdv },
      { libelle: "Signés", valeur: signes },
    ],
    argent: { depenses, parRdv: rdv > 0 && depenses > 0 ? Math.round(depenses / rdv) : null, gagnes: null },
    appris: [],
    proposition: null,
  };
}

// ───── Comptes et forfait ────────────────────────────────────────────────

export async function chargerComptes(ctx: Ctx): Promise<ComptesVue> {
  if (ctx.demo) return DEMO.comptes;
  const { sb, entrepriseId: id } = ctx;
  const [comptes, forfait, identifiants] = await Promise.all([
    sb.from("mes_comptes").select("canal, identifiant_affiche, statut, quota_jour, envois_aujourdhui, note_sante").eq("entreprise_id", id),
    sb.from("mon_forfait").select("comptes_max").eq("entreprise_id", id).in("statut", ["actif", "grace"]).limit(1).maybeSingle(),
    sb.from("prospects_identifiants").select("canal").eq("entreprise_id", id).limit(20000),
  ]);
  const joignables = new Map<string, number>();
  for (const i of identifiants.data ?? []) joignables.set(i.canal, (joignables.get(i.canal) ?? 0) + 1);
  const branches = comptes.data ?? [];
  const pris = new Set(branches.map((c) => c.canal));
  return {
    inclus: forfait.data?.comptes_max ?? null,
    branches: branches.filter((c) => c.statut === "actif").length,
    comptes: branches.map((c) => ({ canal: c.canal as CanalNom, identifiant: c.identifiant_affiche ?? "", statut: c.statut ?? "actif", quota: c.quota_jour ?? 0, envois: c.envois_aujourdhui ?? 0, note: c.note_sante ?? 0, joignables: joignables.get(c.canal ?? "") ?? 0 })),
    autres: (["whatsapp", "email", "instagram", "facebook", "linkedin"] as CanalNom[]).filter((c) => !pris.has(c)).map((canal) => ({ canal, joignables: joignables.get(canal) ?? 0 })),
  };
}

export async function chargerForfait(ctx: Ctx): Promise<ForfaitVue> {
  if (ctx.demo) return DEMO.forfait;
  const { sb, entrepriseId: id } = ctx;
  const [f, mouvements, entreprise] = await Promise.all([
    sb.from("mon_forfait").select("*").eq("entreprise_id", id).in("statut", ["actif", "grace"]).order("fin", { ascending: false }).limit(1).maybeSingle(),
    sb.from("mouvements_forfait").select("cree_le, type, nombre, motif").eq("entreprise_id", id).order("cree_le", { ascending: false }).limit(15),
    sb.from("entreprises").select("plafond_jour").eq("id", id).maybeSingle(),
  ]);
  const d = f.data;
  const debut = d?.debut ? new Date(d.debut).getTime() : 0;
  const fin = d?.fin ? new Date(d.fin).getTime() : 0;
  const NOM_MOUVEMENT: Record<string, string> = { achat: "Forfait", bonus: "Bonus", decompte: "Entreprise contactée", retour: "Message non livré, entreprise rendue", report: "Entreprises reportées", degel: "Entreprises dégelées", gel: "Entreprises gelées", expiration: "Expiration", ajustement: "Ajustement" };
  return {
    forfait: d
      ? {
          type: d.type ?? "payant",
          statut: d.statut ?? "actif",
          montant: d.montant_fcfa ?? 0,
          achetees: d.entreprises_achetees ?? 0,
          restantes: d.entreprises_restantes ?? 0,
          parJour: d.par_jour ?? 0,
          debut: d.debut ?? "",
          fin: d.fin ?? "",
          joursRestants: Math.max(0, Math.ceil((fin - Date.now()) / 86_400_000)),
          joursTotal: Math.max(1, Math.round((fin - debut) / 86_400_000)),
        }
      : null,
    plafondJour: entreprise.data?.plafond_jour ?? 0,
    historique: (mouvements.data ?? []).filter((m) => m.nombre !== 0).map((m) => ({ quand: m.cree_le, libelle: m.motif ?? NOM_MOUVEMENT[m.type] ?? m.type, nombre: m.nombre })),
  };
}

// ───── Réglages ──────────────────────────────────────────────────────────

export async function chargerReglages(ctx: Ctx): Promise<ReglagesVue> {
  if (ctx.demo) return DEMO.reglages;
  const { sb, entrepriseId: id } = ctx;
  const [profil, e, exclusions] = await Promise.all([
    sb.from("profils").select("prenom").eq("id", ctx.user.id).maybeSingle(),
    sb.from("entreprises").select("nom, nom_affiche, fiche_activite, consignes, horaires").eq("id", id).maybeSingle(),
    sb.from("exclusions_client").select("id, type, valeur").eq("entreprise_id", id).order("cree_le", { ascending: false }),
  ]);
  const consignes = json(e.data?.consignes);
  const fiche = json(e.data?.fiche_activite);
  const auto = json(consignes.autonomie);
  const niveau: NiveauAutonomie = auto.niveau === "prudent" || auto.niveau === "autonome" ? auto.niveau : "equilibre";
  const lignesBrutes = json(auto.lignes);
  const lignes = { ...AUTONOMIE_PAR_NIVEAU[niveau] };
  for (const cle of Object.keys(lignes) as (keyof typeof lignes)[]) if (lignesBrutes[cle] === "agent" || lignesBrutes[cle] === "moi") lignes[cle] = lignesBrutes[cle] as "agent" | "moi";
  const alertes = json(consignes.alertes);
  return {
    prenom: profil.data?.prenom ?? "",
    email: ctx.user.email ?? "",
    entreprise: e.data?.nom ?? ctx.entrepriseNom,
    resume: texte(fiche.resume),
    offres: Array.isArray(fiche.offres) ? (fiche.offres as unknown[]).filter((o): o is string => typeof o === "string") : [],
    nomAffiche: e.data?.nom_affiche ?? "",
    consignes: { prix: texte(consignes.prix) ?? "", interdits: texte(consignes.interdits) ?? "" },
    autonomie: { niveau, lignes },
    alertes: { whatsapp: alertes.whatsapp !== false, email: alertes.email === true, debut: texte(alertes.debut) ?? "08:00", fin: texte(alertes.fin) ?? "19:00" },
    exclusions: (exclusions.data ?? []).map((x) => ({ id: x.id, type: x.type as "domaine" | "nom" | "identifiant", valeur: x.valeur })),
  };
}
