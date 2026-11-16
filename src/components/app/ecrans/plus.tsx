import { Carte, EtatVide, LigneLien, Sourdine, Titrine, TitrePage, BoutonLien } from "@/components/app/kit";
import { NOM_CANAL } from "@/lib/app/vues";

export function EcranPlus({ demo }: { demo: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      <TitrePage titre="Plus" />
      <ul className="glass-window-inner divide-y divide-border">
        <li><LigneLien href="/app/prospects" titre="Prospects" texte="Toutes les entreprises trouvées" /></li>
        <li><LigneLien href="/app/campagnes" titre="Campagnes" texte="Une cible, un message, un budget" /></li>
        <li><LigneLien href="/app/comptes" titre="Comptes connectés" texte="La santé de vos comptes" /></li>
        <li><LigneLien href="/app/forfait" titre="Forfait" texte="Ce qui reste, et pour combien de temps" /></li>
        <li><LigneLien href="/app/whatsapp" titre="Piloter depuis WhatsApp" texte="Tout faire sans ouvrir le site" /></li>
        <li><LigneLien href="/app/reglages" titre="Réglages" texte="Tout ce que vous pouvez corriger vous-même" /></li>
      </ul>
      {!demo && (
        <Carte ton="calme">
          <Titrine>Voir un exemple rempli</Titrine>
          <Sourdine>Découvrez votre tableau de bord avec les données fictives d&apos;un client type, sans rien enregistrer.</Sourdine>
          <div>
            <a href="/app/demo" className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-chip">
              Ouvrir la démonstration
            </a>
          </div>
        </Carte>
      )}
    </div>
  );
}

export function EcranWhatsapp() {
  return (
    <div className="flex flex-col gap-4">
      <TitrePage titre="Piloter depuis WhatsApp" retour="/app/plus" />
      <EtatVide titre="Bientôt disponible" texte="Vous pourrez tout faire depuis WhatsApp : répondre aux décisions, mettre l'agent en pause, demander où en est la semaine. Chaque changement de réglage sera reformulé et ne s'appliquera qu'après votre « Oui »." />
      <Carte>
        <Titrine>Exemple de ce que vous pourrez écrire</Titrine>
        <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
          <li>« Pause » · « Reprends »</li>
          <li>« Montre-moi les leads chauds »</li>
          <li>« Ne contacte plus les écoles »</li>
          <li>« Où en est-on ? »</li>
        </ul>
        <Sourdine>Canaux d&apos;alerte prévus : {NOM_CANAL.whatsapp} et {NOM_CANAL.email}.</Sourdine>
      </Carte>
      <div>
        <BoutonLien href="/app/reglages/alertes" petit>
          Régler mes alertes
        </BoutonLien>
      </div>
    </div>
  );
}
