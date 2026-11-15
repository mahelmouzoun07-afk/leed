-- Chantier 3, migration 8 : corrections issues du contrôle de sécurité de Supabase.
--  • les fonctions « est_membre » et « est_admin » quittent le schéma public (donc l'API publique) ;
--  • les vues passent en mode « droits de l'utilisateur » : la RLS s'applique, plus de vue privilégiée ;
--  • deux fonctions reçoivent un search_path fixe.

create schema if not exists private;
grant usage on schema private to authenticated, service_role;
alter function public.est_membre(uuid) set schema private;
alter function public.est_admin() set schema private;

alter function public.maj_modifie_le() set search_path = '';
alter function public.interdire_modification() set search_path = '';

create or replace function public.admin_resume_clients()
returns table (entreprise_id uuid, nom text, pays char(2), forfait_statut public.statut_forfait, entreprises_restantes integer, fin timestamptz, comptes_actifs bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not private.est_admin() then
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

-- Le client lit ses comptes par colonnes autorisées : unipile_account_id n'en fait pas partie.
drop view public.mes_comptes;
drop view public.mon_forfait;
grant select (id, entreprise_id, canal, identifiant_affiche, statut, connecte_le, quota_jour, envois_aujourdhui, note_sante)
  on public.comptes_connectes to authenticated;
create policy "membres lisent leurs comptes" on public.comptes_connectes for select to authenticated
  using (private.est_membre(entreprise_id));

create view public.mes_comptes with (security_invoker = true) as
  select id, entreprise_id, canal, identifiant_affiche, statut, connecte_le, quota_jour, envois_aujourdhui, note_sante
  from public.comptes_connectes;
create view public.mon_forfait with (security_invoker = true) as
  select id, entreprise_id, type, statut, montant_fcfa, prix_unitaire_fcfa, entreprises_achetees,
         entreprises_restantes, par_jour, comptes_max, debut, fin, grace_fin, gel_expire_le
  from public.forfaits;
grant select on public.mes_comptes, public.mon_forfait to authenticated;
grant all on public.mes_comptes, public.mon_forfait to service_role;
