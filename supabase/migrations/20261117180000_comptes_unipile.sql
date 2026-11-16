-- Chantier 7 : la connexion des comptes du client (Unipile).
--  • liens_connexion : un lien de connexion est créé AVANT d'envoyer le client chez Unipile ; au retour, seul un lien connu,
--    récent et jamais utilisé peut enregistrer un compte (un faux appel à notre adresse de retour ne crée rien) ;
--  • enregistrer_compte_unipile : le client ne branche que s'il a PAYÉ (forfait payant en cours) et dans la limite de comptes de son forfait ;
--  • appliquer_statut_compte : l'état d'un compte suit ce qu'Unipile annonce (bon, à rebrancher, suspendu, débranché) ;
--  • enregistrer_message_recu : une réponse reçue est notée une seule fois (sans son contenu : les conversations viennent au chantier 9).
-- Tout est réservé au serveur (service_role). unipile_account_id ne sort jamais vers le navigateur (vue mes_comptes).

create table public.liens_connexion (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  canal public.canal not null,
  type text not null default 'create' check (type in ('create', 'reconnect')),
  compte_id uuid references public.comptes_connectes(id) on delete cascade,   -- pour « reconnect »
  cree_par uuid references public.profils(id) on delete set null,
  cree_le timestamptz not null default now(),
  expire_le timestamptz not null default now() + interval '1 hour',
  utilise_le timestamptz
);
create index liens_connexion_entreprise_idx on public.liens_connexion (entreprise_id, cree_le desc);
alter table public.liens_connexion enable row level security;
revoke all on public.liens_connexion from anon, authenticated;
grant all on public.liens_connexion to service_role;

-- Une réponse reçue (webhook, rejouée par Unipile en cas d'échec) n'est notée qu'une fois.
create unique index evenements_message_unique on public.evenements_compte (compte_id, (charge ->> 'message_id')) where type = 'message_recu';

-- Les comptes qui coûtent chez Unipile (même s'ils sont à rebrancher ou suspendus) comptent dans la limite du forfait.
create or replace function public.comptes_en_cours(p_entreprise uuid)
returns integer language sql stable security definer set search_path = public, pg_temp as $$
  select count(*)::integer from public.comptes_connectes where entreprise_id = p_entreprise and statut in ('actif', 'a_rebrancher', 'suspendu');
$$;

-- Peut-on brancher un compte de plus ? Renvoie « ok » ou la raison du refus. Appelée avant de créer le lien, et au retour d'Unipile.
create or replace function public.verifier_branchement(p_entreprise uuid, p_canal public.canal)
returns text language plpgsql stable security definer set search_path = public, pg_temp as $$
declare f public.forfaits%rowtype;
begin
  select * into f from public.forfaits where entreprise_id = p_entreprise and statut in ('actif', 'grace') order by fin desc limit 1;
  if not found or f.type <> 'payant' then return 'forfait_requis'; end if;        -- le client paie AVANT de brancher quoi que ce soit
  if f.statut = 'grace' then return 'forfait_requis'; end if;
  if exists (select 1 from public.comptes_connectes where entreprise_id = p_entreprise and canal = p_canal and statut in ('actif', 'a_rebrancher', 'suspendu')) then
    return 'canal_deja_branche';
  end if;
  if f.comptes_max is not null and public.comptes_en_cours(p_entreprise) >= f.comptes_max then return 'limite_comptes'; end if;
  return 'ok';
end;
$$;

create or replace function public.enregistrer_compte_unipile(p_lien uuid, p_account_id text, p_identifiant text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  l public.liens_connexion%rowtype;
  v_compte uuid;
  v_verdict text;
begin
  select * into l from public.liens_connexion where id = p_lien for update;
  if not found then return jsonb_build_object('ok', false, 'raison', 'lien_inconnu'); end if;

  -- Rejeu du même retour : on renvoie le compte déjà enregistré, sans rien refaire.
  select id into v_compte from public.comptes_connectes where unipile_account_id = p_account_id;
  if l.utilise_le is not null then
    if v_compte is not null then return jsonb_build_object('ok', true, 'compte_id', v_compte, 'canal', l.canal, 'rejeu', true); end if;
    return jsonb_build_object('ok', false, 'raison', 'lien_utilise');
  end if;
  if now() > l.expire_le then return jsonb_build_object('ok', false, 'raison', 'lien_expire'); end if;

  if l.type = 'reconnect' then
    update public.comptes_connectes set statut = 'actif', derniere_erreur = null, note_sante = 100, verifie_le = now()
     where id = l.compte_id and entreprise_id = l.entreprise_id and unipile_account_id = p_account_id returning id into v_compte;
    if v_compte is null then return jsonb_build_object('ok', false, 'raison', 'compte_different'); end if;
  else
    v_verdict := public.verifier_branchement(l.entreprise_id, l.canal);
    if v_verdict <> 'ok' then return jsonb_build_object('ok', false, 'raison', v_verdict); end if;
    insert into public.comptes_connectes (entreprise_id, canal, unipile_account_id, identifiant_affiche, statut)
    values (l.entreprise_id, l.canal, p_account_id, coalesce(nullif(btrim(p_identifiant), ''), 'compte connecté'), 'actif')
    returning id into v_compte;
  end if;

  update public.liens_connexion set utilise_le = now() where id = l.id;
  insert into public.evenements_compte (compte_id, type, gravite, charge)
  values (v_compte, case when l.type = 'reconnect' then 'rebranche' else 'connecte' end, 1, jsonb_build_object('canal', l.canal));
  return jsonb_build_object('ok', true, 'compte_id', v_compte, 'canal', l.canal);
end;
$$;

-- L'état annoncé par Unipile. Un compte débranché par nous n'est jamais « réveillé » par un message tardif.
create or replace function public.appliquer_statut_compte(p_unipile_account_id text, p_statut public.statut_compte, p_message text)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare c public.comptes_connectes%rowtype; v_note integer; v_erreur text; v_grave smallint;
begin
  select * into c from public.comptes_connectes where unipile_account_id = p_unipile_account_id for update;
  if not found or c.statut = 'debranche' then return false; end if;
  v_note := case p_statut when 'actif' then 100 when 'a_rebrancher' then 30 when 'suspendu' then 10 else c.note_sante end;
  v_erreur := case p_statut
    when 'actif' then null
    when 'a_rebrancher' then 'Le compte doit être rebranché (mot de passe changé, session expirée ou contrôle de sécurité).'
    when 'suspendu' then 'La synchronisation du compte est arrêtée à cause d''une erreur. Les envois sont suspendus.'
    else c.derniere_erreur end;
  v_grave := case p_statut when 'actif' then 1 when 'a_rebrancher' then 2 else 3 end;

  update public.comptes_connectes set statut = p_statut, note_sante = v_note, derniere_erreur = v_erreur, verifie_le = now() where id = c.id;
  if c.statut is distinct from p_statut then       -- un événement seulement quand l'état change (Unipile rejoue ses envois)
    insert into public.evenements_compte (compte_id, type, gravite, charge)
    values (c.id, 'statut', v_grave, jsonb_build_object('ancien', c.statut, 'nouveau', p_statut, 'message', left(coalesce(p_message, ''), 60)));
  end if;
  return true;
end;
$$;

create or replace function public.enregistrer_message_recu(p_unipile_account_id text, p_chat_id text, p_message_id text)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare v_compte uuid; v_n integer;
begin
  select id into v_compte from public.comptes_connectes where unipile_account_id = p_unipile_account_id and statut <> 'debranche';
  if v_compte is null or p_message_id is null then return false; end if;
  insert into public.evenements_compte (compte_id, type, gravite, charge)
  values (v_compte, 'message_recu', 1, jsonb_build_object('chat_id', left(coalesce(p_chat_id, ''), 80), 'message_id', left(p_message_id, 120)))
  on conflict do nothing;
  get diagnostics v_n = row_count;
  return v_n > 0;
end;
$$;

-- Débrancher : marqué par nous, après la suppression chez Unipile.
create or replace function public.marquer_compte_debranche(p_compte uuid, p_motif text)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare v_n integer;
begin
  update public.comptes_connectes set statut = 'debranche', derniere_erreur = null where id = p_compte and statut <> 'debranche';
  get diagnostics v_n = row_count;
  if v_n > 0 then
    insert into public.evenements_compte (compte_id, type, gravite, charge) values (p_compte, 'debranche', 1, jsonb_build_object('motif', left(coalesce(p_motif, ''), 80)));
  end if;
  return v_n > 0;
end;
$$;

revoke all on function public.comptes_en_cours(uuid), public.verifier_branchement(uuid, public.canal),
  public.enregistrer_compte_unipile(uuid, text, text), public.appliquer_statut_compte(text, public.statut_compte, text),
  public.enregistrer_message_recu(text, text, text), public.marquer_compte_debranche(uuid, text) from public, anon, authenticated;
grant execute on function public.comptes_en_cours(uuid), public.verifier_branchement(uuid, public.canal),
  public.enregistrer_compte_unipile(uuid, text, text), public.appliquer_statut_compte(text, public.statut_compte, text),
  public.enregistrer_message_recu(text, text, text), public.marquer_compte_debranche(uuid, text) to service_role;
