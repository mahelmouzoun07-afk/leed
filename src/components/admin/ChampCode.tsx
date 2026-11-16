"use client";

import { useState } from "react";
import { Dices } from "lucide-react";
import { Champ, inputClass } from "@/components/form";
import { classeBouton } from "@/components/app/kit";
import { CODE_MAX, genererCode } from "@/lib/promo";

/** Le champ « code » du formulaire de création : on le tape, ou on clique sur « Générer » (10 caractères sans 0, O, 1, I, L). Vide = généré à l'enregistrement. */
export function ChampCode() {
  const [code, setCode] = useState("");
  return (
    <Champ id="code" label="Code" aide="8 à 12 lettres ou chiffres, majuscules ou minuscules. Laissez vide pour en générer un.">
      <div className="flex gap-2">
        <input
          id="code"
          name="code"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/[^A-Za-z0-9]/g, "").slice(0, CODE_MAX))}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          maxLength={CODE_MAX}
          placeholder="Ex. BIENVENUE26"
          className={`${inputClass} uppercase tracking-wider`}
        />
        <button type="button" onClick={() => setCode(genererCode(10))} className={`${classeBouton("cadre")} shrink-0`}>
          <Dices className="h-4 w-4" aria-hidden="true" />
          Générer
        </button>
      </div>
    </Champ>
  );
}
