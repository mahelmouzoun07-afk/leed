import type { Metadata } from "next";
import { Legal } from "@/components/Legal";
import { BRAND } from "@/components/data";

export const metadata: Metadata = { title: `Affiliate Program Terms — ${BRAND}` };

export default function Page() {
  return (
    <Legal
      title="Affiliate Program Terms"
      updated="1 January 2026"
      intro="The agreement between you, as a partner, and us."
      sections={[
        { h: "Commission", p: ["20 percent of net revenue from each referred customer for 12 months after their first payment."] },
        { h: "Attribution", p: ["30 day cookie, last click wins. Self-referrals are not eligible."] },
        { h: "Payouts", p: ["Monthly, once your cleared balance reaches $25, by PayPal, Wise or bank transfer."] },
        { h: "Promotion rules", p: ["No brand bidding in paid search, no incentivized traffic, no spam."] },
        { h: "Termination", p: ["Either side can end the partnership at any time. Cleared commissions are still paid."] },
      ]}
    />
  );
}
