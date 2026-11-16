import { notFound } from "next/navigation";
import { CadreApp } from "@/components/app/CadreApp";
import { EcranAccueil } from "@/components/app/ecrans/accueil";
import { EcranCampagne, EcranCampagnes } from "@/components/app/ecrans/campagnes";
import { EcranComptes, EcranForfait } from "@/components/app/ecrans/compte";
import { EcranConversation, EcranConversations } from "@/components/app/ecrans/conversations";
import { EcranDecisions } from "@/components/app/ecrans/decisions";
import { EcranPlus, EcranWhatsapp } from "@/components/app/ecrans/plus";
import { EcranProspect, EcranProspects } from "@/components/app/ecrans/prospects";
import { EcranRapports } from "@/components/app/ecrans/rapports";
import { Recharge } from "@/components/app/ecrans/Recharge";
import { SuiviPaiement } from "@/components/app/ecrans/SuiviPaiement";
import { EcranActivite, EcranAlertes, EcranAutonomie, EcranCompte, EcranExclusions, EcranHoraires, EcranMessages, EcranReglages } from "@/components/app/ecrans/reglages";
import { Simulateur } from "@/components/app/ecrans/Simulateur";
import { DEMO } from "@/lib/app/vues";

/** /dev/app/<écran> : chaque écran du tableau de bord avec le jeu d'exemple de Koffi (développement seulement). */
const ECRANS: Record<string, () => React.ReactNode> = {
  accueil: () => <EcranAccueil v={DEMO.accueil} />,
  "accueil-vide": () => <EcranAccueil v={{ prenom: "Koffi", agentActif: false, decisionsNb: 0, decisions: [], semaine: { contactes: 0, reponses: 0, interesses: 0, rdv: 0 }, forfait: null, canaux: [], aujourdhui: [] }} />,
  decisions: () => <EcranDecisions decisions={DEMO.decisions} repondues={false} />,
  "decisions-repondues": () => <EcranDecisions decisions={DEMO.decisionsRepondues} repondues />,
  "decisions-vide": () => <EcranDecisions decisions={[]} repondues={false} />,
  prospects: () => <EcranProspects v={DEMO.prospects} />,
  "prospects-vide": () => <EcranProspects v={{ ...DEMO.prospects, total: 0, contactes: 0, lignes: [] }} />,
  prospect: () => <EcranProspect v={DEMO.prospect} />,
  "prospect-masque": () => <EcranProspect v={{ ...DEMO.prospect, nom: "", masque: true, contact: null, signal: null, identifiants: [], historique: [], conversationId: null }} />,
  conversations: () => <EcranConversations lignes={DEMO.conversations} />,
  "conversations-vide": () => <EcranConversations lignes={[]} />,
  conversation: () => <EcranConversation v={DEMO.conversation} />,
  campagnes: () => <EcranCampagnes lignes={DEMO.campagnes} />,
  "campagnes-vide": () => <EcranCampagnes lignes={[]} />,
  campagne: () => <EcranCampagne v={DEMO.campagne} onglet="cible" />,
  simulateur: () => <Simulateur v={DEMO.simulateur} />,
  "simulateur-sans-donnees": () => <Simulateur v={{ taux: null }} />,
  rapports: () => <EcranRapports v={DEMO.rapports} />,
  "rapports-vide": () => <EcranRapports v={{ entonnoir: DEMO.rapports.entonnoir.map((e) => ({ ...e, valeur: 0 })), argent: { depenses: 0, parRdv: null, gagnes: null }, appris: [], proposition: null }} />,
  comptes: () => <EcranComptes v={DEMO.comptes} />,
  forfait: () => <EcranForfait v={DEMO.forfait} />,
  "forfait-vide": () => <EcranForfait v={{ forfait: null, plafondJour: 0, historique: [] }} />,
  recharge: () => <Recharge restantes={34} avantLaFin pays="BJ" demo reseaux={[{ code: "mtn_bj", nom: "MTN MoMo" }, { code: "moov_bj", nom: "Moov Money" }, { code: "celtiis_bj", nom: "Celtiis Cash" }]} />,
  "recharge-pays-non-pris": () => <Recharge restantes={0} avantLaFin={false} pays="GH" reseaux={[]} />,
  "paiement-reussi": () => <SuiviPaiement id="demo" montant={25000} initial="reussi" />,
  "paiement-echoue": () => <SuiviPaiement id="demo" montant={25000} initial="echoue" />,
  reglages: () => <EcranReglages v={DEMO.reglages} />,
  activite: () => <EcranActivite v={DEMO.reglages} />,
  messages: () => <EcranMessages v={DEMO.reglages} />,
  autonomie: () => <EcranAutonomie v={DEMO.reglages} />,
  alertes: () => <EcranAlertes v={DEMO.reglages} />,
  horaires: () => <EcranHoraires />,
  exclusions: () => <EcranExclusions v={DEMO.reglages} />,
  compte: () => <EcranCompte v={DEMO.reglages} />,
  plus: () => <EcranPlus demo={false} />,
  whatsapp: () => <EcranWhatsapp />,
};

export default async function Page({ params }: { params: Promise<{ ecran: string }> }) {
  const { ecran } = await params;
  const rendu = ECRANS[ecran];
  if (!rendu) notFound();
  return (
    <CadreApp nom="Studio Koffi" demo={false} decisionsNb={3} base="/dev/app">
      {rendu()}
    </CadreApp>
  );
}
