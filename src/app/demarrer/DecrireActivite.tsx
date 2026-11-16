"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Globe, PenLine } from "lucide-react";
import { Champ, Puce, boutonPrincipal, inputClass } from "@/components/form";
import { useParcours } from "@/lib/parcours/etat";
import { normaliserSite } from "@/lib/parcours/site";
import type { Formulaire } from "@/lib/parcours/types";

const SECTEURS = ["Restaurants et maquis", "Boutiques", "Écoles et formations", "Hôtels et résidences", "Beauté et bien-être", "Santé", "Immobilier", "Construction", "Transport et logistique", "Agriculture", "Services aux entreprises"];
const TAILLES = ["1 à 10 personnes", "11 à 50 personnes", "51 à 200 personnes", "Plus de 200"];
const OBJECTIFS = ["Des rendez-vous", "Des devis", "Des démonstrations", "Des commandes"];

const vide: Formulaire = { vend: "", client: "", secteurs: [], taille: "", zone: "", prixMoyen: "", objectif: "" };
const REMISE = { fiche: undefined, questions: undefined, reponses: undefined, profils: undefined, apercu: undefined };

export function DecrireActivite() {
  const router = useRouter();
  const params = useSearchParams();
  const { etat, pret, maj } = useParcours();
  const [mode, setMode] = useState<"site" | "formulaire">(params.get("mode") === "formulaire" ? "formulaire" : "site");
  const [site, setSite] = useState(params.get("site") ?? "");
  const [f, setF] = useState<Formulaire>(vide);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});

  // Si le visiteur revient en arrière, on lui rend ce qu'il avait écrit.
  useEffect(() => {
    if (!pret || !etat.entree) return;
    if (etat.entree.mode === "site") {
      const precedent = etat.entree.site;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture du stockage du navigateur ou lancement d'un travail après l'affichage (évite un écart entre serveur et navigateur)
      setSite((s) => s || precedent);
    } else {
      setF(etat.entree.formulaire);
      if (!params.get("mode")) setMode("formulaire");
    }
  }, [pret, etat.entree, params]);

  const basculer = (m: "site" | "formulaire") => {
    setMode(m);
    setErreurs({});
  };
  const cocher = (s: string) => setF((x) => ({ ...x, secteurs: x.secteurs.includes(s) ? x.secteurs.filter((v) => v !== s) : [...x.secteurs, s] }));

  const envoyer = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "site") {
      const d = normaliserSite(site);
      if (!d) return setErreurs({ site: "Entrez une adresse de site valide, par exemple votreentreprise.com" });
      maj({ entree: { mode: "site", site: d }, ...REMISE });
    } else {
      const err: Record<string, string> = {};
      if (f.vend.trim().length < 20) err.vend = "Décrivez ce que vous vendez en quelques phrases (20 caractères au moins).";
      if (!f.client.trim()) err.client = "Dites-nous qui sont vos clients idéaux.";
      if (!f.zone.trim()) err.zone = "Indiquez au moins un pays ou une ville.";
      if (!f.objectif) err.objectif = "Choisissez ce que vous voulez obtenir.";
      setErreurs(err);
      if (Object.keys(err).length) return;
      maj({ entree: { mode: "formulaire", formulaire: f }, ...REMISE });
    }
    router.push("/demarrer/analyse/");
  };

  return (
    <form noValidate onSubmit={envoyer}>
      <h1 className="hero-headline !text-[clamp(1.875rem,7vw,2.875rem)]">
        Dites-nous ce que <span className="headline-accent">vous vendez</span>
      </h1>
      <p className="!mt-3 max-w-[600px] text-base">Leed étudie votre activité avant de chercher vos clients. Deux façons de lui présenter votre travail.</p>

      <div role="tablist" aria-label="Comment décrire votre activité" className="mt-6 inline-flex rounded-xl bg-chip p-1">
        {[
          { id: "site", label: "J'ai un site web", Icone: Globe },
          { id: "formulaire", label: "Je n'ai pas de site", Icone: PenLine },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={mode === t.id}
            onClick={() => basculer(t.id as "site" | "formulaire")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${mode === t.id ? "bg-card text-foreground shadow-[var(--shadow-plaque)]" : "text-muted-foreground hover:text-foreground"}`}
          >
            <t.Icone className="h-4 w-4" aria-hidden="true" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="glass-window-inner mt-6 p-5 md:p-6">
        {mode === "site" ? (
          <div className="flex flex-col gap-4">
            <Champ id="site" label="L'adresse de votre site" aide="Ou celle de la page qui présente votre produit ou votre application." erreur={erreurs.site}>
              <input id="site" type="text" inputMode="url" autoComplete="off" placeholder="studiokoffi.bj" value={site} aria-invalid={!!erreurs.site} onChange={(e) => setSite(e.target.value)} className={`${inputClass} ${erreurs.site ? "!border-destructive" : ""}`} />
            </Champ>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <Champ id="vend" label="Ce que vous vendez" erreur={erreurs.vend}>
              <textarea id="vend" rows={4} value={f.vend} onChange={(e) => setF({ ...f, vend: e.target.value })} placeholder="Ex. Je crée des logos, des affiches et des visuels pour les restaurants et les boutiques de Cotonou" className={`${inputClass} !h-auto resize-none p-3 ${erreurs.vend ? "!border-destructive" : ""}`} />
            </Champ>
            <Champ id="client" label="Votre client idéal" erreur={erreurs.client}>
              <input id="client" type="text" value={f.client} onChange={(e) => setF({ ...f, client: e.target.value })} placeholder="Ex. Un gérant de restaurant qui vient d'ouvrir" className={`${inputClass} ${erreurs.client ? "!border-destructive" : ""}`} />
            </Champ>
            <div>
              <div className="mb-1.5 text-sm font-medium text-foreground" id="secteurs-label">
                Secteurs visés <span className="font-normal text-muted-foreground">(facultatif)</span>
              </div>
              <div role="group" aria-labelledby="secteurs-label" className="flex flex-wrap gap-2">
                {SECTEURS.map((s) => (
                  <Puce key={s} actif={f.secteurs.includes(s)} onClick={() => cocher(s)}>
                    {s}
                  </Puce>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-1.5 text-sm font-medium text-foreground" id="taille-label">
                Taille des entreprises visées <span className="font-normal text-muted-foreground">(facultatif)</span>
              </div>
              <div role="radiogroup" aria-labelledby="taille-label" className="flex flex-wrap gap-2">
                {TAILLES.map((t) => (
                  <Puce radio key={t} actif={f.taille === t} onClick={() => setF({ ...f, taille: f.taille === t ? "" : t })}>
                    {t}
                  </Puce>
                ))}
              </div>
            </div>
            <Champ id="zone" label="Pays et villes" erreur={erreurs.zone}>
              <input id="zone" type="text" value={f.zone} onChange={(e) => setF({ ...f, zone: e.target.value })} placeholder="Ex. Cotonou, Porto-Novo, Abidjan" className={`${inputClass} ${erreurs.zone ? "!border-destructive" : ""}`} />
            </Champ>
            <Champ id="prix" label="Votre prix moyen, en FCFA" aide="Facultatif. L'agent ne citera jamais un prix que vous n'avez pas indiqué.">
              <input id="prix" type="text" inputMode="numeric" value={f.prixMoyen} onChange={(e) => setF({ ...f, prixMoyen: e.target.value })} placeholder="Ex. 50 000" className={inputClass} />
            </Champ>
            <div>
              <div className="mb-1.5 text-sm font-medium text-foreground" id="objectif-label">
                Ce que vous voulez obtenir
              </div>
              <div role="radiogroup" aria-labelledby="objectif-label" className="flex flex-wrap gap-2">
                {OBJECTIFS.map((o) => (
                  <Puce radio key={o} actif={f.objectif === o} onClick={() => setF({ ...f, objectif: o })}>
                    {o}
                  </Puce>
                ))}
              </div>
              {erreurs.objectif && (
                <div role="alert" className="mt-1.5 text-sm text-destructive">
                  {erreurs.objectif}
                </div>
              )}
            </div>
          </div>
        )}
        <button type="submit" className={`${boutonPrincipal} mt-6 w-full md:w-auto`}>
          Analyser mon activité <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}
