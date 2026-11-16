import "server-only";
import { creerClientServeur } from "../supabase/server";
import { exigerAdmin } from "../auth/session";
import { creerClientAdmin } from "../supabase/admin";
import { env } from "../env";
import { listerComptesDistants, listerWebhooksDistants } from "../canaux/service";
import { ADMIN_DEMO } from "./vues";
import type {
  AdminAccueilVue,
  AdminAnnuaireVue,
  AdminClientLigne,
  AdminClientVue,
  AdminCodesPromoVue,
  AdminUnipileVue,
  AdminComptesVue,
  AdminCoutsVue,
  AdminJournalVue,
  AdminMessagesVue,
  AdminPaiementsVue,
  AdminTicketLigne,
  AdminTicketVue,
} from "./vues";

/**
 * Lecture des écrans de l'espace équipe. Chaque lecture passe par une fonction SQL qui revérifie le rôle
 * administrateur : la garde `exigerAdmin` de la page ne suffit pas à elle seule, et la base refuse de toute façon.
 * L'équipe ne lit jamais le contenu des conversations privées d'un client : seulement des chiffres, des états,
 * et les messages que le contrôle a refusés.
 */
export type CtxAdmin = Awaited<ReturnType<typeof contexteAdmin>>;

export async function contexteAdmin() {
  const { user, role } = await exigerAdmin();
  return { sb: await creerClientServeur(), user, role };
}

async function rpc<T>(ctx: CtxAdmin, nom: "admin_accueil" | "admin_clients" | "admin_comptes" | "admin_annuaire" | "admin_messages_bloques" | "admin_paiements" | "admin_couts"): Promise<T> {
  const { data, error } = await ctx.sb.rpc(nom);
  if (error) throw new Error(`${nom} : ${error.message}`);
  return data as unknown as T;
}

export const chargerAdminAccueil = (ctx: CtxAdmin) => rpc<AdminAccueilVue>(ctx, "admin_accueil");
export const chargerAdminClients = (ctx: CtxAdmin) => rpc<AdminClientLigne[]>(ctx, "admin_clients");
export const chargerAdminComptes = (ctx: CtxAdmin) => rpc<AdminComptesVue>(ctx, "admin_comptes");
export const chargerAdminAnnuaire = (ctx: CtxAdmin) => rpc<AdminAnnuaireVue>(ctx, "admin_annuaire");
export const chargerAdminMessages = (ctx: CtxAdmin) => rpc<AdminMessagesVue>(ctx, "admin_messages_bloques");
export const chargerAdminPaiements = (ctx: CtxAdmin) => rpc<AdminPaiementsVue>(ctx, "admin_paiements");
export const chargerAdminCouts = (ctx: CtxAdmin) => rpc<AdminCoutsVue>(ctx, "admin_couts");

export async function chargerAdminCodesPromo(ctx: CtxAdmin): Promise<AdminCodesPromoVue> {
  const { data, error } = await ctx.sb.rpc("admin_codes_promo");
  if (error) throw new Error(`admin_codes_promo : ${error.message}`);
  return data as unknown as AdminCodesPromoVue;
}

export async function chargerAdminClient(ctx: CtxAdmin, id: string): Promise<AdminClientVue | null> {
  const { data, error } = await ctx.sb.rpc("admin_client", { p_id: id });
  if (error) {
    if (error.code === "P0002") return null;
    throw new Error(`admin_client : ${error.message}`);
  }
  return data as unknown as AdminClientVue;
}

export async function chargerAdminJournal(ctx: CtxAdmin): Promise<AdminJournalVue> {
  const { data, error } = await ctx.sb.rpc("admin_journal", { p_limite: 100 });
  if (error) throw new Error(`admin_journal : ${error.message}`);
  return data as unknown as AdminJournalVue;
}

export async function chargerAdminTickets(ctx: CtxAdmin, statut: "ouverts" | "resolus"): Promise<AdminTicketLigne[]> {
  const requete = ctx.sb.from("tickets_support").select("id, entreprise_id, sujet, statut, priorite, cree_le").order("priorite").order("cree_le", { ascending: false }).limit(100);
  const { data, error } = statut === "resolus" ? await requete.eq("statut", "resolu") : await requete.neq("statut", "resolu");
  if (error) throw new Error(`tickets : ${error.message}`);
  const clients = await chargerAdminClients(ctx);
  const noms = new Map(clients.map((c) => [c.id, c.nom]));
  return (data ?? []).map((t) => ({ id: t.id, entreprise: t.entreprise_id ? noms.get(t.entreprise_id) ?? null : null, sujet: t.sujet, statut: t.statut, priorite: t.priorite, cree_le: t.cree_le }));
}

export async function chargerAdminTicket(ctx: CtxAdmin, id: string): Promise<AdminTicketVue | null> {
  const { data: t } = await ctx.sb.from("tickets_support").select("id, entreprise_id, sujet, statut, priorite, cree_le").eq("id", id).maybeSingle();
  if (!t) return null;
  const [msgs, clients] = await Promise.all([
    ctx.sb.from("messages_ticket").select("id, auteur, corps, cree_le").eq("ticket_id", id).order("cree_le", { ascending: true }),
    chargerAdminClients(ctx),
  ]);
  return {
    id: t.id,
    entreprise: clients.find((c) => c.id === t.entreprise_id)?.nom ?? null,
    sujet: t.sujet,
    statut: t.statut,
    priorite: t.priorite,
    cree_le: t.cree_le,
    messages: (msgs.data ?? []).map((m) => ({ id: m.id, auteur: m.auteur as "client" | "admin", corps: m.corps, cree_le: m.cree_le })),
  };
}

export { ADMIN_DEMO };

/** L'état de la connexion à Unipile, pour la page de l'équipe : variables posées, comptes FACTURÉS chez Unipile, webhooks déclarés. */
export async function chargerAdminUnipile(ctx: CtxAdmin): Promise<AdminUnipileVue> {
  void ctx;
  const e = env();
  const variables = { dsn: !!e.UNIPILE_DSN, cle: !!e.UNIPILE_API_KEY, secret: !!e.UNIPILE_WEBHOOK_SECRET, site: !!e.APP_URL };
  const prete = variables.dsn && variables.cle;
  const [comptes, webhooks] = await Promise.all([prete ? listerComptesDistants() : null, prete ? listerWebhooksDistants() : null]);
  const { data: locaux } = await creerClientAdmin().from("comptes_connectes").select("statut").in("statut", ["actif", "a_rebrancher", "suspendu"]);
  const compte = (s: string) => (locaux ?? []).filter((l) => l.statut === s).length;
  const admin = creerClientAdmin();
  const { data: ev } = await admin.from("evenements_compte").select("compte_id, type, gravite, charge, cree_le").order("cree_le", { ascending: false }).limit(15);
  const ids = [...new Set((ev ?? []).map((x) => x.compte_id))];
  const { data: cc } = ids.length > 0 ? await admin.from("comptes_connectes").select("id, canal, identifiant_affiche").in("id", ids) : { data: [] };
  const parId = new Map((cc ?? []).map((c) => [c.id, c]));
  const evenements = (ev ?? []).map((x) => {
    const c = parId.get(x.compte_id);
    const charge = (x.charge ?? {}) as Record<string, unknown>;
    const detail =
      x.type === "statut" ? `${String(charge.ancien ?? "?")} -> ${String(charge.nouveau ?? "?")} (${String(charge.message ?? "")})` : x.type === "message_recu" ? "réponse reçue" : x.type === "connecte" ? "compte connecté" : x.type === "rebranche" ? "compte rebranché" : x.type === "debranche" ? `débranché (${String(charge.motif ?? "")})` : x.type;
    return { quand: x.cree_le, type: x.type, canal: c?.canal ?? null, identifiant: c?.identifiant_affiche ?? null, gravite: x.gravite, detail };
  });
  return {
    variables,
    adresseWebhook: e.APP_URL ? `${e.APP_URL.replace(/\/$/, "")}/api/webhooks/unipile` : null,
    comptes: comptes === null ? null : comptes.ok ? { ok: true, liste: comptes.donnees.map((c) => ({ id: c.id, type: c.type, canal: c.canal, identifiant: c.identifiant, statut: c.statutBrut, cree_le: c.creeLe })) } : { ok: false, erreur: comptes.erreur },
    webhooks: webhooks === null ? null : webhooks.ok ? { ok: true, liste: webhooks.donnees.map((w) => ({ id: w.id, source: w.source, url: w.url })) } : { ok: false, erreur: webhooks.erreur },
    locaux: { actifs: compte("actif"), a_rebrancher: compte("a_rebrancher"), suspendus: compte("suspendu") },
    evenements,
  };
}
