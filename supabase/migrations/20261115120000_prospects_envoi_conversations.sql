-- Chantier 3, migration 3 : prospects, envoi, conversations, décisions, rendez-vous, conformité.

-- ───── K. Conformité (créée d'abord : l'envoi en dépend) ──────────────────
-- Un prospect qui dit STOP ne reçoit plus rien, d'aucun client, à vie.
-- On garde l'empreinte SHA-256 de l'identifiant, jamais l'identifiant en clair.
create table public.opt_outs (
  id uuid primary key default gen_random_uuid(),
  canal public.canal not null,
  identifiant_hash text not null,
  raison text not null check (raison in ('stop', 'blocage', 'signalement', 'demande_ecrite')),
  cree_le timestamptz not null default now(),
  unique (canal, identifiant_hash)
);

-- Entreprises qu'un client ne veut jamais contacter (ses clients actuels, ses concurrents).
create table public.exclusions_client (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  type text not null check (type in ('domaine', 'nom', 'identifiant')),
  valeur text not null,
  motif text,
  cree_le timestamptz not null default now(),
  unique (entreprise_id, type, valeur)
);

-- Évite le harcèlement : un même prospect reçoit au plus un premier message leed par semaine, tous clients confondus.
create table public.verrou_contact (
  canal public.canal not null,
  identifiant_hash text not null,
  dernier_premier_message_le timestamptz not null default now(),
  nombre_total integer not null default 1 check (nombre_total > 0),
  primary key (canal, identifiant_hash)
);

create table public.jours_feries (
  pays char(2) not null,
  date date not null,
  nom text not null,
  primary key (pays, date)
);

-- ───── E. Prospects du client ─────────────────────────────────────────────
-- La copie qu'un client s'approprie. Elle pointe vers l'annuaire sans le copier.
create table public.prospects (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  campagne_id uuid references public.campagnes(id) on delete set null,
  annuaire_entreprise_id uuid references public.annuaire_entreprises(id) on delete set null,
  nom text not null,                      -- copie figée à la sélection : l'historique reste lisible
  ville text,
  secteur text,
  contact_nom text,
  contact_role text,
  categorie public.categorie_prospect not null default 'pme',
  langue text not null default 'fr',
  score integer check (score between 0 and 100),
  signal text,                            -- la raison précise d'écrire maintenant : sans signal, pas de message
  canal_choisi public.canal,
  canaux_essayes public.canal[] not null default '{}',
  statut public.statut_prospect not null default 'nouveau',
  origine text not null default 'annuaire' check (origine in ('annuaire', 'import_client', 'pub_whatsapp', 'annuaire_gratuit')),
  importe_le timestamptz not null default now(),
  contacte_le timestamptz,
  repondu_le timestamptz,
  modifie_le timestamptz not null default now()
);
create trigger prospects_maj before update on public.prospects
  for each row execute function public.maj_modifie_le();
-- Un client ne contacte jamais deux fois la même entreprise de l'annuaire.
create unique index prospects_unique_annuaire on public.prospects (entreprise_id, annuaire_entreprise_id)
  where annuaire_entreprise_id is not null;
create index prospects_entreprise_statut_idx on public.prospects (entreprise_id, statut);
create index prospects_campagne_idx on public.prospects (campagne_id);

-- Coordonnées utilisables, une ligne par canal.
create table public.prospects_identifiants (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  canal public.canal not null,
  identifiant text not null,
  verifie boolean not null default false,
  source text,
  unique (prospect_id, canal, identifiant)
);
create index prospects_identifiants_idx on public.prospects_identifiants (prospect_id, canal);

-- ───── Messages types (créés ici : les étapes de séquence y renvoient) ────
create table public.modeles_messages (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid references public.entreprises(id) on delete cascade,   -- null = modèle leed par défaut
  canal public.canal not null,
  metier text,
  categorie_cible public.categorie_prospect,
  langue text not null default 'fr',
  corps text not null,
  variables text[] not null default '{}',
  score integer not null default 0,
  actif boolean not null default true,
  cree_le timestamptz not null default now()
);

-- ───── F. Envoi ───────────────────────────────────────────────────────────
create table public.sequences (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid references public.entreprises(id) on delete cascade,   -- null = séquence leed par défaut
  nom text not null,
  categorie_cible public.categorie_prospect,
  actif boolean not null default true,
  cree_le timestamptz not null default now()
);

create table public.etapes_sequence (
  id uuid primary key default gen_random_uuid(),
  sequence_id uuid not null references public.sequences(id) on delete cascade,
  rang integer not null check (rang > 0),
  jour integer not null check (jour >= 0),
  canal public.canal,                      -- null = le canal choisi pour le prospect
  type text not null check (type in ('premier', 'relance', 'dernier')),
  modele_id uuid references public.modeles_messages(id) on delete set null,
  unique (sequence_id, rang)
);

-- File des messages à envoyer : applique les plafonds et les horaires.
create table public.file_envoi (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  compte_connecte_id uuid references public.comptes_connectes(id) on delete set null,
  canal public.canal not null,
  etape_sequence_id uuid references public.etapes_sequence(id) on delete set null,
  planifie_pour timestamptz not null,
  statut text not null default 'en_attente' check (statut in ('en_attente', 'pris', 'envoye', 'annule', 'echoue')),
  tentatives integer not null default 0 check (tentatives >= 0),
  pris_le timestamptz,
  pris_par text,
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now()
);
create trigger file_envoi_maj before update on public.file_envoi
  for each row execute function public.maj_modifie_le();
create index file_envoi_travail_idx on public.file_envoi (statut, planifie_pour);
create unique index file_envoi_une_fois on public.file_envoi (prospect_id, etape_sequence_id) where etape_sequence_id is not null;

/**
 * Garde-fou dans la base, pas seulement dans le code : aucun message ne peut
 * être mis en file si l'envoi est suspendu, si le prospect n'a pas de signal,
 * s'il a dit STOP (sur ce canal) ou si le client l'a exclu.
 */
create or replace function public.verifier_avant_envoi()
returns trigger language plpgsql security definer set search_path = public, extensions as $$
declare
  p public.prospects%rowtype;
  suspendu boolean;
begin
  select envoi_suspendu into suspendu from public.entreprises where id = new.entreprise_id;
  if suspendu then
    raise exception 'envoi_suspendu : les envois de cette entreprise sont suspendus' using errcode = 'P0001';
  end if;

  select * into p from public.prospects where id = new.prospect_id;
  if p.id is null or p.entreprise_id <> new.entreprise_id then
    raise exception 'prospect_invalide : ce prospect n''appartient pas à cette entreprise' using errcode = 'P0001';
  end if;
  if p.signal is null or length(trim(p.signal)) = 0 then
    raise exception 'sans_signal : pas de raison d''écrire, pas de message' using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from public.prospects_identifiants i
    join public.opt_outs o on o.canal = i.canal and o.identifiant_hash = public.hacher_identifiant(i.canal, i.identifiant)
    where i.prospect_id = new.prospect_id and i.canal = new.canal
  ) then
    raise exception 'opt_out : ce prospect a demandé à ne plus être contacté' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.exclusions_client e
    where e.entreprise_id = new.entreprise_id
      and (
        (e.type = 'nom' and lower(e.valeur) = lower(p.nom))
        or (e.type = 'identifiant' and exists (
              select 1 from public.prospects_identifiants i
              where i.prospect_id = new.prospect_id and lower(i.identifiant) = lower(e.valeur)))
        or (e.type = 'domaine' and exists (
              select 1 from public.prospects_identifiants i
              where i.prospect_id = new.prospect_id and lower(i.identifiant) like '%' || lower(e.valeur) || '%'))
      )
  ) then
    raise exception 'exclusion_client : le client a exclu ce prospect' using errcode = 'P0001';
  end if;

  return new;
end;
$$;
create trigger file_envoi_verifier before insert on public.file_envoi
  for each row execute function public.verifier_avant_envoi();

-- ───── G. Conversations ───────────────────────────────────────────────────
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  compte_connecte_id uuid references public.comptes_connectes(id) on delete set null,
  canal public.canal not null,
  unipile_chat_id text,
  statut text not null default 'ouverte' check (statut in ('ouverte', 'en_attente_client', 'fermee')),
  dernier_message_le timestamptz,
  reprise_par_client boolean not null default false,   -- le client a pris la main : l'agent n'écrit plus
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now()
);
create trigger conversations_maj before update on public.conversations
  for each row execute function public.maj_modifie_le();
create index conversations_entreprise_idx on public.conversations (entreprise_id, statut, dernier_message_le desc);
create unique index conversations_chat_unique on public.conversations (compte_connecte_id, unipile_chat_id) where unipile_chat_id is not null;

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sens public.sens_message not null,
  canal public.canal not null,
  corps text not null,
  unipile_message_id text,
  statut public.statut_message not null default 'planifie',
  classe_reponse public.classe_reponse,          -- rempli par l'IA sur les messages entrants
  variante_test text,
  envoye_le timestamptz,
  livre_le timestamptz,
  lu_le timestamptz,
  erreur text,
  cree_le timestamptz not null default now()
);
create index messages_conversation_idx on public.messages (conversation_id, cree_le);
create unique index messages_unipile_unique on public.messages (unipile_message_id) where unipile_message_id is not null;

-- Second passage de l'IA : preuve que chaque message sortant a été contrôlé contre INTERDITS.md.
create table public.controles_message (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  verdict text not null check (verdict in ('accepte', 'refuse', 'corrige')),
  motifs text[] not null default '{}',
  corps_corrige text,
  cree_le timestamptz not null default now()
);
create index controles_message_idx on public.controles_message (message_id);

-- ───── H. Décisions du client ─────────────────────────────────────────────
create table public.decisions (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  type public.type_decision not null,
  prospect_id uuid references public.prospects(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  urgence smallint not null default 2 check (urgence between 1 and 3),
  question text not null,
  options jsonb not null default '[]'::jsonb,     -- [{cle: "oui", libelle: "Oui"}, …]
  contexte jsonb not null default '{}'::jsonb,
  statut public.statut_decision not null default 'ouverte',
  reponse jsonb,
  repondu_par uuid references public.profils(id) on delete set null,
  echeance timestamptz,
  cree_le timestamptz not null default now(),
  repondu_le timestamptz,
  notifie_le timestamptz
);
create index decisions_file_idx on public.decisions (entreprise_id, statut, urgence, cree_le);

-- ───── I. Rendez-vous ─────────────────────────────────────────────────────
create table public.rendez_vous (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  prospect_id uuid references public.prospects(id) on delete set null,
  debut timestamptz not null,
  fin timestamptz not null,
  fuseau text not null default 'Africa/Porto-Novo',
  lieu text,
  lien_visio text,
  statut public.statut_rdv not null default 'propose',
  calendrier_event_id text,
  resultat text check (resultat in ('signe', 'en_discussion', 'perdu')),
  rappels_envoyes jsonb not null default '[]'::jsonb,
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now(),
  check (fin > debut)
);
create trigger rendez_vous_maj before update on public.rendez_vous
  for each row execute function public.maj_modifie_le();
create index rendez_vous_entreprise_idx on public.rendez_vous (entreprise_id, debut);
