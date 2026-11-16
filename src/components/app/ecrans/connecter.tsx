import { AlertTriangle } from "lucide-react";
import { BoutonLien, Carte, Sourdine, TitrePage, classeBouton } from "@/components/app/kit";
import { connecterCompte } from "@/lib/canaux/actions";
import { NOM_CANAL, type Canal } from "@/lib/canaux/types";

/** Ce qui est dit au client AVANT de relier un compte (docs/UNIPILE.md §4 et §5) : écrit noir sur blanc, accepté par une case à cocher. */
const COMMUN = (nom: string) => `Leed écrira depuis votre compte ${nom}, à votre nom. Vous voyez tous les messages dans votre application comme d'habitude. Vous pouvez débrancher Leed à tout moment.`;

const RISQUES: Record<Canal, string[]> = {
  whatsapp: [
    "Leed relie WhatsApp comme WhatsApp Web, et non par la voie officielle de Meta. WhatsApp peut limiter ou suspendre un compte qui envoie des messages à des inconnus. Ce risque existe même si nous le réduisons.",
    "Pour le réduire : pas plus de 10 messages le premier jour, puis un peu plus chaque jour, jamais plus de 40 par jour ; chaque message est personnalisé ; « STOP » arrête tout envoi ; jamais en dehors de 8 h à 19 h.",
    "Si ce numéro est essentiel à votre activité, pensez à en utiliser un autre pour Leed.",
  ],
  instagram: ["Instagram limite les messages envoyés à des inconnus. Leed envoie peu de messages, personnalisés. Un compte qui envoie trop peut être restreint par Instagram."],
  facebook: ["Facebook limite les messages envoyés à des inconnus. Leed envoie peu de messages, personnalisés. Un compte qui envoie trop peut être restreint."],
  linkedin: ["LinkedIn limite fortement les invitations (20 par semaine au plus avec Leed) et les messages (30 par jour au plus). Un compte qui automatise trop peut être restreint par LinkedIn."],
  email: ["Leed lit vos réponses et accède à votre agenda pour proposer des rendez-vous. Vos emails personnels ne sont jamais utilisés pour autre chose."],
};

export function ConnecterCompte({ canal, rebrancher, erreur, refus, demo }: { canal: Canal; rebrancher?: string; erreur?: string; refus?: { code: string; message: string }; demo: boolean }) {
  const nom = NOM_CANAL[canal];
  return (
    <div className="flex flex-col gap-4">
      <TitrePage titre={`${rebrancher ? "Rebrancher" : "Connecter"} ${nom}`} retour="/app/comptes" />
      {erreur && <p role="alert" className="rounded-lg bg-[#fdeee4] px-3 py-2 text-sm text-[#b4410e]">{erreur}</p>}
      {demo && <Sourdine>Mode démonstration : aucune connexion n&apos;est lancée.</Sourdine>}
      {refus ? (
        <Carte ton="vif">
          <p className="!my-0 text-sm !text-foreground">{refus.message}</p>
          {refus.code === "forfait_requis" && <BoutonLien href="/app/forfait/recharger" ton="action" large>Choisir mon forfait</BoutonLien>}
          {refus.code === "limite_comptes" && <BoutonLien href="/app/forfait/recharger" ton="action" large>Voir les forfaits</BoutonLien>}
          {refus.code !== "forfait_requis" && refus.code !== "limite_comptes" && <BoutonLien href="/app/comptes" ton="sombre" large>Retour à mes comptes</BoutonLien>}
        </Carte>
      ) : (
        <form action={connecterCompte} className="flex flex-col gap-4">
          <input type="hidden" name="canal" value={canal} />
          {rebrancher && <input type="hidden" name="rebrancher" value={rebrancher} />}
          <Carte>
            <p className="!my-0 text-base !text-foreground">{COMMUN(nom)}</p>
          </Carte>
          <Carte ton="vif">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />À lire avant de continuer
            </div>
            {RISQUES[canal].map((t) => (
              <p key={t} className="!my-0 text-sm !text-foreground">
                {t}
              </p>
            ))}
          </Carte>
          <label className="flex items-start gap-3 text-sm text-foreground">
            <input type="checkbox" name="accepte" required className="mt-0.5 h-5 w-5 shrink-0" />
            <span>J&apos;ai lu et compris ces informations, et je souhaite connecter mon compte {nom} à Leed.</span>
          </label>
          <button type="submit" disabled={demo} className={classeBouton("action", false, true)}>
            Continuer vers la connexion
          </button>
          <Sourdine>Vous serez redirigé vers la page sécurisée de notre prestataire de connexion. Leed ne voit et ne garde jamais votre mot de passe.</Sourdine>
        </form>
      )}
    </div>
  );
}
