import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogHero, CountryList, GradientNum, IndustriesList, REGION_COUNTRIES, REGION_COUNTS } from "@/components/Catalog";
import { BRAND, FOOTER } from "@/components/data";

export const dynamicParams = false;

export function generateStaticParams() {
  return FOOTER.regions.map(([, slug]) => ({ slug }));
}

const nameOf = (slug: string) => FOOTER.regions.find(([, s]) => s === slug)?.[0];

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Companies in ${nameOf(slug) ?? "the world"} — ${BRAND}` };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const name = nameOf(slug);
  if (!name) notFound();
  return (
    <>
      <CatalogHero
        title="Companies in"
        accent={name}
        sub={`${REGION_COUNTS[slug]} company profiles in ${name}, with industries, size, contacts and websites.`}
      />
      <CountryList
        title={
          <>
            Top locations in {name} <GradientNum>{REGION_COUNTS[slug]}</GradientNum>
          </>
        }
        rows={REGION_COUNTRIES[slug]}
      />
      <IndustriesList where={name} />
    </>
  );
}
