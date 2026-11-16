const CANAUX = ["WhatsApp", "Instagram", "Facebook", "LinkedIn", "Email", "Rendez-vous"];

/**
 * La bande défilante des canaux, entre l'en-tête de l'accueil et « Ce que disent nos clients ».
 * Le contenu est répété deux fois : la piste glisse de la moitié de sa largeur puis recommence, sans coupure visible.
 * Pour les lecteurs d'écran, une seule phrase ; la bande elle-même est décorative.
 */
export function BandeCanaux() {
  return (
    <section aria-label="Les canaux de leed" className="bande-canaux">
      <p className="sr-only">Leed écrit depuis vos propres comptes : {CANAUX.join(", ")}.</p>
      <div className="bande-canaux__fenetre" aria-hidden="true">
        <div className="bande-canaux__piste">
          {[0, 1].map((copie) => (
            <ul key={copie} className="bande-canaux__liste">
              {CANAUX.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
