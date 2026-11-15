-- Test de la sécurité : file d'envoi, RLS, droits par colonne, fonctions réservées au serveur, admin.
-- Tout est annulé à la fin (erreur voulue « TEST_OK »).
do $$
declare
  ua uuid := gen_random_uuid(); ub uuid := gen_random_uuid();
  e1 uuid; e2 uuid; pr1 uuid; pr2 uuid; pr3 uuid; n int; refuse boolean; t uuid;
begin
  insert into auth.users (id, email) values (ua, 'a@test.local'), (ub, 'b@test.local');
  assert (select count(*) from profils where id in (ua, ub)) = 2, 'le profil doit se créer à l''inscription';
  insert into entreprises (nom) values ('E1') returning id into e1;
  insert into entreprises (nom) values ('E2') returning id into e2;
  insert into membres (entreprise_id, profil_id) values (e1, ua);
  insert into comptes_connectes (entreprise_id, canal, unipile_account_id, identifiant_affiche) values (e1, 'whatsapp', 'SECRET-UNIPILE', '+229 97 00 00 00');
  insert into comptes_connectes (entreprise_id, canal, unipile_account_id, identifiant_affiche) values (e2, 'whatsapp', 'SECRET-2', '+229 97 11 11 11');
  insert into annuaire_entreprises (nom, nom_normalise, pays, ville, secteur, whatsapp) values ('Maquis Tanti', 'maquis tanti', 'BJ', 'Cotonou', 'restauration', '+22997000000');
  insert into prospects (entreprise_id, nom, signal) values (e1, 'Maquis Tanti', 'logo difficile à lire') returning id into pr1;
  insert into prospects (entreprise_id, nom, signal) values (e2, 'Autre', 'signal') returning id into pr2;
  insert into prospects (entreprise_id, nom) values (e1, 'Sans signal') returning id into pr3;
  insert into prospects_identifiants (prospect_id, entreprise_id, canal, identifiant) values (pr1, e1, 'whatsapp', '+229 01 23 45 67 89');

  -- ── A. La file d'envoi refuse ce qui ne doit jamais partir ──
  insert into file_envoi (entreprise_id, prospect_id, canal, planifie_pour) values (e1, pr1, 'whatsapp', now());   -- le cas normal passe

  refuse := false;
  begin insert into file_envoi (entreprise_id, prospect_id, canal, planifie_pour) values (e1, pr3, 'whatsapp', now());
  exception when others then refuse := sqlerrm like 'sans_signal%'; end;
  assert refuse, 'sans signal, le message doit être refusé';

  refuse := false;
  begin insert into file_envoi (entreprise_id, prospect_id, canal, planifie_pour) values (e1, pr2, 'whatsapp', now());
  exception when others then refuse := sqlerrm like 'prospect_invalide%'; end;
  assert refuse, 'le prospect d''un autre client doit être refusé';

  insert into opt_outs (canal, identifiant_hash, raison) values ('whatsapp', hacher_identifiant('whatsapp', '00229 01 23 45 67 89'), 'stop');
  -- ce numéro écrit autrement (indicatif, espaces) doit être reconnu
  refuse := false;
  begin insert into file_envoi (entreprise_id, prospect_id, canal, planifie_pour) values (e1, pr1, 'whatsapp', now() + interval '1 day');
  exception when others then refuse := sqlerrm like 'opt_out%'; end;
  assert refuse, 'un numéro qui a dit STOP ne doit plus recevoir de message';
  delete from opt_outs;

  insert into exclusions_client (entreprise_id, type, valeur) values (e1, 'nom', 'MAQUIS TANTI');
  refuse := false;
  begin insert into file_envoi (entreprise_id, prospect_id, canal, planifie_pour) values (e1, pr1, 'whatsapp', now() + interval '2 days');
  exception when others then refuse := sqlerrm like 'exclusion_client%'; end;
  assert refuse, 'un prospect exclu par le client ne doit pas être contacté';
  delete from exclusions_client;

  update entreprises set envoi_suspendu = true where id = e1;
  refuse := false;
  begin insert into file_envoi (entreprise_id, prospect_id, canal, planifie_pour) values (e1, pr1, 'whatsapp', now() + interval '3 days');
  exception when others then refuse := sqlerrm like 'envoi_suspendu%'; end;
  assert refuse, 'envoi suspendu : aucun message ne doit être mis en file';
  update entreprises set envoi_suspendu = false where id = e1;

  -- ── B. Le client A (membre de E1) ──
  perform set_config('request.jwt.claims', json_build_object('sub', ua, 'role', 'authenticated')::text, true);
  set local role authenticated;

  assert (select count(*) from prospects) = 2, 'A ne doit voir que les 2 prospects de E1';
  assert (select count(*) from entreprises) = 1, 'A ne doit voir que son entreprise';
  assert (select count(*) from mes_comptes) = 1, 'A doit voir son compte connecté (et seulement le sien)';

  refuse := false;
  begin perform 1 from annuaire_entreprises; exception when insufficient_privilege then refuse := true; end;
  assert refuse, 'le client ne doit pas lire l''annuaire';

  refuse := false;
  begin perform unipile_account_id from comptes_connectes; exception when insufficient_privilege then refuse := true; end;
  assert refuse, 'unipile_account_id ne doit jamais être lisible par le client';

  refuse := false;
  begin perform 1 from opt_outs; exception when insufficient_privilege then refuse := true; end;
  assert refuse, 'opt_outs : service uniquement';

  refuse := false;
  begin update entreprises set envoi_suspendu = false where id = e1; exception when insufficient_privilege then refuse := true; end;
  assert refuse, 'le client ne doit pas pouvoir toucher envoi_suspendu';

  update entreprises set nom_affiche = 'Koffi, du Studio Koffi' where id = e1;   -- un réglage : permis
  update entreprises set nom_affiche = 'pirate' where id = e2;                   -- l'entreprise d'un autre : 0 ligne
  get diagnostics n = row_count;
  assert n = 0, 'le client ne doit pas modifier l''entreprise d''un autre';

  refuse := false;
  begin insert into forfaits (entreprise_id, type, par_jour, fin, grace_fin) values (e1, 'payant', 40, now(), now()); exception when insufficient_privilege then refuse := true; end;
  assert refuse, 'le client ne doit pas créer de forfait';

  refuse := false;
  begin perform acheter_forfait(e1, 100000, gen_random_uuid()); exception when insufficient_privilege then refuse := true; end;
  assert refuse, 'acheter_forfait : réservé au serveur';
  refuse := false;
  begin perform decompter_entreprise(e1, null, 'x'); exception when insufficient_privilege then refuse := true; end;
  assert refuse, 'decompter_entreprise : réservé au serveur';
  refuse := false;
  begin perform rechercher_annuaire(e1, gen_random_uuid(), 5); exception when insufficient_privilege then refuse := true; end;
  assert refuse, 'rechercher_annuaire : réservé au serveur';

  refuse := false;
  begin perform admin_resume_clients(); exception when others then refuse := sqlstate = '42501'; end;
  assert refuse, 'un client ne doit pas ouvrir le résumé admin';
  assert (select count(*) from administrateurs) = 0, 'un client ne doit voir aucun administrateur';

  insert into tickets_support (entreprise_id, ouvert_par, sujet) values (e1, ua, 'Question') returning id into t;
  refuse := false;
  begin insert into tickets_support (entreprise_id, ouvert_par, sujet) values (e2, ua, 'Pour un autre'); exception when others then refuse := sqlstate = '42501'; end;
  assert refuse, 'un ticket ne s''ouvre que pour sa propre entreprise';

  -- ── C. Le visiteur anonyme ──
  reset role;
  set local role anon;
  assert (select count(*) from paliers_forfait) = 5, 'le barème doit être public';
  refuse := false;
  begin perform 1 from entreprises; exception when insufficient_privilege then refuse := true; end;
  assert refuse, 'un visiteur ne doit rien lire des clients';
  reset role;

  -- ── D. L'administrateur B (pas membre de E1) ──
  insert into administrateurs (profil_id, role) values (ub, 'admin');
  perform set_config('request.jwt.claims', json_build_object('sub', ub, 'role', 'authenticated')::text, true);
  set local role authenticated;
  assert (select count(*) from admin_resume_clients()) >= 2, 'l''admin doit voir le résumé des clients';
  assert (select count(*) from tickets_support) = 1, 'l''admin doit voir les tickets';
  assert (select count(*) from prospects) = 0, 'l''admin ne lit pas les prospects en direct : il passe par des fonctions';
  reset role;

  raise exception 'TEST_OK securite : file d''envoi, RLS, colonnes, fonctions serveur, admin';
end $$;
