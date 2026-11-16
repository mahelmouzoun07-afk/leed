-- Chantiers 11 et 12 : ce que les écrans de l'espace équipe lisent, et la note du client sur un prospect.
--
-- L'administrateur ne lit JAMAIS les tables des clients en direct (RLS). Il passe par ces fonctions,
-- qui revérifient le rôle à chaque appel et ne renvoient que des chiffres, des états et des raisons de
-- blocage : jamais le contenu des conversations privées d'un client.
-- Toute action d'écriture est inscrite dans journal_audit.

-- ───── La note du client sur un prospect (« Rappeler après les fêtes… ») ─────
alter table public.prospects add column note_client text check (note_client is null or length(note_client) <= 2000);
grant update (note_client) on public.prospects to authenticated;
create policy "prospects : noter" on public.prospects for update to authenticated
  using (private.est_membre(entreprise_id)) with check (private.est_membre(entreprise_id));

-- ───── Garde commune ─────────────────────────────────────────────────────
create or replace function private.exiger_admin()
returns void language plpgsql security definer set search_path = public as $$
begin
  if not private.est_admin() then
    raise exception 'acces_refuse' using errcode = '42501';
  end if;
end;
$$;

-- ───── Écrans de lecture ─────────────────────────────────────────────────
create or replace function public.admin_accueil()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_mois date := date_trunc('month', now())::date;
begin
  perform private.exiger_admin();
  return jsonb_build_object(
    'clients_actifs', (select count(distinct entreprise_id) from forfaits where statut in ('actif', 'grace')),
    'comptes_branches', (select count(*) from comptes_connectes where statut = 'actif'),
    'comptes_a_rebrancher', (select count(*) from comptes_connectes where statut = 'a_rebrancher'),
    'tickets_ouverts', (select count(*) from tickets_support where statut <> 'resolu'),
    'messages_a_relire', (select count(*) from controles_message where verdict = 'refuse' and cree_le > now() - interval '7 days'),
    'paiements_en_attente', (select count(*) from paiements where statut = 'en_attente' and cree_le < now() - interval '1 hour'),
    'sources_annuaire', (select count(*) from annuaire_sources),
    'encaisse_mois', (select coalesce(sum(montant_fcfa), 0) from paiements where statut = 'reussi' and cree_le >= v_mois),
    'couts_mois', (select coalesce(jsonb_object_agg(poste, total), '{}'::jsonb)
                   from (select poste, sum(montant_fcfa) as total from couts_par_client where mois = v_mois group by poste) c),
    'sante', (select coalesce(jsonb_agg(jsonb_build_object('canal', canal, 'comptes', comptes, 'alertes', alertes)), '[]'::jsonb)
              from (select canal, count(*) as comptes,
                           count(*) filter (where statut <> 'actif' or note_sante < 70) as alertes
                    from comptes_connectes group by canal order by canal) s)
  );
end;
$$;

create or replace function public.admin_clients()
returns jsonb language plpgsql stable security definer set search_path = public, auth as $$
begin
  perform private.exiger_admin();
  return coalesce((
    select jsonb_agg(c order by (c->>'cree_le') desc) from (
      select jsonb_build_object(
        'id', e.id, 'nom', e.nom, 'ville', e.ville, 'pays', e.pays, 'cree_le', e.cree_le,
        'forfait_montant', f.montant_fcfa, 'forfait_type', f.type, 'forfait_statut', f.statut,
        'restantes', f.entreprises_restantes, 'achetees', f.entreprises_achetees, 'fin', f.fin,
        'etat', case
          when f.id is null then 'aucun'
          when f.type = 'essai' and f.statut = 'actif' then 'essai'
          when f.statut in ('gele', 'expire', 'epuise') then 'expire'
          when f.entreprises_restantes <= greatest(1, f.entreprises_achetees / 10) then 'bientot_fini'
          else 'actif' end,
        'envoi_suspendu', e.envoi_suspendu
      ) as c
      from entreprises e
      left join lateral (select * from forfaits f2 where f2.entreprise_id = e.id order by f2.cree_le desc limit 1) f on true
    ) t), '[]'::jsonb);
end;
$$;

create or replace function public.admin_client(p_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public, auth as $$
declare v_mois date := date_trunc('month', now())::date; v jsonb;
begin
  perform private.exiger_admin();
  select jsonb_build_object(
    'id', e.id, 'nom', e.nom, 'ville', e.ville, 'pays', e.pays, 'cree_le', e.cree_le, 'envoi_suspendu', e.envoi_suspendu,
    'proprietaire', (select jsonb_build_object('prenom', p.prenom, 'nom', p.nom, 'email', u.email,
                       'telephone', case when p.telephone_whatsapp is null then null
                                    else left(p.telephone_whatsapp, 7) || repeat('*', greatest(0, length(p.telephone_whatsapp) - 7)) end)
                     from membres m join profils p on p.id = m.profil_id join auth.users u on u.id = p.id
                     where m.entreprise_id = e.id order by m.cree_le limit 1),
    'forfait', (select jsonb_build_object('type', f.type, 'statut', f.statut, 'montant', f.montant_fcfa, 'achetees', f.entreprises_achetees,
                       'restantes', f.entreprises_restantes, 'fin', f.fin, 'par_jour', f.par_jour)
                from forfaits f where f.entreprise_id = e.id order by f.cree_le desc limit 1),
    'comptes', (select coalesce(jsonb_agg(jsonb_build_object('canal', c.canal, 'identifiant', c.identifiant_affiche, 'statut', c.statut, 'note_sante', c.note_sante)), '[]'::jsonb)
                from comptes_connectes c where c.entreprise_id = e.id),
    'campagnes', (select count(*) from campagnes c where c.entreprise_id = e.id),
    'prospects', (select count(*) from prospects p where p.entreprise_id = e.id),
    'encaisse_mois', (select coalesce(sum(montant_fcfa), 0) from paiements where entreprise_id = e.id and statut = 'reussi' and cree_le >= v_mois),
    'couts_mois', (select coalesce(jsonb_object_agg(poste, montant_fcfa), '{}'::jsonb) from couts_par_client where entreprise_id = e.id and mois = v_mois)
  ) into v from entreprises e where e.id = p_id;
  if v is null then raise exception 'client_inconnu' using errcode = 'P0002'; end if;
  return v;
end;
$$;

create or replace function public.admin_comptes()
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  perform private.exiger_admin();
  return jsonb_build_object(
    'total_actifs', (select count(*) from comptes_connectes where statut = 'actif'),
    'comptes', coalesce((
      select jsonb_agg(jsonb_build_object('entreprise', e.nom, 'canal', c.canal, 'identifiant', c.identifiant_affiche,
               'statut', c.statut, 'note_sante', c.note_sante, 'derniere_erreur', c.derniere_erreur,
               'envois_aujourdhui', c.envois_aujourdhui, 'quota_jour', c.quota_jour, 'verifie_le', c.verifie_le)
             order by (c.statut = 'actif'), c.note_sante)
      from comptes_connectes c join entreprises e on e.id = c.entreprise_id), '[]'::jsonb));
end;
$$;

create or replace function public.admin_annuaire()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare n bigint;
begin
  perform private.exiger_admin();
  select count(*) into n from annuaire_entreprises where actif;
  return jsonb_build_object(
    'entreprises', n,
    'pays', (select count(distinct pays) from annuaire_entreprises where actif),
    'avec_telephone', (select count(*) from annuaire_entreprises where actif and (telephone is not null or whatsapp is not null)),
    'avec_site', (select count(*) from annuaire_entreprises where actif and site is not null),
    'sources', coalesce((
      select jsonb_agg(jsonb_build_object('nom', s.nom, 'licence', s.licence, 'peut_stocker', s.peut_stocker,
               'fiches', (select count(*) from annuaire_entreprises a where a.source_id = s.id),
               'derniere_maj', (select max(a.derniere_maj) from annuaire_entreprises a where a.source_id = s.id)) order by s.nom)
      from annuaire_sources s), '[]'::jsonb));
end;
$$;

create or replace function public.admin_messages_bloques()
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  perform private.exiger_admin();
  return jsonb_build_object(
    'controles_semaine', (select count(*) from controles_message where cree_le > now() - interval '7 days'),
    'bloques_semaine', (select count(*) from controles_message where verdict = 'refuse' and cree_le > now() - interval '7 days'),
    'liste', coalesce((
      select jsonb_agg(jsonb_build_object('id', x.id, 'cree_le', x.cree_le, 'entreprise', x.nom, 'canal', x.canal, 'corps', x.corps, 'motifs', x.motifs) order by x.cree_le desc)
      from (select cm.id, cm.cree_le, e.nom, m.canal, m.corps, cm.motifs
            from controles_message cm join messages m on m.id = cm.message_id join entreprises e on e.id = cm.entreprise_id
            where cm.verdict = 'refuse' order by cm.cree_le desc limit 50) x), '[]'::jsonb));
end;
$$;

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
               'statut', x.statut, 'cree_le', x.cree_le) order by x.cree_le desc)
      from (select p.id, e.nom, p.montant_fcfa, p.moyen, p.statut, p.cree_le
            from paiements p join entreprises e on e.id = p.entreprise_id order by p.cree_le desc limit 50) x), '[]'::jsonb));
end;
$$;

create or replace function public.admin_couts()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_mois date := date_trunc('month', now())::date;
begin
  perform private.exiger_admin();
  return jsonb_build_object(
    'encaisse', (select coalesce(sum(montant_fcfa), 0) from paiements where statut = 'reussi' and cree_le >= v_mois),
    'couts', (select coalesce(jsonb_object_agg(poste, total), '{}'::jsonb)
              from (select poste, sum(montant_fcfa) as total from couts_par_client where mois = v_mois group by poste) c),
    'paliers', coalesce((
      select jsonb_agg(jsonb_build_object('montant_min', pf.montant_min, 'clients', (
        select count(*) from forfaits f where f.type = 'payant' and f.statut in ('actif', 'grace')
          and f.montant_fcfa >= pf.montant_min
          and f.montant_fcfa < coalesce((select min(p2.montant_min) from paliers_forfait p2 where p2.montant_min > pf.montant_min), 2147483647)))
        order by pf.montant_min)
      from paliers_forfait pf), '[]'::jsonb));
end;
$$;

-- ───── Écritures de l'équipe, toutes inscrites dans le journal d'audit ───
create or replace function public.admin_journaliser(p_action text, p_cible_type text, p_cible_id uuid, p_charge jsonb default '{}')
returns void language plpgsql security definer set search_path = public as $$
begin
  perform private.exiger_admin();
  insert into journal_audit (admin_id, action, cible_type, cible_id, charge)
  values (auth.uid(), p_action, p_cible_type, p_cible_id, coalesce(p_charge, '{}'::jsonb));
end;
$$;

create or replace function public.admin_suspendre_envoi(p_entreprise uuid, p_suspendre boolean, p_motif text)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform private.exiger_admin();
  if coalesce(length(trim(p_motif)), 0) < 3 then raise exception 'motif_obligatoire' using errcode = 'P0001'; end if;
  update entreprises set envoi_suspendu = p_suspendre where id = p_entreprise;
  if not found then raise exception 'client_inconnu' using errcode = 'P0002'; end if;
  insert into journal_audit (admin_id, action, cible_type, cible_id, charge)
  values (auth.uid(), case when p_suspendre then 'suspendre_envoi' else 'reprendre_envoi' end, 'entreprise', p_entreprise,
          jsonb_build_object('motif', p_motif));
end;
$$;

create or replace function public.admin_offrir_entreprises(p_entreprise uuid, p_nombre integer, p_motif text)
returns void language plpgsql security definer set search_path = public as $$
declare v_f public.forfaits%rowtype;
begin
  perform private.exiger_admin();
  if not exists (select 1 from administrateurs where profil_id = auth.uid() and role = 'admin') then
    raise exception 'role_insuffisant' using errcode = '42501';
  end if;
  if p_nombre is null or p_nombre < 1 or p_nombre > 500 then raise exception 'nombre_invalide' using errcode = 'P0001'; end if;
  if coalesce(length(trim(p_motif)), 0) < 3 then raise exception 'motif_obligatoire' using errcode = 'P0001'; end if;

  select * into v_f from forfaits where entreprise_id = p_entreprise and statut in ('actif', 'grace') for update;
  if v_f.id is null then raise exception 'aucun_forfait_vivant' using errcode = 'P0001'; end if;
  update forfaits set entreprises_restantes = entreprises_restantes + p_nombre, entreprises_achetees = entreprises_achetees + p_nombre where id = v_f.id;
  insert into mouvements_forfait (entreprise_id, forfait_id, type, nombre, motif)
  values (p_entreprise, v_f.id, 'ajustement', p_nombre, 'offert par l''équipe : ' || p_motif);
  insert into journal_audit (admin_id, action, cible_type, cible_id, charge)
  values (auth.uid(), 'offrir_entreprises', 'entreprise', p_entreprise, jsonb_build_object('nombre', p_nombre, 'motif', p_motif));
end;
$$;

-- Droits : un connecté peut appeler ces fonctions, qui refusent tout non-administrateur.
revoke execute on all functions in schema private from public, anon;
grant execute on function private.exiger_admin() to authenticated;
revoke execute on function public.admin_accueil(), public.admin_clients(), public.admin_client(uuid), public.admin_comptes(),
  public.admin_annuaire(), public.admin_messages_bloques(), public.admin_paiements(), public.admin_couts(),
  public.admin_journaliser(text, text, uuid, jsonb), public.admin_suspendre_envoi(uuid, boolean, text),
  public.admin_offrir_entreprises(uuid, integer, text) from public, anon;
grant execute on function public.admin_accueil(), public.admin_clients(), public.admin_client(uuid), public.admin_comptes(),
  public.admin_annuaire(), public.admin_messages_bloques(), public.admin_paiements(), public.admin_couts(),
  public.admin_journaliser(text, text, uuid, jsonb), public.admin_suspendre_envoi(uuid, boolean, text),
  public.admin_offrir_entreprises(uuid, integer, text) to authenticated, service_role;
