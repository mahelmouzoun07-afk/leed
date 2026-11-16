-- Chantier 4 : à l'inscription, créer l'entreprise du client et lui rattacher l'analyse faite avant.
-- Appelée par le serveur (service_role) après la confirmation de l'email. Rejouable sans danger.
-- Les informations viennent des métadonnées saisies à l'inscription (auth.users.raw_user_meta_data) :
--   entreprise_nom, pays (code ISO à 2 lettres), analyse_jeton.

create or replace function public.creer_entreprise_inscription(p_user uuid)
returns uuid language plpgsql security definer set search_path = public, auth as $$
declare
  v_meta jsonb;
  v_e uuid;
  v_nom text;
  v_pays text;
  v_jeton text;
  v_an public.analyses_anonymes%rowtype;
  v_site text;
begin
  select entreprise_id into v_e from public.membres where profil_id = p_user order by cree_le limit 1;
  if v_e is not null then return v_e; end if;

  select raw_user_meta_data into v_meta from auth.users where id = p_user;
  if not found then raise exception 'utilisateur_inconnu' using errcode = 'P0001'; end if;

  -- Un seul appel à la fois par utilisateur : deux requêtes simultanées ne créent pas deux entreprises.
  perform pg_advisory_xact_lock(hashtextextended(p_user::text, 0));
  select entreprise_id into v_e from public.membres where profil_id = p_user order by cree_le limit 1;
  if v_e is not null then return v_e; end if;

  v_nom := nullif(trim(coalesce(v_meta->>'entreprise_nom', '')), '');
  if v_nom is null then raise exception 'nom_entreprise_manquant' using errcode = 'P0001'; end if;
  v_pays := upper(nullif(trim(coalesce(v_meta->>'pays', '')), ''));
  if v_pays is not null and v_pays !~ '^[A-Z]{2}$' then v_pays := null; end if;
  v_jeton := nullif(v_meta->>'analyse_jeton', '');

  if v_jeton is not null then
    select * into v_an from public.analyses_anonymes
     where jeton = v_jeton and rattachee_a is null and expire_le > now() for update;
  end if;
  if v_an.id is not null and v_an.mode = 'site' then
    v_site := nullif(v_an.entree->>'site', '');
  end if;

  insert into public.entreprises (nom, site, pays, fiche_activite, analyse_le)
  values (v_nom, v_site, v_pays, v_an.fiche, case when v_an.fiche is not null then now() end)
  returning id into v_e;

  insert into public.membres (entreprise_id, profil_id, role) values (v_e, p_user, 'proprietaire');

  update public.profils
     set pays = coalesce(v_pays, pays),
         telephone_whatsapp = coalesce(nullif(v_meta->>'telephone_whatsapp', ''), telephone_whatsapp)
   where id = p_user;

  if v_an.id is not null then
    update public.analyses_anonymes set rattachee_a = v_e, rattachee_le = now() where id = v_an.id;
    -- Les profils de clients idéaux validés avant l'inscription deviennent ses cibles.
    insert into public.profils_cibles (entreprise_id, nom, pays, note, explication)
    select v_e, p->>'nom', case when v_pays is null then '{}'::char(2)[] else array[v_pays]::char(2)[] end,
           nullif(p->>'note', '')::integer, p->>'raison'
    from jsonb_array_elements(coalesce(v_an.profils, '[]'::jsonb)) p
    where coalesce((p->>'actif')::boolean, true) and coalesce(p->>'nom', '') <> '';
  end if;

  insert into public.journal_evenements (entreprise_id, acteur, acteur_id, action, charge)
  values (v_e, 'systeme', p_user, 'entreprise_creee', jsonb_build_object('analyse_rattachee', v_an.id is not null));

  return v_e;
end;
$$;

revoke execute on function public.creer_entreprise_inscription(uuid) from public, anon, authenticated;
grant execute on function public.creer_entreprise_inscription(uuid) to service_role;
