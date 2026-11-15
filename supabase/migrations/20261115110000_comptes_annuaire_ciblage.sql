-- Chantier 3, migration 2 : comptes connectés (Unipile), annuaire partagé, ciblage.

-- ───── B. Comptes connectés ───────────────────────────────────────────────
-- Un compte du client branché via Unipile : c'est depuis lui que l'agent écrit.
create table public.comptes_connectes (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  canal public.canal not null,
  unipile_account_id text not null unique,      -- JAMAIS renvoyé au navigateur (vue mes_comptes)
  identifiant_affiche text not null,            -- « +229 97 00 00 00 », « @studiokoffi »
  statut public.statut_compte not null default 'actif',
  connecte_le timestamptz not null default now(),
  verifie_le timestamptz,
  quota_jour integer not null default 10 check (quota_jour between 0 and 40),  -- montée progressive, plafond 40
  envois_aujourdhui integer not null default 0 check (envois_aujourdhui >= 0),
  note_sante integer not null default 100 check (note_sante between 0 and 100),
  derniere_erreur text,
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now()
);
create trigger comptes_connectes_maj before update on public.comptes_connectes
  for each row execute function public.maj_modifie_le();
-- Un seul compte actif par canal et par entreprise.
create unique index comptes_un_actif_par_canal on public.comptes_connectes (entreprise_id, canal) where statut = 'actif';
create index comptes_statut_idx on public.comptes_connectes (statut, verifie_le);

-- Historique de santé : prévenir le client AVANT la suspension d'un compte.
create table public.evenements_compte (
  id uuid primary key default gen_random_uuid(),
  compte_id uuid not null references public.comptes_connectes(id) on delete cascade,
  type text not null,
  gravite smallint not null default 1 check (gravite between 1 and 3),
  charge jsonb not null default '{}'::jsonb,
  cree_le timestamptz not null default now()
);
create index evenements_compte_idx on public.evenements_compte (compte_id, cree_le desc);

-- Ce que le client voit de ses comptes : tout SAUF unipile_account_id.
create view public.mes_comptes with (security_invoker = false) as
  select id, entreprise_id, canal, identifiant_affiche, statut, connecte_le,
         quota_jour, envois_aujourdhui, note_sante
  from public.comptes_connectes
  where public.est_membre(entreprise_id);

-- ───── C. Annuaire partagé (jamais lisible directement par un client) ─────
create table public.annuaire_sources (
  id uuid primary key default gen_random_uuid(),
  nom text not null unique,
  licence text,
  peut_stocker boolean not null default true,
  peut_revendre boolean not null default false,
  delai_conservation_jours integer check (delai_conservation_jours > 0),  -- null = sans limite
  cree_le timestamptz not null default now()
);

create table public.annuaire_entreprises (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  nom_normalise text not null,                 -- sans accents, minuscules : sert au dédoublonnage
  pays char(2) not null,
  ville text,
  quartier text,
  secteur text,
  sous_secteur text,
  taille text check (taille in ('1-10', '11-50', '51-200', '201-1000', '1000+')),
  site text,
  telephone text,
  whatsapp text,
  email text,
  liens_sociaux jsonb not null default '{}'::jsonb,   -- {instagram, facebook, linkedin, tiktok}
  coordonnees extensions.geography(point, 4326),
  place_id_google text,                        -- seule donnée Google conservable sans limite
  source_id uuid references public.annuaire_sources(id),
  source_ref text,
  score_qualite integer not null default 0 check (score_qualite between 0 and 100),
  actif boolean not null default true,         -- fermé définitivement = false, jamais supprimé
  derniere_maj timestamptz not null default now(),
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now()
);
create trigger annuaire_entreprises_maj before update on public.annuaire_entreprises
  for each row execute function public.maj_modifie_le();
create index annuaire_lieu_secteur_idx on public.annuaire_entreprises (pays, ville, secteur) where actif;
create index annuaire_pays_secteur_idx on public.annuaire_entreprises (pays, secteur) where actif;
create index annuaire_coord_idx on public.annuaire_entreprises using gist (coordonnees);
create index annuaire_nom_trgm_idx on public.annuaire_entreprises using gin (nom_normalise extensions.gin_trgm_ops);
create unique index annuaire_source_unique on public.annuaire_entreprises (source_id, source_ref) where source_ref is not null;

-- Les personnes rattachées à une entreprise : `base_legale` = ce qu'on montre à l'APDP.
create table public.annuaire_contacts (
  id uuid primary key default gen_random_uuid(),
  annuaire_entreprise_id uuid not null references public.annuaire_entreprises(id) on delete cascade,
  nom text,
  role text,
  linkedin_url text,
  email text,
  telephone text,
  base_legale text not null check (base_legale in ('source_publique', 'registre_officiel', 'inscription_volontaire', 'interet_legitime')),
  source_id uuid references public.annuaire_sources(id),
  cree_le timestamptz not null default now()
);
create index annuaire_contacts_entreprise_idx on public.annuaire_contacts (annuaire_entreprise_id);

create table public.annuaire_doublons (
  id_fusionne uuid primary key,
  id_garde uuid not null references public.annuaire_entreprises(id) on delete cascade,
  fusionne_le timestamptz not null default now()
);

-- Cache de l'analyse IA : calculée une fois, partagée entre clients. Ne contient rien du client.
create table public.analyses_prospects (
  annuaire_entreprise_id uuid primary key references public.annuaire_entreprises(id) on delete cascade,
  fiche jsonb not null,
  signaux jsonb not null default '[]'::jsonb,   -- les raisons d'écrire maintenant, chacune datée
  calcule_le timestamptz not null default now(),
  expire_le timestamptz not null default now() + interval '60 days',
  cout_fcfa integer not null default 0 check (cout_fcfa >= 0)
);

-- ───── D. Ciblage ─────────────────────────────────────────────────────────
create table public.profils_cibles (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  nom text not null,
  secteurs text[] not null default '{}',
  pays char(2)[] not null default '{}',
  villes text[] not null default '{}',
  tailles text[] not null default '{}',
  signaux_recherches text[] not null default '{}',
  note integer check (note between 0 and 100),
  explication text,
  actif boolean not null default true,
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now()
);
create trigger profils_cibles_maj before update on public.profils_cibles
  for each row execute function public.maj_modifie_le();
create index profils_cibles_entreprise_idx on public.profils_cibles (entreprise_id);

create table public.campagnes (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  profil_cible_id uuid references public.profils_cibles(id) on delete set null,
  nom text not null,
  statut public.statut_campagne not null default 'brouillon',
  canaux_autorises public.canal[] not null default '{whatsapp,instagram,facebook,linkedin,email}',
  plafond_jour integer not null default 0 check (plafond_jour >= 0),
  entreprises_contactees integer not null default 0 check (entreprises_contactees >= 0),
  debut timestamptz,
  fin timestamptz,
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now()
);
create trigger campagnes_maj before update on public.campagnes
  for each row execute function public.maj_modifie_le();
create index campagnes_entreprise_idx on public.campagnes (entreprise_id, statut);

-- Chaque passage du client dans le simulateur ; comparée plus tard à la réalité.
create table public.simulations (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  profil_cible_id uuid references public.profils_cibles(id) on delete set null,
  montant_fcfa integer not null check (montant_fcfa >= 0),
  canaux public.canal[] not null default '{}',
  hypotheses jsonb not null default '{}'::jsonb,
  resultat jsonb not null default '{}'::jsonb,
  campagne_lancee_id uuid references public.campagnes(id) on delete set null,
  cree_le timestamptz not null default now()
);
create index simulations_entreprise_idx on public.simulations (entreprise_id, cree_le desc);
