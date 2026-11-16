import type { Metadata } from "next";
import Link from "next/link";
import { Accordion } from "@/components/common";
import { BRAND, CONTACT } from "@/components/data";

export const metadata: Metadata = { title: `Questions sur la conformité | ${BRAND}` };

export default function Page() {
  return (
    <div className="container mx-auto max-w-[1200px] flex-grow px-4 py-6 lg:py-10">
      <h1 className="!mb-6 !text-3xl !font-bold text-foreground">Questions sur la conformité</h1>
      <p className="mb-8 max-w-[820px]">Les réponses aux questions les plus fréquentes sur les données, la sécurité et le respect des personnes que vous contactez.</p>
      <Accordion
        bordered
        items={[
          { q: "Qui écrit aux entreprises : vous ou moi ?", a: `Vous. ${BRAND} écrit depuis vos propres comptes, en votre nom. C'est votre numéro, votre adresse et votre nom qui apparaissent, pas les nôtres.` },
          { q: "Que se passe-t-il si quelqu'un répond STOP ?", a: `Il n'est plus jamais contacté, ni par vous ni par aucun autre client de ${BRAND}. La demande est prise en compte immédiatement.` },
          { q: "L'agent peut-il se faire passer pour un humain ?", a: "Il écrit en votre nom, mais il ne nie jamais être une intelligence artificielle si on le lui demande, et il ne se fait jamais passer pour une administration, une banque ou un opérateur." },
          { q: "Quelles activités refusez-vous ?", a: "Les jeux d'argent et paris, les crypto-monnaies et placements promettant des gains, les contenus pour adultes, les partis et campagnes politiques, les prêts à taux abusifs, les armes, les médicaments et produits de santé non autorisés, et tout ce qui est illégal dans le pays du destinataire." },
          { q: "Mes comptes risquent-ils d'être bloqués ?", a: "Les réseaux fixent leurs propres règles et peuvent restreindre un compte. Pour limiter ce risque, l'agent n'envoie jamais plus de 40 nouveaux messages par jour et par compte et respecte des horaires de 8 h à 19 h chez le destinataire. Le risque ne peut pas être supprimé." },
          { q: "D'où viennent les entreprises que vous trouvez ?", a: "D'informations professionnelles publiques : sites web, pages d'entreprises, annuaires et registres. Nous n'achetons pas de listes de particuliers." },
          { q: "Que voyez-vous dans mes comptes ?", a: "Seulement ce qui est nécessaire pour écrire en votre nom et suivre les réponses. La liste exacte est affichée avant la connexion, et vous pouvez débrancher à tout moment. Nous ne voyons jamais vos mots de passe." },
          { q: "Comment une entreprise peut-elle demander à ne plus être contactée ?", a: `En répondant STOP, ou en écrivant à ${CONTACT.confidentialite}.` },
        ]}
      />
      <div className="mt-12 max-w-[820px] rounded-lg bg-chip p-6">
        <h2 className="!mb-3 !text-xl !font-semibold text-foreground">Une autre question ?</h2>
        <p className="!mb-0">
          Écrivez-nous à{" "}
          <a href={`mailto:${CONTACT.confidentialite}`} className="text-foreground underline underline-offset-4">
            {CONTACT.confidentialite}
          </a>
          . Vous pouvez aussi lire nos{" "}
          <Link href="/conditions/" className="text-foreground underline underline-offset-4">
            conditions d&apos;utilisation
          </Link>{" "}
          et notre{" "}
          <Link href="/confidentialite/" className="text-foreground underline underline-offset-4">
            page confidentialité
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
