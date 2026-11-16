"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BlocErreur, Champ, inputClass } from "@/components/form";
import { Carte, Chiffres, Ligne, Sourdine, Titrine, TitrePage, classeBouton, fcfa, nombre } from "@/components/app/kit";
import { Puce } from "@/components/form";
import { Slider } from "@/components/ui";
import { bareme, economie, marcheSuivante, montantDepuisPosition } from "@/lib/forfait";
import { deviseDuPays, exigeCodeOtp, type Reseau } from "@/lib/paiement/reseaux";
import { payerForfait, verifierCodePromo, type EtatCode } from "@/lib/paiement/actions";
import { CODE_MAX } from "@/lib/promo";

/** La position du curseur qui donne le montant le plus proche de celui demandé (ex. venant du choix de l'offre). */
function positionPour(montant: number | undefined): number {
  if (!montant) return 50;
  let meilleure = 50;
  let ecart = Infinity;
  for (let p = 0; p <= 100; p++) {
    const e = Math.abs(montantDepuisPosition(p) - montant);
    if (e < ecart) {
      ecart = e;
      meilleure = p;
    }
  }
  return meilleure;
}

/**
 * Recharger : le palier suivant est toujours montré, avec l'économie en FCFA. Le client paie EXACTEMENT le montant choisi
 * (les frais de paiement sont à notre charge). Le paiement part sur son téléphone ; la page de suivi attend la confirmation.
 */
export function Recharge({ restantes, avantLaFin, reseaux, pays, montantInitial, demo = false }: { restantes: number; avantLaFin: boolean; reseaux: Reseau[] | null; pays: string | null; montantInitial?: number; demo?: boolean }) {
  const router = useRouter();
  const [pos, setPos] = useState(() => positionPour(montantInitial));
  const [reseau, setReseau] = useState(reseaux?.[0]?.code ?? "");
  const [etat, action, enCours] = useActionState(payerForfait, {});
  const montant = montantDepuisPosition(pos);
  const b = bareme(montant);
  const suivante = marcheSuivante(montant);
  const gain = economie(montant);
  const bonus = avantLaFin ? Math.floor((b.entreprises * b.palier.bonus) / 100) : 0;

  // Le code promo : l'écran montre l'effet du code, mais le prix est recalculé par la base au moment de payer.
  const [codeOuvert, setCodeOuvert] = useState(false);
  const [code, setCode] = useState("");
  const [promo, setPromo] = useState<EtatCode | null>(null);
  const [verification, setVerification] = useState(false);
  const promoActif = !!promo?.ok;
  const aPayer = promoActif ? promo?.aPayer ?? montant : montant;
  const gratuit = promoActif && aPayer === 0;
  const complet = promoActif && !!promo?.accesComplet;
  const paiementPossible = !demo && (gratuit || (!!deviseDuPays(pays) && !!reseaux && reseaux.length > 0));

  async function appliquerCode() {
    if (!code.trim()) return;
    setVerification(true);
    setPromo(await verifierCodePromo(code, montant));
    setVerification(false);
  }
  function retirerCode() {
    setPromo(null);
    setCode("");
  }

  // Quand le montant change, la remise est recalculée (après une courte pause du curseur).
  useEffect(() => {
    if (!promoActif || !code.trim()) return;
    const t = setTimeout(() => {
      void verifierCodePromo(code, montant).then(setPromo);
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seul le montant doit relancer le calcul
  }, [montant]);

  useEffect(() => {
    if (!etat.ok || !etat.paiementId) return;
    if (etat.redirection) window.location.assign(etat.redirection);
    else router.push(`/app/forfait/paiement/${etat.paiementId}`);
  }, [etat, router]);

  return (
    <div className="flex flex-col gap-4">
      <TitrePage titre="Recharger" retour="/app/forfait" />
      <div className="flex flex-col gap-2">
        <span className="text-[2rem] font-semibold tabular-nums leading-tight text-foreground" aria-live="polite">
          {fcfa(montant)}
        </span>
        <Slider value={pos} onChange={setPos} label="Montant de la recharge" />
        <Ligne className="text-muted-foreground">
          <span>5 000</span>
          <span>150 000</span>
        </Ligne>
      </div>
      <Chiffres
        colonnes={2}
        items={[
          [nombre(b.entreprises), "entreprises"],
          [`${b.prix} F`, "par entreprise"],
          [complet ? "Tous" : b.comptes, !complet && b.comptes === "1" ? "compte" : "comptes"],
          [`${complet ? 40 : b.parJour}/j`, "rythme"],
        ]}
      />
      {complet && (
        <Carte ton="calme">
          <p className="!my-0 text-sm !text-foreground">Avec ce code, vous avez accès à toutes les fonctionnalités : tous vos comptes, le rythme maximal et des cibles illimitées.</p>
        </Carte>
      )}
      {suivante && !complet && (
        <Carte ton="calme">
          <p className="!my-0 text-sm !text-foreground">{suivante}</p>
        </Carte>
      )}
      {gain > 0 && <Sourdine>À {fcfa(montant)}, vous économisez {fcfa(gain)} par rapport au prix de base.</Sourdine>}
      <Carte ton="calme">
        <Ligne>
          <span>Entreprises reportées</span>
          <b className="tabular-nums text-brand-600">+{nombre(restantes)}</b>
        </Ligne>
        <Ligne>
          <span>Bonus de fidélité</span>
          <b className="tabular-nums text-brand-600">{avantLaFin ? `+${b.palier.bonus} % (${nombre(bonus)})` : "recharge avant la fin du forfait"}</b>
        </Ligne>
      </Carte>

      <Carte>
        {!codeOuvert && !promoActif ? (
          <button type="button" onClick={() => setCodeOuvert(true)} className="text-left text-sm font-medium text-foreground underline underline-offset-4">
            J&apos;ai un code promo
          </button>
        ) : promoActif ? (
          <div className="flex flex-col gap-2" aria-live="polite">
            <Ligne>
              <span className="text-sm text-muted-foreground">Code promo</span>
              <button type="button" onClick={retirerCode} className="text-sm text-muted-foreground underline underline-offset-4">Retirer</button>
            </Ligne>
            <p className="!my-0 text-sm font-medium !text-foreground">{promo?.message}</p>
            <Ligne>
              <span>Prix du forfait</span>
              <span className="tabular-nums text-muted-foreground line-through">{fcfa(montant)}</span>
            </Ligne>
            <Ligne>
              <b>À payer</b>
              <b className="tabular-nums text-brand-600">{fcfa(aPayer)}</b>
            </Ligne>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Champ id="code-promo" label="Code promo" aide="8 à 12 lettres ou chiffres, majuscules ou minuscules.">
              <input
                id="code-promo"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/[^A-Za-z0-9]/g, "").slice(0, CODE_MAX));
                  setPromo(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void appliquerCode();
                  }
                }}
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                maxLength={CODE_MAX}
                className={`${inputClass} uppercase tracking-wider`}
              />
            </Champ>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={appliquerCode} disabled={verification || code.trim().length < 8} className={classeBouton("cadre", true)}>
                {verification ? "Vérification…" : "Appliquer"}
              </button>
              <button type="button" onClick={() => { setCodeOuvert(false); retirerCode(); }} className="text-sm text-muted-foreground underline underline-offset-4">Annuler</button>
            </div>
            {promo && !promo.ok && <BlocErreur message={promo.message} />}
          </div>
        )}
      </Carte>

      <form action={action} noValidate className="flex flex-col gap-4">
        <input type="hidden" name="montant" value={montant} />
        {!gratuit && <input type="hidden" name="reseau" value={reseau} />}
        {promoActif && <input type="hidden" name="code" value={code} />}
        {demo && <Sourdine>Mode démonstration : aucun paiement n&apos;est lancé.</Sourdine>}
        {!demo && !gratuit && !deviseDuPays(pays) && <BlocErreur message="Le paiement n'est pas encore disponible dans votre pays. Écrivez-nous depuis la page Support." />}
        {!demo && !gratuit && !!deviseDuPays(pays) && reseaux === null && <BlocErreur message="Le paiement est momentanément indisponible. Réessayez dans quelques minutes." />}
        {!demo && !gratuit && !!deviseDuPays(pays) && reseaux !== null && reseaux.length === 0 && <BlocErreur message="Aucun opérateur Mobile Money n'est encore disponible dans votre pays." />}
        {gratuit && <Sourdine>Rien à payer : votre forfait s&apos;ouvre tout de suite.</Sourdine>}
        {!gratuit && reseaux && reseaux.length > 0 && (
          <>
            <div className="flex flex-col gap-2">
              <Titrine>Opérateur</Titrine>
              <div role="radiogroup" aria-label="Opérateur Mobile Money" className="flex flex-wrap gap-2">
                {reseaux.map((r) => (
                  <Puce radio key={r.code} actif={reseau === r.code} onClick={() => setReseau(r.code)}>
                    {r.nom}
                  </Puce>
                ))}
              </div>
            </div>
            <Champ id="telephone" label="Numéro de votre compte Mobile Money" aide="C'est sur ce téléphone que vous validerez le paiement.">
              <input id="telephone" name="telephone" type="tel" autoComplete="tel" placeholder="+229 01 23 45 67 89" required className={inputClass} />
            </Champ>
            {exigeCodeOtp(reseau) && (
              <Champ id="otp" label="Code à usage unique" aide="Générez-le sur votre téléphone (code USSD de l'opérateur), puis saisissez-le ici.">
                <input id="otp" name="otp" inputMode="numeric" autoComplete="one-time-code" maxLength={20} className={inputClass} />
              </Champ>
            )}
          </>
        )}
        {etat.message && !etat.ok && <BlocErreur message={etat.message} />}
        <button type="submit" disabled={!paiementPossible || enCours || (!gratuit && !reseau)} className={classeBouton("action", false, true)}>
          {enCours ? (gratuit ? "Activation…" : "Envoi de la demande…") : gratuit ? "Activer mon forfait offert" : `Payer ${fcfa(aPayer)}`}
        </button>
        <Sourdine>
          {gratuit
            ? "Aucun paiement n'est demandé. Aucun abonnement, aucun renouvellement automatique."
            : `Vous payez exactement ${fcfa(aPayer)}${promoActif ? ` au lieu de ${fcfa(montant)}` : ""} : les frais de paiement sont à notre charge. Aucun abonnement, aucun renouvellement automatique.`}
        </Sourdine>
      </form>
    </div>
  );
}
