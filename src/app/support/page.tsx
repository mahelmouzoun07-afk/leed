import type { Metadata } from "next";
import Link from "next/link";
import { BRAND, BRAND_LOWER } from "@/components/data";
import { SupportActions } from "./SupportActions";

export const metadata: Metadata = { title: `Support — ${BRAND}` };

export default function Page() {
  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col gap-6 px-4 pb-16 pt-8 md:pt-16">
      <div className="flex flex-col gap-4">
        <h1 className="!text-[1.875rem] !font-medium !leading-tight">{BRAND} support</h1>
        <p className="!my-0 text-base">
          Questions about your account, a campaign or a charge? Chat with us here or email{" "}
          <a href={`mailto:support@${BRAND_LOWER}.example`} className="text-foreground underline underline-offset-4 hover:text-muted-foreground">
            support@{BRAND_LOWER}.example
          </a>
        </p>
        <SupportActions />
      </div>
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-6">
        <h2 className="!mb-0 !text-xl !font-medium !leading-snug">Seeing {BRAND.toUpperCase()} on your card statement?</h2>
        <p className="!my-0 text-base">That’s us. {BRAND} is an AI agent that finds B2B customers for a business and emails them. A charge from us is one of these:</p>
        <ul className="flex list-disc flex-col gap-2 pl-5 text-base text-muted-foreground">
          <li>Emails the agent sent, billed per email within your daily budget</li>
          <li>A monthly fee for mailboxes and domains</li>
          <li>A data plan for company search and exports</li>
          <li>A credit pack you bought</li>
        </ul>
        <p className="!my-0 text-base">Don’t recognize it? Send us the date and amount and we’ll tell you which account it belongs to</p>
      </div>
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-6">
        <h2 className="!mb-0 !text-xl !font-medium !leading-snug">Company</h2>
        <p className="!my-0 text-base">
          {BRAND} LTD, company 00000000, registered in England and Wales
          <br />1 Sample Street, London EC1A 1AA
        </p>
        <p className="!my-0 text-base">
          <Link href="/terms-of-use/" className="text-foreground underline underline-offset-4 hover:text-muted-foreground">
            Terms of Use
          </Link>{" "}
          ·{" "}
          <Link href="/privacy-policy/" className="text-foreground underline underline-offset-4 hover:text-muted-foreground">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
