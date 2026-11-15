"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { BlocErreur, Champ, boutonPrincipal, estEmail, inputClass } from "@/components/form";
import { BoutonGoogle } from "@/app/connexion/Connexion";
import { useParcours } from "@/lib/parcours/etat";
import { creerCompte } from "@/lib/parcours/factice";

const PAYS = ["Bénin", "Côte d'Ivoire", "Sénégal", "Togo", "Mali", "Burkina Faso", "Niger", "Guinée", "Cameroun", "Gabon", "Congo", "RD Congo", "Ghana", "Nigeria", "Autre pays"];

export function Inscription() {
  const router = useRouter();
  const { maj, etat } = useParcours();
  const [v, setV] = useState({ prenom: "", entreprise: "", email: "", motDePasse: "", whatsapp: "", pays: "Bénin", cgu: false });
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const champ = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setV({ ...v, [k]: e.target.value });

  const envoyer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);
    const err: Record<string, string> = {};
    if (v.prenom.trim().length < 2) err.prenom = "Entrez votre prénom et votre nom.";
    if (v.entreprise.trim().length < 2) err.entreprise = "Entrez le nom de votre entreprise : il apparaît dans vos messages.";
    if (!estEmail(v.email)) err.email = "Entrez une adresse email valide.";
    if (v.motDePasse.length < 8) err.motDePasse = "Le mot de passe doit contenir au moins 8 caractères.";
    if (!/^\+?\d{8,15}$/.test(v.whatsapp.replace(/[\s.-]/g, ""))) err.whatsapp = "Entrez un numéro WhatsApp valide, avec l'indicatif, par exemple +229 01 23 45 67 89.";
    if (!v.cgu) err.cgu = "Vous devez accepter les conditions pour continuer.";
    setErreurs(err);
    if (Object.keys(err).length) return;
    setEnvoi(true);
    const r = await creerCompte({ prenom: v.prenom.trim(), entreprise: v.entreprise.trim(), email: v.email.trim(), pays: v.pays });
    setEnvoi(false);
    if (!r.ok) return setErreur(r.erreur);
    maj({ compte: { prenom: v.prenom.trim(), entreprise: v.entreprise.trim(), email: v.email.trim(), pays: v.pays } });
    router.push("/choisir/");
  };

  const total = etat.apercu?.total;
  const mauvais = (k: string) => (erreurs[k] ? "!border-destructive" : "");

  return (
    <div className="mx-auto w-full max-w-[520px] px-4 pb-24 pt-10 md:pt-16">
      <div className="glass-window-inner p-6">
        <h1 className="!text-[1.75rem] !font-medium !leading-tight tracking-[-0.02em]">Créez votre compte</h1>
        <p className="!mt-1 text-base">
          {total ? `Tout ce que vous venez de faire est conservé : vos ${total.toLocaleString("fr-FR").replace(/[  ]/g, " ")} entreprises vous attendent.` : "Une minute suffit."}
        </p>
        <div className="mt-5">
          <BoutonGoogle libelle="S'inscrire avec Google" />
        </div>
        <div className="my-4 flex items-center gap-3 text-sm text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          ou
          <span className="h-px flex-1 bg-border" />
        </div>
        {erreur && (
          <div className="mb-4">
            <BlocErreur message={erreur}>
              <Link href="/connexion/" className="text-sm text-foreground underline underline-offset-4">
                Aller à la connexion
              </Link>
            </BlocErreur>
          </div>
        )}
        <form noValidate onSubmit={envoyer} className="flex flex-col gap-4">
          <Champ id="prenom" label="Prénom et nom" erreur={erreurs.prenom}>
            <input id="prenom" autoComplete="name" value={v.prenom} onChange={champ("prenom")} className={`${inputClass} ${mauvais("prenom")}`} />
          </Champ>
          <Champ id="entreprise" label="Nom de votre entreprise" erreur={erreurs.entreprise}>
            <input id="entreprise" autoComplete="organization" value={v.entreprise} onChange={champ("entreprise")} className={`${inputClass} ${mauvais("entreprise")}`} />
          </Champ>
          <Champ id="email" label="Adresse email" erreur={erreurs.email}>
            <input id="email" type="email" autoComplete="email" value={v.email} onChange={champ("email")} className={`${inputClass} ${mauvais("email")}`} />
          </Champ>
          <Champ id="motDePasse" label="Mot de passe" aide="8 caractères au moins." erreur={erreurs.motDePasse}>
            <input id="motDePasse" type="password" autoComplete="new-password" value={v.motDePasse} onChange={champ("motDePasse")} className={`${inputClass} ${mauvais("motDePasse")}`} />
          </Champ>
          <Champ id="whatsapp" label="Votre numéro WhatsApp" aide="Nous vous enverrons un code pour le vérifier. Un seul essai gratuit par numéro." erreur={erreurs.whatsapp}>
            <input id="whatsapp" type="tel" autoComplete="tel" placeholder="+229 01 23 45 67 89" value={v.whatsapp} onChange={champ("whatsapp")} className={`${inputClass} ${mauvais("whatsapp")}`} />
          </Champ>
          <Champ id="pays" label="Pays">
            <select id="pays" value={v.pays} onChange={champ("pays")} className={inputClass}>
              {PAYS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </Champ>
          <div>
            <label className="flex cursor-pointer items-start gap-2">
              <input type="checkbox" checked={v.cgu} onChange={(e) => setV({ ...v, cgu: e.target.checked })} className="mt-[3px] h-4 w-4 shrink-0 accent-[var(--primary)]" />
              <span className="text-sm leading-snug text-muted-foreground">
                J'accepte les{" "}
                <Link href="/terms-of-use/" target="_blank" className="text-foreground underline underline-offset-4">
                  conditions d'utilisation
                </Link>{" "}
                et la{" "}
                <Link href="/privacy-policy/" target="_blank" className="text-foreground underline underline-offset-4">
                  politique de confidentialité
                </Link>
                .
              </span>
            </label>
            {erreurs.cgu && (
              <div role="alert" className="mt-1.5 text-sm text-destructive">
                {erreurs.cgu}
              </div>
            )}
          </div>
          <button type="submit" disabled={envoi} className={`${boutonPrincipal} w-full`}>
            {envoi ? "Création du compte…" : "Créer mon compte"} {!envoi && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
          </button>
        </form>
        <p className="!mb-0 !mt-5 text-center text-sm">
          Déjà un compte ?{" "}
          <Link href="/connexion/" className="text-foreground underline underline-offset-4">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
