-- Chantier 3, migration 5 : apprentissage, journal, espace admin, fonctions de l'annuaire.

-- ───── L. Apprentissage ───────────────────────────────────────────────────
-- Seules les STATISTIQUES sont partagées entre clients, jamais les messages.
create table public.stats_canal (
  pays char(2) not null,
  secteur text not null default '',
  categorie public.categorie_prospect not null,
  canal public.canal not null,
  periode date not null,                   -- début de semaine
  envoyes integer not null default 0 check (envoyes >= 0),
  livres integer not null default 0 check (livres >= 0),
  reponses integer not null default 0 check (reponses >= 0),
  positives integer not null default 0 check (positives >= 0),
  rdv integer not null default 0 check (rdv >= 0),
  taux_reponse numeric generated always as (case when envoyes > 0 then reponses::numeric / envoyes end) stored,
  taux_positif numeric generated always as (case when envoyes > 0 then positives::numeric / envoyes end) stored,
  taux_rdv numeric generated always as (case when envoyes > 0 then rdv::numeric / envoyes end) stored,
  primary key (pays, secteur, categorie, canal, periode)
);

create table public.tests_messages (
  id uuid primary key default gen_random_uuid(),
  modele_id uuid not null references public.modeles_messages(id) on delete cascade,
  variante text not null,
  envoyes integer not null default 0 check (envoyes >= 0),
  positives integer not null default 0 check (positives >= 0),
  actif boolean not null default true,
  unique (modele_id, variante)
);

-- ───── M. Journal ─────────────────────────────────────────────────────────
create table public.journal_evenements (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid references public.entreprises(id) on delete set null,
  acteur text not null check (acteur in ('client', 'agent', 'systeme')),
  acteur_id uuid,
  action text not null,
  cible_type text,
  cible_id uuid,
  charge jsonb not null default '{}'::jsonb,
  cree_le timestamptz not null default now()
);
create index journal_entreprise_idx on public.journal_evenements (entreprise_id, cree_le desc);
create trigger journal_evenements_immuable before update or delete on public.journal_evenements
  for each row execute function public.interdire_modification();

-- ───── Espace admin ───────────────────────────────────────────────────────
create table public.tickets_support (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid references public.entreprises(id) on delete set null,
  ouvert_par uuid references public.profils(id) on delete set null,
  sujet text not null,
  statut public.statut_ticket not null default 'ouvert',
  priorite smallint not null default 2 check (priorite between 1 and 3),
  assigne_a uuid references public.administrateurs(profil_id) on delete set null,
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now(),
  resolu_le timestamptz
);
create trigger tickets_support_maj before update on public.tickets_support
  for each row execute function public.maj_modifie_le();
create index tickets_statut_idx on public.tickets_support (statut, priorite, cree_le);

create table public.messages_ticket (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets_support(id) on delete cascade,
  auteur text not null check (auteur in ('client', 'admin')),
  auteur_id uuid references public.profils(id) on delete set null,
  corps text not null,
  cree_le timestamptz not null default now()
);
create index messages_ticket_idx on public.messages_ticket (ticket_id, cree_le);

-- Qui a fait quoi dans l'espace admin. Ajout seulement : jamais modifié ni effacé.
create table public.journal_audit (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.administrateurs(profil_id) on delete set null,
  action text not null,
  cible_type text,
  cible_id uuid,
  charge jsonb not null default '{}'::jsonb,
  ip_hash text,
  cree_le timestamptz not null default now()
);
create index journal_audit_idx on public.journal_audit (admin_id, cree_le desc);
create trigger journal_audit_immuable before update or delete on public.journal_audit
  for each row execute function public.interdire_modification();

-- Nos coûts réels par client et par mois (Unipile, IA, frais Mobile Money…) : base de la marge.
create table public.couts_par_client (
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  mois date not null,                      -- premier jour du mois
  poste text not null check (poste in ('unipile', 'ia', 'paiement', 'autre')),
  montant_fcfa integer not null default 0 check (montant_fcfa >= 0),
  detail jsonb not null default '{}'::jsonb,
  primary key (entreprise_id, mois, poste)
);

-- ───── Fonctions de l'annuaire (le client n'y accède jamais directement) ──
/**
 * Aperçu avant inscription : un nombre, la répartition par canal et quelques lignes SANS nom ni coordonnée.
 * Appelée par le serveur (service_role) pour le visiteur.
 */
create or replace function public.apercu_annuaire(
  p_pays char(2), p_secteurs text[] default null, p_villes text[] default null, p_tailles text[] default null
) returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v jsonb;
begin
  with base as (
    select * from public.annuaire_entreprises a
     where a.actif and a.pays = p_pays
       and (p_secteurs is null or a.secteur = any (p_secteurs))
       and (p_villes is null or a.ville = any (p_villes))
       and (p_tailles is null or a.taille = any (p_tailles))
  )
  select jsonb_build_object(
    'total', (select count(*) from base),
    'canaux', jsonb_build_object(
      'whatsapp', (select count(*) from base where whatsapp is not null),
      'email', (select count(*) from base where email is not null),
      'instagram', (select count(*) from base where liens_sociaux ? 'instagram'),
      'facebook', (select count(*) from base where liens_sociaux ? 'facebook'),
      'linkedin', (select count(*) from base where liens_sociaux ? 'linkedin')
    ),
    'exemples', coalesce((
      select jsonb_agg(jsonb_build_object('secteur', e.secteur, 'ville', e.ville, 'taille', e.taille))
      from (select secteur, ville, taille from base order by random() limit 3) e
    ), '[]'::jsonb)
  ) into v;
  return v;
end;
$$;

/**
 * Recherche pour un client : les entreprises de l'annuaire qui correspondent à un profil cible,
 * qu'il ne contacte pas déjà et qu'il n'a pas exclues. Appelée par le serveur uniquement.
 */
create or replace function public.rechercher_annuaire(p_entreprise uuid, p_profil_cible uuid, p_limite integer default 50)
returns table (id uuid, nom text, ville text, secteur text, taille text, whatsapp text, email text, liens_sociaux jsonb, score_qualite integer)
language sql stable security definer set search_path = public as $$
  select a.id, a.nom, a.ville, a.secteur, a.taille, a.whatsapp, a.email, a.liens_sociaux, a.score_qualite
  from public.annuaire_entreprises a
  join public.profils_cibles pc on pc.id = p_profil_cible and pc.entreprise_id = p_entreprise
  where a.actif
    and (cardinality(pc.pays) = 0 or a.pays = any (pc.pays))
    and (cardinality(pc.secteurs) = 0 or a.secteur = any (pc.secteurs))
    and (cardinality(pc.villes) = 0 or a.ville = any (pc.villes))
    and (cardinality(pc.tailles) = 0 or a.taille = any (pc.tailles))
    and not exists (select 1 from public.prospects p where p.entreprise_id = p_entreprise and p.annuaire_entreprise_id = a.id)
    and not exists (select 1 from public.exclusions_client e where e.entreprise_id = p_entreprise and e.type = 'nom' and lower(e.valeur) = lower(a.nom))
  order by a.score_qualite desc, a.id
  limit greatest(1, least(coalesce(p_limite, 50), 500));
$$;

/** Remet à zéro les compteurs d'envoi des comptes connectés (appelée chaque nuit). */
create or replace function public.remettre_compteurs_comptes()
returns integer language sql security definer set search_path = public as $$
  with m as (update public.comptes_connectes set envois_aujourdhui = 0 where envois_aujourdhui > 0 returning 1)
  select count(*)::integer from m;
$$;

/** Résumé des clients pour l'espace admin : vérifie le rôle à CHAQUE appel. */
create or replace function public.admin_resume_clients()
returns table (entreprise_id uuid, nom text, pays char(2), forfait_statut public.statut_forfait, entreprises_restantes integer, fin timestamptz, comptes_actifs bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.est_admin() then
    raise exception 'acces_refuse' using errcode = '42501';
  end if;
  return query
    select e.id, e.nom, e.pays, f.statut, f.entreprises_restantes, f.fin,
           (select count(*) from public.comptes_connectes c where c.entreprise_id = e.id and c.statut = 'actif')
    from public.entreprises e
    left join lateral (
      select * from public.forfaits f2 where f2.entreprise_id = e.id order by f2.cree_le desc limit 1
    ) f on true
    order by e.cree_le desc;
end;
$$;
