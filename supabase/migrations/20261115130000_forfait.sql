-- Chantier 3, migration 4 : le forfait (remplace les crédits de Djeli).
-- Règle d'or : l'argent et le décompte ne bougent QUE par les fonctions ci-dessous,
-- appelées par le serveur (service_role). Jamais d'écriture directe depuis l'application.

-- ───── Barème et réglages, en base et modifiables sans redéployer ─────────
create table public.paliers_forfait (
  montant_min integer primary key check (montant_min > 0),
  prix_unitaire integer not null check (prix_unitaire > 0),   -- FCFA par entreprise contactée
  comptes_max integer check (comptes_max > 0),                -- null = tous les comptes
  par_jour integer not null check (par_jour > 0),             -- entreprises contactées par jour
  cibles_max integer check (cibles_max > 0),                  -- null = illimité
  bonus_fidelite_pct integer not null default 0 check (bonus_fidelite_pct >= 0)
);
insert into public.paliers_forfait values
  (5000,   250, 1,    5,  1,    5),
  (10000,  250, 2,   10,  2,   10),
  (25000,  225, 3,   20,  3,   15),
  (50000,  200, null, 40, null, 20),
  (100000, 175, null, 40, null, 20);

create table public.reglages_forfait (
  cle text primary key,
  valeur integer not null
);
insert into public.reglages_forfait values
  ('duree_jours', 30),            -- validité d'un forfait payant
  ('grace_jours', 7),             -- plus de nouveaux envois, l'agent répond encore
  ('gel_mois', 12),              -- entreprises gelées, rendues à la prochaine recharge
  ('montant_minimum', 5000),
  ('bonus_apres_essai_pct', 20), -- premier forfait dans les 48 h qui suivent l'essai
  ('delai_bonus_essai_heures', 48),
  ('essai_entreprises', 10),
  ('essai_jours', 7);

-- ───── Paiements Mobile Money ─────────────────────────────────────────────
create table public.paiements (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete restrict,
  montant_fcfa integer not null check (montant_fcfa > 0),
  moyen text not null check (moyen in ('mtn_momo', 'moov_money', 'wave', 'orange_money', 'autre')),
  prestataire text not null,
  reference_prestataire text,
  statut public.statut_paiement not null default 'en_attente',
  cree_le timestamptz not null default now(),
  confirme_le timestamptz,
  modifie_le timestamptz not null default now()
);
create trigger paiements_maj before update on public.paiements
  for each row execute function public.maj_modifie_le();
create unique index paiements_reference_unique on public.paiements (prestataire, reference_prestataire)
  where reference_prestataire is not null;
create index paiements_entreprise_idx on public.paiements (entreprise_id, cree_le desc);

-- ───── Forfaits ───────────────────────────────────────────────────────────
create table public.forfaits (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete restrict,
  type public.type_forfait not null,
  statut public.statut_forfait not null default 'actif',
  paiement_id uuid unique references public.paiements(id) on delete restrict,
  montant_fcfa integer not null default 0 check (montant_fcfa >= 0),
  prix_unitaire_fcfa integer not null default 0 check (prix_unitaire_fcfa >= 0),
  entreprises_achetees integer not null default 0 check (entreprises_achetees >= 0),   -- achat + bonus
  entreprises_restantes integer not null default 0 check (entreprises_restantes >= 0),
  par_jour integer not null check (par_jour > 0),
  comptes_max integer,                      -- null = tous
  debut timestamptz not null default now(),
  fin timestamptz not null,
  grace_fin timestamptz not null,
  gele_le timestamptz,
  gel_expire_le timestamptz,
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now(),
  check (grace_fin >= fin)
);
create trigger forfaits_maj before update on public.forfaits
  for each row execute function public.maj_modifie_le();
-- Un seul forfait « vivant » (actif ou en grâce) par entreprise.
create unique index forfaits_un_vivant on public.forfaits (entreprise_id) where statut in ('actif', 'grace');
create index forfaits_entreprise_idx on public.forfaits (entreprise_id, statut);
create index forfaits_echeances_idx on public.forfaits (statut, fin, grace_fin, gel_expire_le);

-- Historique immuable : on ajoute des lignes, on ne modifie ni n'efface jamais.
create table public.mouvements_forfait (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete restrict,
  forfait_id uuid not null references public.forfaits(id) on delete restrict,
  type public.type_mouvement not null,
  nombre integer not null,                  -- positif : entreprises ajoutées ; négatif : retirées ; 0 : changement d'état
  cle_idempotence text unique,              -- le même envoi rejoué ne décompte qu'une fois
  prospect_id uuid references public.prospects(id) on delete set null,
  motif text,
  cree_le timestamptz not null default now()
);
create index mouvements_forfait_idx on public.mouvements_forfait (forfait_id, cree_le);
create index mouvements_jour_idx on public.mouvements_forfait (entreprise_id, type, cree_le);

create or replace function public.interdire_modification()
returns trigger language plpgsql as $$
begin
  raise exception 'immuable : % interdit sur %', tg_op, tg_table_name using errcode = 'P0001';
end;
$$;
create trigger mouvements_forfait_immuable before update or delete on public.mouvements_forfait
  for each row execute function public.interdire_modification();

-- Anti-abus de l'essai gratuit : un par numéro WhatsApp, par adresse Gmail et par site web.
create table public.empreintes_essai (
  type text not null check (type in ('whatsapp', 'gmail', 'site')),
  empreinte_hash text not null,
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  cree_le timestamptz not null default now(),
  primary key (type, empreinte_hash)
);

-- ───── Fonctions ──────────────────────────────────────────────────────────
create or replace function public.reglage(p_cle text)
returns integer language sql stable set search_path = public as $$
  select valeur from public.reglages_forfait where cle = p_cle;
$$;

create or replace function public.empreinte(p_texte text)
returns text language sql immutable set search_path = public, extensions as $$
  select encode(extensions.digest(lower(trim(coalesce(p_texte, ''))), 'sha256'), 'hex');
$$;

/** Démarre l'essai gratuit : 10 entreprises, 7 jours, une seule fois par numéro, Gmail et site. */
create or replace function public.demarrer_essai(p_entreprise uuid, p_whatsapp text, p_gmail text, p_site text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_n integer := public.reglage('essai_entreprises');
  v_fin timestamptz := now() + make_interval(days => public.reglage('essai_jours'));
begin
  perform 1 from public.entreprises where id = p_entreprise for update;
  if not found then raise exception 'entreprise_inconnue' using errcode = 'P0001'; end if;
  if exists (select 1 from public.forfaits where entreprise_id = p_entreprise and type = 'essai') then
    raise exception 'essai_deja_utilise' using errcode = 'P0001';
  end if;

  begin
    insert into public.empreintes_essai (type, empreinte_hash, entreprise_id)
    values ('whatsapp', public.empreinte(regexp_replace(coalesce(p_whatsapp, ''), '[^0-9]', '', 'g')), p_entreprise),
           ('gmail', public.empreinte(p_gmail), p_entreprise);
    if p_site is not null and length(trim(p_site)) > 0 then
      insert into public.empreintes_essai (type, empreinte_hash, entreprise_id)
      values ('site', public.empreinte(regexp_replace(lower(p_site), '^(https?://)?(www\.)?', '')), p_entreprise);
    end if;
  exception when unique_violation then
    raise exception 'essai_deja_utilise' using errcode = 'P0001';
  end;

  insert into public.forfaits (entreprise_id, type, statut, entreprises_achetees, entreprises_restantes,
                               par_jour, comptes_max, fin, grace_fin)
  values (p_entreprise, 'essai', 'actif', v_n, v_n, v_n, 1, v_fin, v_fin)
  returning id into v_id;

  insert into public.mouvements_forfait (entreprise_id, forfait_id, type, nombre, cle_idempotence, motif)
  values (p_entreprise, v_id, 'achat', v_n, 'essai:' || p_entreprise, 'essai gratuit');
  return v_id;
end;
$$;

/**
 * Crée un forfait payant à partir d'un paiement réussi.
 * - recharge avant la fin : les entreprises restantes sont REPORTÉES, avec le bonus de fidélité du palier ;
 * - recharge pendant la grâce : report, sans bonus ;
 * - entreprises GELÉes (dans les 12 mois) : elles reviennent ;
 * - premier forfait dans les 48 h après l'essai : +20 %.
 * Rejouable : un même paiement ne crée jamais deux forfaits.
 */
create or replace function public.acheter_forfait(p_entreprise uuid, p_montant integer, p_paiement uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_pai public.paiements%rowtype;
  v_pal public.paliers_forfait%rowtype;
  v_id uuid;
  v_deja uuid;
  v_achat integer;
  v_bonus integer := 0;
  v_report integer := 0;
  v_degel integer := 0;
  v_vieux public.forfaits%rowtype;
  v_gele public.forfaits%rowtype;
  v_essai public.forfaits%rowtype;
  v_premier boolean;
begin
  select id into v_deja from public.forfaits where paiement_id = p_paiement;
  if v_deja is not null then return v_deja; end if;

  select premier_forfait_fait into v_premier from public.entreprises where id = p_entreprise for update;
  if not found then raise exception 'entreprise_inconnue' using errcode = 'P0001'; end if;

  -- Revérifie après le verrou : un appel concurrent a pu créer le forfait entre-temps.
  select id into v_deja from public.forfaits where paiement_id = p_paiement;
  if v_deja is not null then return v_deja; end if;

  select * into v_pai from public.paiements where id = p_paiement for update;
  if v_pai.id is null or v_pai.entreprise_id <> p_entreprise then
    raise exception 'paiement_invalide' using errcode = 'P0001';
  end if;
  if v_pai.statut <> 'reussi' then raise exception 'paiement_non_confirme' using errcode = 'P0001'; end if;
  if v_pai.montant_fcfa <> p_montant then raise exception 'montant_different' using errcode = 'P0001'; end if;
  if p_montant < public.reglage('montant_minimum') then raise exception 'montant_trop_bas' using errcode = 'P0001'; end if;

  select * into v_pal from public.paliers_forfait where montant_min <= p_montant order by montant_min desc limit 1;
  v_achat := p_montant / v_pal.prix_unitaire;

  -- Forfait vivant (actif ou en grâce) : on le clôt et on reporte ce qui reste.
  select * into v_vieux from public.forfaits
   where entreprise_id = p_entreprise and statut in ('actif', 'grace') for update;
  -- Forfait gelé encore valable : ses entreprises reviennent.
  select * into v_gele from public.forfaits
   where entreprise_id = p_entreprise and statut = 'gele' and gel_expire_le > now()
   order by gele_le desc limit 1 for update;

  if v_vieux.id is not null and v_vieux.type = 'payant' then
    v_report := v_vieux.entreprises_restantes;
    if v_vieux.statut = 'actif' then
      v_bonus := (v_achat * v_pal.bonus_fidelite_pct) / 100;   -- fidélité : seulement avant la fin
    end if;
  end if;
  if v_gele.id is not null then v_degel := v_gele.entreprises_restantes; end if;

  -- Premier forfait payant juste après l'essai : +20 %.
  if not v_premier then
    select * into v_essai from public.forfaits where entreprise_id = p_entreprise and type = 'essai' order by cree_le desc limit 1;
    if v_essai.id is not null
       and now() <= v_essai.fin + make_interval(hours => public.reglage('delai_bonus_essai_heures')) then
      v_bonus := v_bonus + (v_achat * public.reglage('bonus_apres_essai_pct')) / 100;
    end if;
  end if;

  -- Ferme l'ancien forfait vivant avant d'en ouvrir un nouveau (index unique « un seul vivant »).
  if v_vieux.id is not null then
    update public.forfaits set statut = 'epuise', entreprises_restantes = 0 where id = v_vieux.id;
    if v_report > 0 then
      insert into public.mouvements_forfait (entreprise_id, forfait_id, type, nombre, motif)
      values (p_entreprise, v_vieux.id, 'report', -v_report, 'reporté sur le nouveau forfait');
    end if;
  end if;
  if v_gele.id is not null then
    update public.forfaits set statut = 'epuise', entreprises_restantes = 0 where id = v_gele.id;
    if v_degel > 0 then
      insert into public.mouvements_forfait (entreprise_id, forfait_id, type, nombre, motif)
      values (p_entreprise, v_gele.id, 'degel', -v_degel, 'dégelé sur le nouveau forfait');
    end if;
  end if;

  insert into public.forfaits (entreprise_id, type, statut, paiement_id, montant_fcfa, prix_unitaire_fcfa,
                               entreprises_achetees, entreprises_restantes, par_jour, comptes_max, fin, grace_fin)
  values (p_entreprise, 'payant', 'actif', p_paiement, p_montant, v_pal.prix_unitaire,
          v_achat + v_bonus, v_achat + v_bonus + v_report + v_degel, v_pal.par_jour, v_pal.comptes_max,
          now() + make_interval(days => public.reglage('duree_jours')),
          now() + make_interval(days => public.reglage('duree_jours') + public.reglage('grace_jours')))
  returning id into v_id;

  insert into public.mouvements_forfait (entreprise_id, forfait_id, type, nombre, cle_idempotence, motif)
  values (p_entreprise, v_id, 'achat', v_achat, 'achat:' || p_paiement, 'forfait de ' || p_montant || ' FCFA');
  if v_bonus > 0 then
    insert into public.mouvements_forfait (entreprise_id, forfait_id, type, nombre, motif)
    values (p_entreprise, v_id, 'bonus', v_bonus, 'bonus de fidélité ou d''après-essai');
  end if;
  if v_report > 0 then
    insert into public.mouvements_forfait (entreprise_id, forfait_id, type, nombre, motif)
    values (p_entreprise, v_id, 'report', v_report, 'entreprises reportées');
  end if;
  if v_degel > 0 then
    insert into public.mouvements_forfait (entreprise_id, forfait_id, type, nombre, motif)
    values (p_entreprise, v_id, 'degel', v_degel, 'entreprises dégelées');
  end if;

  update public.entreprises set premier_forfait_fait = true where id = p_entreprise;
  return v_id;
end;
$$;

/**
 * Décompte UNE entreprise quand son premier message est bien parti.
 * Idempotent : la même clé rejouée ne décompte qu'une fois (renvoie false).
 * Refuse : pas de forfait actif (ni en grâce), forfait épuisé, rythme du jour atteint.
 */
create or replace function public.decompter_entreprise(p_entreprise uuid, p_prospect uuid, p_cle text)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_f public.forfaits%rowtype;
  v_fuseau text;
  v_plafond integer;
  v_aujourdhui integer;
  v_insere uuid;
begin
  if p_cle is null or length(p_cle) = 0 then raise exception 'cle_obligatoire' using errcode = 'P0001'; end if;

  -- Le verrou sur le forfait met les décomptes simultanés en file : jamais de double dépense.
  select * into v_f from public.forfaits
   where entreprise_id = p_entreprise and statut = 'actif' and now() >= debut and now() < fin
   for update;
  if v_f.id is null then raise exception 'aucun_forfait_actif' using errcode = 'P0001'; end if;

  if exists (select 1 from public.mouvements_forfait where cle_idempotence = p_cle) then
    return false;   -- déjà décompté
  end if;
  if v_f.entreprises_restantes <= 0 then raise exception 'forfait_epuise' using errcode = 'P0001'; end if;

  select fuseau_horaire, plafond_jour into v_fuseau, v_plafond from public.entreprises where id = p_entreprise;
  select coalesce(sum(case when type = 'decompte' then 1 when type = 'retour' then -1 else 0 end), 0)
    into v_aujourdhui
    from public.mouvements_forfait
   where entreprise_id = p_entreprise and type in ('decompte', 'retour')
     and (cree_le at time zone v_fuseau)::date = (now() at time zone v_fuseau)::date;
  if v_aujourdhui >= v_f.par_jour or (v_plafond > 0 and v_aujourdhui >= v_plafond) then
    raise exception 'rythme_atteint' using errcode = 'P0001';
  end if;

  insert into public.mouvements_forfait (entreprise_id, forfait_id, type, nombre, cle_idempotence, prospect_id)
  values (p_entreprise, v_f.id, 'decompte', -1, p_cle, p_prospect)
  on conflict (cle_idempotence) do nothing
  returning id into v_insere;
  if v_insere is null then return false; end if;

  update public.forfaits set entreprises_restantes = entreprises_restantes - 1 where id = v_f.id;
  return true;
end;
$$;

/** Rend une entreprise quand le message n'a pas été livré. Idempotent (clé du retour). */
create or replace function public.rendre_entreprise(p_cle_decompte text, p_cle_retour text)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_m public.mouvements_forfait%rowtype;
  v_cible public.forfaits%rowtype;
  v_insere uuid;
begin
  select * into v_m from public.mouvements_forfait where cle_idempotence = p_cle_decompte and type = 'decompte';
  if v_m.id is null then raise exception 'decompte_inconnu' using errcode = 'P0001'; end if;

  select * into v_cible from public.forfaits
   where entreprise_id = v_m.entreprise_id and statut in ('actif', 'grace', 'gele')
   order by cree_le desc limit 1 for update;
  if v_cible.id is null then
    select * into v_cible from public.forfaits where id = v_m.forfait_id for update;
  end if;

  insert into public.mouvements_forfait (entreprise_id, forfait_id, type, nombre, cle_idempotence, prospect_id, motif)
  values (v_m.entreprise_id, v_cible.id, 'retour', 1, p_cle_retour, v_m.prospect_id, 'message non livré')
  on conflict (cle_idempotence) do nothing
  returning id into v_insere;
  if v_insere is null then return false; end if;

  update public.forfaits set entreprises_restantes = entreprises_restantes + 1 where id = v_cible.id;
  return true;
end;
$$;

/** Fait avancer les forfaits dans le temps : fin → grâce → gel → expiration. Lancée chaque nuit par le travail de fond. */
create or replace function public.appliquer_echeances_forfaits()
returns table (passes_en_grace integer, geles integer, expires integer, essais_clos integer)
language plpgsql security definer set search_path = public as $$
declare r public.forfaits%rowtype; g integer := 0; ge integer := 0; ex integer := 0; es integer := 0;
begin
  -- Essai fini : il s'éteint, sans grâce ni gel.
  for r in select * from public.forfaits where type = 'essai' and statut = 'actif' and now() >= fin for update loop
    update public.forfaits set statut = 'expire', entreprises_restantes = 0 where id = r.id;
    if r.entreprises_restantes > 0 then
      insert into public.mouvements_forfait (entreprise_id, forfait_id, type, nombre, motif)
      values (r.entreprise_id, r.id, 'expiration', -r.entreprises_restantes, 'fin de l''essai');
    end if;
    es := es + 1;
  end loop;

  for r in select * from public.forfaits where type = 'payant' and statut = 'actif' and now() >= fin for update loop
    update public.forfaits set statut = 'grace' where id = r.id;
    g := g + 1;
  end loop;

  for r in select * from public.forfaits where type = 'payant' and statut = 'grace' and now() >= grace_fin for update loop
    update public.forfaits set statut = 'gele', gele_le = now(),
           gel_expire_le = now() + make_interval(months => public.reglage('gel_mois')) where id = r.id;
    insert into public.mouvements_forfait (entreprise_id, forfait_id, type, nombre, motif)
    values (r.entreprise_id, r.id, 'gel', 0, r.entreprises_restantes || ' entreprises gelées');
    ge := ge + 1;
  end loop;

  for r in select * from public.forfaits where statut = 'gele' and now() >= gel_expire_le for update loop
    update public.forfaits set statut = 'expire', entreprises_restantes = 0 where id = r.id;
    if r.entreprises_restantes > 0 then
      insert into public.mouvements_forfait (entreprise_id, forfait_id, type, nombre, motif)
      values (r.entreprise_id, r.id, 'expiration', -r.entreprises_restantes, 'gel de 12 mois dépassé');
    end if;
    ex := ex + 1;
  end loop;

  return query select g, ge, ex, es;
end;
$$;

-- Ce que le client voit de son forfait.
create view public.mon_forfait with (security_invoker = false) as
  select id, entreprise_id, type, statut, montant_fcfa, prix_unitaire_fcfa, entreprises_achetees,
         entreprises_restantes, par_jour, comptes_max, debut, fin, grace_fin, gel_expire_le
  from public.forfaits
  where public.est_membre(entreprise_id);
