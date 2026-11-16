import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { PricingCalc } from "@/components/home/Features";
import { Accordion } from "@/components/common";
import { PALIERS, formaterFcfa } from "@/lib/forfait";

const INCLUS = ["La recherche de l'entreprise et de ses coordonnées", "Son étude : ce qu'elle fait et pourquoi lui écrire maintenant", "Un premier message personnel", "Jusqu'à 2 relances", "Toutes les réponses de l'agent", "La prise de rendez-vous dans votre agenda"];

const comptes = (c: number | "tous") => (c === "tous" ? "Tous" : String(c));
const cibles = (c: number | "illimitees") => (c === "illimitees" ? "Illimité" : String(c));
const suivant = (i: number) => (PALIERS[i + 1] ? `${formaterFcfa(PALIERS[i].min)} à ${formaterFcfa(PALIERS[i + 1].min - 1)}` : `${formaterFcfa(PALIERS[i].min)} et plus`);

export function PricingPage() {
  return (
    <>
      <section className="hero">
        <div className="w-full px-4 pt-10 text-center md:pb-10">
          <h1 className="hero-headline mx-auto max-w-[760px]">
            Payez le montant que <span className="headline-accent">vous voulez</span>
          </h1>
          <p className="mx-auto !mt-6 max-w-[600px] text-lg">Pas d&apos;abonnement. Un forfait de 30 jours à partir de 5 000 FCFA, payé en Mobile Money. Plus vous mettez, moins l&apos;entreprise contactée coûte cher.</p>
          <div className="mt-10">
            <PricingCalc />
          </div>
        </div>
      </section>

      <section>
        <div>
          <div className="mx-auto mb-10 max-w-xl text-center">
            <h2>Ce qui change selon le forfait</h2>
          </div>
          <div className="glass-window-inner overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-base">
              <caption className="sr-only">Prix, comptes connectés et rythme selon le montant du forfait</caption>
              <thead>
                <tr className="border-b border-border text-sm text-muted-foreground">
                  <th scope="col" className="px-4 py-3 font-medium">Forfait (FCFA)</th>
                  <th scope="col" className="px-4 py-3 font-medium">Par entreprise</th>
                  <th scope="col" className="px-4 py-3 font-medium">Comptes en même temps</th>
                  <th scope="col" className="px-4 py-3 font-medium">Entreprises par jour</th>
                  <th scope="col" className="px-4 py-3 font-medium">Cibles actives</th>
                </tr>
              </thead>
              <tbody>
                {PALIERS.map((p, i) => (
                  <tr key={p.min} className="border-b border-border last:border-0">
                    <th scope="row" className="px-4 py-3 font-medium text-foreground tabular-nums">{suivant(i)}</th>
                    <td className="px-4 py-3 tabular-nums text-foreground">{p.prix} FCFA</td>
                    <td className="px-4 py-3 text-foreground">{comptes(p.comptes)}</td>
                    <td className="px-4 py-3 tabular-nums text-foreground">{p.parJour}</td>
                    <td className="px-4 py-3 text-foreground">{cibles(p.cibles)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mx-auto !mt-4 max-w-[680px] text-center text-sm">Tous les réseaux (email, WhatsApp, Instagram, Facebook, LinkedIn) sont ouverts dès 5 000 FCFA. Le montant décide du nombre de comptes que vous connectez en même temps, et de la vitesse.</p>
        </div>
      </section>

      <section>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="glass-window-inner flex flex-col p-6">
            <h2 className="!mb-2 !text-2xl !leading-snug">Tout est compris dans l&apos;entreprise contactée</h2>
            <ul className="mt-3 space-y-2">
              {INCLUS.map((f) => (
                <li key={f} className="flex items-start gap-2 text-base text-muted-foreground">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" /> {f}
                </li>
              ))}
            </ul>
            <p className="!mb-0 text-sm">Une entreprise est décomptée quand le premier message est bien parti. Message non livré : elle vous est rendue.</p>
          </div>
          <div className="glass-window-inner flex flex-col p-6">
            <h2 className="!mb-2 !text-2xl !leading-snug">Essai gratuit</h2>
            <ul className="mt-3 space-y-2">
              {["10 entreprises contactées par email, depuis votre Gmail", "7 jours", "Le tableau de bord complet et les réponses reçues", "Les autres entreprises restent floutées"].map((f) => (
                <li key={f} className="flex items-start gap-2 text-base text-muted-foreground">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" /> {f}
                </li>
              ))}
            </ul>
            <p className="text-sm">Un essai par numéro WhatsApp vérifié, par adresse Gmail et par site web. Un premier forfait pris dans les 48 heures qui suivent l&apos;essai donne 20 % d&apos;entreprises en plus.</p>
            <Link href="/demarrer/" className="cta-primary mt-auto inline-flex items-center justify-center gap-2 self-start rounded-lg px-6 py-3 font-medium transition-all duration-300 hover:scale-[1.02]">
              Essayer gratuitement <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-[720px]">
          <div className="mx-auto mb-10 max-w-xl text-center">
            <h2>Questions sur les tarifs</h2>
          </div>
          <Accordion
            items={[
              { q: "Qu'est-ce qui est décompté ?", a: "Une entreprise contactée, tout compris : sa recherche, son étude, le premier message, jusqu'à 2 relances et toutes les réponses. Les réponses et les rendez-vous ne coûtent jamais rien de plus." },
              { q: "Que se passe-t-il au bout de 30 jours ?", a: "Si vous rechargez avant la fin, les entreprises restantes sont reportées, avec un bonus de fidélité. Sinon, vous avez 7 jours de grâce : plus de nouveaux envois, mais l'agent continue de répondre aux conversations en cours." },
              { q: "Est-ce que je perds les entreprises que je n'ai pas utilisées ?", a: "Non. Après la grâce, vos comptes sont débranchés et les entreprises restantes sont gelées. Elles reviennent à votre prochaine recharge, dans les 12 mois." },
              { q: "Et si j'utilise tout avant 30 jours ?", a: "Vous pouvez recharger tout de suite : les 30 jours repartent de zéro." },
              { q: "Pourquoi le nombre de comptes dépend-il du forfait ?", a: "Chaque compte connecté (WhatsApp, Instagram, LinkedIn, email) a un coût pour nous. Avec 20 entreprises à contacter, un seul compte suffit largement : l'agent vous indique lequel choisir. Vous pouvez en changer d'un mois sur l'autre." },
              { q: "Quels moyens de paiement ?", a: "Le Mobile Money : MTN MoMo, Moov Money, Wave et Orange Money, selon votre pays." },
            ]}
          />
        </div>
      </section>
    </>
  );
}
