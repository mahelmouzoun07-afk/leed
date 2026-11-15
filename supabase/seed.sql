-- Données d'EXEMPLE pour développer le tableau de bord (jamais en production).
-- Fil rouge : Koffi Adjovi, Studio Koffi, graphiste à Cotonou. Tout est fictif.
-- Les entreprises de l'annuaire portent le mot « Exemple » dans leur nom.
-- Rejouable : si Studio Koffi existe déjà, il ne se passe rien.
do $$
declare
  u uuid := gen_random_uuid(); e uuid; src uuid; pai uuid; frf uuid; cpt uuid;
  camp uuid; cible uuid; seq uuid; mdl uuid; pr uuid; conv uuid; msg uuid; i int; a record;
  types text[] := array['Maquis', 'Boutique de mode', 'École privée', 'Hôtel', 'Salon de beauté'];
  secteurs text[] := array['restauration', 'commerce', 'education', 'hotellerie', 'beaute'];
  villes text[] := array['Cotonou', 'Porto-Novo', 'Abomey-Calavi'];
begin
  if exists (select 1 from public.entreprises where nom = 'Studio Koffi') then return; end if;

  -- ── Annuaire d'exemple : 5 types × 3 villes × 4 = 60 entreprises ──
  insert into public.annuaire_sources (nom, licence, peut_stocker, peut_revendre)
  values ('exemple', 'données d''exemple, fictives', true, false) returning id into src;
  for i in 1..60 loop
    insert into public.annuaire_entreprises (nom, nom_normalise, pays, ville, secteur, taille, whatsapp, email, liens_sociaux, source_id, source_ref, score_qualite)
    values (
      types[1 + (i - 1) % 5] || ' Exemple ' || lpad(i::text, 2, '0'),
      lower(types[1 + (i - 1) % 5]) || ' exemple ' || lpad(i::text, 2, '0'),
      'BJ', villes[1 + (i - 1) % 3], secteurs[1 + (i - 1) % 5],
      case when i % 4 = 0 then '11-50' else '1-10' end,
      case when i % 5 <> 4 then '+22900000' || lpad(i::text, 4, '0') end,
      case when i % 3 = 0 then 'contact' || i || '@exemple.invalid' end,
      case when i % 2 = 0 then jsonb_build_object('facebook', 'exemple-' || i) else jsonb_build_object('instagram', 'exemple_' || i) end,
      src, 'exemple-' || i, 40 + (i * 7) % 55
    );
  end loop;

  -- ── Koffi et son entreprise ──
  insert into auth.users (id, email) values (u, 'koffi@exemple.invalid');
  update public.profils set prenom = 'Koffi', nom = 'Adjovi', pays = 'BJ', telephone_whatsapp = '+22900000001' where id = u;
  insert into public.entreprises (nom, nom_affiche, site, pays, ville, secteur, fuseau_horaire, style_valide, fiche_activite)
  values ('Studio Koffi', 'Koffi, du Studio Koffi', 'studiokoffi.exemple', 'BJ', 'Cotonou', 'design graphique', 'Africa/Porto-Novo', true,
          '{"offres":["Identité visuelle et logo","Affiches et supports imprimés","Contenus pour les réseaux sociaux"],"zone":"Bénin","forces":["Prix clairs","Réponse rapide"]}')
  returning id into e;
  insert into public.membres (entreprise_id, profil_id) values (e, u);

  -- ── Un forfait de 25 000 FCFA payé (essai ignoré ici) et quelques décomptes ──
  insert into public.paiements (entreprise_id, montant_fcfa, moyen, prestataire, statut, confirme_le)
  values (e, 25000, 'mtn_momo', 'exemple', 'reussi', now()) returning id into pai;
  frf := public.acheter_forfait(e, 25000, pai);

  -- ── Compte WhatsApp connecté (identifiant Unipile fictif) ──
  insert into public.comptes_connectes (entreprise_id, canal, unipile_account_id, identifiant_affiche, quota_jour)
  values (e, 'whatsapp', 'seed-koffi-whatsapp', '+229 00 00 00 01', 10) returning id into cpt;

  -- ── Ciblage ──
  insert into public.profils_cibles (entreprise_id, nom, secteurs, pays, villes, tailles, note, explication) values
    (e, 'Restaurants et maquis sans logo professionnel', '{restauration}', '{BJ}', '{Cotonou,Porto-Novo}', '{1-10}', 92, 'Forte demande de visuels, budgets compatibles'),
    (e, 'Boutiques de mode', '{commerce}', '{BJ}', '{}', '{1-10}', 85, 'Besoin de nouveaux visuels chaque semaine'),
    (e, 'Écoles privées', '{education}', '{BJ}', '{}', '{}', 78, 'Affiches et flyers à chaque rentrée')
  returning id into cible;
  select id into cible from public.profils_cibles where entreprise_id = e order by note desc limit 1;
  insert into public.campagnes (entreprise_id, profil_cible_id, nom, statut, debut)
  values (e, cible, 'Restaurants de Cotonou', 'active', now() - interval '3 days') returning id into camp;

  -- ── Séquence et modèles par défaut de leed (entreprise_id null) ──
  insert into public.modeles_messages (canal, categorie_cible, corps, variables)
  values ('whatsapp', 'pme', 'Bonjour {{prenom}}, ici {{nom_affiche}}. {{signal}}. Seriez-vous ouvert à un court échange sur ce sujet ? Répondez STOP pour ne plus être contacté.', '{prenom,nom_affiche,signal}')
  returning id into mdl;
  insert into public.sequences (nom, categorie_cible) values ('PME : WhatsApp en trois temps', 'pme') returning id into seq;
  insert into public.etapes_sequence (sequence_id, rang, jour, canal, type, modele_id) values
    (seq, 1, 1, null, 'premier', mdl), (seq, 2, 3, null, 'relance', null), (seq, 3, 7, null, 'dernier', null);

  -- ── Six prospects du client, dont trois déjà contactés ──
  i := 0;
  for a in select id, nom, ville, secteur, whatsapp from public.annuaire_entreprises
            where secteur = 'restauration' and whatsapp is not null order by id limit 6 loop
    i := i + 1;
    insert into public.prospects (entreprise_id, campagne_id, annuaire_entreprise_id, nom, ville, secteur, contact_nom, categorie, score, signal, canal_choisi, statut, contacte_le)
    values (e, camp, a.id, a.nom, a.ville, a.secteur, 'Gérant', 'pme', 95 - i * 4,
            'Son logo est difficile à lire sur sa page Facebook', 'whatsapp',
            case when i <= 3 then 'en_conversation'::public.statut_prospect else 'analyse'::public.statut_prospect end,
            case when i <= 3 then now() - (i || ' days')::interval end)
    returning id into pr;
    insert into public.prospects_identifiants (prospect_id, entreprise_id, canal, identifiant, verifie, source)
    values (pr, e, 'whatsapp', a.whatsapp, true, 'annuaire');
    if i <= 3 then
      perform public.decompter_entreprise(e, pr, 'seed-' || pr);
      insert into public.conversations (entreprise_id, prospect_id, compte_connecte_id, canal, dernier_message_le)
      values (e, pr, cpt, 'whatsapp', now() - (i || ' days')::interval) returning id into conv;
      insert into public.messages (entreprise_id, conversation_id, sens, canal, corps, statut, envoye_le)
      values (e, conv, 'sortant', 'whatsapp', 'Bonjour, ici Koffi, du Studio Koffi. J''ai vu que votre logo est difficile à lire sur Facebook. Je vous prépare 3 idées, sans engagement ?', 'livre', now() - (i || ' days')::interval)
      returning id into msg;
      insert into public.controles_message (message_id, entreprise_id, verdict) values (msg, e, 'accepte');
      if i = 1 then
        insert into public.messages (entreprise_id, conversation_id, sens, canal, corps, statut, classe_reponse, envoye_le)
        values (e, conv, 'entrant', 'whatsapp', 'Oui pourquoi pas, c''est combien ?', 'livre', 'question', now() - interval '20 hours');
        insert into public.decisions (entreprise_id, type, prospect_id, conversation_id, urgence, question, options)
        values (e, 'question_prospect', pr, conv, 1, 'Il demande votre prix. Que lui répondre ?',
                '[{"cle":"devis","libelle":"Proposer un devis"},{"cle":"appel","libelle":"Proposer un appel"}]');
      end if;
    end if;
  end loop;

  -- ── Un rendez-vous proposé ──
  insert into public.rendez_vous (entreprise_id, prospect_id, debut, fin, statut)
  select e, id, now() + interval '2 days', now() + interval '2 days 30 minutes', 'propose'
  from public.prospects where entreprise_id = e order by score desc limit 1;

  -- ── Jours fériés fixes du Bénin (les fêtes mobiles seront ajoutées avec le calendrier officiel) ──
  insert into public.jours_feries (pays, date, nom)
  select 'BJ', make_date(y, m, d), n
  from (values (1, 1, 'Jour de l''An'), (1, 10, 'Fête du Vodoun'), (5, 1, 'Fête du Travail'), (8, 1, 'Fête de l''Indépendance'),
               (8, 15, 'Assomption'), (11, 1, 'Toussaint'), (12, 25, 'Noël')) f(m, d, n),
       (values (2026), (2027)) yy(y)
  on conflict do nothing;
end $$;
