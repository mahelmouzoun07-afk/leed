-- Test de creer_entreprise_inscription (chantier 4). Tout est annulé à la fin (erreur voulue « TEST_OK »).
do $$
declare u uuid := gen_random_uuid(); u2 uuid := gen_random_uuid(); e uuid; e2 uuid; refuse boolean;
begin
  insert into analyses_anonymes (jeton, mode, entree, fiche, profils)
  values ('jeton-test', 'site', '{"mode":"site","site":"studiokoffi.bj"}', '{"nom":"Studio Koffi","offres":["logo"]}',
          '[{"nom":"Restaurants","raison":"forte demande","note":92,"actif":true},{"nom":"Hôtels","raison":"x","note":74,"actif":false}]');
  insert into auth.users (id, email, raw_user_meta_data)
  values (u, 'k@test.local', '{"entreprise_nom":"Studio Koffi","pays":"bj","telephone_whatsapp":"+22901234567","analyse_jeton":"jeton-test","prenom":"Koffi"}');
  e := creer_entreprise_inscription(u);
  assert e is not null, 'entreprise non créée';
  assert creer_entreprise_inscription(u) = e, 'rejouer doit renvoyer la même entreprise';
  assert (select count(*) from entreprises where id = e) = 1, 'doublon d''entreprise';
  assert (select count(*) from membres where entreprise_id = e and profil_id = u and role = 'proprietaire') = 1, 'membre propriétaire manquant';
  assert (select site from entreprises where id = e) = 'studiokoffi.bj', 'site non repris de l''analyse';
  assert (select pays from entreprises where id = e) = 'BJ', 'pays à normaliser en majuscules';
  assert (select fiche_activite->>'nom' from entreprises where id = e) = 'Studio Koffi', 'fiche non rattachée';
  assert (select count(*) from profils_cibles where entreprise_id = e) = 1, 'seul le profil actif doit devenir une cible';
  assert (select rattachee_a from analyses_anonymes where jeton = 'jeton-test') = e, 'analyse non marquée rattachée';
  assert (select telephone_whatsapp from profils where id = u) = '+22901234567', 'numéro non repris';

  insert into auth.users (id, email, raw_user_meta_data) values (u2, 'v@test.local', '{"entreprise_nom":"Autre","analyse_jeton":"jeton-test"}');
  e2 := creer_entreprise_inscription(u2);
  assert (select fiche_activite from entreprises where id = e2) is null, 'une analyse déjà rattachée ne doit pas être réutilisée';

  refuse := false;
  begin
    insert into auth.users (id, email, raw_user_meta_data) values (gen_random_uuid(), 'w@test.local', '{}');
    perform creer_entreprise_inscription((select id from auth.users where email = 'w@test.local'));
  exception when others then refuse := sqlerrm like 'nom_entreprise_manquant%'; end;
  assert refuse, 'sans nom d''entreprise, la création doit être refusée';

  perform set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true);
  set local role authenticated;
  refuse := false;
  begin perform creer_entreprise_inscription(u2); exception when insufficient_privilege then refuse := true; end;
  assert refuse, 'creer_entreprise_inscription doit être réservée au serveur';
  reset role;
  raise exception 'TEST_OK creation_entreprise';
end $$;
