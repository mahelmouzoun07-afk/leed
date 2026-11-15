import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Accordion } from "../common";

const QUESTIONS = [
  { q: "Je n'ai pas de site web. Puis-je quand même essayer ?", a: "Oui. Vous décrivez votre activité dans un court formulaire : ce que vous vendez, qui sont vos clients idéaux, où vous travaillez. Leed fait le reste." },
  { q: "Qui écrit aux entreprises ?", a: "Vous. Leed écrit depuis vos propres comptes (WhatsApp, Instagram, Facebook, LinkedIn, email), en votre nom. Vous pouvez débrancher un compte à tout moment." },
  { q: "Combien ça coûte ?", a: "L'essai est gratuit : 10 entreprises contactées par email depuis votre Gmail. Ensuite, un forfait au montant libre à partir de 5 000 FCFA, valable 30 jours, payé en Mobile Money. Pas d'abonnement." },
  { q: "Mes comptes risquent-ils d'être bloqués ?", a: "Les réseaux ont leurs propres règles, et ce risque ne peut pas être supprimé. Leed n'envoie jamais plus de 40 nouveaux messages par jour et par compte, et respecte des horaires de 8 h à 19 h chez le destinataire." },
  { q: "Que se passe-t-il si quelqu'un répond STOP ?", a: "Il n'est plus jamais contacté, ni par vous ni par aucun autre client de Leed." },
  { q: "Qui décide de ce qui est envoyé ?", a: "Vous gardez la main. Vous validez le ton des messages au départ, et l'agent vous demande votre avis sur les décisions importantes." },
];

export function Faq() {
  return (
    <section>
      <div className="mx-auto max-w-[720px]">
        <div className="mx-auto mb-10 max-w-xl text-center">
          <h2>Questions fréquentes</h2>
        </div>
        <Accordion items={QUESTIONS} />
      </div>
    </section>
  );
}

export function AppelFinal() {
  return (
    <section>
      <div className="mx-auto max-w-[680px] text-center">
        <h2>Prêt à trouver vos clients ?</h2>
        <p className="text-lg">Donnez l&apos;adresse de votre site, ou décrivez votre activité. C&apos;est gratuit pour commencer.</p>
        <Link href="/demarrer/" className="cta-primary mt-4 inline-flex items-center gap-2 rounded-lg px-8 py-3 font-medium transition-all duration-300 hover:scale-105">
          Trouver mes clients <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
