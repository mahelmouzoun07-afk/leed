import type { Metadata } from "next";
import { CatalogHero, CountryList, GradientNum, IndustriesList, RegionsGrid } from "@/components/Catalog";
import { BRAND } from "@/components/data";

export const metadata: Metadata = { title: `Global B2B Company Database — ${BRAND}` };

const COUNTRIES: [string, string][] = [
  ["United States", "22M+"],
  ["Germany", "6M+"],
  ["United Kingdom", "6M+"],
  ["India", "5M+"],
  ["China", "4M+"],
  ["Brazil", "4M+"],
  ["France", "4M+"],
  ["Japan", "3M+"],
  ["Spain", "3M+"],
  ["Russian Federation", "2M+"],
  ["Canada", "2M+"],
  ["Italy", "2M+"],
  ["Australia", "2M+"],
  ["Netherlands", "1M+"],
];

export default function Page() {
  return (
    <>
      <CatalogHero
        title="Largest Global B2B"
        accent="Company Database"
        sub="Access 105M+ company profiles with firmographics, contacts and AI-derived signals, ready for search, export or the API."
      />
      <RegionsGrid />
      <IndustriesList />
      <CountryList
        title={
          <>
            Browse companies across <GradientNum>238</GradientNum> countries
          </>
        }
        rows={COUNTRIES}
      />
    </>
  );
}
