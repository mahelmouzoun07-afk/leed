import { BRAND } from "./data";

export type LegalSection = { h: string; p: string[] };

export function Legal({ title, updated, intro, sections }: { title: string; updated: string; intro: string; sections: LegalSection[] }) {
  return (
    <div className="container mx-auto max-w-[1200px] flex-grow px-4 py-6 lg:py-10">
      <h1 className="!mb-2 !text-3xl !font-bold text-foreground">{title}</h1>
      <div className="mb-6 text-sm text-muted-foreground">Last updated: {updated}</div>
      <p className="mb-8 max-w-[820px] text-base">{intro}</p>
      <div className="max-w-[820px] space-y-8">
        {sections.map((s, i) => (
          <div key={s.h}>
            <h2 className="!mb-3 !text-xl !font-semibold !leading-snug text-foreground">
              {i + 1}. {s.h}
            </h2>
            {s.p.map((t) => (
              <p key={t} className="text-base leading-relaxed">
                {t}
              </p>
            ))}
          </div>
        ))}
      </div>
      <p className="mt-10 text-sm">
        This is sample text for the {BRAND} demo site and is not a legal document.
      </p>
    </div>
  );
}
