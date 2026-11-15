-- Chantier 3, migration 6 : sécurité. RLS sur chaque table + droits retirés par défaut.
--
-- Principe : tout est interdit, puis on ouvre ce qui doit l'être.
--  • le client lit les données de SON entreprise (via est_membre) ;
--  • il n'écrit que ses réglages (droits par colonne) ;
--  • l'argent, l'envoi, l'annuaire, la conformité : le serveur (service_role) seulement ;
--  • l'administrateur passe par est_admin() ou par une fonction qui le vérifie à chaque appel.

-- ───── 1. RLS partout ─────────────────────────────────────────────────────
do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
  end loop;
end $$;

-- ───── 2. Droits : on retire tout, on rouvre le nécessaire ────────────────
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;
grant all on all tables in schema public to service_role;
grant execute on all functions in schema public to service_role;

-- Les objets créés plus tard ne sont plus ouverts par défaut.
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from public, anon, authenticated;

-- Fonctions que les politiques RLS et l'espace admin appellent au nom de l'utilisateur.
grant execute on function public.est_membre(uuid) to authenticated;
grant execute on function public.est_admin() to authenticated;
grant execute on function public.admin_resume_clients() to authenticated;

-- ───── 3. Lecture publique : le barème (affiché sur la page tarifs) ───────
grant select on public.paliers_forfait, public.reglages_forfait to anon, authenticated;
create policy "barème public" on public.paliers_forfait for select using (true);
create policy "réglages publics" on public.reglages_forfait for select using (true);
grant select on public.jours_feries to authenticated;
create policy "jours fériés lisibles" on public.jours_feries for select to authenticated using (true);

-- ───── 4. Profils ─────────────────────────────────────────────────────────
grant select on public.profils to authenticated;
grant update (prenom, nom, langue, pays) on public.profils to authenticated;   -- le numéro WhatsApp passe par la vérification, côté serveur
create policy "profil : lire le sien" on public.profils for select to authenticated using (id = auth.uid());
create policy "profil : modifier le sien" on public.profils for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- ───── 5. Entreprises et membres ──────────────────────────────────────────
grant select on public.entreprises to authenticated;
grant update (nom, nom_affiche, site, instagram, facebook, pays, ville, secteur, fiche_activite, style_valide,
              consignes, horaires, fuseau_horaire, plafond_jour, mode_repartition) on public.entreprises to authenticated;
create policy "entreprise : lire la sienne" on public.entreprises for select to authenticated using (public.est_membre(id));
create policy "entreprise : régler la sienne" on public.entreprises for update to authenticated
  using (public.est_membre(id)) with check (public.est_membre(id));

grant select on public.membres to authenticated;
create policy "membres : lire ceux de son entreprise" on public.membres for select to authenticated
  using (profil_id = auth.uid() or public.est_membre(entreprise_id));

-- ───── 6. Données du client : lecture par les membres de l'entreprise ─────
do $$
declare t text;
begin
  foreach t in array array[
    'profils_cibles', 'campagnes', 'simulations', 'prospects', 'prospects_identifiants',
    'file_envoi', 'conversations', 'messages', 'controles_message', 'decisions', 'rendez_vous',
    'exclusions_client', 'paiements', 'forfaits', 'mouvements_forfait', 'journal_evenements'
  ] loop
    execute format('grant select on public.%I to authenticated', t);
    execute format('create policy %I on public.%I for select to authenticated using (public.est_membre(entreprise_id))',
                   'membres lisent ' || t, t);
  end loop;
end $$;

-- Écritures permises au client : ses cibles, ses campagnes (réglages), ses simulations, ses exclusions.
grant insert, delete on public.profils_cibles to authenticated;
grant update (nom, secteurs, pays, villes, tailles, signaux_recherches, note, explication, actif) on public.profils_cibles to authenticated;
create policy "cibles : créer" on public.profils_cibles for insert to authenticated with check (public.est_membre(entreprise_id));
create policy "cibles : modifier" on public.profils_cibles for update to authenticated
  using (public.est_membre(entreprise_id)) with check (public.est_membre(entreprise_id));
create policy "cibles : supprimer" on public.profils_cibles for delete to authenticated using (public.est_membre(entreprise_id));

grant insert (entreprise_id, profil_cible_id, nom, statut, canaux_autorises, plafond_jour, debut, fin) on public.campagnes to authenticated;
grant update (profil_cible_id, nom, statut, canaux_autorises, plafond_jour, debut, fin) on public.campagnes to authenticated;
create policy "campagnes : créer" on public.campagnes for insert to authenticated with check (public.est_membre(entreprise_id));
create policy "campagnes : modifier" on public.campagnes for update to authenticated
  using (public.est_membre(entreprise_id)) with check (public.est_membre(entreprise_id));

grant insert (entreprise_id, profil_cible_id, montant_fcfa, canaux, hypotheses, resultat) on public.simulations to authenticated;
create policy "simulations : créer" on public.simulations for insert to authenticated with check (public.est_membre(entreprise_id));

grant insert (entreprise_id, type, valeur, motif), delete on public.exclusions_client to authenticated;
create policy "exclusions : créer" on public.exclusions_client for insert to authenticated with check (public.est_membre(entreprise_id));
create policy "exclusions : supprimer" on public.exclusions_client for delete to authenticated using (public.est_membre(entreprise_id));

-- Le client peut prendre la main sur une conversation : l'agent n'y écrit plus.
grant update (reprise_par_client) on public.conversations to authenticated;
create policy "conversations : reprendre la main" on public.conversations for update to authenticated
  using (public.est_membre(entreprise_id)) with check (public.est_membre(entreprise_id));

-- ───── 7. Séquences et modèles : ceux de leed (entreprise_id null) + les siens ─
grant select on public.sequences, public.modeles_messages, public.etapes_sequence to authenticated;
create policy "séquences visibles" on public.sequences for select to authenticated
  using (entreprise_id is null or public.est_membre(entreprise_id));
create policy "modèles visibles" on public.modeles_messages for select to authenticated
  using (entreprise_id is null or public.est_membre(entreprise_id));
create policy "étapes visibles" on public.etapes_sequence for select to authenticated
  using (exists (select 1 from public.sequences s where s.id = sequence_id and (s.entreprise_id is null or public.est_membre(s.entreprise_id))));

-- ───── 8. Vues : le client voit ses comptes et son forfait ────────────────
-- (jamais comptes_connectes : unipile_account_id ne doit pas sortir du serveur)
grant select on public.mes_comptes, public.mon_forfait to authenticated;

-- ───── 9. Support : le client ouvre et lit ses tickets ────────────────────
grant select, insert (entreprise_id, ouvert_par, sujet, priorite) on public.tickets_support to authenticated;
create policy "tickets : lire les siens" on public.tickets_support for select to authenticated
  using (public.est_admin() or (entreprise_id is not null and public.est_membre(entreprise_id)));
create policy "tickets : ouvrir" on public.tickets_support for insert to authenticated
  with check (ouvert_par = auth.uid() and entreprise_id is not null and public.est_membre(entreprise_id));
grant update (statut, priorite, assigne_a, resolu_le) on public.tickets_support to authenticated;
create policy "tickets : traiter (admin)" on public.tickets_support for update to authenticated
  using (public.est_admin()) with check (public.est_admin());

grant select, insert (ticket_id, auteur, auteur_id, corps) on public.messages_ticket to authenticated;
create policy "messages de ticket : lire" on public.messages_ticket for select to authenticated
  using (exists (select 1 from public.tickets_support t where t.id = ticket_id
                 and (public.est_admin() or (t.entreprise_id is not null and public.est_membre(t.entreprise_id)))));
create policy "messages de ticket : écrire" on public.messages_ticket for insert to authenticated
  with check (
    auteur_id = auth.uid() and exists (select 1 from public.tickets_support t where t.id = ticket_id
      and ((auteur = 'client' and t.entreprise_id is not null and public.est_membre(t.entreprise_id))
           or (auteur = 'admin' and public.est_admin())))
  );

-- ───── 10. Administration : lecture réservée aux administrateurs ──────────
grant select on public.administrateurs, public.journal_audit, public.couts_par_client to authenticated;
create policy "admins : lire" on public.administrateurs for select to authenticated using (public.est_admin());
create policy "audit : lire" on public.journal_audit for select to authenticated using (public.est_admin());
create policy "coûts : lire" on public.couts_par_client for select to authenticated using (public.est_admin());

-- ───── 11. Sans politique ni droit : service_role uniquement ──────────────
-- annuaire_*, analyses_prospects, analyses_anonymes, tentatives, comptes_connectes, evenements_compte,
-- opt_outs, verrou_contact, stats_canal, tests_messages, empreintes_essai.
-- RLS est active et aucune politique n'existe : un client connecté ne peut rien y lire ni écrire.
