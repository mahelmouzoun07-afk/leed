import { notFound } from "next/navigation";
import { CadreAdmin } from "@/components/admin/CadreAdmin";
import { AdminAccueil, AdminClient, AdminClients } from "@/components/admin/ecrans/clients";
import { AdminAnnuaire, AdminComptes, AdminCouts, AdminJournal, AdminMessages, AdminPaiements, AdminPlus } from "@/components/admin/ecrans/exploitation";
import { AdminSupport, AdminTicket } from "@/components/admin/ecrans/support";
import { AdminCodesPromo } from "@/components/admin/ecrans/promo";
import { AdminUnipile } from "@/components/admin/ecrans/unipile";
import { ADMIN_DEMO as D } from "@/lib/admin/vues";

/** /dev/admin/<écran> : chaque écran de l'espace équipe avec le jeu d'exemple (développement seulement). */
const ECRANS: Record<string, () => React.ReactNode> = {
  accueil: () => <AdminAccueil v={D.accueil} />,
  "accueil-vide": () => <AdminAccueil v={{ clients_actifs: 0, comptes_branches: 0, comptes_a_rebrancher: 0, tickets_ouverts: 0, messages_a_relire: 0, paiements_en_attente: 0, sources_annuaire: 0, encaisse_mois: 0, couts_mois: {}, sante: [] }} />,
  clients: () => <AdminClients clients={D.clients} q="" etat="" />,
  "clients-vide": () => <AdminClients clients={[]} q="" etat="" />,
  client: () => <AdminClient v={D.client} role="admin" />,
  comptes: () => <AdminComptes v={D.comptes} />,
  "comptes-vide": () => <AdminComptes v={{ total_actifs: 0, comptes: [] }} />,
  annuaire: () => <AdminAnnuaire v={D.annuaire} />,
  "annuaire-vide": () => <AdminAnnuaire v={{ entreprises: 0, pays: 0, avec_telephone: 0, avec_site: 0, sources: [] }} />,
  messages: () => <AdminMessages v={D.messages} />,
  paiements: () => <AdminPaiements v={D.paiements} />,
  couts: () => <AdminCouts v={D.couts} />,
  unipile: () => <AdminUnipile v={D.unipile} />,
  "unipile-vide": () => <AdminUnipile v={{ variables: { dsn: false, cle: false, secret: false, site: true }, adresseWebhook: null, comptes: null, webhooks: null, locaux: { actifs: 0, a_rebrancher: 0, suspendus: 0 }, evenements: [] }} />,
  "unipile-erreur": () => <AdminUnipile v={{ ...D.unipile, comptes: { ok: false, erreur: "Unipile a répondu 401." }, webhooks: { ok: false, erreur: "Unipile a répondu 401." } }} erreur="Exemple d'erreur." />,
  "codes-promo": () => <AdminCodesPromo v={D.codes_promo} />,
  "codes-promo-nouveau": () => <AdminCodesPromo v={D.codes_promo} nouveau="BIENVENUE26" ok />,
  "codes-promo-vide": () => <AdminCodesPromo v={{ codes: [], recentes: [] }} />,
  support: () => <AdminSupport tickets={D.tickets} resolus={false} />,
  ticket: () => <AdminTicket v={D.ticket} />,
  journal: () => <AdminJournal v={D.journal} />,
  plus: () => <AdminPlus />,
};

export default async function Page({ params }: { params: Promise<{ ecran: string }> }) {
  const { ecran } = await params;
  const rendu = ECRANS[ecran];
  if (!rendu) notFound();
  return (
    <div className="landing min-h-screen bg-background pt-4 text-foreground">
      <CadreAdmin email="equipe@exemple.com" role="admin" base="/dev/admin" deconnexion={false}>
        {rendu()}
      </CadreAdmin>
    </div>
  );
}
