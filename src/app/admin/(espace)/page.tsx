import type { Metadata } from "next";
import { exigerAdmin } from "@/lib/auth/session";
import { creerClientServeur } from "@/lib/supabase/server";
import { BlocErreur } from "@/components/form";

export const metadata: Metadata = { title: "Clients | Équipe Leed", robots: { index: false, follow: false } };

const STATUT: Record<string, string> = { actif: "Actif", grace: "En grâce", gele: "Gelé", epuise: "Épuisé", expire: "Expiré" };
const date = (v: string | null) => (v ? new Date(v).toLocaleDateString("fr-FR") : "—");

export default async function Page() {
  await exigerAdmin();
  const supabase = await creerClientServeur();
  // La fonction SQL revérifie le rôle administrateur à chaque appel.
  const { data, error } = await supabase.rpc("admin_resume_clients");
  if (error) return <BlocErreur message="Impossible de charger la liste des clients pour le moment." />;
  return (
    <div>
      <h1 className="!text-[1.75rem] !font-medium !leading-tight">Clients</h1>
      {data.length === 0 ? (
        <p className="text-base">Aucun client pour l&apos;instant.</p>
      ) : (
        <div className="glass-window-inner mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-base">
            <caption className="sr-only">Résumé des clients</caption>
            <thead>
              <tr className="border-b border-border text-sm text-muted-foreground">
                <th scope="col" className="px-4 py-3 font-medium">Client</th>
                <th scope="col" className="px-4 py-3 font-medium">Pays</th>
                <th scope="col" className="px-4 py-3 font-medium">Forfait</th>
                <th scope="col" className="px-4 py-3 font-medium">Entreprises restantes</th>
                <th scope="col" className="px-4 py-3 font-medium">Fin</th>
                <th scope="col" className="px-4 py-3 font-medium">Comptes connectés</th>
              </tr>
            </thead>
            <tbody>
              {data.map((c) => (
                <tr key={c.entreprise_id} className="border-b border-border last:border-0">
                  <th scope="row" className="px-4 py-3 font-medium text-foreground">{c.nom}</th>
                  <td className="px-4 py-3 text-foreground">{c.pays ?? "—"}</td>
                  <td className="px-4 py-3 text-foreground">{c.forfait_statut ? STATUT[c.forfait_statut] : "Aucun"}</td>
                  <td className="px-4 py-3 tabular-nums text-foreground">{c.entreprises_restantes ?? "—"}</td>
                  <td className="px-4 py-3 text-foreground">{date(c.fin)}</td>
                  <td className="px-4 py-3 tabular-nums text-foreground">{c.comptes_actifs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
