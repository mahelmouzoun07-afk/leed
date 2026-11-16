import { exigerAdmin } from "@/lib/auth/session";
import { deconnecterAdmin } from "@/lib/auth/actions-admin";

/**
 * Espace équipe. La garde `exigerAdmin` tourne à CHAQUE affichage d'une page de cet espace :
 * connecté, administrateur et double authentification validée. Les clients reçoivent une 404.
 */
export default async function Layout({ children }: { children: React.ReactNode }) {
  const { user, role } = await exigerAdmin();
  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 pb-24 pt-6 md:pt-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="text-sm font-medium text-foreground">Espace équipe Leed</div>
          <div className="text-sm text-muted-foreground">
            {user.email} · rôle {role === "admin" ? "administrateur" : "support"}
          </div>
        </div>
        <form action={deconnecterAdmin}>
          <button type="submit" className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-chip">
            Me déconnecter
          </button>
        </form>
      </div>
      {children}
    </div>
  );
}
