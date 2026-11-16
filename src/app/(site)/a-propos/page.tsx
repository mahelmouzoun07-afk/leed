import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, MessageCircle, ShieldCheck, Smartphone } from "lucide-react";
import { BRAND } from "@/components/data";

export const metadata: Metadata = { title: `À propos | ${BRAND}` };

const PRINCIPES = [
  { Icone: MessageCircle, titre: "Là où l'on répond vraiment", texte: "Chez nous, les affaires se font sur WhatsApp, Instagram, Facebook et LinkedIn bien plus que par email. Leed prospecte sur ces canaux." },
  { Icone: Smartphone, titre: "Depuis vos propres comptes", texte: "Ce n'est pas un numéro inconnu qui écrit : c'est vous, avec votre nom, votre photo et votre historique. Vous gardez la main et pouvez débrancher à tout moment." },
  { Icone: BadgeCheck, titre: "Honnête, sans exception", texte: "Pas de fausse promesse, pas de faux chiffre, pas de fausse référence, pas de pression. Chaque message est contrôlé avant d'être envoyé." },
  { Icone: ShieldCheck, titre: "Le respect de ceux qui reçoivent", texte: "Quelqu'un qui répond STOP n'est plus jamais contacté, pour aucun de nos clients. Pas de message la nuit, ni pendant la prière du vendredi dans les pays concernés." },
];

export default function Page() {
  return (
    <>
      <section className="hero">
        <div className="w-full px-4 pt-10 text-center md:pb-16">
          <h1 className="hero-headline mx-auto max-w-[760px]">
            Vous savez faire votre métier. <span className="headline-accent">Leed s&apos;occupe de vendre.</span>
          </h1>
          <p className="mx-auto !mt-6 max-w-[600px] text-lg">
            Un graphiste à Cotonou, un traiteur à Abidjan, une imprimerie à Dakar : ils attendent que le client vienne. {BRAND} est l&apos;agent commercial qui va le chercher pour eux, en français, en FCFA, à partir de 5 000 FCFA.
          </p>
        </div>
      </section>

      <section>
        <div>
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2>Ce qui nous guide</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {PRINCIPES.map(({ Icone, titre, texte }) => (
              <div key={titre} className="glass-window-inner flex flex-col gap-3 p-6">
                <Icone className="h-6 w-6 text-indigo" aria-hidden="true" />
                <h3 className="text-xl font-medium text-foreground">{titre}</h3>
                <p className="!my-0 text-base">{texte}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-[680px] text-center">
          <h2>Essayez gratuitement</h2>
          <p className="text-lg">Donnez l&apos;adresse de votre site, ou décrivez votre activité : Leed vous montre combien d&apos;entreprises vous attendent.</p>
          <Link href="/demarrer/" className="cta-primary mt-4 inline-flex items-center gap-2 rounded-lg px-8 py-3 font-medium transition-all duration-300 hover:scale-105">
            Trouver mes clients <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}
