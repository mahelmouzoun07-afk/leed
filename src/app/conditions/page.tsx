import type { Metadata } from "next";
import { Legal } from "@/components/Legal";
import { BRAND } from "@/components/data";

export const metadata: Metadata = { title: `Conditions d'utilisation | ${BRAND}` };

export default function Page() {
  return (
    <Legal
      title="Conditions d'utilisation"
      updated="15 novembre 2026"
      intro={`Ces conditions expliquent comment utiliser ${BRAND} et ce que vous pouvez attendre de nous. Elles s'appliquent dès la création de votre compte.`}
      sections={[
        { h: "Le service", p: [`${BRAND} est un agent de prospection : il étudie votre activité, trouve des entreprises susceptibles d'avoir besoin de vous, leur écrit depuis vos propres comptes (email, WhatsApp, Instagram, Facebook, LinkedIn), répond à leurs réactions et propose des rendez-vous.`, "Le service s'adresse aux entreprises qui vendent à d'autres entreprises."] },
        { h: "Qui est l'éditeur", p: ["La raison sociale, l'adresse et le numéro d'enregistrement de l'éditeur seront indiqués ici avant l'ouverture du service."] },
        { h: "Votre compte", p: ["Vous êtes responsable de l'exactitude des informations que vous donnez et de la sécurité de votre mot de passe.", "Un essai gratuit est accordé par numéro WhatsApp vérifié, par adresse Gmail et par site web."] },
        { h: "Écrire en votre nom, depuis vos comptes", p: ["En connectant un compte, vous autorisez l'agent à envoyer des messages en votre nom, depuis ce compte, dans les limites que vous fixez. Vous pouvez débrancher un compte à tout moment.", "L'agent n'envoie jamais plus de 40 nouveaux messages par jour et par compte. Il ne nie jamais être une intelligence artificielle si on le lui demande."] },
        { h: "Les risques liés aux réseaux", p: ["Les réseaux comme WhatsApp, Instagram, Facebook ou LinkedIn fixent leurs propres règles et peuvent limiter ou bloquer un compte. Nous réduisons ce risque par des limites d'envoi prudentes, mais nous ne pouvons pas le supprimer ni garantir qu'un compte ne sera jamais restreint."] },
        { h: "Le forfait et les paiements", p: ["Le forfait est d'un montant libre à partir de 5 000 FCFA, valable 30 jours, payé en Mobile Money. Il n'y a pas d'abonnement ni de renouvellement automatique.", "Une entreprise est décomptée quand le premier message est bien parti. Si le message n'est pas livré, elle vous est rendue. Les réponses et les rendez-vous ne coûtent rien de plus.", "Si vous rechargez avant la fin des 30 jours, les entreprises restantes sont reportées. Après 30 jours sans recharge, vous avez 7 jours de grâce : plus de nouveaux envois, mais l'agent continue de répondre aux conversations en cours. Ensuite, les entreprises restantes sont gelées et reviennent à votre prochaine recharge dans les 12 mois."] },
        { h: "Ce qui est interdit", p: ["Vous ne pouvez pas utiliser le service pour promouvoir les jeux d'argent et paris, les crypto-monnaies et placements promettant des gains, les contenus pour adultes, les partis et campagnes politiques, les prêts à taux abusifs, les armes, les médicaments et produits de santé non autorisés, ni quoi que ce soit d'illégal dans le pays du destinataire.", "Aucun message ne doit contenir de fausse promesse, de faux chiffres ou de fausse référence. L'agent contrôle chaque message avant envoi et peut le refuser."] },
        { h: "Les personnes qui disent STOP", p: [`Toute personne qui répond STOP, bloque votre numéro ou signale un message n'est plus jamais contactée, pour aucun client de ${BRAND}.`] },
        { h: "Responsabilité", p: ["Le service est fourni tel quel. Notre responsabilité est limitée au montant que vous avez payé pour le forfait en cours, sauf dans les cas où la loi l'interdit."] },
        { h: "Changements", p: ["Nous pouvons modifier ces conditions. Nous vous prévenons par email avant tout changement important."] },
      ]}
    />
  );
}
