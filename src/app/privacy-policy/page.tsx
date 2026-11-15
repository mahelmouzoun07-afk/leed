import type { Metadata } from "next";
import { Legal } from "@/components/Legal";
import { BRAND } from "@/components/data";

export const metadata: Metadata = { title: `Privacy Policy — ${BRAND}` };

export default function Page() {
  return (
    <Legal
      title="Privacy Policy"
      updated="1 January 2026"
      intro={`This policy explains which personal data ${BRAND} processes, why, and the choices you have.`}
      sections={[
        { h: "Data we collect", p: ["Account details you give us, usage data from the app, and business contact data from public sources."] },
        { h: "Why we use it", p: ["To run the service, to bill you, to improve the product and to keep the platform secure."] },
        { h: "Legal basis", p: ["Contract for customers, and legitimate interest for business contact data, balanced against the rights of the people concerned."] },
        { h: "Sharing", p: ["We use trusted processors for hosting, email delivery and payments. We never sell personal data."] },
        { h: "Your rights", p: ["You can ask to access, correct or delete your data, or object to its use, at any time by contacting support."] },
        { h: "Retention", p: ["We keep data only as long as needed for the purposes above, then delete or anonymise it."] },
      ]}
    />
  );
}
