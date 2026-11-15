import type { Metadata } from "next";
import { Accordion } from "@/components/common";
import { BRAND, BRAND_LOWER } from "@/components/data";

export const metadata: Metadata = { title: `Compliance FAQ — ${BRAND}` };

export default function Page() {
  return (
    <div className="container mx-auto max-w-[1200px] flex-grow px-2 py-2 lg:px-4 lg:py-6">
      <h1 className="!mb-6 !text-3xl !font-bold text-foreground">Compliance FAQ</h1>
      <p className="mb-8">Answers to common questions about data compliance, security and privacy at {BRAND}.</p>
      <Accordion
        bordered
        items={[
          { q: `Is ${BRAND} GDPR compliant?`, a: "Yes. We process business contact data under legitimate interest and honour every data subject request." },
          { q: `What is ${BRAND}’s lawful basis to process the data?`, a: "Legitimate interest for B2B outreach, assessed and documented for each data source." },
          { q: "What sources does your database come from?", a: "Public company websites, official registries and map listings, refreshed regularly." },
          { q: "What is my responsibility as a customer?", a: "You decide who to contact and what to say, so you act as the controller of your campaigns." },
          { q: "How should I respond to people asking about their data?", a: "Forward the request to support and we will help you answer within the legal deadline." },
          { q: `Can I opt out of ${BRAND}'s database?`, a: "Yes, email support with your address and you will be removed and suppressed for all customers." },
          { q: `Is ${BRAND} SOC 2 compliant?`, a: "We follow SOC 2 aligned controls; a formal report is on our roadmap." },
        ]}
      />
      <div className="mt-12 rounded-lg bg-chip p-6">
        <h3 className="mb-4 text-xl font-semibold text-foreground">Still have questions?</h3>
        <p className="mb-4">Reach out to our team about compliance, data protection or security.</p>
        <div className="mt-4">
          <p>{BRAND} LTD</p>
          <p>Address: 1 Sample Street, London, EC1A 1AA</p>
          <p>
            Email:{" "}
            <a href={`mailto:privacy@${BRAND_LOWER}.example`} className="text-brand-500 hover:underline">
              privacy@{BRAND_LOWER}.example
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
