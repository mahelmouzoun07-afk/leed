-- Codes promo.
--  • l'équipe crée un code (8 à 12 lettres ou chiffres, majuscules ou minuscules, peu importe) avec un pourcentage de réduction ;
--  • le prix est calculé PAR LA BASE avant le paiement : le client ne choisit jamais le montant qu'il paie ;
--  • 100 % de réduction = rien à payer ET accès à toutes les fonctionnalités (tous les comptes, rythme maximum, cibles illimitées) ;
--  • un code 100 % a toujours un plafond en FCFA (valeur offerte au maximum) : sans lui, un code gratuit offrirait un forfait sans limite ;
--  • un code ne sert jamais deux fois de trop : réservé au lancement du paiement, confirmé au succès, libéré à l'échec.
-- Tout est réservé au serveur (service_role) ou à l'équipe (fonctions admin_*, qui revérifient le rôle et écrivent dans le journal d'audit).

-- ───── 1. Les codes ─────────────────────────────────────────────────────────
create table public.codes_promo (
  id uuid primary key default gen_random_uuid(),
  code text not null,                         -- tel que saisi par l'équipe (pour l'affichage)
  code_normalise text not null unique,        -- en MAJUSCULES : « abc12345 » et « ABC12345 » sont le même code
  libelle text,                               -- note interne (« partenariat radio », « cadeau de lancement »)
  pourcentage integer not null check (pourcentage between 1 and 100),
  plafond_remise_fcfa integer check (plafond_remise_fcfa > 0),   -- remise maximale par utilisation ; obligatoire à 100 %
  montant_min_fcfa integer not null default 5000 check (montant_min_fcfa >= 0),   -- valeur minimale du forfait pour que le code s'applique
  debut timestamptz not null default now(),
  fin timestamptz,                            -- null = sans fin
  max_utilisations integer check (max_utilisations > 0),         -- null = illimité
  max_par_entreprise integer not null default 1 check (max_par_entreprise > 0),
  nouveaux_clients_seulement boolean not null default false,     -- seulement une entreprise qui n'a encore jamais acheté de forfait
  pays char(2)[] not null default '{}',       -- vide = tous les pays
  actif boolean not null default true,
  cree_par uuid references public.profils(id) on delete set null,
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now(),
  constraint codes_promo_format check (code_normalise ~ '^[A-Z0-9]{8,12}$' and upper(code) = code_normalise),
  constraint codes_promo_plafond_si_gratuit check (pourcentage < 100 or plafond_remise_fcfa is not null),
  constraint codes_promo_dates check (fin is null or fin > debut)
);
create trigger codes_promo_maj before update on public.codes_promo
  for each row execute function public.maj_modifie_le();

create table public.utilisations_code_promo (
  id uuid primary key default gen_random_uuid(),
  code_promo_id uuid not null references public.codes_promo(id) on delete restrict,
  entreprise_id uuid not null references public.entreprises(id) on delete restrict,
  paiement_id uuid not null unique references public.paiements(id) on delete restrict,
  montant_forfait_fcfa integer not null check (montant_forfait_fcfa >= 0),
  remise_fcfa integer not null check (remise_fcfa >= 0),
  a_payer_fcfa integer not null check (a_payer_fcfa >= 0),
  statut text not null default 'reserve' check (statut in ('reserve', 'confirme', 'annule')),
  cree_le timestamptz not null default now(),
  confirme_le timestamptz
);
create index utilisations_code_idx on public.utilisations_code_promo (code_promo_id, statut);
create index utilisations_entreprise_idx on public.utilisations_code_promo (entreprise_id, code_promo_id);

alter table public.codes_promo enable row level security;
alter table public.utilisations_code_promo enable row level security;   -- aucune politique : service_role et fonctions seulement
revoke all on public.codes_promo, public.utilisations_code_promo from anon, authenticated;
grant all on public.codes_promo, public.utilisations_code_promo to service_role;

-- ───── 2. Paiements et forfaits : valeur du forfait, remise, accès complet ──
alter table public.paiements drop constraint paiements_montant_fcfa_check;
alter table public.paiements add constraint paiements_montant_fcfa_check check (montant_fcfa >= 0);   -- 0 : forfait offert par un code
alter table public.paiements
  add column montant_forfait_fcfa integer check (montant_forfait_fcfa >= 0),   -- valeur du forfait ; null = égale à montant_fcfa
  add column remise_fcfa integer not null default 0 check (remise_fcfa >= 0),
  add column code_promo_id uuid references public.codes_promo(id) on delete restrict,
  add constraint paiements_remise_coherente check (montant_forfait_fcfa is null or montant_forfait_fcfa = montant_fcfa + remise_fcfa);

alter table public.forfaits
  add column cibles_max integer check (cibles_max > 0),            -- null = illimité
  add column acces_complet boolean not null default false;         -- forfait offert à 100 % : toutes les fonctionnalités
update public.forfaits f set cibles_max = case
    when f.type = 'essai' then 1
    else (select p.cibles_max from public.paliers_forfait p where p.montant_min <= f.montant_fcfa order by p.montant_min desc limit 1) end;

drop view public.mon_forfait;
create view public.mon_forfait with (security_invoker = true) as
  select id, entreprise_id, type, statut, montant_fcfa, prix_unitaire_fcfa, entreprises_achetees,
         entreprises_restantes, par_jour, comptes_max, cibles_max, acces_complet, debut, fin, grace_fin, gel_expire_le
  from public.forfaits;
grant select on public.mon_forfait to authenticated;
grant all on public.mon_forfait to service_role;

-- ───── 3. Le calcul du prix (lecture seule) ─────────────────────────────────
-- Raisons de refus : inconnu, montant_invalide, pas_commence, expire, pays, nouveaux_clients, montant_trop_bas, epuise, deja_utilise.
create or replace function public.calculer_code_promo(p_entreprise uuid, p_code text, p_montant integer)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  c public.codes_promo%rowtype;
  e public.entreprises%rowtype;
  v_code text := upper(btrim(coalesce(p_code, '')));
  v_total integer;
  v_siennes integer;
  v_remise integer;
  v_a_payer integer;
begin
  if p_montant is null or p_montant < public.reglage('montant_minimum') then
    return jsonb_build_object('valide', false, 'raison', 'montant_invalide');
  end if;
  if v_code !~ '^[A-Z0-9]{8,12}$' then return jsonb_build_object('valide', false, 'raison', 'inconnu'); end if;

  select * into c from public.codes_promo where code_normalise = v_code;
  if not found or not c.actif then return jsonb_build_object('valide', false, 'raison', 'inconnu'); end if;
  if now() < c.debut then return jsonb_build_object('valide', false, 'raison', 'pas_commence'); end if;
  if c.fin is not null and now() > c.fin then return jsonb_build_object('valide', false, 'raison', 'expire'); end if;

  select * into e from public.entreprises where id = p_entreprise;
  if not found then return jsonb_build_object('valide', false, 'raison', 'inconnu'); end if;
  if cardinality(c.pays) > 0 and not (e.pays::text = any (c.pays::text[])) then return jsonb_build_object('valide', false, 'raison', 'pays'); end if;
  if c.nouveaux_clients_seulement and e.premier_forfait_fait then return jsonb_build_object('valide', false, 'raison', 'nouveaux_clients'); end if;
  if p_montant < c.montant_min_fcfa then
    return jsonb_build_object('valide', false, 'raison', 'montant_trop_bas', 'montant_min_fcfa', c.montant_min_fcfa);
  end if;

  -- Une utilisation compte si elle est confirmée, ou réservée depuis moins de 2 heures (un paiement abandonné libère le code).
  select count(*) into v_total from public.utilisations_code_promo u
   where u.code_promo_id = c.id and (u.statut = 'confirme' or (u.statut = 'reserve' and u.cree_le > now() - interval '2 hours'));
  if c.max_utilisations is not null and v_total >= c.max_utilisations then
    return jsonb_build_object('valide', false, 'raison', 'epuise');
  end if;
  select count(*) into v_siennes from public.utilisations_code_promo u
   where u.code_promo_id = c.id and u.entreprise_id = p_entreprise
     and (u.statut = 'confirme' or (u.statut = 'reserve' and u.cree_le > now() - interval '2 hours'));
  if v_siennes >= c.max_par_entreprise then return jsonb_build_object('valide', false, 'raison', 'deja_utilise'); end if;

  v_remise := floor(p_montant * c.pourcentage / 100.0);
  if c.plafond_remise_fcfa is not null then v_remise := least(v_remise, c.plafond_remise_fcfa); end if;
  v_a_payer := p_montant - v_remise;
  -- Un paiement Mobile Money ne descend pas sous 100 FCFA : on réduit la remise plutôt que d'envoyer un paiement dérisoire.
  if v_a_payer > 0 and v_a_payer < 100 then
    v_a_payer := 100;
    v_remise := p_montant - 100;
  end if;

  return jsonb_build_object(
    'valide', true, 'code_promo_id', c.id, 'pourcentage', c.pourcentage, 'libelle', c.libelle,
    'montant_forfait_fcfa', p_montant, 'remise_fcfa', v_remise, 'a_payer_fcfa', v_a_payer,
    'plafond_remise_fcfa', c.plafond_remise_fcfa, 'acces_complet', (c.pourcentage = 100));
end;
$$;

-- ───── 4. La réservation, sous verrou : deux paiements en même temps ne dépassent pas le maximum ─────
create or replace function public.reserver_code_promo(p_entreprise uuid, p_code text, p_montant integer, p_paiement uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_code text := upper(btrim(coalesce(p_code, '')));
  v_calc jsonb;
  v_pai public.paiements%rowtype;
begin
  perform 1 from public.codes_promo where code_normalise = v_code for update;   -- sérialise les réservations d'un même code
  v_calc := public.calculer_code_promo(p_entreprise, v_code, p_montant);
  if not (v_calc ->> 'valide')::boolean then return v_calc; end if;

  select * into v_pai from public.paiements where id = p_paiement for update;
  if v_pai.id is null or v_pai.entreprise_id <> p_entreprise then raise exception 'paiement_invalide' using errcode = 'P0001'; end if;
  if v_pai.code_promo_id is distinct from (v_calc ->> 'code_promo_id')::uuid
     or v_pai.remise_fcfa <> (v_calc ->> 'remise_fcfa')::integer
     or v_pai.montant_fcfa <> (v_calc ->> 'a_payer_fcfa')::integer
     or coalesce(v_pai.montant_forfait_fcfa, v_pai.montant_fcfa) <> p_montant then
    raise exception 'prix_modifie' using errcode = 'P0001';
  end if;

  insert into public.utilisations_code_promo (code_promo_id, entreprise_id, paiement_id, montant_forfait_fcfa, remise_fcfa, a_payer_fcfa)
  values ((v_calc ->> 'code_promo_id')::uuid, p_entreprise, p_paiement, p_montant, (v_calc ->> 'remise_fcfa')::integer, (v_calc ->> 'a_payer_fcfa')::integer)
  on conflict (paiement_id) do nothing;
  return v_calc;
end;
$$;

-- L'état d'une utilisation suit celui du paiement : confirmée au succès, libérée à l'échec.
create or replace function public.synchroniser_code_promo_paiement()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.code_promo_id is null then return new; end if;
  if new.statut = 'reussi' then
    update public.utilisations_code_promo set statut = 'confirme', confirme_le = now() where paiement_id = new.id and statut = 'reserve';
  elsif new.statut in ('echoue', 'rembourse') then
    update public.utilisations_code_promo set statut = 'annule' where paiement_id = new.id and statut in ('reserve', 'confirme');
  end if;
  return new;
end;
$$;
create trigger paiements_code_promo after update of statut on public.paiements
  for each row when (old.statut is distinct from new.statut) execute function public.synchroniser_code_promo_paiement();

-- ───── 5. L'achat du forfait : valeur du forfait ≠ montant payé, accès complet à 100 % ─────
create or replace function public.acheter_forfait(p_entreprise uuid, p_montant integer, p_paiement uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pai public.paiements%rowtype;
  v_pal public.paliers_forfait%rowtype;
  v_haut public.paliers_forfait%rowtype;
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
  v_complet boolean := false;
begin
  select id into v_deja from public.forfaits where paiement_id = p_paiement;
  if v_deja is not null then return v_deja; end if;

  select premier_forfait_fait into v_premier from public.entreprises where id = p_entreprise for update;
  if not found then raise exception 'entreprise_inconnue' using errcode = 'P0001'; end if;

  select id into v_deja from public.forfaits where paiement_id = p_paiement;
  if v_deja is not null then return v_deja; end if;

  select * into v_pai from public.paiements where id = p_paiement for update;
  if v_pai.id is null or v_pai.entreprise_id <> p_entreprise then
    raise exception 'paiement_invalide' using errcode = 'P0001';
  end if;
  if v_pai.statut <> 'reussi' then raise exception 'paiement_non_confirme' using errcode = 'P0001'; end if;
  -- La valeur du forfait vient de la base (montant_forfait_fcfa), jamais du client.
  if coalesce(v_pai.montant_forfait_fcfa, v_pai.montant_fcfa) <> p_montant then raise exception 'montant_different' using errcode = 'P0001'; end if;
  if p_montant < public.reglage('montant_minimum') then raise exception 'montant_trop_bas' using errcode = 'P0001'; end if;

  if v_pai.code_promo_id is not null then
    select (c.pourcentage = 100) into v_complet from public.codes_promo c where c.id = v_pai.code_promo_id;
    v_complet := coalesce(v_complet, false);
  end if;

  select * into v_pal from public.paliers_forfait where montant_min <= p_montant order by montant_min desc limit 1;
  select * into v_haut from public.paliers_forfait order by montant_min desc limit 1;
  v_achat := p_montant / v_pal.prix_unitaire;

  select * into v_vieux from public.forfaits
   where entreprise_id = p_entreprise and statut in ('actif', 'grace') for update;
  select * into v_gele from public.forfaits
   where entreprise_id = p_entreprise and statut = 'gele' and gel_expire_le > now()
   order by gele_le desc limit 1 for update;

  if v_vieux.id is not null and v_vieux.type = 'payant' then
    v_report := v_vieux.entreprises_restantes;
    if v_vieux.statut = 'actif' then
      v_bonus := (v_achat * v_pal.bonus_fidelite_pct) / 100;
    end if;
  end if;
  if v_gele.id is not null then v_degel := v_gele.entreprises_restantes; end if;

  if not v_premier then
    select * into v_essai from public.forfaits where entreprise_id = p_entreprise and type = 'essai' order by cree_le desc limit 1;
    if v_essai.id is not null
       and now() <= v_essai.fin + make_interval(hours => public.reglage('delai_bonus_essai_heures')) then
      v_bonus := v_bonus + (v_achat * public.reglage('bonus_apres_essai_pct')) / 100;
    end if;
  end if;

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
                               entreprises_achetees, entreprises_restantes, par_jour, comptes_max, cibles_max, acces_complet, fin, grace_fin)
  values (p_entreprise, 'payant', 'actif', p_paiement, p_montant, v_pal.prix_unitaire,
          v_achat + v_bonus, v_achat + v_bonus + v_report + v_degel,
          case when v_complet then v_haut.par_jour else v_pal.par_jour end,
          case when v_complet then null else v_pal.comptes_max end,
          case when v_complet then null else v_pal.cibles_max end,
          v_complet,
          now() + make_interval(days => public.reglage('duree_jours')),
          now() + make_interval(days => public.reglage('duree_jours') + public.reglage('grace_jours')))
  returning id into v_id;

  insert into public.mouvements_forfait (entreprise_id, forfait_id, type, nombre, cle_idempotence, motif)
  values (p_entreprise, v_id, 'achat', v_achat, 'achat:' || p_paiement,
          case when v_pai.code_promo_id is not null then 'forfait de ' || p_montant || ' FCFA (code promo : ' || v_pai.remise_fcfa || ' FCFA offerts)'
               else 'forfait de ' || p_montant || ' FCFA' end);
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

-- ───── 6. L'espace équipe : créer, suivre, désactiver ───────────────────────
create or replace function public.admin_creer_code_promo(
  p_code text, p_libelle text, p_pourcentage integer, p_plafond integer, p_montant_min integer,
  p_debut timestamptz, p_fin timestamptz, p_max_utilisations integer, p_max_par_entreprise integer,
  p_nouveaux_seulement boolean, p_pays text[])
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_code text := upper(btrim(coalesce(p_code, '')));
  v_id uuid;
begin
  perform private.exiger_admin();
  if not exists (select 1 from public.administrateurs where profil_id = auth.uid() and role = 'admin') then
    raise exception 'role_insuffisant' using errcode = '42501';
  end if;
  if v_code !~ '^[A-Z0-9]{8,12}$' then raise exception 'code_invalide' using errcode = 'P0001'; end if;
  if exists (select 1 from public.codes_promo where code_normalise = v_code) then raise exception 'code_existe' using errcode = 'P0001'; end if;
  if p_pourcentage is null or p_pourcentage < 1 or p_pourcentage > 100 then raise exception 'pourcentage_invalide' using errcode = 'P0001'; end if;
  if p_pourcentage = 100 and (p_plafond is null or p_plafond < 5000) then raise exception 'plafond_obligatoire' using errcode = 'P0001'; end if;
  if p_plafond is not null and p_plafond < 100 then raise exception 'plafond_invalide' using errcode = 'P0001'; end if;
  if p_fin is not null and p_fin <= coalesce(p_debut, now()) then raise exception 'dates_invalides' using errcode = 'P0001'; end if;
  if p_max_utilisations is not null and p_max_utilisations < 1 then raise exception 'maximum_invalide' using errcode = 'P0001'; end if;
  if coalesce(p_max_par_entreprise, 1) < 1 then raise exception 'maximum_invalide' using errcode = 'P0001'; end if;

  insert into public.codes_promo (code, code_normalise, libelle, pourcentage, plafond_remise_fcfa, montant_min_fcfa, debut, fin,
                                  max_utilisations, max_par_entreprise, nouveaux_clients_seulement, pays, cree_par)
  values (v_code, v_code, nullif(btrim(p_libelle), ''), p_pourcentage, p_plafond, greatest(coalesce(p_montant_min, 5000), 0),
          coalesce(p_debut, now()), p_fin, p_max_utilisations, coalesce(p_max_par_entreprise, 1), coalesce(p_nouveaux_seulement, false),
          coalesce(p_pays, '{}')::char(2)[], auth.uid())
  returning id into v_id;

  insert into public.journal_audit (admin_id, action, cible_type, cible_id, charge)
  values (auth.uid(), 'creer_code_promo', 'code_promo', v_id,
          jsonb_build_object('code', v_code, 'pourcentage', p_pourcentage, 'plafond', p_plafond, 'max_utilisations', p_max_utilisations));
  return v_id;
end;
$$;

create or replace function public.admin_modifier_code_promo(p_id uuid, p_libelle text, p_fin timestamptz, p_max_utilisations integer, p_actif boolean)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare c public.codes_promo%rowtype;
begin
  perform private.exiger_admin();
  if not exists (select 1 from public.administrateurs where profil_id = auth.uid() and role = 'admin') then
    raise exception 'role_insuffisant' using errcode = '42501';
  end if;
  select * into c from public.codes_promo where id = p_id for update;
  if not found then raise exception 'code_inconnu' using errcode = 'P0001'; end if;
  if p_max_utilisations is not null and p_max_utilisations < 1 then raise exception 'maximum_invalide' using errcode = 'P0001'; end if;
  if p_fin is not null and p_fin <= c.debut then raise exception 'dates_invalides' using errcode = 'P0001'; end if;
  -- Le pourcentage, le plafond et le code ne changent jamais après la création : on désactive et on en crée un autre.
  update public.codes_promo set libelle = nullif(btrim(p_libelle), ''), fin = p_fin, max_utilisations = p_max_utilisations, actif = coalesce(p_actif, actif)
   where id = p_id;
  insert into public.journal_audit (admin_id, action, cible_type, cible_id, charge)
  values (auth.uid(), case when p_actif is false then 'desactiver_code_promo' else 'modifier_code_promo' end, 'code_promo', p_id,
          jsonb_build_object('code', c.code, 'actif', coalesce(p_actif, c.actif), 'fin', p_fin, 'max_utilisations', p_max_utilisations));
end;
$$;

create or replace function public.admin_codes_promo()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  perform private.exiger_admin();
  return jsonb_build_object(
    'codes', coalesce((
      select jsonb_agg(x order by x.cree_le desc) from (
        select c.id, c.code, c.libelle, c.pourcentage, c.plafond_remise_fcfa, c.montant_min_fcfa, c.debut, c.fin,
               c.max_utilisations, c.max_par_entreprise, c.nouveaux_clients_seulement, c.pays, c.actif, c.cree_le,
               (select count(*) from public.utilisations_code_promo u where u.code_promo_id = c.id and u.statut = 'confirme') as utilisations,
               (select count(*) from public.utilisations_code_promo u where u.code_promo_id = c.id and u.statut = 'reserve' and u.cree_le > now() - interval '2 hours') as en_cours,
               (select coalesce(sum(u.remise_fcfa), 0) from public.utilisations_code_promo u where u.code_promo_id = c.id and u.statut = 'confirme') as remise_totale_fcfa,
               case when not c.actif then 'desactive'
                    when c.fin is not null and now() > c.fin then 'expire'
                    when now() < c.debut then 'a_venir'
                    when c.max_utilisations is not null and (select count(*) from public.utilisations_code_promo u where u.code_promo_id = c.id and u.statut = 'confirme') >= c.max_utilisations then 'epuise'
                    else 'actif' end as etat
          from public.codes_promo c) x), '[]'::jsonb),
    'recentes', coalesce((
      select jsonb_agg(y order by y.cree_le desc) from (
        select c.code, e.nom as entreprise, u.remise_fcfa, u.a_payer_fcfa, u.statut, u.cree_le
          from public.utilisations_code_promo u
          join public.codes_promo c on c.id = u.code_promo_id
          join public.entreprises e on e.id = u.entreprise_id
         where u.statut <> 'annule' order by u.cree_le desc limit 20) y), '[]'::jsonb));
end;
$$;

-- Le journal des paiements montre aussi la remise et le code.
create or replace function public.admin_paiements()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_mois date := date_trunc('month', now())::date;
begin
  perform private.exiger_admin();
  return jsonb_build_object(
    'encaisse_mois', (select coalesce(sum(montant_fcfa), 0) from paiements where statut = 'reussi' and cree_le >= v_mois),
    'nombre_mois', (select count(*) from paiements where cree_le >= v_mois),
    'en_attente', (select count(*) from paiements where statut = 'en_attente'),
    'echoues', (select count(*) from paiements where statut = 'echoue' and cree_le >= v_mois),
    'liste', coalesce((
      select jsonb_agg(jsonb_build_object('id', x.id, 'entreprise', x.nom, 'montant', x.montant_fcfa, 'moyen', x.moyen,
               'statut', x.statut, 'cree_le', x.cree_le, 'remise', x.remise_fcfa, 'code', x.code) order by x.cree_le desc)
      from (select p.id, e.nom, p.montant_fcfa, p.moyen, p.statut, p.cree_le, p.remise_fcfa, c.code
            from paiements p join entreprises e on e.id = p.entreprise_id
            left join codes_promo c on c.id = p.code_promo_id order by p.cree_le desc limit 50) x), '[]'::jsonb));
end;
$$;

-- ───── 7. Droits ────────────────────────────────────────────────────────────
revoke all on function public.calculer_code_promo(uuid, text, integer), public.reserver_code_promo(uuid, text, integer, uuid),
  public.synchroniser_code_promo_paiement() from public, anon, authenticated;
grant execute on function public.calculer_code_promo(uuid, text, integer), public.reserver_code_promo(uuid, text, integer, uuid) to service_role;
revoke all on function public.admin_creer_code_promo(text, text, integer, integer, integer, timestamptz, timestamptz, integer, integer, boolean, text[]),
  public.admin_modifier_code_promo(uuid, text, timestamptz, integer, boolean), public.admin_codes_promo(), public.admin_paiements() from public, anon;
grant execute on function public.admin_creer_code_promo(text, text, integer, integer, integer, timestamptz, timestamptz, integer, integer, boolean, text[]),
  public.admin_modifier_code_promo(uuid, text, timestamptz, integer, boolean), public.admin_codes_promo(), public.admin_paiements() to authenticated, service_role;
revoke all on function public.acheter_forfait(uuid, integer, uuid) from public, anon, authenticated;
grant execute on function public.acheter_forfait(uuid, integer, uuid) to service_role;
