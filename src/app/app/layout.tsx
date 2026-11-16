import { CadreApp } from "@/components/app/CadreApp";
import { contexteApp } from "@/lib/app/donnees";
import { DEMO } from "@/lib/app/vues";

/** Espace client : la garde (connecté + une entreprise) est rejouée ici, à chaque affichage. */
export default async function Layout({ children }: { children: React.ReactNode }) {
  const ctx = await contexteApp();
  let decisionsNb = DEMO.decisions.length;
  if (!ctx.demo) {
    const { count } = await ctx.sb.from("decisions").select("id", { count: "exact", head: true }).eq("entreprise_id", ctx.entrepriseId).eq("statut", "ouverte");
    decisionsNb = count ?? 0;
  }
  return (
    <CadreApp nom={ctx.entrepriseNom} demo={ctx.demo} decisionsNb={decisionsNb}>
      {children}
    </CadreApp>
  );
}
