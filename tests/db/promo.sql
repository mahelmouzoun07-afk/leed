-- Test des codes promo. S'exécute dans une transaction qui se termine par une erreur voulue
-- (« TEST_OK ... ») : tout est annulé, rien ne reste en base.
do $$
declare
  e uuid; e2 uuid; c20 uuid; c100 uuid; cmax uuid; csn uuid;
  p uuid; p2 uuid; p3 uuid; r jsonb; f uuid; fo record; refuse boolean;
begin
  insert into entreprises (nom, pays) values ('Test Promo A', 'BJ') returning id into e;
  insert into entreprises (nom, pays) values ('Test Promo B', 'BJ') returning id into e2;

  insert into codes_promo (code, code_normalise, pourcentage) values ('AbCd1234', 'ABCD1234', 20) returning id into c20;

  -- ── 1. Le pourcentage se calcule avant le paiement ; majuscules et minuscules sont le même code ──
  r := calculer_code_promo(e, 'abcd1234', 25000);
  assert (r ->> 'valide')::boolean, 'code valide refusé : ' || r::text;
  assert (r ->> 'remise_fcfa')::int = 5000 and (r ->> 'a_payer_fcfa')::int = 20000, '20 % de 25 000 : ' || r::text;
  assert (r ->> 'acces_complet')::boolean = false, '20 % ne donne pas l''accès complet';
  assert (calculer_code_promo(e, ' ABCD1234 ', 25000) ->> 'valide')::boolean, 'espaces autour du code';

  -- ── 2. Un code mal formé, inconnu, ou un montant trop bas est refusé ──
  assert calculer_code_promo(e, 'ABC1234', 25000) ->> 'raison' = 'inconnu', '7 caractères';
  assert calculer_code_promo(e, 'ABCD123456789', 25000) ->> 'raison' = 'inconnu', '13 caractères';
  assert calculer_code_promo(e, 'ABCD-234', 25000) ->> 'raison' = 'inconnu', 'caractère interdit';
  assert calculer_code_promo(e, 'ZZZZ9999', 25000) ->> 'raison' = 'inconnu', 'code inconnu';
  assert calculer_code_promo(e, 'ABCD1234', 4000) ->> 'raison' = 'montant_invalide', 'montant sous 5 000';

  -- ── 3. Les contraintes de la table : 8 à 12 lettres ou chiffres ; 100 % exige un plafond ──
  refuse := false;
  begin insert into codes_promo (code, code_normalise, pourcentage) values ('ABC', 'ABC', 10); exception when check_violation then refuse := true; end;
  assert refuse, 'un code de 3 caractères a été accepté';
  refuse := false;
  begin insert into codes_promo (code, code_normalise, pourcentage) values ('ABCD12345', 'ABCD12345', 101); exception when check_violation then refuse := true; end;
  assert refuse, '101 % accepté';
  refuse := false;
  begin insert into codes_promo (code, code_normalise, pourcentage) values ('GRATUIT100', 'GRATUIT100', 100); exception when check_violation then refuse := true; end;
  assert refuse, 'un code 100 % sans plafond a été accepté';

  -- ── 4. Le plafond limite la remise ; un paiement ne tombe jamais sous 100 FCFA ──
  insert into codes_promo (code, code_normalise, pourcentage, plafond_remise_fcfa) values ('Plafond50', 'PLAFOND50', 50, 3000);
  r := calculer_code_promo(e, 'PLAFOND50', 25000);
  assert (r ->> 'remise_fcfa')::int = 3000, 'plafond : ' || r::text;
  insert into codes_promo (code, code_normalise, pourcentage, plafond_remise_fcfa) values ('Presque99X', 'PRESQUE99X', 99, 100000);
  r := calculer_code_promo(e, 'PRESQUE99X', 5000);
  assert (r ->> 'a_payer_fcfa')::int = 100 and (r ->> 'remise_fcfa')::int = 4900, '99 % de 5 000 doit laisser 100 FCFA : ' || r::text;

  -- ── 5. Un code 100 % : rien à payer jusqu'au plafond, accès complet ──
  insert into codes_promo (code, code_normalise, pourcentage, plafond_remise_fcfa) values ('Gratuit2026', 'GRATUIT2026', 100, 20000) returning id into c100;
  r := calculer_code_promo(e, 'gratuit2026', 15000);
  assert (r ->> 'a_payer_fcfa')::int = 0 and (r ->> 'remise_fcfa')::int = 15000 and (r ->> 'acces_complet')::boolean, '100 % sous le plafond : ' || r::text;
  r := calculer_code_promo(e, 'gratuit2026', 50000);
  assert (r ->> 'remise_fcfa')::int = 20000 and (r ->> 'a_payer_fcfa')::int = 30000, '100 % au-dessus du plafond : ' || r::text;

  -- ── 6. Réservation : le prix du paiement doit être celui de la base ──
  insert into paiements (entreprise_id, montant_fcfa, montant_forfait_fcfa, remise_fcfa, code_promo_id, moyen, prestataire, statut)
  values (e, 20000, 25000, 5000, c20, 'wave', 'test', 'en_attente') returning id into p;
  r := reserver_code_promo(e, 'abcd1234', 25000, p);
  assert (r ->> 'valide')::boolean, 'réservation refusée : ' || r::text;
  assert (select statut from utilisations_code_promo where paiement_id = p) = 'reserve', 'utilisation non réservée';
  assert calculer_code_promo(e, 'ABCD1234', 25000) ->> 'raison' = 'deja_utilise', 'un code réservé doit compter pour l''entreprise';
  assert (calculer_code_promo(e2, 'ABCD1234', 25000) ->> 'valide')::boolean, 'une autre entreprise peut l''utiliser';

  insert into paiements (entreprise_id, montant_fcfa, montant_forfait_fcfa, remise_fcfa, code_promo_id, moyen, prestataire, statut)
  values (e2, 1000, 6000, 5000, c20, 'wave', 'test', 'en_attente') returning id into p3;   -- prix trafiqué (cohérent, mais pas celui de la base) : 1 000 FCFA payés au lieu de 20 000
  refuse := false;
  begin perform reserver_code_promo(e2, 'ABCD1234', 25000, p3); exception when others then refuse := sqlerrm like 'prix_modifie%'; end;
  assert refuse, 'un prix qui ne vient pas de la base a été accepté';

  -- ── 7. Succès : l'utilisation est confirmée ; échec : le code est libéré ──
  update paiements set statut = 'reussi' where id = p;
  assert (select statut from utilisations_code_promo where paiement_id = p) = 'confirme', 'utilisation non confirmée au succès';
  assert calculer_code_promo(e, 'ABCD1234', 25000) ->> 'raison' = 'deja_utilise', 'code confirmé : une seule fois par entreprise';

  insert into paiements (entreprise_id, montant_fcfa, montant_forfait_fcfa, remise_fcfa, code_promo_id, moyen, prestataire, statut)
  values (e2, 20000, 25000, 5000, c20, 'wave', 'test', 'en_attente') returning id into p2;
  perform reserver_code_promo(e2, 'ABCD1234', 25000, p2);
  assert calculer_code_promo(e2, 'ABCD1234', 25000) ->> 'raison' = 'deja_utilise', 'réservation non comptée';
  update paiements set statut = 'echoue' where id = p2;
  assert (select statut from utilisations_code_promo where paiement_id = p2) = 'annule', 'utilisation non libérée à l''échec';
  assert (calculer_code_promo(e2, 'ABCD1234', 25000) ->> 'valide')::boolean, 'le code doit redevenir disponible après un échec';

  -- ── 8. Maximum d'utilisations au total ──
  insert into codes_promo (code, code_normalise, pourcentage, max_utilisations) values ('UneSeule01', 'UNESEULE01', 10, 1) returning id into cmax;
  insert into paiements (entreprise_id, montant_fcfa, montant_forfait_fcfa, remise_fcfa, code_promo_id, moyen, prestataire, statut)
  values (e, 22500, 25000, 2500, cmax, 'wave', 'test', 'en_attente') returning id into p3;
  perform reserver_code_promo(e, 'UNESEULE01', 25000, p3);
  update paiements set statut = 'reussi' where id = p3;
  assert calculer_code_promo(e2, 'UNESEULE01', 25000) ->> 'raison' = 'epuise', 'maximum atteint : le code doit être épuisé';

  -- ── 9. Dates, désactivation, pays, nouveaux clients, forfait minimum ──
  insert into codes_promo (code, code_normalise, pourcentage, debut, fin) values ('Expire2024', 'EXPIRE2024', 10, now() - interval '10 days', now() - interval '1 day');
  assert calculer_code_promo(e, 'EXPIRE2024', 25000) ->> 'raison' = 'expire', 'code expiré';
  insert into codes_promo (code, code_normalise, pourcentage, debut) values ('Demain2030', 'DEMAIN2030', 10, now() + interval '1 day');
  assert calculer_code_promo(e, 'DEMAIN2030', 25000) ->> 'raison' = 'pas_commence', 'code pas encore commencé';
  insert into codes_promo (code, code_normalise, pourcentage, actif) values ('Eteint9999', 'ETEINT9999', 10, false);
  assert calculer_code_promo(e, 'ETEINT9999', 25000) ->> 'raison' = 'inconnu', 'code désactivé';
  insert into codes_promo (code, code_normalise, pourcentage, pays) values ('Senegal001', 'SENEGAL001', 10, '{SN}') returning id into csn;
  assert calculer_code_promo(e, 'SENEGAL001', 25000) ->> 'raison' = 'pays', 'code d''un autre pays';
  update entreprises set pays = 'SN' where id = e2;
  assert (calculer_code_promo(e2, 'SENEGAL001', 25000) ->> 'valide')::boolean, 'code du bon pays refusé';
  insert into codes_promo (code, code_normalise, pourcentage, nouveaux_clients_seulement) values ('Nouveaux01', 'NOUVEAUX01', 10, true);
  update entreprises set premier_forfait_fait = true where id = e;
  assert calculer_code_promo(e, 'NOUVEAUX01', 25000) ->> 'raison' = 'nouveaux_clients', 'code réservé aux nouveaux clients';
  insert into codes_promo (code, code_normalise, pourcentage, montant_min_fcfa) values ('Minimum501', 'MINIMUM501', 10, 25000);
  assert calculer_code_promo(e2, 'MINIMUM501', 10000) ->> 'raison' = 'montant_trop_bas', 'forfait minimum du code';

  -- ── 10. Forfait payé avec remise : la valeur du forfait est celle de 25 000 FCFA, pas des 20 000 payés ──
  f := acheter_forfait(e, 25000, p);
  select entreprises_achetees, comptes_max, acces_complet into fo from forfaits where id = f;
  assert fo.entreprises_achetees >= 111, 'forfait de 25 000 : 111 entreprises attendues au moins, obtenu ' || fo.entreprises_achetees;
  assert fo.comptes_max = 3 and fo.acces_complet = false, 'forfait remisé : 3 comptes, pas d''accès complet';
  refuse := false;
  begin perform acheter_forfait(e, 20000, p3); exception when others then refuse := true; end;
  assert refuse, 'un autre montant que la valeur du forfait a été accepté';

  -- ── 11. Forfait offert à 100 % : rien payé, toutes les fonctionnalités ──
  insert into entreprises (nom, pays) values ('Test Promo C', 'BJ') returning id into e;
  insert into paiements (entreprise_id, montant_fcfa, montant_forfait_fcfa, remise_fcfa, code_promo_id, moyen, prestataire, statut)
  values (e, 0, 15000, 15000, c100, 'code_promo', 'code_promo', 'en_attente') returning id into p;
  perform reserver_code_promo(e, 'GRATUIT2026', 15000, p);
  update paiements set statut = 'reussi', confirme_le = now() where id = p;
  f := acheter_forfait(e, 15000, p);
  select entreprises_achetees, par_jour, comptes_max, cibles_max, acces_complet into fo from forfaits where id = f;
  assert fo.acces_complet and fo.comptes_max is null and fo.cibles_max is null and fo.par_jour = 40, 'accès complet attendu : ' || row_to_json(fo)::text;
  assert fo.entreprises_achetees >= 60, 'forfait offert de 15 000 : 60 entreprises attendues au moins';
  assert (select statut from utilisations_code_promo where paiement_id = p) = 'confirme', 'forfait offert : utilisation non confirmée';

  -- ── 12. Un forfait sans code garde les avantages de son palier ──
  insert into entreprises (nom, pays) values ('Test Promo D', 'BJ') returning id into e;
  insert into paiements (entreprise_id, montant_fcfa, moyen, prestataire, statut) values (e, 10000, 'wave', 'test', 'reussi') returning id into p;
  f := acheter_forfait(e, 10000, p);
  select comptes_max, cibles_max, acces_complet, par_jour into fo from forfaits where id = f;
  assert fo.comptes_max = 2 and fo.cibles_max = 2 and fo.acces_complet = false and fo.par_jour = 10, 'palier 10 000 : 2 comptes, 2 cibles, 10 par jour';

  -- ── 13. Aucun accès direct pour un client connecté ou un visiteur ──
  assert not has_table_privilege('authenticated', 'public.codes_promo', 'select'), 'un client peut lire les codes promo';
  assert not has_table_privilege('anon', 'public.utilisations_code_promo', 'select'), 'un visiteur peut lire les utilisations';
  assert not has_function_privilege('authenticated', 'public.calculer_code_promo(uuid,text,integer)', 'execute'), 'un client peut appeler le calcul directement';
  assert not has_function_privilege('authenticated', 'public.reserver_code_promo(uuid,text,integer,uuid)', 'execute'), 'un client peut réserver directement';

  raise exception 'TEST_OK : codes promo';
end;
$$;
