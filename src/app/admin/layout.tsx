import Link from "next/link";
import { Logo } from "@/components/ui";

/**
 * Espace équipe : une mise en page à part, sans l'en-tête ni le pied de page du site public.
 * Les pages de connexion et de vérification s'y affichent aussi ; la garde des autres pages
 * est dans (espace)/layout.tsx.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="landing min-h-screen bg-background text-foreground">
      <header className="mx-auto flex h-[72px] max-w-[1100px] items-center gap-3 px-4">
        <Link href="/" aria-label="Retour au site leed">
          <Logo />
        </Link>
        <span className="rounded-full bg-chip px-2.5 py-0.5 text-xs font-medium text-foreground">équipe</span>
      </header>
      {children}
    </div>
  );
}
