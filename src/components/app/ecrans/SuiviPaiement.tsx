"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, LoaderCircle, X } from "lucide-react";
import { Carte, Sourdine, TitrePage, classeBouton, fcfa } from "@/components/app/kit";
import { suivrePaiement } from "@/lib/paiement/actions";

type Etat = "en_attente" | "reussi" | "echoue" | "inconnu";

const INTERVALLE_MS = 4000;
const DUREE_MAX_MS = 10 * 60_000;

/**
 * Attente de la confirmation du paiement : le client valide la demande sur son téléphone, cette page interroge
 * régulièrement notre serveur (qui interroge SasPay). Le forfait ne s'ouvre que sur la confirmation de SasPay,
 * jamais sur le simple retour du client ici.
 */
export function SuiviPaiement({ id, montant, initial }: { id: string; montant: number; initial: Etat }) {
  const [etat, setEtat] = useState<Etat>(initial);
  const [abandon, setAbandon] = useState(false);
  const debut = useRef(0);

  useEffect(() => {
    if (etat !== "en_attente") return;
    debut.current = debut.current || Date.now();
    let actif = true;
    const t = setInterval(async () => {
      if (!actif) return;
      if (Date.now() - debut.current > DUREE_MAX_MS) {
        setAbandon(true);
        clearInterval(t);
        return;
      }
      const r = await suivrePaiement(id);
      if (actif && (r.etat === "reussi" || r.etat === "echoue")) setEtat(r.etat);
    }, INTERVALLE_MS);
    return () => {
      actif = false;
      clearInterval(t);
    };
  }, [etat, id]);

  return (
    <div className="flex flex-col gap-4">
      <TitrePage titre="Votre paiement" />
      <Carte>
        {etat === "reussi" ? (
          <>
            <div className="flex items-center gap-2 text-base font-medium text-foreground">
              <Check className="h-5 w-5 text-brand-600" aria-hidden="true" /> Paiement reçu
            </div>
            <p className="!my-0 text-sm">Votre forfait de {fcfa(montant)} est ouvert. L&apos;agent peut commencer à travailler dès que vos comptes sont connectés.</p>
            <div>
              <Link href="/app/forfait" className={classeBouton("sombre", true)}>
                Voir mon forfait
              </Link>
            </div>
          </>
        ) : etat === "echoue" ? (
          <>
            <div className="flex items-center gap-2 text-base font-medium text-foreground">
              <X className="h-5 w-5 text-[#b4410e]" aria-hidden="true" /> Le paiement n&apos;a pas abouti
            </div>
            <p className="!my-0 text-sm">Rien n&apos;a été débité, ou la demande a été refusée ou annulée. Vous pouvez recommencer.</p>
            <div>
              <Link href="/app/forfait/recharger" className={classeBouton("sombre", true)}>
                Réessayer
              </Link>
            </div>
          </>
        ) : abandon ? (
          <>
            <div className="text-base font-medium text-foreground">Nous attendons encore la confirmation</div>
            <p className="!my-0 text-sm">Si vous avez validé le paiement sur votre téléphone, votre forfait s&apos;ouvrira dès que l&apos;opérateur nous confirmera. Revenez sur cette page dans quelques minutes, ou contactez le support.</p>
            <div>
              <Link href="/support" className={classeBouton("cadre", true)}>
                Contacter le support
              </Link>
            </div>
          </>
        ) : (
          <>
            <div role="status" aria-live="polite" className="flex items-center gap-2 text-base font-medium text-foreground">
              <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" /> En attente de votre validation
            </div>
            <p className="!my-0 text-sm">Une demande de {fcfa(montant)} vient d&apos;arriver sur votre téléphone. Validez-la avec votre code secret Mobile Money. Cette page se met à jour toute seule.</p>
            <Sourdine>Ne fermez pas cette page tant que vous n&apos;avez pas validé. Si rien n&apos;arrive sur votre téléphone, vérifiez votre numéro et réessayez.</Sourdine>
          </>
        )}
      </Carte>
    </div>
  );
}
