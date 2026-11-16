"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Chargement, Puce, boutonPrincipal, boutonSecondaire } from "@/components/form";
import { useParcours } from "@/lib/parcours/etat";

export function Questions() {
  const router = useRouter();
  const { etat, pret, maj } = useParcours();
  const [reponses, setReponses] = useState<Record<string, string>>({});
  const questions = etat.questions ?? [];

  useEffect(() => {
    if (!pret) return;
    if (!etat.fiche) router.replace("/demarrer/");
    else if (questions.length === 0) router.replace("/demarrer/profils/");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture du stockage du navigateur ou lancement d'un travail après l'affichage (évite un écart entre serveur et navigateur)
    else if (etat.reponses) setReponses(etat.reponses);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pret]);

  if (!pret || questions.length === 0) return <Chargement texte="Chargement…" />;

  const complet = questions.every((q) => reponses[q.id]);
  const continuer = () => {
    maj({ reponses });
    router.push("/demarrer/profils/");
  };

  return (
    <div>
      <h1 className="hero-headline !text-[clamp(1.875rem,7vw,2.875rem)]">
        {questions.length === 1 ? "Une question" : `${questions.length} questions`} <span className="headline-accent">rapides</span>
      </h1>
      <p className="!mt-3 max-w-[600px] text-base">Leed pose seulement ce qu&apos;il ne peut pas deviner. Un clic suffit.</p>
      <div className="mt-6 flex flex-col gap-4">
        {questions.map((q) => (
          <div key={q.id} className="glass-window-inner p-5">
            <div id={`q-${q.id}`} className="text-base font-medium text-foreground">
              {q.texte}
            </div>
            <div role="radiogroup" aria-labelledby={`q-${q.id}`} className="mt-3 flex flex-wrap gap-2">
              {q.choix.map((c) => (
                <Puce radio key={c} actif={reponses[q.id] === c} onClick={() => setReponses({ ...reponses, [q.id]: c })}>
                  {c}
                </Puce>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <button type="button" disabled={!complet} onClick={continuer} className={boutonPrincipal}>
          Continuer <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
        <button type="button" onClick={() => router.push("/demarrer/profils/")} className={boutonSecondaire}>
          Passer
        </button>
      </div>
    </div>
  );
}
