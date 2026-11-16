-- Chantier 4 : inviter un administrateur PAR ADRESSE EMAIL, avant même qu'il ait un compte.
-- Dès que cette adresse est CONFIRMÉE (le propriétaire de la boîte a cliqué sur le lien), le compte
-- reçoit le rôle administrateur. Les adresses invitées ne sont jamais écrites dans le dépôt :
-- elles s'ajoutent dans la base (table invitations_admin), par le serveur ou l'éditeur SQL.
-- La double authentification reste exigée à la première connexion de l'espace équipe.

create table public.invitations_admin (
  email text primary key check (email = lower(email)),
  role public.role_admin not null default 'admin',
  cree_le timestamptz not null default now(),
  utilisee_le timestamptz
);
alter table public.invitations_admin enable row level security;   -- aucune politique : service seulement
revoke all on public.invitations_admin from anon, authenticated;
grant all on public.invitations_admin to service_role;

create or replace function public.promouvoir_admin_invite()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_role public.role_admin;
begin
  if new.email is null or new.email_confirmed_at is null then return new; end if;
  select role into v_role from public.invitations_admin where email = lower(new.email) and utilisee_le is null;
  if v_role is null then return new; end if;
  -- le profil est créé par un autre déclencheur de la même inscription
  insert into public.profils (id) values (new.id) on conflict (id) do nothing;
  insert into public.administrateurs (profil_id, role) values (new.id, v_role) on conflict (profil_id) do nothing;
  update public.invitations_admin set utilisee_le = now() where email = lower(new.email);
  return new;
end;
$$;
revoke execute on function public.promouvoir_admin_invite() from public, anon, authenticated;

create trigger auth_user_promouvoir_admin after insert or update of email_confirmed_at on auth.users
  for each row execute function public.promouvoir_admin_invite();
