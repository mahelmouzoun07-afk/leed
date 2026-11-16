import { CadreAdmin } from "@/components/admin/CadreAdmin";
import { exigerAdmin } from "@/lib/auth/session";

/**
 * Espace équipe. La garde `exigerAdmin` tourne à CHAQUE affichage d'une page de cet espace :
 * connecté, administrateur et double authentification validée. Les clients reçoivent une 404.
 */
export default async function Layout({ children }: { children: React.ReactNode }) {
  const { user, role } = await exigerAdmin();
  return (
    <CadreAdmin email={user.email ?? ""} role={role}>
      {children}
    </CadreAdmin>
  );
}
