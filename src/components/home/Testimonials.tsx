import { TESTIMONIAL_SLOTS } from "../data";

/**
 * Témoignages : la section garde sa place et sa mise en page, mais les cartes
 * sont vides et immobiles. On n'affichera que de vrais témoignages de clients
 * (docs/INTERDITS.md) ; ils se rempliront ici, sans changer la structure.
 */
function CarteVide() {
  return <div className="testimonial-card" aria-hidden="true" />;
}

export function Testimonials() {
  const cartes = Array.from({ length: TESTIMONIAL_SLOTS });
  return (
    <section>
      <div>
        <div className="mx-auto max-w-2xl text-center">
          <h2>Ce que disent nos clients</h2>
        </div>
        <div className="testimonials-rows mt-16 flex flex-col gap-4">
          <div className="md:hidden">
            <div className="testimonial-row testimonial-row--static">
              {cartes.slice(0, 2).map((_, i) => (
                <CarteVide key={i} />
              ))}
            </div>
          </div>
          {[0, 1, 2].map((rang) => (
            <div key={rang} className="hidden md:block">
              <div className={`testimonial-row testimonial-row--static ${rang === 1 ? "testimonial-row--decale" : ""}`}>
                {cartes.map((_, i) => (
                  <CarteVide key={i} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
