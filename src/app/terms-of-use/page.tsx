import type { Metadata } from "next";
import { Legal } from "@/components/Legal";
import { BRAND } from "@/components/data";

export const metadata: Metadata = { title: `Terms of use — ${BRAND}` };

export default function Page() {
  return (
    <Legal
      title="Terms of use"
      updated="1 January 2026"
      intro={`These terms describe how you may use ${BRAND} and what you can expect from us.`}
      sections={[
        { h: "Who we are", p: [`${BRAND} LTD provides an AI agent that finds business customers and contacts them by email on your behalf.`] },
        { h: "Your account", p: ["You are responsible for the accuracy of the information you give us and for keeping your sign-in details safe."] },
        { h: "Sending on your behalf", p: ["When you start a campaign you allow the agent to send emails in the name of your company.", "You must only promote products and services that you are allowed to offer."] },
        { h: "Payments and refunds", p: ["Credits are charged per email sent. Unused credits can be refunded as described on the pricing page."] },
        { h: "Acceptable use", p: ["No spam, misleading claims or content that breaks the law of the recipient's country."] },
        { h: "Liability", p: ["The service is provided as is. Our total liability is limited to the amount you paid in the last twelve months."] },
        { h: "Changes", p: ["We may update these terms and will tell you by email before important changes take effect."] },
      ]}
    />
  );
}
