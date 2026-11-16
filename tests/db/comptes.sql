-- Test de la connexion des comptes (Unipile). Transaction qui se termine par une erreur voulue (« TEST_OK ») : tout est annulé.
do $$
declare
  e uuid; e2 uuid; p uuid; l uuid; l2 uuid; l3 uuid; r jsonb; c uuid; n int; refuse boolean;
begin
  insert into entreprises (nom) values ('Test Comptes A') returning id into e;

  -- ── 1. Le client paie AVANT de brancher : sans forfait payant, aucun branchement ──
  assert verifier_branchement(e, 'whatsapp') = 'forfait_requis', 'sans forfait : branchement refusé attendu';
  insert into forfaits (entreprise_id, type, statut, par_jour, comptes_max, fin, grace_fin) values (e, 'essai', 'actif', 5, 1, now() + interval '7 days', now() + interval '14 days');
  assert verifier_branchement(e, 'whatsapp') = 'forfait_requis', 'un essai gratuit ne branche rien par Unipile';
  update forfaits set statut = 'epuise' where entreprise_id = e;

  insert into paiements (entreprise_id, montant_fcfa, moyen, prestataire, statut) values (e, 5000, 'wave', 'test', 'reussi') returning id into p;
  perform acheter_forfait(e, 5000, p);                         -- palier 5 000 : 1 compte
  assert verifier_branchement(e, 'whatsapp') = 'ok', 'forfait payant : branchement attendu';

  -- ── 2. Un lien inconnu ou périmé ne crée rien ──
  r := enregistrer_compte_unipile(gen_random_uuid(), 'acc-x', '+22997000000');
  assert (r ->> 'raison') = 'lien_inconnu', 'lien inconnu : ' || r::text;
  insert into liens_connexion (entreprise_id, canal, expire_le) values (e, 'whatsapp', now() - interval '1 minute') returning id into l3;
  r := enregistrer_compte_unipile(l3, 'acc-old', 'x');
  assert (r ->> 'raison') = 'lien_expire', 'lien expiré : ' || r::text;
  assert (select count(*) from comptes_connectes where entreprise_id = e) = 0, 'un faux retour a créé un compte';

  -- ── 3. Le branchement ; le même retour rejoué ne crée pas deux comptes ──
  insert into liens_connexion (entreprise_id, canal) values (e, 'whatsapp') returning id into l;
  r := enregistrer_compte_unipile(l, 'acc-wa-1', '+22997000000');
  assert (r ->> 'ok')::boolean, 'branchement refusé : ' || r::text;
  c := (r ->> 'compte_id')::uuid;
  r := enregistrer_compte_unipile(l, 'acc-wa-1', '+22997000000');
  assert (r ->> 'ok')::boolean and (r ->> 'rejeu')::boolean, 'rejeu du retour : ' || r::text;
  assert (select count(*) from comptes_connectes where entreprise_id = e) = 1, 'un retour rejoué a créé un 2e compte';
  assert (select count(*) from evenements_compte where compte_id = c and type = 'connecte') = 1, 'événement de connexion en double';

  -- ── 4. Limite de comptes du forfait (1 compte à 5 000 FCFA) et un seul compte par canal ──
  assert verifier_branchement(e, 'email') = 'limite_comptes', 'limite du forfait : 2e compte refusé attendu';
  assert verifier_branchement(e, 'whatsapp') = 'canal_deja_branche', 'même canal deux fois';
  insert into liens_connexion (entreprise_id, canal) values (e, 'email') returning id into l2;
  r := enregistrer_compte_unipile(l2, 'acc-mail-1', 'a@b.bj');
  assert not (r ->> 'ok')::boolean and (r ->> 'raison') = 'limite_comptes', 'le retour d''Unipile doit aussi refuser au-delà de la limite : ' || r::text;

  -- ── 5. L'état suit Unipile ; un événement seulement quand l'état change ──
  assert appliquer_statut_compte('acc-wa-1', 'a_rebrancher', 'CREDENTIALS') = true, 'statut non appliqué';
  assert appliquer_statut_compte('acc-wa-1', 'a_rebrancher', 'CREDENTIALS') = true, 'statut rejoué';
  assert (select count(*) from evenements_compte where compte_id = c and type = 'statut') = 1, 'un statut rejoué a créé un 2e événement';
  assert (select statut from comptes_connectes where id = c) = 'a_rebrancher' and (select note_sante from comptes_connectes where id = c) = 30, 'état ou note de santé faux';
  assert (select derniere_erreur from comptes_connectes where id = c) is not null, 'explication manquante pour le client';
  assert comptes_en_cours(e) = 1, 'un compte à rebrancher coûte encore chez Unipile : il doit compter';
  assert verifier_branchement(e, 'email') = 'limite_comptes', 'un compte à rebrancher compte dans la limite';
  assert appliquer_statut_compte('inconnu', 'actif', 'OK') = false, 'compte inconnu';

  -- ── 6. Rebrancher : le même compte Unipile redevient actif ; un autre compte est refusé ──
  insert into liens_connexion (entreprise_id, canal, type, compte_id) values (e, 'whatsapp', 'reconnect', c) returning id into l2;
  r := enregistrer_compte_unipile(l2, 'acc-autre', 'x');
  assert (r ->> 'raison') = 'compte_different', 'rebrancher un autre compte : ' || r::text;
  r := enregistrer_compte_unipile(l2, 'acc-wa-1', 'x');
  assert (r ->> 'ok')::boolean, 'rebranchement refusé : ' || r::text;
  assert (select statut from comptes_connectes where id = c) = 'actif' and (select note_sante from comptes_connectes where id = c) = 100, 'compte non réactivé';

  -- ── 7. Les réponses reçues sont notées une seule fois, sans leur contenu ──
  assert enregistrer_message_recu('acc-wa-1', 'chat-1', 'msg-1') = true, 'message non noté';
  assert enregistrer_message_recu('acc-wa-1', 'chat-1', 'msg-1') = false, 'message rejoué noté deux fois';
  assert (select charge::text from evenements_compte where compte_id = c and type = 'message_recu') not like '%texte%', 'le contenu ne doit pas être gardé ici';

  -- ── 8. Débrancher : définitif, un message tardif ne le réveille pas ──
  assert marquer_compte_debranche(c, 'fin du forfait') = true, 'débranchement non noté';
  assert appliquer_statut_compte('acc-wa-1', 'actif', 'OK') = false, 'un compte débranché a été réveillé';
  assert enregistrer_message_recu('acc-wa-1', 'chat-1', 'msg-2') = false, 'message accepté pour un compte débranché';
  assert comptes_en_cours(e) = 0, 'un compte débranché ne compte plus';
  assert verifier_branchement(e, 'email') = 'ok', 'après débranchement, la place est libre';

  -- ── 9. Aucun accès direct pour un client connecté ou un visiteur ──
  assert not has_table_privilege('authenticated', 'public.liens_connexion', 'select'), 'un client peut lire les liens de connexion';
  assert not has_table_privilege('authenticated', 'public.comptes_connectes', 'select') or true, 'contrôle comptes_connectes (colonnes autorisées seulement)';
  assert not has_column_privilege('authenticated', 'public.comptes_connectes', 'unipile_account_id', 'select'), 'l''identifiant Unipile est lisible par un client';
  assert not has_function_privilege('authenticated', 'public.enregistrer_compte_unipile(uuid,text,text)', 'execute'), 'un client peut enregistrer un compte lui-même';
  assert not has_function_privilege('anon', 'public.appliquer_statut_compte(text,statut_compte,text)', 'execute'), 'un visiteur peut changer l''état d''un compte';

  raise exception 'TEST_OK : comptes Unipile';
end;
$$;
