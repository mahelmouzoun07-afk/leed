-- Chantier 12 : lecture du journal d'audit avec l'adresse de l'administrateur (réservé aux administrateurs).
create or replace function public.admin_journal(p_limite integer default 100)
returns jsonb language plpgsql stable security definer set search_path = public, auth as $$
begin
  perform private.exiger_admin();
  return coalesce((
    select jsonb_agg(jsonb_build_object('id', a.id, 'cree_le', a.cree_le, 'admin', u.email, 'action', a.action,
             'cible_type', a.cible_type, 'cible_id', a.cible_id, 'charge', a.charge) order by a.cree_le desc)
    from (select * from journal_audit order by cree_le desc limit greatest(1, least(coalesce(p_limite, 100), 500))) a
    left join auth.users u on u.id = a.admin_id), '[]'::jsonb);
end;
$$;
revoke execute on function public.admin_journal(integer) from public, anon;
grant execute on function public.admin_journal(integer) to authenticated, service_role;
