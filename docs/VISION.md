# Djeli : la vision

*Document fondateur, 14 novembre 2026. Il remplace la vision dispersée dans `PLAN.md`.*

**Cadre actuel : Djeli est B2B.** Nos clients vendent à des entreprises. La prospection vers les particuliers viendra peut-être plus tard.

---

## 1. En une phrase

**Djeli est l'agent commercial qui prospecte depuis les comptes de ses clients, là où l'Afrique discute vraiment : WhatsApp, Instagram, Facebook et LinkedIn.**

Le client donne l'adresse de son site web (ou décrit son activité), l'agent lui trouve ses futurs clients, le client essaie gratuitement par email ou prend un forfait en Mobile Money, connecte ses comptes (email, WhatsApp, Instagram, Facebook, LinkedIn), et l'agent travaille : il trouve les prospects, les étudie, écrit à chacun, gère les réponses et pose les rendez-vous dans son agenda.

---

## 2. Le problème qu'on résout

Un graphiste à Cotonou, un traiteur à Abidjan, une imprimerie à Dakar : ils ont tous le même problème. **Ils savent faire leur métier, pas vendre.** Ils attendent que le client vienne.

Ce qui existe ne marche pas pour eux :

| Ce qu'ils essaient | Pourquoi ça échoue |
|---|---|
| Prospecter à la main sur WhatsApp | 10 messages par jour maximum, aucun suivi, ils abandonnent en deux semaines |
| Les outils occidentaux (Explee, Lemlist, Instantly) | En anglais, en dollars, par carte bancaire, et **par email seulement** — or en Afrique de l'Ouest, l'email professionnel est rare et peu lu |
| Payer une agence | 200 000 FCFA par mois minimum : hors de portée |
| La publicité Facebook | Ça amène des curieux, pas des entreprises identifiées |

**Le vide** : personne n'automatise la prospection **sur les canaux où les Africains répondent vraiment**, avec un paiement Mobile Money, en français, et à partir de 5 000 FCFA.

---

## 3. Ce qu'on garde d'Explee, ce qu'on change

Explee (ex-AutoGTM) a trouvé la bonne mécanique : *tu colles ton site, l'agent comprend ce que tu vends, trouve qui l'achète, écrit à chacun, gère les réponses, apprend.* On reprend **cette mécanique**, pas son produit.

| | Explee | Djeli |
|---|---|---|
| **Canal** | Email uniquement | **WhatsApp d'abord**, puis Instagram, Facebook, LinkedIn, email |
| **Qui envoie** | Des boîtes email appartenant à Explee | **Les comptes du client lui-même** (voir §4) |
| **Entrée** | Coller l'adresse du site | Site web **ou formulaire de description** |
| **Paiement** | 0,04 $ par email, carte bancaire | **Forfait au montant libre** en FCFA, Mobile Money, dès 5 000 FCFA, et un essai gratuit |
| **Unité vendue** | « un email envoyé » | « **un prospect contacté** » : son analyse, son message, ses relances |
| **Base de données** | 105 M d'entreprises mondiales | **Annuaire africain profond** : entreprises sans site, visibles seulement sur Facebook ou Google Maps |
| **Langue** | Anglais | **Français d'abord**, anglais ensuite, et l'agent écrit dans la langue du prospect |
| **Témoignages** | Une vingtaine, en page d'accueil | **Aucun tant qu'ils ne sont pas vrais** (voir `INTERDITS.md`) |
| **Chiffres affichés** | « 202 525 leads chauds » | Nos vrais chiffres, ou rien |
| **Tableau de bord** | Suivi des campagnes | Suivi **+ simulateur de prospection + file de décisions** (voir §6) |

**Ce qu'on prend littéralement d'Explee** : le parcours en 3 écrans (analyse → aperçu → paiement), les 6 cartes qui défilent pour expliquer le pipeline, le curseur de budget qui montre ce qu'on obtient, l'aperçu de prospects flouté avant inscription. Tout ça est déjà construit dans `C:\Users\HP\Desktop\explee` et sera repris (voir `PLAN-V2.md`).

---

## 4. La décision qui change tout : on envoie depuis les comptes du client

C'est le changement le plus important par rapport au plan de novembre.

**Avant** (plan du 9 novembre) : Djeli achetait ses propres numéros WhatsApp et ses propres boîtes email, et envoyait pour tous ses clients depuis cette infrastructure mutualisée.

**Maintenant** : grâce à Unipile, **chaque client branche ses propres comptes** (son WhatsApp, son Instagram, sa page Facebook, son LinkedIn) et l'agent écrit depuis eux.

Pourquoi c'est meilleur sur tous les plans :

| | Comptes Djeli mutualisés | Comptes du client (Unipile) |
|---|---|---|
| **Confiance du prospect** | Un numéro inconnu lui écrit au nom de Koffi | **C'est vraiment Koffi qui écrit**, avec sa photo, son historique |
| **Taux de réponse** | Faible : message d'inconnu, souvent signalé | **Bien plus haut** : c'est un vrai compte local |
| **Risque de blocage** | **Catastrophique** : un numéro bloqué = tous les clients du pays à l'arrêt | **Isolé** : le client risque son compte, pas celui des autres |
| **Autorisation de Meta** | Modèles de messages à faire valider, accord préalable du destinataire exigé | Pas de validation à attendre |
| **Délai avant lancement** | 3 à 6 semaines (vérification Meta, préchauffage des boîtes) | **Quelques jours** |
| **Coût par message** | 15 à 50 FCFA (tarif Meta) | **0 FCFA** |
| **Coût fixe** | Numéros + boîtes + agrégateur SMS | ~3 300 FCFA par compte et par mois (Unipile) |

Le détail technique, les limites et les risques sont dans `UNIPILE.md`. **Le risque qui reste** : Unipile relie WhatsApp comme le fait WhatsApp Web, ce qui n'est pas la voie officielle de Meta. Le compte du client peut être suspendu s'il envoie trop ou mal. C'est à nous de l'en protéger : volumes bas, messages vraiment personnalisés, montée en puissance progressive. C'est détaillé dans `UNIPILE.md` §5.

---

## 5. Les canaux : décision du 14 novembre

**Les canaux** : WhatsApp, email, Instagram, Facebook, LinkedIn — et Messenger dès qu'Unipile le proposera. Le client connecte ceux qu'il veut.

**On abandonne** :
- **Les appels par IA** (ElevenLabs, Twilio, appels WhatsApp) : trop chers, trop risqués juridiquement, et ils doublaient la complexité du produit. Toute l'étape 14 du squelette disparaît.
- **Les SMS** : coût réel par message, nom d'expéditeur à déclarer dans chaque pays, et les gens ne répondent pas aux SMS.

**L'email** : confirmé le 14 novembre. Le client connecte sa boîte (Gmail, Outlook) comme ses autres comptes, et l'agenda vient avec. C'est le canal le plus sûr : pas de risque de suspension, et écrire à froid à une entreprise y est admis partout.

**Ordre d'usage par type de prospect** :

| Type de prospect | Canal 1 | Canal 2 | Canal 3 |
|---|---|---|---|
| Commerçant, artisan, PME locale | **WhatsApp** | Instagram (si actif) | — |
| Boutique visible seulement sur Instagram | **Instagram** | WhatsApp (si numéro sur la bio) | — |
| Grande entreprise structurée | Email | **LinkedIn** | WhatsApp |
| Entreprise européenne ou nord-américaine | LinkedIn | Email | — |

---

## 6. Le tableau de bord : deux idées qui n'existent nulle part

Un tableau de bord qui ne fait que montrer des chiffres ne sert à rien à un commerçant. Le nôtre doit répondre à deux questions, et c'est là qu'on dépasse Explee.

### A. « Combien ça va me rapporter ? » — le simulateur de prospection

Avant de dépenser, le client règle trois curseurs — **budget**, **profil cible**, **canaux** — et voit immédiatement :

> Avec **15 000 FCFA** sur « Restaurants de Cotonou », en WhatsApp :
> ~130 prospects contactés · ~18 à 30 réponses · ~4 à 8 rendez-vous
> Coût par rendez-vous estimé : ~2 500 FCFA
> *Fondé sur 1 240 prospects contactés dans ce secteur et ce pays ces 90 derniers jours.*

Ce n'est pas une estimation inventée : elle vient de nos **vrais taux de réponse mesurés** par pays, secteur et canal (table `stats_canal`). Plus Djeli a de clients, plus la simulation devient juste — et c'est un avantage que personne ne peut copier.

Le client peut comparer deux scénarios côte à côte avant de choisir. C'est ce que tu appelais « modéliser les prospections ».

### B. « Qu'est-ce que je dois décider ? » — la file de décisions

L'agent travaille seul 95 % du temps. Les 5 % restants, il a besoin du patron. Aujourd'hui ces demandes se perdent. On les rassemble dans **une seule file, triée par urgence**, visible sur le tableau de bord *et* envoyée sur WhatsApp :

| Décision | Ce que le client voit | Réponse |
|---|---|---|
| **Lead chaud** | « Mme Houngbo (Maquis Chez Tanti) veut un devis logo » | Je m'en occupe / Laisse l'agent répondre |
| **Question hors de portée de l'agent** | « Elle demande si tu fais aussi des enseignes. Tu fais ? » | Oui / Non / Texte libre |
| **Confirmer un rendez-vous** | « Jeudi 15 h avec Mme Houngbo ? » | Oui / Propose un autre horaire |
| **Valider une information** | « Ton prix pour un logo, je peux dire 50 000 FCFA ? » | Oui / Corriger |
| **Note vocale non comprise** | La note + le contexte de la conversation | Texte de réponse |
| **Forfait bientôt fini** | « Il reste 8 entreprises et 5 jours · 9 réponses obtenues » | Recharger |

Chaque décision a une échéance. Passé 4 heures sans réponse, l'agent envoie un message d'attente au prospect pour ne pas le perdre, et relance le client.

### Le reste du tableau de bord

Accueil (solde, dépenses par canal, réponses, leads chauds, rendez-vous) · Prospects (liste, filtres, fiches, export) · Messagerie unifiée (toutes les conversations, tous canaux, reprise en main possible) · Profils cibles · Comptes connectés (état de santé de chaque compte) · Forfait · Paramètres.

---

## 7. Le modèle économique

**Le détail complet, avec les calculs, est dans `OFFRE-ET-PRIX.md`.** En résumé :

- **Pas de crédits.** Le client achète des **entreprises contactées**, en FCFA. Tout est compris : recherche, étude, message, relances, réponses, rendez-vous.
- **Un essai gratuit** : 10 entreprises contactées par email depuis son Gmail, en 7 jours.
- **Un forfait au montant libre**, dès 5 000 FCFA, valable 30 jours — comme un forfait internet. Plus le montant est élevé, moins l'entreprise coûte cher (de 250 à 175 FCFA) et plus l'agent va vite. Tous les réseaux sont ouverts dès 5 000 FCFA.
- **On paie avant de connecter par Unipile.** Pour un client payant, tout passe par Unipile, email compris. Chaque compte connecté nous coûte environ 3 280 FCFA par mois.
- **Rien n'est jamais perdu** : les entreprises non utilisées sont reportées si le client recharge à temps, gelées sinon.

---

## 8. Ce qui protège Djeli dans deux ans

1. **L'annuaire africain.** Des dizaines de sources recoupées, dédoublonnées, enrichies à la demande. Une entreprise de Parakou qui n'a ni site ni email mais une page Facebook active : on l'a, Explee ne l'aura jamais.
2. **Les taux de réponse mesurés.** Quel canal répond, dans quel pays, dans quel secteur, à quelle heure, avec quelle accroche. Chaque message envoyé pour un client améliore le ciblage de tous les autres. C'est une base de données qui ne s'achète pas.
3. **Mobile Money et le forfait libre.** Une barrière d'entrée réelle pour un concurrent occidental : il faut des contrats locaux, une société africaine, et comprendre qu'on ne prélève pas automatiquement en Afrique.
4. **Le français et le terrain.** Les messages, le support, l'interface, les exemples : pensés pour un commerçant béninois, pas traduits depuis l'anglais.

---

## 9. Les décisions

| # | Sujet | État |
|---|---|---|
| 1 | B2B seulement, entrée par site web ou formulaire | ✅ Décidé |
| 2 | Envoi depuis les comptes du client | ✅ Décidé |
| 3 | Le client paie **avant** de connecter par Unipile | ✅ Décidé |
| 4 | Essai gratuit par Gmail seulement, API Gmail en direct, adresse de réponse relais | ✅ Décidé |
| 5 | Forfait au montant libre dès 5 000 FCFA, valable 30 jours ; ni crédits ni abonnement | ✅ Décidé |
| 6 | 250 FCFA l'entreprise contactée, dégressif jusqu'à 175 FCFA | ✅ Décidé |
| 7 | Tous les réseaux ouverts dès 5 000 FCFA | ✅ Décidé |
| 8 | Clients payants : tout par Unipile, email compris | ✅ Décidé |
| 9 | Comptes connectés en même temps : 1 dès 5 000, 2 dès 10 000, 3 dès 25 000, tous dès 50 000 FCFA — et les six leviers de `OFFRE-ET-PRIX.md` §4 | ✅ Décidé |
| 10 | Quelles informations on collecte dans les comptes du client | ⏳ À préciser (`OFFRE-ET-PRIX.md` §8) |
| 11 | Messenger : on sort sans, on l'ajoute quand Unipile le propose | ⏳ Proposé |
| 12 | Le nom de domaine reste `djeliai.com` ? | ⏳ À confirmer |

---

## 10. Les documents de référence

| Document | Ce qu'il contient |
|---|---|
| **`VISION.md`** | Ce document : pourquoi, pour qui, le modèle |
| **`UNIPILE.md`** | L'API Unipile : ce qu'elle permet, ce qu'elle coûte, ses limites et ses risques |
| **`BASE-DE-DONNEES.md`** | Le schéma complet de la base, table par table |
| **`OFFRE-ET-PRIX.md`** | L'essai gratuit, les forfaits, les prix, ce qu'on gagne |
| **`PARCOURS.md`** | Le parcours du visiteur et du client, écran par écran |
| **`TABLEAU-DE-BORD.md`** | Le tableau de bord : croquis de chaque page, et tout ce que le client peut voir, modifier, ajouter |
| **`PLAN-V2.md`** | Comment on construit, dans quel ordre, et ce qu'on reprend du clone d'Explee |
| `INTERDITS.md` | Ce que l'agent ne dit jamais et ne fait jamais — **reste valable intégralement** |
| `MODELE-ECONOMIQUE.md` | Historique — remplacé par `OFFRE-ET-PRIX.md` |
| `PLAN.md`, `SQUELETTE.md` | **Historique.** Les étapes 0, 12, 13, 14 et 20 sont périmées par le passage à Unipile |
