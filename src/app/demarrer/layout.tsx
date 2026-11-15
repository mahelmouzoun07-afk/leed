import { EtapesParcours } from "@/components/parcours/Etapes";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[880px] px-4 pb-24 pt-6 md:pt-10">
      <EtapesParcours />
      {children}
    </div>
  );
}
