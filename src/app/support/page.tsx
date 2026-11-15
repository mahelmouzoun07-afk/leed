import type { Metadata } from "next";
import Link from "next/link";
import { BRAND, CONTACT } from "@/components/data";

export const metadata: Metadata = { title: `Support | ${BRAND}` };

const lien = "text-foreground underline underline-offset-4 hover:text-muted-foreground";

export default function Page() {
  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col gap-6 px-4 pb-16 pt-8 md:pt-16">
      <div className="flex flex-col gap-4">
        <h1 className="!text-[1.875rem] !font-medium !leading-tight">Support {BRAND}</h1>
        <p className="!my-0 text-base">
          Une question sur votre compte, votre forfait ou une campagne ? Écrivez-nous à{" "}
          <a href={`mailto:${CONTACT.support}`} className={lien}>
            {CONTACT.support}
          </a>
          . Indiquez l&apos;adresse email de votre compte pour que nous puissions vous retrouver.
        </p>
        <div>
          <a href={`mailto:${CONTACT.support}`} className="cta-primary inline-flex items-center justify-center rounded-xl px-5 py-3 font-medium">
            Écrire au support
          </a>
        </div>
      </div>
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-6">
        <h2 className="!mb-0 !text-xl !font-medium !leading-snug">Un message envoyé en votre nom pose problème ?</h2>
        <p className="!my-0 text-base">
          Si une personne vous signale un message ou demande à ne plus être contactée, écrivez-nous tout de suite. Elle ne sera plus jamais contactée, pour aucun client de {BRAND}.
        </p>
      </div>
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-6">
        <h2 className="!mb-0 !text-xl !font-medium !leading-snug">Pour aller plus vite</h2>
        <ul className="flex list-disc flex-col gap-2 pl-5 text-base text-muted-foreground">
          <li>
            <Link href="/tarifs/" className={lien}>
              Comprendre le forfait et ses règles
            </Link>
          </li>
          <li>
            <Link href="/conformite/" className={lien}>
              Questions sur la conformité et les comptes connectés
            </Link>
          </li>
        </ul>
        <p className="!my-0 text-base">
          <Link href="/conditions/" className={lien}>
            Conditions d&apos;utilisation
          </Link>{" "}
          ·{" "}
          <Link href="/confidentialite/" className={lien}>
            Confidentialité
          </Link>
        </p>
      </div>
    </div>
  );
}
