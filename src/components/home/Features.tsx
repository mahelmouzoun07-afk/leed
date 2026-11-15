"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Building2, Gauge, Link2, Tag } from "lucide-react";
import { Slider } from "../ui";

function TiltCard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      className="relative h-full transition-transform duration-300 ease-out"
      style={{ transformStyle: "preserve-3d", willChange: "transform" }}
      onMouseMove={(e) => {
        const r = ref.current!.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        ref.current!.style.transform = `perspective(800px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg)`;
      }}
      onMouseLeave={() => {
        ref.current!.style.transform = "";
      }}
    >
      {children}
    </div>
  );
}

// Trois faits de notre offre (docs/VISION.md, docs/OFFRE-ET-PRIX.md) : aucun chiffre de résultat.
const FEATURES = [
  { n: "5", pre: "", suf: "", rest: "réseaux, vos propres comptes", text: "WhatsApp, Instagram, Facebook, LinkedIn et email : c'est vous qui écrivez, pas un numéro inconnu" },
  { n: "40", pre: "", suf: "", rest: "messages par jour, pas plus", text: "Par compte connecté, pour que vos comptes restent en sécurité" },
  { n: "5 000", pre: "Dès ", suf: " FCFA", rest: "", text: "En Mobile Money, sans abonnement ni carte bancaire" },
];

export function ThreeThings() {
  return (
    <section>
      <div>
        <div>
          <div className="mb-12 text-center">
            <h2>Ce qui rend Leed différent</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <TiltCard key={f.text}>
                <div className="glass-window-inner flex h-full min-h-[160px] flex-col p-4 md:p-6">
                  <div className="text-[clamp(24px,4.5vw,36px)] font-medium leading-tight text-foreground">
                    <span className="tabular-nums">{f.pre}{f.n}{f.suf}</span> {f.rest}
                  </div>
                  <p className="!mb-0 !mt-auto pt-6 text-base leading-relaxed text-muted-foreground">{f.text}</p>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* Position du curseur (0–100) -> montant du forfait en FCFA.
   Le curseur démarre sur 25 000 FCFA (position 50). */
const POINTS: [number, number][] = [
  [0, 5000],
  [25, 10000],
  [50, 25000],
  [75, 50000],
  [100, 150000],
];
function montant(pos: number) {
  for (let i = 1; i < POINTS.length; i++) {
    const [p0, v0] = POINTS[i - 1];
    const [p1, v1] = POINTS[i];
    if (pos <= p1) {
      const v = v0 + ((pos - p0) / (p1 - p0)) * (v1 - v0);
      return v < 25000 ? Math.round(v / 1000) * 1000 : Math.round(v / 5000) * 5000;
    }
  }
  return 150000;
}

/* Barème du forfait : source unique docs/OFFRE-ET-PRIX.md. */
export function bareme(fcfa: number) {
  const prix = fcfa >= 100000 ? 175 : fcfa >= 50000 ? 200 : fcfa >= 25000 ? 225 : 250;
  const comptes = fcfa >= 50000 ? "Tous" : fcfa >= 25000 ? "3" : fcfa >= 10000 ? "2" : "1";
  const parJour = fcfa >= 50000 ? 40 : fcfa >= 25000 ? 20 : fcfa >= 10000 ? 10 : 5;
  return { prix, comptes, parJour, entreprises: Math.floor(fcfa / prix) };
}
const fmt = (n: number) => n.toLocaleString("fr-FR").replace(/\u202f|\u00a0/g, " ");

export function PricingCalc() {
  const [pos, setPos] = useState(50);
  const fcfa = montant(pos);
  const b = bareme(fcfa);
  const tiles = [
    { icon: Building2, value: fmt(b.entreprises), label: "Entreprises contactées", tip: "Recherche, étude, message, relances et réponses compris" },
    { icon: Tag, value: `${b.prix} FCFA`, label: "Par entreprise" },
    { icon: Link2, value: b.comptes, label: b.comptes === "1" ? "Compte connecté" : "Comptes connectés", tip: "WhatsApp, Instagram, Facebook, LinkedIn ou email, au choix" },
    { icon: Gauge, value: `${b.parJour} par jour`, label: "Rythme de l'agent" },
  ];
  const essayer = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.getElementById("hero-website-input")?.focus({ preventScroll: true });
  };
  return (
    <div className="glass-window-inner mx-auto max-w-[680px] p-4 md:px-9 md:py-6">
      <div className="mb-7">
        <div className="relative pt-9">
          <span
            className="absolute top-[-5px] -translate-x-1/2 whitespace-nowrap text-2xl font-semibold tabular-nums text-foreground"
            style={{ left: `clamp(64px, calc((100% - 16px) * ${pos / 100} + 8px), calc(100% - 72px))` }}
          >
            {fmt(fcfa)} FCFA
          </span>
          <Slider value={pos} onChange={setPos} label="Montant du forfait" />
        </div>
      </div>
      <div className="mb-7 grid grid-cols-2 gap-2">
        {tiles.map((t) => (
          <div key={t.label} className="relative flex flex-col rounded-lg bg-chip p-2">
            <span className="absolute right-2 top-2" title={t.tip}>
              <t.icon className={`h-5 w-5 text-muted-foreground ${t.tip ? "cursor-help" : ""}`} strokeWidth={1.5} />
            </span>
            <div className="break-words pr-7 text-2xl font-semibold tabular-nums text-foreground">{t.value}</div>
            <div className="mt-auto flex items-center gap-1 pt-2 text-base font-medium text-muted-foreground">{t.label}</div>
          </div>
        ))}
      </div>
      <div className="text-center">
        <button
          type="button"
          onClick={essayer}
          className="cta-primary inline-flex items-center gap-2 rounded-lg px-8 py-3 font-medium transition-all duration-300 hover:scale-105"
        >
          Essayer gratuitement
          <ArrowRight className="h-4 w-4" />
        </button>
        <p className="!mb-0 !mt-3 text-sm">Forfait valable 30 jours · Tous les réseaux dès 5 000 FCFA</p>
      </div>
    </div>
  );
}

export function Pricing() {
  return (
    <section>
      <div>
        <div id="pricing" className="scroll-mt-24">
          <div className="mx-auto mb-12 max-w-xl text-center">
            <h2>Payez ce que vous voulez, sans abonnement</h2>
          </div>
          <PricingCalc />
        </div>
      </div>
    </section>
  );
}
