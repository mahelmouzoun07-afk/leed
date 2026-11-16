import type { Metadata } from "next";
import Link from "next/link";
import { exigerEntreprise } from "@/lib/auth/session";
import { deconnecter } from "@/lib/auth/actions";

export const metadata: Metadata = { title: "Mon espace | Leed" };

/** Espace client : l'accès est revérifié ici, côté serveur, à chaque affichage. Le tableau de bord arrive ensuite. */
export default async function Page() {
  const { entreprise } = await exigerEntreprise();
  return (
    <div className="mx-auto w-full max-w-[720px] px-4 pb-24 pt-10 md:pt-16">
      <h1 className="hero-headline !text-[clamp(1.875rem,7vw,2.875rem)]">
        Bonjour, <span className="headline-accent">{entreprise.nom}</span>
      </h1>
      <p className="!mt-3 text-base">Votre espace est en cours de préparation. Vous serez prévenu dès que votre tableau de bord ouvre.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/choisir/" className="cta-primary inline-flex items-center rounded-lg px-6 py-3 font-medium">
          Choisir mon forfait
        </Link>
        <form action={deconnecter}>
          <button type="submit" className="inline-flex items-center rounded-lg border border-border px-5 py-3 font-medium text-foreground transition-colors hover:bg-chip">
            Me déconnecter
          </button>
        </form>
      </div>
    </div>
  );
}
