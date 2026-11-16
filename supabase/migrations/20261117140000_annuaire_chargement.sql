-- Chantier 5 : chargement de l'annuaire.
--  • les sources déclarées avec leur licence (une source qui change de licence se retire proprement) ;
--  • charger_annuaire : insère ou met à jour un lot d'entreprises d'une source, sans jamais créer de doublon (même source, même référence) ;
--  • retirer_source_annuaire : retire TOUT ce qui vient d'une source et interdit d'en recharger.
-- Les deux fonctions sont réservées au serveur (service_role) : un client connecté n'a aucun accès à l'annuaire.

insert into public.annuaire_sources (nom, licence, peut_stocker, peut_revendre, delai_conservation_jours) values
  ('overture', 'CDLA Permissive 2.0 (Apache 2.0 et CC0 1.0 selon le contributeur). Citation recommandée : Overture Maps Foundation.', true, false, null),
  ('osm',      'ODbL 1.0. Mention obligatoire : © contributeurs OpenStreetMap. Toute base dérivée publiée doit rester sous ODbL.', true, false, null),
  ('gleif',    'CC0 1.0', true, true, null)
on conflict (nom) do nothing;

create or replace function public.charger_annuaire(p_source text, p_lignes jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_source uuid;
  v_stocker boolean;
  v_inseres integer := 0;
  v_maj integer := 0;
begin
  select id, peut_stocker into v_source, v_stocker from public.annuaire_sources where nom = p_source;
  if v_source is null then raise exception 'source inconnue : %', p_source; end if;
  if not v_stocker then raise exception 'source % : le stockage est interdit (source retirée)', p_source; end if;
  if jsonb_typeof(p_lignes) <> 'array' then raise exception 'p_lignes doit être un tableau'; end if;

  with src as (
    select distinct on (x.source_ref) x.*
      from jsonb_to_recordset(p_lignes) as x(
        source_ref text, nom text, nom_normalise text, pays text, ville text, secteur text, sous_secteur text,
        site text, telephone text, whatsapp text, email text, liens_sociaux jsonb,
        lon double precision, lat double precision, score_qualite integer, actif boolean)
     where x.source_ref is not null and x.nom is not null and x.nom_normalise is not null and x.pays is not null
  ), op as (
    insert into public.annuaire_entreprises
      (nom, nom_normalise, pays, ville, secteur, sous_secteur, site, telephone, whatsapp, email, liens_sociaux,
       coordonnees, source_id, source_ref, score_qualite, actif)
    select s.nom, s.nom_normalise, s.pays, s.ville, s.secteur, s.sous_secteur, s.site, s.telephone, s.whatsapp, s.email,
           coalesce(s.liens_sociaux, '{}'::jsonb),
           case when s.lon is not null and s.lat is not null
                then st_setsrid(st_makepoint(s.lon, s.lat), 4326)::extensions.geography end,
           v_source, s.source_ref, coalesce(s.score_qualite, 0), coalesce(s.actif, true)
      from src s
    on conflict (source_id, source_ref) where source_ref is not null do update set
      nom = excluded.nom, nom_normalise = excluded.nom_normalise, pays = excluded.pays, ville = excluded.ville,
      secteur = excluded.secteur, sous_secteur = excluded.sous_secteur, site = excluded.site,
      telephone = excluded.telephone, whatsapp = excluded.whatsapp, email = excluded.email,
      liens_sociaux = excluded.liens_sociaux, coordonnees = excluded.coordonnees,
      score_qualite = excluded.score_qualite, actif = excluded.actif, derniere_maj = now()
    returning (xmax = 0) as insere
  )
  select count(*) filter (where insere), count(*) filter (where not insere) into v_inseres, v_maj from op;

  return jsonb_build_object('inseres', v_inseres, 'mis_a_jour', v_maj);
end;
$$;

create or replace function public.retirer_source_annuaire(p_source text)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_source uuid;
  v_n integer;
begin
  select id into v_source from public.annuaire_sources where nom = p_source;
  if v_source is null then raise exception 'source inconnue : %', p_source; end if;
  update public.annuaire_sources set peut_stocker = false where id = v_source;   -- plus aucun rechargement possible
  delete from public.annuaire_entreprises where source_id = v_source;
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

revoke all on function public.charger_annuaire(text, jsonb) from public, anon, authenticated;
revoke all on function public.retirer_source_annuaire(text) from public, anon, authenticated;
grant execute on function public.charger_annuaire(text, jsonb) to service_role;
grant execute on function public.retirer_source_annuaire(text) to service_role;
