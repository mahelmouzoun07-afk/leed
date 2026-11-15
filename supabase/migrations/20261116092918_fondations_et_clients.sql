-- Chantier 3, migration 1 : extensions, types, fonctions utilitaires, clients.
-- Remplace toutes les anciennes migrations Djeli (branche module-04) : leed-dev
-- était vide, on repart d'un schéma v2 (forfait, comptes connectés, admin).

-- ───── Extensions ─────────────────────────────────────────────────────────
create extension if not exists postgis with schema extensions;
create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;
create extension if not exists pgcrypto with schema extensions;

-- ───── Types énumérés ─────────────────────────────────────────────────────
-- Canaux : email, WhatsApp, Instagram, Facebook, LinkedIn. Ni SMS ni appel (pivot du 14/11).
create type public.canal as enum ('whatsapp', 'instagram', 'facebook', 'linkedin', 'email');
create type public.statut_compte as enum ('actif', 'a_rebrancher', 'suspendu', 'debranche');
create type public.categorie_prospect as enum ('grande_entreprise', 'pme', 'independant');
create type public.statut_prospect as enum (
  'nouveau', 'analyse', 'en_sequence', 'en_conversation', 'interesse',
  'rdv_pris', 'refuse', 'stop', 'epuise'
);
create type public.sens_message as enum ('sortant', 'entrant');
create type public.statut_message as enum ('planifie', 'en_attente', 'envoye', 'livre', 'lu', 'echoue', 'annule');
create type public.classe_reponse as enum (
  'interesse', 'question', 'pas_maintenant', 'pas_interesse', 'mauvaise_personne',
  'stop', 'absent', 'hostile', 'note_vocale'
);
create type public.type_decision as enum (
  'lead_chaud', 'question_prospect', 'confirmer_rdv', 'valider_information',
  'note_vocale', 'forfait_bientot_fini', 'compte_a_rebrancher'
);
create type public.statut_decision as enum ('ouverte', 'repondue', 'expiree', 'annulee');
create type public.statut_campagne as enum ('brouillon', 'active', 'en_pause', 'terminee');
create type public.mode_repartition as enum ('automatique', 'manuel');
create type public.role_membre as enum ('proprietaire', 'membre');
create type public.statut_rdv as enum ('propose', 'confirme', 'annule', 'honore', 'non_venu');
create type public.statut_paiement as enum ('en_attente', 'reussi', 'echoue', 'rembourse');
create type public.type_forfait as enum ('essai', 'payant');
create type public.statut_forfait as enum ('actif', 'grace', 'gele', 'epuise', 'expire');
create type public.type_mouvement as enum (
  'achat', 'bonus', 'decompte', 'retour', 'report', 'gel', 'degel', 'expiration', 'ajustement'
);
create type public.role_admin as enum ('admin', 'support');
create type public.statut_ticket as enum ('ouvert', 'en_cours', 'attente_client', 'resolu');

-- ───── Fonctions partagées ───────────────────────────────────────────────
create or replace function public.maj_modifie_le()
returns trigger language plpgsql as $$
begin
  new.modifie_le := now();
  return new;
end;
$$;

/** Normalise un identifiant de contact avant hachage : chiffres seuls pour un numéro, minuscules pour le reste. */
create or replace function public.normaliser_identifiant(p_canal public.canal, p_identifiant text)
returns text language sql immutable set search_path = public, extensions as $$
  select case
    when p_canal = 'whatsapp' then regexp_replace(coalesce(p_identifiant, ''), '[^0-9]', '', 'g')
    else lower(trim(coalesce(p_identifiant, '')))
  end;
$$;

/** Empreinte SHA-256 d'un identifiant : ce qu'on garde dans opt_outs et verrou_contact, jamais l'identifiant en clair. */
create or replace function public.hacher_identifiant(p_canal public.canal, p_identifiant text)
returns text language sql immutable set search_path = public, extensions as $$
  select encode(extensions.digest(public.normaliser_identifiant(p_canal, p_identifiant), 'sha256'), 'hex');
$$;

-- ───── A. Clients ─────────────────────────────────────────────────────────
-- Une personne, liée 1 pour 1 à auth.users.
create table public.profils (
  id uuid primary key references auth.users(id) on delete cascade,
  prenom text,
  nom text,
  telephone_whatsapp text,                -- format international
  whatsapp_verifie_le timestamptz,
  pays char(2),
  langue text not null default 'fr',
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now()
);
create trigger profils_maj before update on public.profils
  for each row execute function public.maj_modifie_le();

create or replace function public.creer_profil_a_inscription()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profils (id, prenom, nom, telephone_whatsapp)
  values (
    new.id,
    nullif(new.raw_user_meta_data->>'prenom', ''),
    nullif(new.raw_user_meta_data->>'nom', ''),
    nullif(new.raw_user_meta_data->>'telephone_whatsapp', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger auth_user_cree_profil after insert on auth.users
  for each row execute function public.creer_profil_a_inscription();

-- Le client payant : clé de cloisonnement de presque toutes les tables.
create table public.entreprises (
  id uuid primary key default gen_random_uuid(),
  nom text not null,                       -- « Studio Koffi »
  nom_affiche text,                        -- expéditeur des messages : « Koffi, du Studio Koffi »
  site text,
  instagram text,
  facebook text,
  pays char(2),
  ville text,
  secteur text,
  fiche_activite jsonb,                    -- ce que l'agent a compris (offres, prix, forces, concurrents, zone)
  analyse_le timestamptz,
  style_valide boolean not null default false,
  consignes jsonb not null default '{}'::jsonb,   -- ce que l'agent peut / ne doit pas dire
  horaires jsonb not null default '{}'::jsonb,
  fuseau_horaire text not null default 'Africa/Porto-Novo',
  plafond_jour integer not null default 0 check (plafond_jour >= 0),  -- 0 = pas de plafond choisi par le client
  mode_repartition public.mode_repartition not null default 'automatique',
  envoi_suspendu boolean not null default false,      -- mis à true par le système si un compte est en danger
  premier_forfait_fait boolean not null default false,
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now()
);
create trigger entreprises_maj before update on public.entreprises
  for each row execute function public.maj_modifie_le();
create index entreprises_pays_idx on public.entreprises (pays);

-- Qui a accès à quelle entreprise : la table que toutes les règles RLS interrogent.
create table public.membres (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  profil_id uuid not null references public.profils(id) on delete cascade,
  role public.role_membre not null default 'proprietaire',
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now(),
  unique (entreprise_id, profil_id)
);
create trigger membres_maj before update on public.membres
  for each row execute function public.maj_modifie_le();
create index membres_profil_idx on public.membres (profil_id);

-- ───── Administrateurs (l'équipe leed) ────────────────────────────────────
-- Table séparée des clients : un client n'est jamais administrateur par erreur.
create table public.administrateurs (
  profil_id uuid primary key references public.profils(id) on delete cascade,
  role public.role_admin not null default 'support',
  mfa_exige boolean not null default true,   -- authentification en deux étapes obligatoire
  ajoute_par uuid references public.profils(id) on delete set null,
  cree_le timestamptz not null default now()
);

create or replace function public.est_membre(p_entreprise uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.membres m
    where m.entreprise_id = p_entreprise and m.profil_id = auth.uid()
  );
$$;

create or replace function public.est_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.administrateurs a where a.profil_id = auth.uid());
$$;

-- ───── Aide à l'authentification (chantier 4) ─────────────────────────────
-- L'analyse faite AVANT l'inscription, gardée pour être rattachée au compte.
create table public.analyses_anonymes (
  id uuid primary key default gen_random_uuid(),
  jeton text not null unique,              -- 32 octets aléatoires, base64url
  mode text not null default 'site' check (mode in ('site', 'formulaire')),
  entree jsonb not null,
  fiche jsonb,
  profils jsonb,
  apercu jsonb,
  pays char(2),
  rattachee_a uuid references public.entreprises(id) on delete set null,
  rattachee_le timestamptz,
  ip_hash text,
  expire_le timestamptz not null default now() + interval '7 days',
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now()
);
create trigger analyses_anonymes_maj before update on public.analyses_anonymes
  for each row execute function public.maj_modifie_le();
create index analyses_anonymes_expire_idx on public.analyses_anonymes (expire_le);

-- Limite de fréquence (connexion, inscription, analyse gratuite).
create table public.tentatives (
  id uuid primary key default gen_random_uuid(),
  cle text not null,
  action text not null,
  cree_le timestamptz not null default now()
);
create index tentatives_cle_date_idx on public.tentatives (cle, action, cree_le desc);

/** Vrai si l'action est AUTORISÉE. Une tentative refusée n'est pas enregistrée : on ne prolonge pas le blocage. */
create or replace function public.verifier_limite(p_cle text, p_action text, p_maximum integer, p_fenetre interval)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare n integer;
begin
  delete from public.tentatives where cree_le < now() - interval '24 hours';
  select count(*) into n from public.tentatives t
   where t.cle = p_cle and t.action = p_action and t.cree_le > now() - p_fenetre;
  if n >= p_maximum then return false; end if;
  insert into public.tentatives (cle, action) values (p_cle, p_action);
  return true;
end;
$$;

create or replace function public.reinitialiser_limite(p_cle text, p_action text)
returns void language sql security definer set search_path = public, pg_temp as $$
  delete from public.tentatives where cle = p_cle and action = p_action;
$$;
