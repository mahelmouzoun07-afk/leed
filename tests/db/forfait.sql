-- Test du forfait. S'exécute dans une transaction qui se termine par une erreur voulue
-- (« TEST_OK ... ») : tout est annulé, rien ne reste en base.
-- Lancer : exécuter ce fichier dans l'éditeur SQL de Supabase ou via le connecteur.
do $$
declare
  e uuid; e2 uuid; e3 uuid; p uuid; p2 uuid; p3 uuid; f uuid; f2 uuid;
  i int; r boolean; ok int := 0; rest int; refuse boolean;
begin
  -- ── 1. Achat : 100 000 FCFA = 571 entreprises à 175 FCFA, sans bonus (pas d'essai avant) ──
  insert into entreprises (nom) values ('Test A') returning id into e;
  insert into paiements (entreprise_id, montant_fcfa, moyen, prestataire, statut) values (e, 100000, 'wave', 'test', 'reussi') returning id into p;
  f := acheter_forfait(e, 100000, p);
  select entreprises_restantes into rest from forfaits where id = f;
  assert rest = 571, 'achat 100000 : attendu 571, obtenu ' || rest;
  assert acheter_forfait(e, 100000, p) = f, 'le même paiement doit renvoyer le même forfait';
  assert (select count(*) from forfaits where entreprise_id = e) = 1, 'un paiement rejoué a créé un 2e forfait';

  -- ── 2. Un paiement non confirmé ou au mauvais montant est refusé ──
  insert into paiements (entreprise_id, montant_fcfa, moyen, prestataire, statut) values (e, 5000, 'mtn_momo', 'test', 'en_attente') returning id into p2;
  refuse := false;
  begin perform acheter_forfait(e, 5000, p2); exception when others then refuse := sqlerrm like 'paiement_non_confirme%'; end;
  assert refuse, 'un paiement en attente a ouvert un forfait';

  -- ── 3. Décompte : au plus 40 par jour (palier 100 000), 200 tentatives ──
  for i in 1..200 loop
    begin
      r := decompter_entreprise(e, null, 'cle-' || i);
      if r then ok := ok + 1; end if;
    exception when others then null;
    end;
  end loop;
  assert ok = 40, '200 décomptes : exactement 40 attendus (rythme du jour), obtenu ' || ok;
  select entreprises_restantes into rest from forfaits where id = f;
  assert rest = 531, 'restantes après 40 décomptes : 531 attendu, obtenu ' || rest;

  -- ── 4. Idempotence : la même clé rejouée ne décompte pas deux fois ──
  assert decompter_entreprise(e, null, 'cle-1') = false, 'clé rejouée : doit renvoyer false';
  select entreprises_restantes into rest from forfaits where id = f;
  assert rest = 531, 'clé rejouée a décompté de nouveau';

  -- ── 5. Retour : un message non livré rend l'entreprise, une seule fois ──
  assert rendre_entreprise('cle-1', 'retour-1') = true, 'retour attendu';
  assert rendre_entreprise('cle-1', 'retour-1') = false, 'retour rejoué doit renvoyer false';
  select entreprises_restantes into rest from forfaits where id = f;
  assert rest = 532, 'restantes après retour : 532 attendu, obtenu ' || rest;

  -- ── 6. Le grand livre ne se modifie pas ──
  refuse := false;
  begin update mouvements_forfait set nombre = 0; exception when others then refuse := sqlerrm like 'immuable%'; end;
  assert refuse, 'mouvements_forfait doit être immuable (update)';
  refuse := false;
  begin delete from mouvements_forfait; exception when others then refuse := sqlerrm like 'immuable%'; end;
  assert refuse, 'mouvements_forfait doit être immuable (delete)';

  -- ── 7. Recharge avant la fin : report + bonus de fidélité (20 % au palier 50 000) ──
  insert into paiements (entreprise_id, montant_fcfa, moyen, prestataire, statut) values (e, 50000, 'wave', 'test', 'reussi') returning id into p3;
  f2 := acheter_forfait(e, 50000, p3);
  -- 50 000 / 200 = 250 ; bonus 20 % = 50 ; report 532
  select entreprises_restantes into rest from forfaits where id = f2;
  assert rest = 250 + 50 + 532, 'recharge : 832 attendu (250 + 50 bonus + 532 reportées), obtenu ' || rest;
  assert (select statut from forfaits where id = f) = 'epuise', 'l''ancien forfait doit être clos';

  -- ── 8. Fin de forfait : grâce, puis gel, puis dégel à la recharge ──
  update forfaits set fin = now() - interval '1 day', grace_fin = now() + interval '6 days' where id = f2;
  perform appliquer_echeances_forfaits();
  assert (select statut from forfaits where id = f2) = 'grace', 'après la fin : statut grace attendu';
  refuse := false;
  begin perform decompter_entreprise(e, null, 'pendant-grace'); exception when others then refuse := sqlerrm like 'aucun_forfait_actif%'; end;
  assert refuse, 'en grâce : plus de nouveaux envois';
  update forfaits set grace_fin = now() - interval '1 hour' where id = f2;
  perform appliquer_echeances_forfaits();
  assert (select statut from forfaits where id = f2) = 'gele', 'après la grâce : statut gele attendu';
  assert (select entreprises_restantes from forfaits where id = f2) = 832, 'le gel ne doit rien perdre';

  insert into paiements (entreprise_id, montant_fcfa, moyen, prestataire, statut) values (e, 10000, 'wave', 'test', 'reussi') returning id into p;
  f := acheter_forfait(e, 10000, p);
  -- 10 000 / 250 = 40, pas de bonus (ni forfait actif, ni essai) + 832 dégelées
  select entreprises_restantes into rest from forfaits where id = f;
  assert rest = 40 + 832, 'dégel : 872 attendu, obtenu ' || rest;

  -- ── 9. Essai gratuit : un par numéro, Gmail et site ──
  insert into entreprises (nom) values ('Essai 1') returning id into e2;
  insert into entreprises (nom) values ('Essai 2') returning id into e3;
  perform demarrer_essai(e2, '+229 01 23 45 67 89', 'koffi@gmail.com', 'https://www.studiokoffi.bj');
  assert (select entreprises_restantes from forfaits where entreprise_id = e2 and type = 'essai') = 10, 'essai : 10 entreprises';
  refuse := false;
  begin perform demarrer_essai(e3, '+22901 23 45 67 89', 'troisieme@gmail.com', 'troisieme.bj'); exception when others then refuse := sqlerrm like 'essai_deja_utilise%'; end;
  assert refuse, 'même numéro WhatsApp : l''essai doit être refusé';
  refuse := false;
  begin perform demarrer_essai(e3, '+229 99 99 99 99', 'KOFFI@gmail.com', 'x.bj'); exception when others then refuse := sqlerrm like 'essai_deja_utilise%'; end;
  assert refuse, 'même Gmail (casse différente) : l''essai doit être refusé';

  -- ── 10. Premier forfait juste après l'essai : +20 % ──
  insert into paiements (entreprise_id, montant_fcfa, moyen, prestataire, statut) values (e2, 25000, 'moov_money', 'test', 'reussi') returning id into p;
  f := acheter_forfait(e2, 25000, p);
  -- 25 000 / 225 = 111 ; +20 % = 22
  assert (select entreprises_achetees from forfaits where id = f) = 111 + 22, 'bonus après essai : 133 attendu';

  raise exception 'TEST_OK forfait : 10 groupes de vérifications passés';
end $$;
