"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { BRAND, BRAND_LOWER, FOOTER } from "./data";

const link = "hover:text-muted-foreground transition-colors";

export function Footer() {
  const pathname = usePathname() || "/";
  if (pathname.startsWith("/affiliate")) {
    return (
      <footer className="border-t border-border">
        <div className="mx-auto max-w-[1200px] px-4 py-8 text-base text-muted-foreground">
          <Link prefetch={false} href="/" className="transition-colors hover:text-foreground">
            {BRAND_LOWER}.com
          </Link>
        </div>
      </footer>
    );
  }
  const regions = FOOTER.regions;
  const col = (items: ReadonlyArray<readonly [string, string]>) => (
    <ul className="space-y-2">
      {items.map(([name, slug]) => (
        <li key={slug}>
          <Link prefetch={false} href={`/b2b-database/locations/${slug}/`} className={link}>
            Companies in {name}
          </Link>
        </li>
      ))}
    </ul>
  );
  return (
    <footer className="border-t border-border text-base text-muted-foreground">
      <div className="container mx-auto max-w-[1200px] px-4 pb-4 pt-6 md:pb-6 md:pt-12 lg:pb-10 lg:pt-20">
        <div className="mb-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h4 className="mb-4 font-semibold text-muted-foreground">Products and GTM Tools</h4>
            <ul className="space-y-2">
              {FOOTER.products.map((p) => (
                <li key={p.label}>
                  <Link prefetch={false} href={p.href} className={link}>
                    {p.label}{" "}
                    {p.badge && (
                      <span className="inline-block rounded-md bg-chip px-1.5 py-0 align-middle text-[10px] font-medium text-muted-foreground">
                        {p.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold text-muted-foreground">B2B Databases</h4>
            {col(regions.slice(0, 5))}
          </div>
          <div>
            <h4 className="invisible mb-4 hidden font-semibold text-muted-foreground lg:block">B2B Databases</h4>
            {col(regions.slice(5))}
          </div>
          <div>
            <h4 className="mb-4 font-semibold text-muted-foreground">Resources</h4>
            <ul className="space-y-2">
              {FOOTER.resources.map((r) => (
                <li key={r.label}>
                  <Link prefetch={false} href={r.href} className={link}>
                    {r.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="pt-6">
          <div className="flex flex-col items-center justify-between md:flex-row">
            <p className="mb-2 md:mb-0">
              © 2026 {BRAND} LTD, made with <span className="text-brand-500">🌿</span> in London
            </p>
            <div className="flex flex-wrap items-center justify-center">
              <Link prefetch={false} href="/terms-of-use/" className="hover:underline">
                Terms of use
              </Link>
              <span className="mx-2">|</span>
              <Link prefetch={false} href="/privacy-policy/" className="hover:underline">
                Privacy Policy
              </Link>
            </div>
          </div>
          <p className="mt-2 text-center text-base font-medium md:text-left">
            Company No. 00000000 | VAT GB000000000 | 1 Sample Street, London, EC1A 1AA
          </p>
        </div>
      </div>
    </footer>
  );
}
