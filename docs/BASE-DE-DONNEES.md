# La base de données de Djeli

*Schéma de référence du 14 novembre 2026.*

> **À lire avant tout.** Ce schéma **n'est pas à construire maintenant**. Décision du 14 novembre : on valide d'abord la vision, le parcours et le tableau de bord, on maquette les écrans à partir du clone d'Explee, et la base de données vient ensuite (étape D de `PLAN-V2.md`). Ce document sera ajusté à ce moment-là. Deux points déjà périmés : Djeli est **B2B seulement** pour l'instant (ignorer ce qui concerne les particuliers), et les §18-19 supposaient qu'on gardait les migrations du code actuel, qui est désormais mis de côté.

Base : **PostgreSQL via Supabase**. Sécurité par **Row Level Security (RLS)** sur chaque table : un client ne peut jamais lire les données d'un autre, même si notre code a un bug.

---

## 1. Les quatre règles qui gouvernent tout le schéma

### Règle 1 — L'annuaire est séparé des prospects

Deux choses très différentes portent le mot « entreprise » :

- **L'annuaire** (`annuaire_*`) : notre base partagée de toutes les entreprises africaines qu'on a trouvées. Elle appartient à Djeli. Aucun client n'y a accès directement.
- **Les prospects** (`prospects`) : la copie qu'un client s'est appropriée quand l'agent l'a sélectionné pour lui. Elle appartient au client, et elle garde son propre historique.

Si on mélange les deux, on casse la confidentialité (un client verrait qui les autres contactent) et on ne peut plus enrichir l'annuaire sans réécrire les prospects de tout le monde.

### Règle 2 — Le client ne touche jamais l'annuaire directement

Si un client pouvait faire `select * from annuaire_entreprises`, il aspirerait notre actif principal en une requête. L'accès se fait **uniquement par des fonctions** (`rechercher_annuaire`, `apercu_annuaire`) qui tournent avec les droits du serveur et ne renvoient que ce qu'on autorise — par exemple un nombre et des lignes sans nom pour l'aperçu avant inscription.

### Règle 3 — L'argent ne bouge que par des fonctions

On ne met jamais à jour un solde de crédits depuis le code de l'application. Tout passe par des fonctions PostgreSQL (`debiter_credits`, `crediter_credits`) qui, dans **une seule transaction**, vérifient le solde, vérifient le plafond du jour, écrivent la ligne d'historique et mettent à jour le solde. Sinon, deux campagnes qui tournent en même temps peuvent dépenser le même crédit deux fois.

*Déjà construit et testé dans `supabase/migrations/20261109130000_credits_fonctions.sql` — on garde.*

### Règle 4 — Rien n'est effacé, tout est historisé

Un message envoyé, un crédit débité, une décision prise : on ne les modifie pas, on ajoute une ligne. C'est indispensable pour répondre à « pourquoi ce prospect a-t-il reçu ce message ? » devant un client ou devant l'APDP.

---

## 2. Vue d'ensemble

```
A. CLIENTS                 profils · entreprises · membres
B. COMPTES CONNECTÉS  ⭐    comptes_connectes · evenements_compte
C. ANNUAIRE PARTAGÉ        annuaire_entreprises · annuaire_contacts · annuaire_sources
                           annuaire_doublons · analyses_prospects
D. CIBLAGE                 profils_cibles · campagnes · simulations ⭐
E. PROSPECTS DU CLIENT     prospects · prospects_identifiants
F. ENVOI                   sequences · etapes_sequence · file_envoi
G. CONVERSATIONS           conversations · messages · controles_message
H. DÉCISIONS          ⭐    decisions
I. RENDEZ-VOUS             rendez_vous
J. CRÉDITS ET PAIEMENTS    soldes_credits · lots_credits · transactions_credits
                           depenses_jour · couts_actions · packs · paiements
K. CONFORMITÉ              opt_outs · exclusions_client · verrou_contact · jours_feries
L. APPRENTISSAGE      ⭐    stats_canal · modeles_messages · tests_messages
M. JOURNAL                 journal_evenements
```

⭐ = nouveau par rapport à ce qui est déjà construit.

---

## 3. Les types énumérés

```sql
-- CHANGEMENT : on retire sms et appel, on ajoute les réseaux sociaux
create type canal as enum ('whatsapp', 'instagram', 'facebook', 'linkedin', 'email');
-- 'messenger' sera ajouté quand Unipile le proposera

create type statut_compte as enum ('actif', 'a_rebrancher', 'suspendu', 'debranche');
create type type_cible as enum ('entreprise', 'particulier');
create type categorie_prospect as enum ('grande_entreprise', 'pme', 'independant', 'particulier');
create type statut_prospect as enum ('nouveau', 'analyse', 'en_sequence', 'en_conversation',
                                      'interesse', 'rdv_pris', 'refuse', 'stop', 'epuise');
create type sens_message as enum ('sortant', 'entrant');
create type statut_message as enum ('planifie', 'en_attente', 'envoye', 'livre', 'lu', 'echoue', 'annule');
create type classe_reponse as enum ('interesse', 'question', 'pas_maintenant', 'pas_interesse',
                                     'mauvaise_personne', 'stop', 'absent', 'hostile', 'note_vocale');
create type type_decision as enum ('lead_chaud', 'question_prospect', 'confirmer_rdv',
                                    'valider_information', 'note_vocale', 'solde_bas', 'compte_a_rebrancher');
create type statut_decision as enum ('ouverte', 'repondue', 'expiree', 'annulee');
create type type_transaction as enum ('achat', 'bonus', 'debit', 'remboursement', 'expiration');
create type statut_campagne as enum ('brouillon', 'active', 'en_pause', 'terminee');
create type mode_repartition as enum ('automatique', 'manuel');
```

---

## 4. A — Les clients

### `profils`
Une personne. Lié 1 pour 1 à `auth.users` de Supabase.

| Colonne | Type | Note |
|---|---|---|
| `id` | uuid, PK | = `auth.users.id` |
| `prenom`, `nom` | text | **Apparaissent dans les messages envoyés** |
| `telephone_whatsapp` | text | Format international, vérifié par code |
| `pays` | text | Code ISO à 2 lettres |
| `langue` | text | `fr` par défaut |

### `entreprises`
Le client payant. **C'est la clé de cloisonnement de tout le schéma** : presque chaque table porte un `entreprise_id`.

| Colonne | Type | Note |
|---|---|---|
| `id` | uuid, PK | |
| `nom` | text | Apparaît dans les messages : « Koffi, du Studio Koffi » |
| `site`, `instagram`, `facebook` | text | Les portes d'entrée de l'analyse |
| `pays`, `ville`, `secteur` | text | |
| `fiche_activite` | jsonb | Ce que l'agent a compris : offres, prix, points forts, preuves, concurrents, zone |
| `nom_affiche` | text | Nom de l'expéditeur dans les messages |
| `consignes` | jsonb | Ce que l'agent peut dire (prix, délais) et ne doit jamais dire |
| `horaires` | jsonb | Quand le client est joignable |
| `plafond_jour_credits` | int | 0 = pas de plafond |
| `mode_repartition` | mode_repartition | Automatique ou manuel |
| `envoi_suspendu` | bool | Mis à `true` par le système si un compte est en danger |

### `membres`
Qui a accès à quelle entreprise. `(entreprise_id, profil_id, role)`. **C'est la table que toutes les règles RLS interrogent.**

---

## 5. B — Les comptes connectés ⭐ (le cœur du pivot)

### `comptes_connectes`
Un compte du client branché via Unipile. **Remplace les tables `boites_envoi` et `numeros_djeli`, qui sont supprimées.**

| Colonne | Type | Note |
|---|---|---|
| `id` | uuid, PK | |
| `entreprise_id` | uuid → entreprises | |
| `canal` | canal | |
| `unipile_account_id` | text, unique | **Jamais renvoyé au navigateur** (voir §15) |
| `identifiant_affiche` | text | `+229 97 00 00 00`, `@studiokoffi` — ce que le client reconnaît |
| `statut` | statut_compte | |
| `connecte_le` | timestamptz | |
| `verifie_le` | timestamptz | Dernière vérification de santé |
| `quota_jour` | int | **Calculé par la montée progressive** : 10 le jour 1, +5/jour, plafond 40 |
| `envois_aujourdhui` | int | Remis à 0 chaque nuit |
| `note_sante` | int | 0 à 100. Baisse sur échec de livraison, STOP, blocage |
| `derniere_erreur` | text | |

**Contrainte** : un seul compte actif par canal et par entreprise au départ.
**Index** : `(entreprise_id, canal, statut)` et `(statut, verifie_le)` pour le travail de fond qui vérifie la santé.

### `evenements_compte`
L'historique de santé d'un compte : déconnexion, quota atteint, message refusé, note en baisse. Sert à prévenir le client **avant** que son compte soit suspendu, et à nous donner les vrais chiffres de risque après quelques mois.

| `id` · `compte_id` · `type` · `gravite` · `charge` jsonb · `cree_le` |

---

## 6. C — L'annuaire partagé

**Aucune RLS pour les clients : table interdite en lecture directe.** Accès uniquement par fonctions (règle 2).

### `annuaire_entreprises`

| Colonne | Type | Note |
|---|---|---|
| `id` | uuid, PK | |
| `nom`, `nom_normalise` | text | `nom_normalise` sert au dédoublonnage |
| `pays`, `ville`, `quartier` | text | |
| `secteur`, `sous_secteur` | text | Nomenclature interne, à définir |
| `taille` | text | `1-10`, `11-50`, … |
| `type_cible` | type_cible | Entreprise ou particulier |
| `site`, `telephone`, `whatsapp`, `email` | text | |
| `liens_sociaux` | jsonb | `{instagram, facebook, linkedin, tiktok}` |
| `coordonnees` | geography(point) | Pour « à moins de 5 km de Cotonou » |
| `place_id_google` | text | **Seule donnée Google qu'on a le droit de stocker sans limite** |
| `source`, `source_id` | text | D'où vient la fiche |
| `score_qualite` | int | Complétude et fraîcheur |
| `derniere_maj` | timestamptz | |
| `actif` | bool | Fermé définitivement = `false`, jamais supprimé |

**Index** : `(pays, ville, secteur)` · `(pays, secteur, type_cible)` · GIST sur `coordonnees` · GIN trigram sur `nom_normalise`.

### `annuaire_contacts`
Les personnes rattachées à une entreprise de l'annuaire : `nom`, `role`, `linkedin_url`, `email`, `telephone`, et surtout **`base_legale`** — pourquoi on a le droit de détenir ce contact (source publique, registre officiel, inscription volontaire). Cette colonne est ce qu'on montre à l'APDP.

### `annuaire_sources`
Une ligne par source de données : `nom`, `licence`, `peut_stocker` (bool), `peut_revendre` (bool), `delai_conservation_jours`. Un travail de fond lit cette table et **purge automatiquement** ce qu'on n'a pas le droit de garder (les coordonnées Google après 30 jours, par exemple). C'est notre protection juridique, automatisée.

### `annuaire_doublons`
`id_garde` → `id_fusionne`. On garde la trace des fusions pour ne pas réimporter un doublon à chaque mise à jour de source.

### `analyses_prospects`
**Le cache qui nous fait gagner de l'argent.** L'analyse IA d'une entreprise (sa fiche, ses signaux) coûte ~20 FCFA. Si trois clients visent le même restaurant, on la calcule **une fois**.

| Colonne | Type | Note |
|---|---|---|
| `annuaire_entreprise_id` | uuid, PK | |
| `fiche` | jsonb | Ce qu'elle fait, son décideur probable, sa langue, sa catégorie |
| `signaux` | jsonb | Les raisons d'écrire maintenant, chacune datée |
| `calcule_le`, `expire_le` | timestamptz | Validité ~60 jours, les signaux vieillissent |
| `cout_fcfa` | int | Pour suivre nos coûts réels |

**Cette table ne contient rien du client.** Elle décrit le prospect, pas la relation. C'est ce qui permet de la partager sans fuite.

---

## 7. D — Le ciblage

### `profils_cibles`
Un segment de clientèle idéale, proposé par l'agent et corrigé par le client.

`entreprise_id` · `nom` · `secteurs[]` · `pays[]` · `villes[]` · `tailles[]` · `type_cible` · `signaux_recherches[]` · `note` (0-100) · `explication` · `actif`

### `campagnes`
`entreprise_id` · `profil_cible_id` · `nom` · `statut` · `canaux_autorises[]` (le client peut interdire un canal) · `plafond_jour_credits` · `budget_credits` · `credits_depenses` · `debut` · `fin`

### `simulations` ⭐
Chaque passage du client dans le simulateur de prospection. On la garde pour deux raisons : lui remontrer ses scénarios, et **comparer plus tard la simulation à la réalité** pour corriger nos hypothèses.

| Colonne | Type | Note |
|---|---|---|
| `id` · `entreprise_id` · `profil_cible_id` | | |
| `budget_credits` | int | |
| `canaux` | canal[] | |
| `hypotheses` | jsonb | Les taux utilisés, et d'où ils viennent |
| `resultat` | jsonb | `{prospects, reponses_min, reponses_max, rdv_min, rdv_max, cout_par_rdv}` |
| `campagne_lancee_id` | uuid, nullable | Si la simulation a donné une campagne |

---

## 8. E — Les prospects du client

### `prospects`
La ligne appartient au client. Elle **pointe** vers l'annuaire sans le copier, mais garde ses propres décisions.

| Colonne | Type | Note |
|---|---|---|
| `id` | uuid, PK | |
| `entreprise_id` | uuid → entreprises | Le client |
| `campagne_id` | uuid → campagnes | |
| `annuaire_entreprise_id` | uuid → annuaire | Nullable : un prospect importé par le client n'est pas dans l'annuaire |
| `nom`, `ville`, `secteur` | text | Copie figée au moment de la sélection, pour que l'historique reste lisible |
| `contact_nom`, `contact_role` | text | |
| `categorie` | categorie_prospect | Détermine l'ordre des canaux |
| `langue` | text | L'agent écrit dans cette langue |
| `score` | int | Adéquation avec le profil cible |
| `signal` | text | **La raison précise de lui écrire maintenant.** Sans signal, pas de message |
| `canal_choisi` | canal | |
| `canaux_essayes` | canal[] | |
| `statut` | statut_prospect | |
| `origine` | text | `annuaire`, `import_client`, `pub_whatsapp`, `annuaire_gratuit` |
| `importe_le`, `contacte_le`, `repondu_le` | timestamptz | |

**Contrainte unique** : `(entreprise_id, annuaire_entreprise_id)` — un client ne contacte pas deux fois la même entreprise.
**Pas de contrainte entre clients** : deux graphistes peuvent viser le même restaurant (décision du 9 novembre), c'est `verrou_contact` qui espace les messages.

### `prospects_identifiants`
Les coordonnées utilisables, une ligne par canal : `prospect_id` · `canal` · `identifiant` · `verifie` · `source`. Séparé de `prospects` parce qu'un prospect a souvent trois numéros et deux emails, dont un seul marche.

---

## 9. F — L'envoi

### `sequences` et `etapes_sequence`
Le scénario de relance, par catégorie de prospect.

`sequences` : `entreprise_id` (nullable = modèle Djeli par défaut) · `nom` · `categorie_cible` · `actif`
`etapes_sequence` : `sequence_id` · `rang` · `jour` · `canal` · `type` (`premier`, `relance`, `dernier`) · `modele_id`

Séquence PME par défaut : J1 WhatsApp · J3 WhatsApp · J7 WhatsApp dernier · J10 fin.
Séquence grande entreprise : J1 email · J2 LinkedIn · J5 LinkedIn · J9 dernier.

### `file_envoi`
**La file d'attente des messages à envoyer.** C'est elle qui applique les plafonds et les horaires.

| Colonne | Type | Note |
|---|---|---|
| `id` · `prospect_id` · `compte_connecte_id` · `canal` | | |
| `etape_sequence_id` | uuid | |
| `planifie_pour` | timestamptz | Calculé selon les horaires locaux et les jours fériés |
| `statut` | text | `en_attente`, `pris`, `envoye`, `annule`, `echoue` |
| `tentatives` | int | |
| `pris_le`, `pris_par` | timestamptz, text | Verrou pour que deux travailleurs ne l'envoient pas deux fois |

**Index** : `(statut, planifie_pour)` — la requête du travailleur d'envoi, appelée chaque minute.

---

## 10. G — Les conversations

### `conversations`
Un fil avec un prospect sur un canal.

| Colonne | Type | Note |
|---|---|---|
| `id` · `prospect_id` · `compte_connecte_id` · `canal` | | |
| `unipile_chat_id` | text | L'identifiant du fil chez Unipile |
| `statut` | text | `ouverte`, `en_attente_client`, `fermee` |
| `dernier_message_le` | timestamptz | |
| `reprise_par_client` | bool | Le client a pris la main, l'agent n'écrit plus |

### `messages`

| Colonne | Type | Note |
|---|---|---|
| `id` · `conversation_id` | | |
| `sens` | sens_message | |
| `canal` | canal | |
| `corps` | text | |
| `unipile_message_id` | text | |
| `statut` | statut_message | |
| `classe_reponse` | classe_reponse | Rempli par l'IA sur les messages entrants |
| `credits_debites` | int | 0 pour les entrants et les réponses |
| `variante_test` | text | Pour comparer deux versions d'une accroche |
| `envoye_le`, `livre_le`, `lu_le` | timestamptz | |
| `erreur` | text | |

**Index** : `(conversation_id, envoye_le)` · `(unipile_message_id)` pour rapprocher les webhooks.

### `controles_message`
Le second passage de l'IA, qui vérifie chaque message sortant contre `INTERDITS.md` **avant** l'envoi.

`message_id` · `verdict` (`accepte`, `refuse`, `corrige`) · `motifs[]` · `corps_corrige` · `cree_le`

Un message refusé ne part pas et ne coûte rien au client. **Cette table est la preuve, en cas de litige, que chaque message a été contrôlé.**

---

## 11. H — Les décisions du client ⭐

### `decisions`
Tout ce qui attend une réponse du patron, au même endroit, qu'il réponde sur le tableau de bord ou sur WhatsApp.

| Colonne | Type | Note |
|---|---|---|
| `id` · `entreprise_id` | | |
| `type` | type_decision | |
| `prospect_id`, `conversation_id` | uuid, nullable | |
| `urgence` | int | 1 à 3 : trie la file |
| `question` | text | Formulée simplement, en français |
| `options` | jsonb | `[{cle: "oui", libelle: "Oui"}, …]` — l'agent pose des questions fermées |
| `contexte` | jsonb | Ce qu'il faut savoir pour répondre, sans ouvrir la conversation |
| `statut` | statut_decision | |
| `reponse` | jsonb | La clé choisie, ou le texte libre |
| `repondu_par` | uuid → profils | |
| `echeance` | timestamptz | Passée l'échéance, l'agent envoie un message d'attente au prospect |
| `cree_le`, `repondu_le`, `notifie_le` | timestamptz | |

**Index** : `(entreprise_id, statut, urgence, cree_le)` — la requête du tableau de bord.

---

## 12. I — Les rendez-vous

### `rendez_vous`
`entreprise_id` · `prospect_id` · `debut` · `fin` · `fuseau` · `lieu` · `lien_visio` · `statut` (`propose`, `confirme`, `annule`, `honore`, `absent`) · `calendrier_event_id` (créé via Unipile) · `resultat` (`signe`, `en_discussion`, `perdu`) · `rappels_envoyes` jsonb

---

## 13. J — Les crédits et les paiements

**Déjà construit et testé.** Il n'y a que le barème à changer. Les tables : `soldes_credits`, `lots_credits` (pour la validité de 12 mois, dépense du plus ancien d'abord), `transactions_credits` (l'historique immuable), `depenses_jour` (pour le plafond journalier), `paiements`.

### `couts_actions`
Le barème **en base de données, versionné** — pas dans le code. On change un prix sans redéployer, et on sait à quel prix chaque message passé a été facturé.

| `action` | `canal` | `credits` | `actif_depuis` | `actif_jusqua` |
|---|---|---|---|---|
| `analyse_prospect` | null | 5 | 2026-11-14 | null |
| `message_premier` | null | 3 | 2026-11-14 | null |
| `message_relance` | null | 3 | 2026-11-14 | null |
| `conversation` | null | 0 | 2026-11-14 | null |
| `rendez_vous` | null | 0 | 2026-11-14 | null |

### `packs`
`nom` · `montant_fcfa` · `credits` · `bonus_pct` · `actif` · `ordre`. Les cinq packs de `VISION.md` §7.

---

## 14. K — La conformité

### `opt_outs`
**La table la plus sensible du projet.** Un prospect qui dit STOP ne reçoit plus rien, d'aucun client, à vie.

`canal` · `identifiant_hash` (SHA-256 de l'identifiant normalisé, **jamais en clair**) · `raison` (`stop`, `blocage`, `signalement`, `demande_ecrite`) · `cree_le`

Pourquoi haché : si notre base fuite, la liste des gens qui ont refusé la prospection ne devient pas une liste exploitable. On peut vérifier « est-ce que ce numéro a dit stop ? » sans jamais pouvoir lister les numéros.

**Un déclencheur PostgreSQL vérifie cette table avant toute insertion dans `file_envoi`.** La protection est dans la base, pas seulement dans le code.

### `exclusions_client`
Les entreprises qu'un client ne veut jamais contacter : ses clients actuels, ses concurrents. `entreprise_id` · `type` (`domaine`, `nom`, `identifiant`) · `valeur` · `motif`

### `verrou_contact`
Protège les prospects du harcèlement : un même prospect ne reçoit **pas plus d'un premier message Djeli par semaine**, tous clients confondus.

`identifiant_hash` · `canal` · `dernier_premier_message_le` · `nombre_total`

Avec Unipile, le risque a changé de nature : ce n'est plus notre numéro qui serait bloqué, mais la réputation de Djeli et le confort du prospect. **On garde la règle.**

### `jours_feries`
`pays` · `date` · `nom`. Lue par le calcul de `planifie_pour`.

---

## 15. L — L'apprentissage ⭐

### `stats_canal`
**L'actif qui grandit tout seul, et qui alimente le simulateur.**

| Colonne | Type |
|---|---|
| `pays`, `secteur`, `categorie_prospect`, `canal` | text |
| `periode` | date (par semaine) |
| `envoyes`, `livres`, `reponses`, `positives`, `rdv` | int |
| `taux_reponse`, `taux_positif`, `taux_rdv` | numeric (calculés) |

**Seules les statistiques sont partagées entre clients, jamais les messages.** Un nouveau client de Cotonou profite immédiatement de ce qu'on a appris avec les autres. C'est ce que le simulateur affiche sous forme de « fondé sur 1 240 prospects contactés ces 90 derniers jours ».

### `modeles_messages`
`canal` · `metier` · `categorie_cible` · `langue` · `corps` (avec emplacements) · `variables[]` · `score` · `actif`

### `tests_messages`
`modele_id` · `variante` · `envoyes` · `positives` · `actif`. Deux versions, 30 prospects minimum chacune, la meilleure gagne, une nouvelle l'affronte.

---

## 16. M — Le journal

### `journal_evenements`
Qui a fait quoi, quand. `entreprise_id` · `acteur` (`client`, `agent`, `systeme`) · `acteur_id` · `action` · `cible_type` · `cible_id` · `charge` jsonb · `cree_le`

---

## 17. La sécurité, concrètement

### Le schéma des règles RLS

```sql
-- Le modèle appliqué à chaque table portant entreprise_id
create policy "membre lit ses données" on prospects for select
  using (entreprise_id in (select entreprise_id from membres where profil_id = auth.uid()));
```

| Catégorie de table | Qui lit | Qui écrit |
|---|---|---|
| `entreprises`, `prospects`, `campagnes`, `conversations`, `messages`, `decisions`, `rendez_vous`, crédits | Les membres de l'entreprise | Les membres, pour les champs de réglage seulement |
| `annuaire_*`, `analyses_prospects` | **Personne** en direct. Fonctions uniquement | Le serveur (`service_role`) |
| `comptes_connectes` | Les membres, **via une vue** qui masque `unipile_account_id` | Le serveur |
| `opt_outs`, `verrou_contact`, `stats_canal`, `couts_actions` | Le serveur | Le serveur |
| `packs`, `jours_feries` | Tout le monde | Le serveur |

### Le point à ne pas rater : masquer les identifiants Unipile

```sql
create view mes_comptes as
  select id, entreprise_id, canal, identifiant_affiche, statut,
         connecte_le, quota_jour, envois_aujourdhui, note_sante
  from comptes_connectes;   -- unipile_account_id n'est pas dans la liste
```

Le client voit l'état de ses comptes, jamais la clé qui permet d'agir en son nom. Un test automatisé doit vérifier que `unipile_account_id` n'apparaît dans aucune réponse d'API — comme le test `admin-server-only.test.ts` déjà en place pour la clé Supabase.

---

## 18. Ce qu'on garde, ce qu'on change, ce qu'on supprime

Bonne nouvelle : **l'essentiel de ce qui est déjà construit survit.** Neuf migrations existent, et le moteur de crédits comme l'authentification sont déjà testés sur un vrai Postgres.

| Déjà en base | Décision |
|---|---|
| `profils`, `entreprises`, `membres` | ✅ Garder, ajouter `instagram`, `facebook`, `envoi_suspendu` |
| `profils_cibles`, `campagnes` | ✅ Garder |
| `prospects` | ♻️ Garder, ajouter `signal`, `categorie`, `origine`, `annuaire_entreprise_id` |
| `messages`, `conversations` | ✅ Garder |
| `rendez_vous` | ✅ Garder |
| `soldes_credits`, `lots_credits`, `transactions_credits`, `depenses_jour`, `paiements` | ✅ Garder tel quel |
| Fonctions `debiter_credits` / `crediter_credits` | ✅ Garder — déjà testées, deux bugs déjà corrigés |
| `opt_outs`, `contacts_recents`, `jours_feries` | ✅ Garder (`contacts_recents` devient `verrou_contact`) |
| `journal_evenements`, `analyses_anonymes`, `tentatives` | ✅ Garder |
| `integrations` (`google_agenda`) | ❌ **Supprimer** : l'agenda passe par Unipile |
| `boites_envoi`, `numeros_djeli` | ❌ **Supprimer** : remplacés par `comptes_connectes` |
| Type `canal` avec `sms` et `appel` | ♻️ **Remplacer** par le nouveau type |
| `type_integration` | ❌ Supprimer |

| À créer | Pourquoi |
|---|---|
| `comptes_connectes`, `evenements_compte` | Le pivot Unipile |
| `annuaire_entreprises`, `annuaire_contacts`, `annuaire_sources`, `annuaire_doublons` | L'actif principal |
| `analyses_prospects` | Le cache qui divise nos coûts IA |
| `prospects_identifiants` | Plusieurs coordonnées par prospect |
| `sequences`, `etapes_sequence`, `file_envoi` | L'envoi avec plafonds et horaires |
| `controles_message` | La preuve du contrôle anti-interdits |
| `decisions` | La file de décisions du tableau de bord |
| `simulations` | Le simulateur de prospection |
| `stats_canal`, `modeles_messages`, `tests_messages` | L'apprentissage |
| `couts_actions`, `packs` | Le barème en base, versionné |

---

## 19. L'ordre des migrations à écrire

1. `..._canaux_v2.sql` — nouveau type `canal`, suppression de `boites_envoi`, `numeros_djeli`, `integrations`
2. `..._comptes_connectes.sql` — `comptes_connectes`, `evenements_compte`, la vue `mes_comptes`
3. `..._annuaire.sql` — les quatre tables d'annuaire, leurs index, `analyses_prospects`
4. `..._prospects_v2.sql` — colonnes ajoutées, `prospects_identifiants`
5. `..._envoi.sql` — `sequences`, `etapes_sequence`, `file_envoi`, le déclencheur qui vérifie `opt_outs`
6. `..._decisions.sql` — `decisions`
7. `..._apprentissage.sql` — `stats_canal`, `modeles_messages`, `tests_messages`, `simulations`
8. `..._bareme.sql` — `couts_actions`, `packs`, et les valeurs de départ
9. `..._controles.sql` — `controles_message`
10. `..._rls_v2.sql` — toutes les règles RLS du §17
11. `..._fonctions_annuaire.sql` — `rechercher_annuaire`, `apercu_annuaire`

**Chaque migration est validée sur un vrai Postgres local** (`npm run db:reset`) avant d'être considérée comme faite, et accompagnée de ses tests dans `tests/db/` — c'est exactement la méthode qui a déjà trouvé deux bugs SQL le 9 novembre.
