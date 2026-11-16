import { EtapesParcours } from "@/components/parcours/Etapes";
import { Shell } from "@/components/Shell";
import { Footer } from "@/components/Footer";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Shell footer={<Footer />}>
      <div className="mx-auto w-full max-w-[880px] px-4 pb-24 pt-6 md:pt-10">
        <EtapesParcours />
        {children}
      </div>
    </Shell>
  );
}
