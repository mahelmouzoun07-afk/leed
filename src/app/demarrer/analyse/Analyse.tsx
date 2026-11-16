"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Check, LoaderCircle } from "lucide-react";
import { BlocErreur, boutonPrincipal, boutonSecondaire } from "@/components/form";
import { useParcours } from "@/lib/parcours/etat";
import { normaliserSite } from "@/lib/parcours/site";
import { analyserActivite, poserQuestions } from "@/lib/parcours/actions";
import type { Entree } from "@/lib/parcours/types";

const LIGNES = ["Je lis votre site…", "J'identifie ce que vous vendez…", "J'étudie vos concurrents…", "Je cherche qui achète ce que vous vendez…"];

export function Analyse() {
  const router = useRouter();
  const params = useSearchParams();
  const { etat, pret, maj } = useParcours();
  const [erreur, setErreur] = useState<string | null>(null);
  const [ligne, setLigne] = useState(0);
  const [enCours, setEnCours] = useState(false);
  const lance = useRef(false);

  // Le visiteur arrive soit de l'accueil (?site=…), soit de l'écran précédent.
  const entreeUrl: Entree | null = (() => {
    const s = params.get("site");
    const d = s ? normaliserSite(s) : null;
    return d ? { mode: "site", site: d } : null;
  })();
  const entree = entreeUrl ?? etat.entree ?? null;

  const lancer = useCallback(
    async (e: Entree) => {
      setErreur(null);
      setEnCours(true);
      setLigne(0);
      const r = await analyserActivite(e);
      if (!r.ok) {
        setErreur(r.erreur);
        setEnCours(false);
        return;
      }
      const q = await poserQuestions(e);
      maj({ entree: e, fiche: r.donnees, questions: q.ok ? q.donnees : [] });
      setEnCours(false);
    },
    [maj],
  );

  useEffect(() => {
    if (!pret || lance.current) return;
    if (!entree) {
      router.replace("/demarrer/");
      return;
    }
    if (etat.fiche && !entreeUrl) return;
    lance.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture du stockage du navigateur ou lancement d'un travail après l'affichage (évite un écart entre serveur et navigateur)
    void lancer(entree);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pret]);

  useEffect(() => {
    if (!enCours) return;
    const t = setInterval(() => setLigne((n) => Math.min(n + 1, LIGNES.length - 1)), 700);
    return () => clearInterval(t);
  }, [enCours]);

  const suite = () => router.push(etat.questions && etat.questions.length > 0 ? "/demarrer/questions/" : "/demarrer/profils/");

  if (erreur) {
    return (
      <BlocErreur message={erreur}>
        <button
          type="button"
          className={boutonPrincipal}
          onClick={() => {
            if (entree) void lancer(entree);
          }}
        >
          Réessayer
        </button>
        <Link href="/demarrer/?mode=formulaire" className={boutonSecondaire}>
          Décrire mon activité
        </Link>
      </BlocErreur>
    );
  }

  if (!pret || enCours || !etat.fiche) {
    return (
      <div>
        <h1 className="hero-headline !text-[clamp(1.875rem,7vw,2.875rem)]">
          Leed étudie <span className="headline-accent">votre activité</span>
        </h1>
        <ul className="glass-window-inner mt-8 flex flex-col gap-3 p-5" role="status" aria-live="polite">
          {LIGNES.map((l, i) => (
            <li key={l} className="flex items-center gap-2 text-base transition-opacity duration-300" style={{ opacity: i <= ligne ? 1 : 0.3 }}>
              {i < ligne ? <Check className="h-4 w-4 text-brand-600" aria-hidden="true" /> : i === ligne ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <span className="h-4 w-4" />}
              <span className="text-foreground">{l}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const f = etat.fiche;
  return (
    <div>
      <h1 className="hero-headline !text-[clamp(1.875rem,7vw,2.875rem)]">
        Voici ce que Leed a <span className="headline-accent">compris</span>
      </h1>
      <p className="!mt-3 max-w-[600px] text-base">Vérifiez cette fiche : c&apos;est elle qui guide tous les messages. Vous pourrez la corriger plus tard.</p>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="glass-window-inner p-5 md:col-span-2">
          <div className="text-sm font-medium text-muted-foreground">Votre activité</div>
          <div className="mt-2 text-lg font-medium text-foreground">{f.nom}</div>
          <p className="!mb-0 !mt-1 text-base">{f.resume}</p>
        </div>
        <div className="glass-window-inner p-5">
          <div className="text-sm font-medium text-muted-foreground">Ce que vous proposez</div>
          <ul className="mt-2 flex flex-col gap-1.5 text-base text-foreground">
            {f.offres.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </div>
        {f.forces.length > 0 && (
          <div className="glass-window-inner p-5">
            <div className="text-sm font-medium text-muted-foreground">Vos points forts</div>
            <ul className="mt-2 flex flex-col gap-1.5 text-base text-foreground">
              {f.forces.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="glass-window-inner p-5">
          <div className="text-sm font-medium text-muted-foreground">Votre zone</div>
          <p className="!mb-0 !mt-2 text-base text-foreground">{f.zone}</p>
        </div>
        {/* Les concurrents ne sont montrés que s'ils sont cités sur le site : l'IA n'en devine jamais. */}
        {f.concurrents.length > 0 && (
          <div className="glass-window-inner p-5">
            <div className="text-sm font-medium text-muted-foreground">Concurrents cités</div>
            <ul className="mt-2 flex flex-col gap-1.5 text-base text-foreground">
              {f.concurrents.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <button type="button" onClick={suite} className={boutonPrincipal}>
          C&apos;est bien ça, continuer <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
        <Link href="/demarrer/" className={boutonSecondaire}>
          Modifier ma description
        </Link>
      </div>
    </div>
  );
}
