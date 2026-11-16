-- Test des fonctions de l'espace équipe (chantier 12). Tout est annulé à la fin (erreur voulue « TEST_OK »).
do $$
declare
  a uuid := gen_random_uuid(); c uuid := gen_random_uuid(); s uuid := gen_random_uuid();
  e uuid; pai uuid; r jsonb; refuse boolean; n int;
begin
  insert into auth.users (id, email) values (a, 'admin@test.local'), (c, 'client@test.local'), (s, 'support@test.local');
  insert into administrateurs (profil_id, role) values (a, 'admin'), (s, 'support');
  insert into entreprises (nom, ville, pays) values ('Entreprise test', 'Cotonou', 'BJ') returning id into e;
  insert into membres (entreprise_id, profil_id) values (e, c);
  insert into paiements (entreprise_id, montant_fcfa, moyen, prestataire, statut) values (e, 25000, 'wave', 'test', 'reussi') returning id into pai;
  perform acheter_forfait(e, 25000, pai);
  insert into couts_par_client (entreprise_id, mois, poste, montant_fcfa) values (e, date_trunc('month', now())::date, 'unipile', 6560);

  -- un client n'a accès à aucune fonction admin
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  set local role authenticated;
  refuse := false; begin perform admin_accueil(); exception when others then refuse := sqlstate = '42501'; end;
  assert refuse, 'un client ne doit pas ouvrir admin_accueil';
  refuse := false; begin perform admin_clients(); exception when others then refuse := sqlstate = '42501'; end;
  assert refuse, 'un client ne doit pas ouvrir admin_clients';
  refuse := false; begin perform admin_suspendre_envoi(e, true, 'test'); exception when others then refuse := sqlstate = '42501'; end;
  assert refuse, 'un client ne doit pas suspendre un envoi';
  reset role;

  -- un administrateur lit
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  r := admin_accueil();
  assert (r->>'clients_actifs')::int >= 1, 'accueil : clients actifs';
  assert (r->'couts_mois'->>'unipile')::int = 6560, 'accueil : coût Unipile du mois';
  assert jsonb_array_length(admin_clients()) >= 1, 'clients : liste';
  r := admin_client(e);
  assert r->>'nom' = 'Entreprise test', 'fiche client';
  assert (r->'forfait'->>'restantes')::int = 111, 'fiche client : forfait';
  assert r->'proprietaire'->>'email' = 'client@test.local', 'fiche client : propriétaire';
  assert (admin_comptes()->>'total_actifs') is not null, 'comptes';
  assert (admin_annuaire()->>'entreprises') is not null, 'annuaire';
  assert admin_messages_bloques() ? 'liste', 'messages bloqués';
  assert (admin_paiements()->>'encaisse_mois')::int >= 25000, 'paiements : encaissé';
  assert jsonb_array_length(admin_couts()->'paliers') = 5, 'coûts : cinq paliers';
  refuse := false; begin perform admin_client(gen_random_uuid()); exception when others then refuse := sqlstate = 'P0002'; end;
  assert refuse, 'client inconnu : erreur attendue';

  -- écritures : motif obligatoire, journal d'audit
  refuse := false; begin perform admin_suspendre_envoi(e, true, ''); exception when others then refuse := sqlerrm like 'motif_obligatoire%'; end;
  assert refuse, 'motif obligatoire';
  perform admin_suspendre_envoi(e, true, 'compte en danger');
  assert ((select x->>'envoi_suspendu' from jsonb_array_elements(admin_clients()) x where x->>'id' = e::text))::boolean, 'envoi suspendu';
  perform admin_suspendre_envoi(e, false, 'compte rebranché');
  perform admin_offrir_entreprises(e, 10, 'geste commercial');
  assert (admin_client(e)->'forfait'->>'restantes')::int = 121, 'offrir : 111 + 10';
  assert (select count(*) from journal_audit where cible_id = e) = 3, 'trois actions dans le journal d''audit';
  reset role;

  -- le support lit mais ne peut pas offrir des entreprises
  perform set_config('request.jwt.claims', json_build_object('sub', s, 'role', 'authenticated')::text, true);
  set local role authenticated;
  assert (admin_accueil()->>'clients_actifs') is not null, 'le support peut lire';
  refuse := false; begin perform admin_offrir_entreprises(e, 5, 'test'); exception when others then refuse := sqlstate = '42501'; end;
  assert refuse, 'le support ne doit pas offrir des entreprises';
  reset role;

  -- le journal d'audit est immuable
  refuse := false; begin update journal_audit set action = 'x'; exception when others then refuse := sqlerrm like 'immuable%'; end;
  assert refuse, 'journal_audit doit être immuable';

  -- la note du client sur un prospect : possible pour son entreprise seulement
  insert into prospects (entreprise_id, nom) values (e, 'Prospect test');
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update prospects set note_client = 'Rappeler après les fêtes' where entreprise_id = e;
  get diagnostics n = row_count;
  assert n = 1, 'le client doit pouvoir noter son prospect';
  refuse := false; begin update prospects set nom = 'pirate' where entreprise_id = e; exception when insufficient_privilege then refuse := true; end;
  assert refuse, 'le client ne doit modifier que la note';
  reset role;

  raise exception 'TEST_OK admin';
end $$;
