import { Shell } from "@/components/Shell";
import { Footer } from "@/components/Footer";

/** Le site public et le parcours d'inscription : en-tête et pied de page de leed. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <Shell footer={<Footer />}>{children}</Shell>;
}
