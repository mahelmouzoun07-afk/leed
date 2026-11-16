import { NavAdmin } from "./NavAdmin";
import { deconnecterAdmin } from "@/lib/auth/actions-admin";

/** Le cadre de l'espace équipe : identité, rôle, navigation, déconnexion. Affichage seulement. */
export function CadreAdmin({ email, role, base = "/admin", children, deconnexion = true }: { email: string; role: "admin" | "support"; base?: string; children: React.ReactNode; deconnexion?: boolean }) {
  return (
    <>
      <div className="mx-auto w-full max-w-[1100px] px-4 pb-28 pt-2 lg:pb-12">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <NavAdmin base={base} />
          <div className="ml-auto flex items-center gap-3">
            <div className="text-right text-sm leading-tight">
              <div className="max-w-[220px] truncate text-foreground">{email}</div>
              <div className="text-muted-foreground">{role === "admin" ? "administrateur" : "support"}</div>
            </div>
            {deconnexion && (
              <form action={deconnecterAdmin}>
                <button type="submit" className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-chip">
                  Me déconnecter
                </button>
              </form>
            )}
          </div>
        </div>
        {children}
      </div>
    </>
  );
}
