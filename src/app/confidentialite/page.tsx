import type { Metadata } from "next";
import { Legal } from "@/components/Legal";
import { BRAND, CONTACT } from "@/components/data";

export const metadata: Metadata = { title: `Confidentialité | ${BRAND}` };

export default function Page() {
  return (
    <Legal
      title="Confidentialité"
      updated="15 novembre 2026"
      intro={`Cette page explique quelles données ${BRAND} collecte, pourquoi, et comment vous gardez la main dessus.`}
      sections={[
        { h: "Ce que nous collectons sur vous", p: ["Votre nom, le nom de votre entreprise, votre adresse email, votre numéro WhatsApp, votre pays, et ce que vous nous dites de votre activité (adresse de votre site, description, cibles, réglages).", "Votre mot de passe est stocké sous une forme que nous ne pouvons pas lire."] },
        { h: "Les comptes que vous connectez", p: ["Quand vous connectez un compte (email, WhatsApp, Instagram, Facebook, LinkedIn), nous lisons uniquement ce qui est nécessaire pour écrire en votre nom et suivre les réponses. La liste exacte vous est montrée avant la connexion et vous devez l'accepter.", `${BRAND} ne voit jamais le mot de passe de vos réseaux : la connexion se fait dans une fenêtre sécurisée. Nous nous appuyons sur un prestataire technique de connexion de messageries pour cela. Vous pouvez débrancher un compte à tout moment.`] },
        { h: "Les entreprises que nous contactons", p: ["Nous traitons des informations professionnelles sur des entreprises (nom, activité, ville, coordonnées de contact de l'entreprise) pour leur proposer vos services. Nous gardons une liste commune des personnes qui ont dit STOP : elles ne sont plus jamais contactées, pour aucun de nos clients."] },
        { h: "À quoi servent ces données", p: ["Faire fonctionner le service, vous facturer, vous aider, protéger vos comptes et empêcher les abus. Nous ne vendons pas vos données."] },
        { h: "Vos droits", p: [`Vous pouvez demander l'accès à vos données, leur correction, leur suppression ou leur export en écrivant à ${CONTACT.confidentialite}. Une entreprise contactée peut aussi demander à ne plus l'être, à la même adresse.`, "Notre déclaration auprès de l'autorité de protection des données du Bénin (APDP) est en préparation."] },
        { h: "Combien de temps nous gardons les données", p: ["Pendant la durée de votre compte, puis le temps nécessaire pour respecter nos obligations légales. Les entreprises gelées de votre forfait sont conservées 12 mois."] },
      ]}
    />
  );
}
