# La base de données de leed

*Version du 16 novembre 2026, chantier 3. Elle décrit ce qui est réellement construit dans `leed-dev` (Supabase, Francfort). Les migrations sont dans `supabase/migrations/`, les tests dans `tests/db/`, les données d'exemple dans `supabase/seed.sql`, les types TypeScript dans `src/lib/supabase/database.types.ts`.*

Elle remplace la version du 14 novembre : plus de crédits, plus de SMS ni d'appels, et les tables de l'espace admin existent.

---

## 1. Les règles qui gouvernent tout

1. **L'annuaire est séparé des prospects.** `annuaire_*` appartient à leed. Un prospect est la copie qu'un client s'approprie. Un client ne lit jamais l'annuaire : il passe par des fonctions.
2. **L'argent ne bouge que par des fonctions SQL**, appelées par le serveur (`service_role`) : jamais d'écriture directe sur un forfait.
3. **Rien n'est effacé.** `mouvements_forfait`, `journal_evenements` et `journal_audit` sont immuables : un déclencheur refuse toute modification ou suppression.
4. **La sécurité est dans la base**, pas seulement dans le code : un message ne peut pas être mis en file si le prospect a dit STOP, n'a pas de signal, est exclu, ou si l'envoi est suspendu.

## 2. Les tables (44 tables, 2 vues, 45 politiques de sécurité)

| Groupe | Tables |
|---|---|
| **Clients** | `profils`, `entreprises`, `membres`, `administrateurs` |
| **Avant l'inscription** | `analyses_anonymes`, `tentatives` (limite de fréquence) |
| **Comptes connectés (Unipile)** | `comptes_connectes`, `evenements_compte`, vue `mes_comptes` |
| **Annuaire (leed seulement)** | `annuaire_sources`, `annuaire_entreprises`, `annuaire_contacts`, `annuaire_doublons`, `analyses_prospects` |
| **Ciblage** | `profils_cibles`, `campagnes`, `simulations` |
| **Prospects du client** | `prospects`, `prospects_identifiants` |
| **Envoi** | `modeles_messages`, `sequences`, `etapes_sequence`, `file_envoi` |
| **Conversations** | `conversations`, `messages`, `controles_message` |
| **Décisions et rendez-vous** | `decisions`, `rendez_vous` |
| **Forfait** | `paliers_forfait`, `reglages_forfait`, `paiements`, `forfaits`, `mouvements_forfait`, `empreintes_essai`, vue `mon_forfait` |
| **Conformité** | `opt_outs`, `exclusions_client`, `verrou_contact`, `jours_feries` |
| **Apprentissage** | `stats_canal`, `tests_messages` |
| **Journal** | `journal_evenements` |
| **Espace admin** | `tickets_support`, `messages_ticket`, `journal_audit`, `couts_par_client` |

Canaux : `whatsapp`, `instagram`, `facebook`, `linkedin`, `email`. Ni SMS ni appel.

## 3. Le forfait

Le barème et les règles sont **en base** (`paliers_forfait`, `reglages_forfait`) : on change un prix sans redéployer.

| Fonction (serveur seulement) | Ce qu'elle fait |
|---|---|
| `demarrer_essai` | 10 entreprises, 7 jours, un essai par numéro WhatsApp, adresse Gmail et site (empreintes SHA-256) |
| `acheter_forfait` | Crée le forfait d'un paiement réussi. Rejouable : un paiement ne crée jamais deux forfaits |
| `decompter_entreprise` | Décompte une entreprise quand le premier message est parti. Idempotent (clé unique), respecte le rythme du jour |
| `rendre_entreprise` | Rend l'entreprise si le message n'est pas livré. Idempotent |
| `appliquer_echeances_forfaits` | Chaque nuit : fin du forfait, puis grâce de 7 jours, puis gel de 12 mois, puis expiration |

Règles appliquées par `acheter_forfait` : recharge avant la fin = report des entreprises restantes **plus** bonus de fidélité du palier (5, 10, 15 ou 20 %) ; recharge pendant la grâce = report sans bonus ; entreprises gelées = elles reviennent ; premier forfait dans les 48 h après l'essai = +20 %.

**Hypothèse à confirmer** : le bonus de fidélité est calculé sur les entreprises achetées par la nouvelle recharge (pas sur celles reportées). `docs/OFFRE-ET-PRIX.md` ne le précise pas. De même, les entreprises non utilisées de l'essai s'éteignent avec lui (elles ne sont pas reportées).

## 4. L'annuaire

- `apercu_annuaire(pays, secteurs, villes, tailles)` : un nombre, la répartition par canal et trois lignes **sans nom ni coordonnée**. Pour le visiteur avant inscription.
- `rechercher_annuaire(entreprise, profil_cible, limite)` : les entreprises qui correspondent à un profil, sans celles déjà contactées ni exclues.
- Les deux sont réservées au serveur. L'annuaire lui-même n'a aucune politique : un client connecté n'y lit rien.

## 5. La sécurité (RLS)

| Qui | Ce qu'il peut |
|---|---|
| **Visiteur** (anon) | Lire le barème (`paliers_forfait`, `reglages_forfait`). Rien d'autre |
| **Client** (membre d'une entreprise) | Lire les données de **son** entreprise ; modifier ses réglages (droits **par colonne**) ; créer ses cibles, campagnes, simulations, exclusions ; ouvrir des tickets. Pas d'écriture sur le forfait, les paiements, les prospects, les messages |
| **Administrateur** | Lire les tickets, le journal d'audit, les coûts ; `admin_resume_clients()` (rôle revérifié à chaque appel). Il ne lit pas les données des clients en direct |
| **Serveur** (`service_role`) | Tout, y compris l'annuaire, la conformité, les comptes connectés |

Points clés :
- **`unipile_account_id` ne sort jamais.** Le client lit ses comptes par colonnes autorisées (vue `mes_comptes`) ; la colonne n'est pas dans la liste. Les types TypeScript générés contiennent la colonne : n'importer le type complet que côté serveur.
- Les fonctions `est_membre` et `est_admin` sont dans le schéma `private`, hors de l'API publique.
- Les nouveaux objets n'ont plus de droits par défaut : toute nouvelle table doit recevoir sa RLS et ses `grant`.
- Le contrôle automatique de Supabase (« advisors ») ne signale plus d'erreur. Restent 13 avis d'information (tables serveur seulement, sans politique : voulu) et 1 avertissement (`admin_resume_clients` appelable par un connecté : voulu, il refuse tout non-administrateur).

## 6. Les tests

`tests/db/forfait.sql` et `tests/db/securite.sql` s'exécutent dans une transaction qui finit par une erreur voulue (`TEST_OK …`) : rien ne reste en base. Ils couvrent : achat, report, bonus, grâce, gel, dégel, essai, idempotence, 200 décomptes pour 40 autorisés par jour, grand livre immuable, file d'envoi (STOP, signal, exclusion, suspension), cloisonnement entre clients, colonnes interdites, fonctions réservées au serveur, rôle administrateur.

**Limite connue** : ces tests passent par une seule connexion. Le test de **100 débits réellement simultanés** du module 03 demande une connexion directe à la base (mot de passe Postgres) : à refaire quand elle sera disponible. Le verrou (`for update` sur le forfait) est en place.

## 7. Ce qui reste hors de la base (chantiers suivants)

La création de l'entreprise à l'inscription et le rattachement de `analyses_anonymes` (chantier 4), le chargement de l'annuaire (5), les tâches de nuit qui lancent `appliquer_echeances_forfaits` et `remettre_compteurs_comptes` (travail de fond), les fêtes mobiles dans `jours_feries`.
