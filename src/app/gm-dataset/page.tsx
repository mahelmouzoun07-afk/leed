import type { Metadata } from "next";
import { CatalogHero, CountryList, GradientNum } from "@/components/Catalog";
import { BRAND } from "@/components/data";

export const metadata: Metadata = { title: `Google Maps Dataset — ${BRAND}` };

export default function Page() {
  return (
    <>
      <CatalogHero
        title="Google Maps"
        accent="Dataset"
        sub="218M+ places with category, address, phone, website, rating and opening hours, including businesses with no online footprint."
      />
      <CountryList
        title={
          <>
            Most common categories across <GradientNum>218M+</GradientNum> places
          </>
        }
        rows={[
          ["Restaurants", "14M+"],
          ["Shops and retail", "12M+"],
          ["Beauty and wellness", "6M+"],
          ["Health clinics", "5M+"],
          ["Auto repair", "3M+"],
          ["Hotels and lodging", "2M+"],
          ["Real estate agencies", "2M+"],
          ["Construction contractors", "2M+"],
          ["Schools", "1M+"],
          ["Gyms", "1M+"],
        ]}
      />
    </>
  );
}
