# Les chantiers de leed

*Plan du 16 novembre 2026. Il découpe tout ce qui reste à construire en 13 grands chantiers, dans l'ordre, avec pour chacun : ce qu'on construit, les étapes, comment bien s'y prendre, ce qu'il me faut de toi, et quand c'est terminé.*

*Base : `VISION.md`, `PARCOURS.md`, `TABLEAU-DE-BORD.md`, `OFFRE-ET-PRIX.md`, `UNIPILE.md`, `BASE-DE-DONNEES.md`, `INTERDITS.md` et la maquette des 42 écrans.*

---

## 1. La vue d'ensemble

| # | Chantier | Taille | Dépend de |
|---|---|---|---|
| 1 | Fondations : comptes en ligne, projet, déploiement | petit | — |
| 2 | Le site public et le parcours (les vrais écrans) | moyen | 1 |
| 3 | La base de données | moyen | 1 |
| 4 | Comptes : inscription, connexion, rôles | moyen | 3 |
| 5 | L'annuaire des entreprises | **gros** | 3 |
| 6 | L'intelligence de l'agent : analyser, cibler, écrire, contrôler | **gros** | 3, 5 |
| 7 | La connexion des comptes du client (Unipile) | moyen | 4 |
| 8 | L'envoi et la planification | **gros** | 6, 7 |
| 9 | Les réponses, les conversations et les décisions | **gros** | 8 |
| 10 | Le forfait et le paiement Mobile Money | moyen | 4 |
| 11 | Le tableau de bord, les rapports et les alertes | **gros** | 9, 10 |
| 12 | L'espace admin | moyen | 11 |
| 13 | Conformité, sécurité, tests et lancement | moyen | tout |

**Ce qui peut avancer en même temps** (dans des sessions séparées) :
- 2, 3 et la demande Google dès que 1 est fait
- 5 (annuaire) pendant que 4 (comptes) se construit
- 7 (Unipile) et 10 (paiement) une fois 4 terminé

**Le chemin le plus long** : 3 → 5 → 6 → 8 → 9 → 11. Si l'annuaire est mauvais, tout le reste est mauvais : c'est le chantier où il ne faut pas se presser.

**À lancer tout de suite, car l'attente est longue** (voir §3) : la vérification Google de l'application, le nom de domaine, et la question écrite à Unipile sur la prospection à froid.

---

## 2. Les règles qui valent pour tous les chantiers

1. **Un chantier = une branche git**, relue avant d'être fusionnée dans `main`.
2. **Une migration SQL = un fichier**, jamais modifié après coup : on en ajoute une nouvelle.
3. **La sécurité (RLS) est écrite avec la table**, pas après. Un client ne doit jamais pouvoir lire les données d'un autre.
4. **Chaque règle métier a un test** qui échoue quand la règle est cassée. Pas de test, pas de « terminé ».
5. **On regarde le résultat à l'écran** (Playwright) avant de te le montrer.
6. **Les secrets** (clés Unipile, Anthropic, Resend…) vont dans `.env.local` et dans les variables Vercel. Jamais dans le code, jamais dans git, jamais collés dans une conversation.
7. **Une chose à la fois par session** : un chantier, ou une partie d'un chantier.
8. **Les pièges déjà rencontrés** (à ne pas refaire) : `analyse` est un mot réservé de Postgres (colonne `analyse_ia`) ; dans les types Supabase, écrire `type` et jamais `interface` ; le disque C: doit avoir de la place libre avant de lancer Docker.

---

## 3. Les chantiers, un par un

### Chantier 1 — Fondations

**À quoi ça sert.** Poser le terrain : un endroit où le site tourne en ligne, une base de données de développement, et les comptes dont tout le reste dépend.

**Ce qu'on construit.** Le projet leed dans `C:\Users\HP\Desktop\djeli`, déployé automatiquement à chaque envoi sur GitHub, avec une base de données de développement.

**Étapes.**
1. Fusionner la branche `leed-site` dans `main` (site + maquette).
2. Créer le projet Supabase « leed » (voir « Outils », §4). Le disque C: est plein : **on travaille sur Supabase en ligne, pas sur Docker en local**.
3. Relier le dépôt GitHub à Vercel : chaque envoi = un site de test en ligne.
4. Choisir et acheter le nom de domaine, régler le DNS.
5. Reprendre de la branche `module-04` les fichiers qui servent encore : lecture des variables d'environnement (`env.ts`), clients Supabase, `proxy.ts`, `resultat.ts`, `journal.ts`, pays et téléphones (E.164), limite de fréquence.
6. Renommer le dossier du projet en `leed` (voir fin de ce document).

**Comment bien s'y prendre.**
- Un seul projet Supabase par environnement : `leed-dev` maintenant, `leed-prod` plus tard. Ne jamais mélanger.
- Vercel Hobby est interdit pour un usage commercial : on prend l'offre Pro (~20 $/mois) **au lancement**, pas avant.
- Le plan gratuit de Supabase met la base en pause après 7 jours sans activité : acceptable en développement, pas en production (offre Pro ~25 $/mois).

**Il me faut de toi.** Le nom de domaine choisi (le placeholder `leed.app` de la maquette n'est pas acheté) ; ta confirmation pour créer le projet Supabase (cela peut coûter de l'argent : je te montre le coût avant).

**Terminé quand.** Un envoi sur `main` met le site à jour en ligne, et le site se connecte à la base.

---

### Chantier 2 — Le site public et le parcours (les vrais écrans)

**À quoi ça sert.** Transformer la maquette en vraies pages, pour le visiteur qui n'est pas encore client.

**Ce qu'on construit.** Accueil, tarifs, à propos, support, pages légales, puis les écrans du parcours : décrire son activité, analyse, questions, profils, recherche, aperçu flouté, inscription, choix essai/forfait. À ce stade les données sont des **exemples** : les vraies viennent aux chantiers 5, 6 et 10.

**Étapes.**
1. Finir la page d'accueil (déjà habillée) : la regarder en bureau et en téléphone, traduire les fenêtres encore en anglais (connexion, « pas de site », discussion de support).
2. Les pages une par une, dans l'ordre du clone d'Explee, **sans changer la mise en page** : tarifs, à propos, support, conditions, confidentialité.
3. Le parcours : chaque écran de la maquette devient une vraie page, avec ses états (chargement, erreur, vide).
4. Brancher chaque bouton sur une fonction « factice » qui renvoie des exemples, pour que le parcours se clique de bout en bout.
5. Retirer ce qui reste d'Explee : pages sans objet (`autogtm`, API, base B2B) et leurs liens.

**Comment bien s'y prendre.**
- **Une page à la fois, regardée avant de la montrer.** C'est la règle posée après le rejet de la première refonte.
- Réécrire en français **tous** les textes, y compris les messages d'erreur et les textes de bouton.
- Aucun témoignage ni chiffre inventé (`INTERDITS.md`). Les emplacements restent vides.
- Tester sur un petit Android avec une connexion lente : le public est là, pas sur un grand écran.

**Il me faut de toi.** Tes retours sur la maquette, écran par écran ; les textes légaux (je rédige un brouillon, un juriste doit le relire).

**Terminé quand.** Un visiteur peut cliquer de l'accueil jusqu'à l'écran d'inscription, sur téléphone, sans voir un mot d'anglais.

---

### Chantier 3 — La base de données

**À quoi ça sert.** C'est la mémoire de leed : clients, comptes connectés, prospects, messages, décisions, forfaits. Tout le reste s'appuie dessus.

**Ce qu'on construit.** Le schéma de `BASE-DE-DONNEES.md` (32 tables), **mis à jour**.

**À corriger avant de commencer.** Ce document est antérieur au passage au forfait :
- la section « Les crédits et les paiements » (crédits, lots de 12 mois, `couts_actions`, `packs`) décrit l'ancien modèle ;
- il parle encore des particuliers (B2B seulement pour l'instant) ;
- **il n'y a aucune table pour l'espace admin** : administrateurs, tickets de support, journal d'audit, journal des coûts.

**Étapes.**
1. Réécrire le schéma : remplacer les crédits par le **forfait** (montant, entreprises achetées, entreprises utilisées, entreprises reportées, entreprises gelées, date de fin, jours de grâce).
2. Ajouter les tables admin : `administrateurs`, `tickets_support`, `journal_audit`, `couts_par_client`.
3. Écrire les migrations dans l'ordre : types → clients → comptes connectés → annuaire → ciblage → prospects → envoi → conversations → décisions → forfait → conformité → apprentissage → admin.
4. Écrire la sécurité (RLS) avec chaque table : le client voit ses données ; les tables de l'annuaire et de la conformité ne sont jamais lisibles par un client ; l'admin passe par une fonction dédiée.
5. Générer les types TypeScript depuis la base, les commiter.
6. Un jeu de **données d'exemple** (Koffi, ses prospects, ses conversations) pour développer le tableau de bord.

**Comment bien s'y prendre.**
- **L'annuaire est séparé des prospects du client** : le client ne touche jamais l'annuaire directement, il y accède par des fonctions de recherche.
- **L'argent ne bouge que par des fonctions SQL** (forfait, décompte, remboursement), jamais par une écriture directe. La logique des lots de l'ancien module 03 (consommer du plus ancien au plus récent, report, gel) est réutilisable pour les entreprises reportées et gelées.
- **Le décompte est idempotent** : le même envoi rejoué ne décompte qu'une fois (clé unique). Les 100 débits simultanés du module 03 ont prouvé que le verrou fonctionne ; on refait le même test.
- Valider chaque migration sur une vraie base avant de la garder. C'est ainsi qu'on a trouvé le mot réservé `analyse`.
- Ne jamais stocker un jeton Unipile ou un mot de passe : seulement l'identifiant de compte.

**Il me faut de toi.** Ton accord sur le schéma mis à jour avant que j'écrive les migrations.

**Terminé quand.** Les migrations s'appliquent sur une base vide, les tests de sécurité passent (un client A ne voit rien du client B), et les données d'exemple se chargent.

---

### Chantier 4 — Comptes : inscription, connexion, rôles

**À quoi ça sert.** Qu'un client puisse créer son espace, y revenir, et que l'équipe leed ait son propre accès, séparé.

**Ce qu'on construit.** Inscription (email + mot de passe, lien magique, Google), connexion, mot de passe oublié, création de l'entreprise, rattachement de l'analyse faite avant l'inscription, rôle administrateur.

**Étapes.**
1. Reprendre le code du module 04 (sur la branche `module-04`) : actions d'inscription et de connexion, route de retour, limites de fréquence.
2. Adapter à la v2 : plus de redirection vers « /credits », mais vers le choix essai/forfait.
3. Brancher les emails d'authentification en français (modèles déjà écrits), envoyés par Resend.
4. Ajouter le rôle **admin** : un compte marqué administrateur en base, avec une connexion distincte et l'authentification en deux étapes.
5. L'écran de connexion d'un client qui revient (absent de la maquette).

**Comment bien s'y prendre.**
- **Aucun message ne révèle si un email existe déjà.** Un test automatique le vérifie.
- Un mot de passe faible et un email déjà pris renvoient tous deux le statut 422 chez Supabase : le test écrit pendant le module 04 distingue les deux. À conserver.
- L'espace admin est un **autre espace**, pas une page cachée : adresse séparée, vérification du rôle côté serveur à chaque requête.
- Ne jamais faire confiance au seul `proxy.ts` : chaque page et chaque action revérifie l'utilisateur.

**Il me faut de toi.** Le projet Google Cloud (connexion Google) ; le compte Resend ; le domaine d'envoi vérifié.

**Terminé quand.** Les trois méthodes de connexion fonctionnent, un nouveau client arrive sur le choix essai/forfait avec son analyse déjà rattachée, et un client ne peut pas ouvrir l'espace admin.

---

### Chantier 5 — L'annuaire des entreprises

**À quoi ça sert.** C'est ce qui protège leed dans deux ans : sans de bonnes entreprises à contacter, l'agent n'a rien à faire. C'est aussi ce qui donne le vrai nombre de l'aperçu.

**Ce qu'on construit.** Une base d'entreprises d'Afrique de l'Ouest, dédoublonnée, avec la provenance de chaque information. Le plan détaillé existe déjà : `docs/harness/07A` à `07H` et `docs/sources/REGISTRE-DES-SOURCES.md` (≈ 80 sources classées 🟢 autorisé, 🟡 sous conditions, 🔴 pas de robot).

**Étapes.**
1. **Schéma et moteur** (07A, 07B) : tables, lecture des sources, normalisation, rapprochement, fusion, retrait d'une source.
2. **Vague 1 — les lieux** (07C) : Overture, Foursquare OS, OpenStreetMap, GLEIF, Wikidata, pour le Bénin et le Sénégal d'abord.
3. **Mesurer avant de continuer** : combien d'entreprises, quelle part avec téléphone, avec site, recoupées par 2 sources.
4. **Vagues suivantes**, seulement si le rapport le justifie : identité légale (07D), listes officielles et marchés publics (07E), empreinte web (07F), sources propres (07G).
5. **Qualité** (07H) : scores, rafraîchissement, droits des personnes.
6. La **recherche** `chercher_annuaire` et le comptage de l'aperçu.

**Comment bien s'y prendre.**
- **Un connecteur par source, une garde juridique commune** : une source 🟡 reste désactivée tant qu'un humain n'a pas coché que ses conditions sont remplies.
- **Google Maps** : on ne garde que l'identifiant `place_id`. Tout le reste est demandé à la demande, jamais stocké.
- **Les dirigeants sont des personnes** : nom et fonction seulement, avec la base légale écrite.
- **Mesurer la précision du rapprochement** sur 200 fiches vérifiées à la main. On préfère rater une fusion que fusionner deux entreprises différentes (objectif : 95 % de précision).
- **Ouvrir sur peu de villes** d'abord (Cotonou, Dakar, Abidjan) plutôt que tout l'Afrique de l'Ouest en médiocre.
- Une donnée peut devenir interdite (changement de licence) : le script `retirer-source` doit tout enlever proprement.

**Il me faut de toi.** Rassembler les listes officielles (BCEAO, CIMA, ministères) en PDF ou Excel ; écrire aux guichets uniques (APIEx, CEPICI, APIX) et au portail RCCM pour demander un accès ; ~20 Go libres sur un disque (D: convient).

**Terminé quand.** « Restaurants à Cotonou » répond en moins d'une demi-seconde avec de vraies entreprises, et le rapport de qualité par pays est lisible.

---

### Chantier 6 — L'intelligence de l'agent

**À quoi ça sert.** C'est ce qui sépare leed d'un envoi en masse : comprendre l'activité du client, trouver qui lui achète, étudier chaque prospect, écrire un message vraiment personnel, et ne rien envoyer qui soit interdit.

**Ce qu'on construit.** Quatre sous-systèmes, tous appuyés sur l'API Claude :
1. **Analyse de l'activité** (lecture du site, ou formulaire) → fiche structurée.
2. **Profils de clients idéaux** → 3 à 5 cibles notées.
3. **Analyse d'un prospect** → « pourquoi lui écrire maintenant », par où le joindre, quel canal.
4. **Rédaction et contrôle** → un message par canal, puis une seconde IA qui le relit.

**Étapes.**
1. Le lecteur de sites : récupérer les pages utiles, refuser les adresses internes (protection contre les attaques par redirection), respecter `robots.txt`.
2. Les prompts, un fichier par tâche, **versionnés**, avec une sortie en JSON validée.
3. Un client IA unique : il demande du JSON, valide, réessaie une fois, puis échoue proprement ; il note le coût de chaque appel.
4. L'analyse d'un prospect (modèle rapide pour lire, modèle fort pour synthétiser), avec cache de 30 jours par entreprise.
5. Le choix du canal, **en code, pas en IA** (règles écrites de `VISION.md` §5, puis pondérées par les taux de réponse mesurés).
6. La rédaction, puis les **contrôles en code** (longueur, pas de lien au premier message, pas de faux « RE: », aucun chiffre qui n'est pas dans la fiche du client), puis la relecture par la seconde IA avec `INTERDITS.md`.
7. Le **style validé une seule fois** par le client (trois exemples), puis l'agent écrit seul.
8. Le simulateur de budget, fondé sur les vraies statistiques.

**Comment bien s'y prendre.**
- **L'IA propose, le code décide.** Un message n'est jamais envoyé parce que l'IA l'a dit : il passe les contrôles en code.
- **Une accroche précise ou pas de message.** Si l'analyse ne trouve rien de précis sur le prospect, on n'écrit pas.
- Si l'IA ne trouve pas une information dans le texte, elle la laisse vide. Jamais d'invention.
- Un message bloqué **ne coûte rien** au client et ne part pas ; l'équipe voit pourquoi (écran admin « messages bloqués »).
- Mesurer le coût réel par prospect dès le premier jour ; l'objectif est d'environ 40 FCFA.
- Tester avec un **faux client IA** dans les tests automatiques, pas avec de vrais appels payants.

**Il me faut de toi.** La clé Anthropic (environ 5 $ de crédit suffisent pour les tests) ; 20 vrais sites de clients potentiels pour juger la qualité des analyses.

**Terminé quand.** Sur 20 sites réels, l'analyse est juste, et sur 20 prospects de test, chaque message est soit validé et personnel, soit bloqué avec une raison claire.

---

### Chantier 7 — La connexion des comptes du client (Unipile)

**À quoi ça sert.** C'est le cœur du pivot : l'agent écrit depuis WhatsApp, Instagram, Facebook, LinkedIn et la boîte email du client.

**Ce qu'on construit.** Le branchement d'un compte (QR code pour WhatsApp, connexion classique pour les autres), le suivi de sa santé, et sa déconnexion.

**Étapes.**
1. **Les tests de `UNIPILE.md` §7, avant toute ligne de produit** : brancher un vrai compte de chaque type, envoyer un message à nous-mêmes, recevoir la réponse, tester Facebook contre Messenger, lire l'agenda Gmail, détecter une déconnexion, vérifier ce qui est facturé. Noter les résultats au §8 du document.
2. Une **interface unique** `src/lib/canaux/`, avec Unipile comme seule implémentation : si Unipile change ou disparaît, on ne touche qu'un dossier.
3. Le branchement : lien d'authentification Unipile → retour chez nous → enregistrement de l'identifiant du compte.
4. Les **webhooks Unipile** : message reçu, compte déconnecté, erreur d'envoi. Vérifiés par signature, rejouables sans effet double.
5. La **santé d'un compte** : bonne, à surveiller, suspendue, avec l'explication affichée au client.
6. La **limite par plan** : 1, 2, 3 puis tous les comptes selon le forfait (option B de `OFFRE-ET-PRIX.md`).
7. Débrancher à la fin du forfait, pour ne plus payer ce compte.

**Comment bien s'y prendre.**
- **Le client paie avant de brancher quoi que ce soit.** Unipile facture le **pic** de comptes du mois, même si on les débranche ensuite : un compte branché pour un test coûte un mois plein.
- **Compter aussi nos propres comptes de test** dans la facture.
- **Ne jamais exposer l'identifiant de compte Unipile** au navigateur : un test automatique vérifie qu'il n'apparaît dans aucune réponse.
- **WhatsApp passe par la voie de WhatsApp Web, pas par la voie officielle de Meta.** Le compte du client peut être limité ou suspendu. C'est le risque n° 1 du projet, déjà écrit dans `UNIPILE.md` §5. Les protections sont construites au chantier 8, et le client voit un avertissement clair **avant** de brancher.

**Il me faut de toi.** La clé et l'adresse (DSN) Unipile. **Démarre l'essai de 7 jours seulement quand le chantier 4 est terminé**, sinon le temps d'essai s'écoule pour rien. Écrire à Unipile pour obtenir **par écrit** leur position sur la prospection à froid (question ouverte du §5 risque 4) : c'est un point à régler avant le lancement.

**Terminé quand.** Un compte WhatsApp et un Gmail de test se branchent en moins d'une minute, envoient et reçoivent, et le débranchement est détecté.

---

### Chantier 8 — L'envoi et la planification

**À quoi ça sert.** Faire partir les bons messages, au bon moment, sans mettre en danger les comptes des clients.

**Ce qu'on construit.** Une file d'envoi, une **garde** par laquelle passe chaque message, et un planificateur qui tourne jour et nuit.

**Étapes.**
1. La table `file_envoi` et le planificateur (tâche de fond Trigger.dev, toutes les 5 minutes).
2. La **garde commune**, dans cet ordre, chaque refus journalisé : liste STOP → règle « un premier message par prospect et par semaine » → horaires du prospect → plafond du compte → forfait → envoi.
3. La **montée progressive** : un compte neuf commence bas et monte jusqu'à 40 nouvelles conversations par jour, jamais plus.
4. Les **séquences** : premier message, relance J3, dernier message J7, puis arrêt.
5. Les **arrêts automatiques** : le prospect répond, dit STOP, le client reprend la main, le compte est suspendu, le forfait est fini.
6. Le **décompte** : une entreprise est décomptée quand le premier message est bien parti, et rendue s'il n'est pas livré.
7. Les **délais aléatoires** entre deux envois d'un même compte (pas de rafale).

**Comment bien s'y prendre.**
- **Aucun envoi ne contourne la garde.** On le vérifie par un test qui parcourt tout le code.
- Un verrou en base empêche qu'un message parte deux fois si le planificateur se réveille en double.
- **Horaires** : 8 h à 19 h heure du prospect, pas le dimanche, pas pendant la prière du vendredi dans les pays concernés, pas les jours fériés.
- **STOP est respecté à vie, pour tous les clients de leed.** Quelqu'un qui refuse un client ne reçoit plus rien d'aucun autre.
- Un bouton **Pause** général arrête les nouveaux envois en moins d'une minute.
- **Pas de contournement des règles des plateformes** : pas de rotation de numéros, pas de faux comptes.

**Il me faut de toi.** Rien de nouveau (clé Trigger.dev).

**Terminé quand.** Une campagne de 10 prospects de test déroule sa séquence en temps accéléré, sans doublon, en respectant les horaires, et s'arrête dès qu'un prospect répond.

---

### Chantier 9 — Les réponses, les conversations et les décisions

**À quoi ça sert.** Recevoir les réponses de tous les canaux dans une seule boîte, répondre quand l'agent peut le faire seul, et demander au client quand il le faut.

**Ce qu'on construit.** Réception, classement, réponse automatique, file de **décisions**, prise de rendez-vous, reprise en main.

**Étapes.**
1. **L'entrée unique** : tout message reçu (webhook Unipile) arrive au même endroit, retrouve son prospect, annule les relances prévues.
2. Les **notes vocales** : transcription (Whisper via Groq) ; si elle est incertaine, la note part chez le client avec le contexte.
3. Le **classement** : intéressé, question, pas maintenant, refus, absent, désinscription, autre. Confiance sous 70 % : l'agent ne répond pas, il transmet.
4. La **réponse automatique** : après 5 à 20 minutes, avec uniquement des informations connues. Pour tout le reste : « je vérifie », et une **décision** est créée pour le client.
5. La **file de décisions** (8 types, voir `TABLEAU-DE-BORD.md` §4), avec échéance : sans réponse au bout de 4 h, l'agent envoie un mot d'attente au prospect.
6. **« Retenir cette réponse »** : elle s'ajoute aux consignes, l'agent ne reposera plus la question.
7. Le **rendez-vous** : créneaux libres lus dans l'agenda (inclus avec Unipile), proposition, réservation, rappels.
8. La **reprise en main** : si le client répond lui-même depuis son téléphone, l'agent le détecte et se tait sur cette conversation.

**Comment bien s'y prendre.**
- **STOP, « ne m'écrivez plus » : c'est le code qui l'applique**, même si l'IA hésite. Mieux vaut perdre un prospect que contacter quelqu'un qui a refusé.
- Si on demande à l'agent s'il est une IA, il répond honnêtement qu'il est l'assistant de [client].
- Jamais de prix, de délai ou d'engagement que le client n'a pas indiqué.
- **Le cas piégeux** : le client écrit depuis son téléphone pendant que l'agent prépare une réponse. Il faut annuler la réponse préparée. À tester explicitement.
- Une réponse reçue deux fois n'est traitée qu'une fois.

**Il me faut de toi.** La clé Groq (notes vocales) ; la liste de ce qu'on collecte dans les comptes du client (décision n° 10 de `VISION.md`, toujours ouverte) : elle détermine l'écran d'accord avant la connexion.

**Terminé quand.** Une réponse WhatsApp et une réponse email de test arrivent dans la même boîte, une question inconnue crée une décision (sans prix inventé), et un STOP ne reçoit plus jamais de message.

---

### Chantier 10 — Le forfait et le paiement Mobile Money

**À quoi ça sert.** Encaisser, et faire respecter ce que le client a acheté.

**Ce qu'on construit.** Le forfait au montant libre (dès 5 000 FCFA, 30 jours), le paiement Mobile Money, le décompte, le report, le gel, l'essai gratuit.

**Étapes.**
1. Une **interface de paiement** et une première implémentation (FedaPay en bac à sable, SaaSPay à confirmer).
2. Le **barème en base**, versionné : 250 / 225 / 200 / 175 FCFA l'entreprise selon le montant ; comptes, rythme, bonus de fidélité par palier.
3. L'achat : le montant arrive du navigateur, **le serveur recalcule tout** ; ligne `paiements` en attente, puis appel au prestataire.
4. Le **webhook de paiement** : signature vérifiée, statut **revérifié auprès du prestataire**, montant comparé, puis le forfait est crédité, une seule fois.
5. Le **rattrapage** : une tâche relit les paiements en attente de plus de 5 minutes, abandonne après 24 h.
6. Les **règles de fin** : recharge avant 30 jours = report avec bonus ; fin sans recharge = 7 jours de grâce, puis comptes débranchés et entreprises gelées (reviennent à la prochaine recharge, dans les 12 mois).
7. L'**essai gratuit** : 10 entreprises, Gmail seulement, API Gmail en direct, adresse de réponse relais, une seule fois par numéro WhatsApp vérifié, par Gmail et par site.
8. Les **reçus** et l'historique.

**Comment bien s'y prendre.**
- **Ne jamais croire le contenu d'un webhook.** On revérifie toujours auprès du prestataire.
- Le même webhook reçu trois fois ne crédite qu'une fois (clé d'idempotence = référence du paiement).
- Un montant reçu différent du montant attendu : aucun crédit, et une alerte pour l'équipe.
- **Le Mobile Money ne prélève pas automatiquement** : pas d'abonnement, d'où le forfait et le rappel avant la fin.
- L'offre est conçue pour qu'on gagne de l'argent à partir de 25 000 FCFA ; surveiller les petits forfaits avec plusieurs comptes (les coûts Unipile les rendent déficitaires).
- Les chiffres d'argent sont toujours des entiers.

**Il me faut de toi.** Un compte FedaPay en mode bac à sable (gratuit) ; **le compte de production exige une société immatriculée et ses documents** : à lancer tôt. L'essai gratuit par Gmail demande la vérification Google de l'application (gratuite, plusieurs semaines, exige un site public en ligne et sa politique de confidentialité).

**Terminé quand.** Un achat complet en bac à sable crédite le bon nombre d'entreprises ; un paiement rejoué ne crédite qu'une fois ; un montant faux ne crédite rien.

---

### Chantier 11 — Le tableau de bord, les rapports et les alertes

**À quoi ça sert.** Que le client décide vite, comprenne ce que ça lui rapporte, et règle ce que fait l'agent.

**Ce qu'on construit.** Les 9 pages de `TABLEAU-DE-BORD.md`, branchées sur les vraies données, plus les rapports et les alertes WhatsApp.

**Étapes.**
1. L'**accueil** et les **décisions** d'abord : c'est ce que le client ouvre tous les jours.
2. **Prospects** et fiche prospect (filtres, import d'une liste, note, résultat d'un rendez-vous).
3. **Conversations** (lecture, reprise en main, message préparé par l'agent).
4. **Campagnes** : cible, messages, rythme, budget, simulateur.
5. **Comptes** et **Forfait** (branchés aux chantiers 7 et 10).
6. **Réglages**, dont l'autonomie (Prudent / Équilibré / Autonome, puis ligne par ligne).
7. **Rapports** : le chemin des prospects, l'argent, ce que l'agent a appris. Point du jour, bilan de la semaine, bilan du mois (PDF).
8. **Les alertes et le pilotage par WhatsApp** : « Pause », « Où en est-on ? », avec **confirmation avant tout changement de réglage**.
9. Les **temps réel** : une décision répondue à un endroit disparaît de l'autre.

**Comment bien s'y prendre.**
- **Téléphone d'abord**, une seule chose importante par écran, comme dans le plan.
- Le client ne peut pas changer les **limites fixes** (40 par jour, STOP, horaires) : elles sont affichées et expliquées, pas cachées.
- Toute modification de réglage par WhatsApp est reformulée et exige un « Oui ».
- **Les entreprises floutées** rappellent ce qu'un plus gros forfait irait chercher : c'est un levier de montée en gamme, pas un décor.

**Il me faut de toi.** La décision sur **le numéro d'où leed écrit au client** pour les alertes (`TABLEAU-DE-BORD.md` §14 parle d'un numéro WhatsApp de leed). Deux options : l'API officielle de Meta (vérification de l'entreprise, plusieurs semaines) ou un compte WhatsApp leed branché par Unipile. À trancher avant ce chantier.

**Terminé quand.** Koffi peut, depuis son téléphone, répondre à une décision, mettre en pause, créer une campagne, recharger et lire son rapport, avec de vraies données.

---

### Chantier 12 — L'espace admin

**À quoi ça sert.** Que l'équipe leed voie tout de suite ce qui va mal avant que les clients s'en aperçoivent.

**Ce qu'on construit.** Les 9 écrans de la maquette : accueil, clients, fiche client, santé des comptes, annuaire et sources, messages bloqués, paiements, support, coûts et marges.

**Étapes.**
1. L'accueil « à traiter aujourd'hui » : comptes déconnectés, messages à relire, paiements en attente, sources à rafraîchir.
2. Les clients et la fiche client (jamais leurs conversations privées).
3. La **santé des comptes** avec la facture Unipile du mois.
4. Les **messages bloqués** à relire (on corrige la règle, pas le message).
5. Les **paiements** et les rattrapages manuels.
6. L'**annuaire** : rapprochements douteux, imports de documents, demandes de suppression.
7. Le **support** : tickets que l'agent de support n'a pas su traiter.
8. Les **coûts et marges** par client et par palier, avec l'alerte « on perd de l'argent sur ce client ».
9. Le **journal d'audit** : qui a fait quoi, quand.

**Comment bien s'y prendre.**
- L'admin ne lit **pas** le contenu des conversations privées d'un client. Il voit des chiffres, des états, des raisons de blocage.
- **Toute action d'un admin est journalisée**, et l'accès est protégé par l'authentification en deux étapes.
- L'espace est séparé du reste du site (voir chantier 4).

**Il me faut de toi.** Qui dans l'équipe a un accès admin, et avec quelles permissions.

**Terminé quand.** Une déconnexion de compte, un paiement bloqué et un message refusé apparaissent dans l'admin dans la minute, avec l'action à faire.

---

### Chantier 13 — Conformité, sécurité, tests et lancement

**À quoi ça sert.** Ne pas se faire fermer, ne pas fuiter de données, et ouvrir sans mauvaise surprise.

**Étapes.**
1. **Conformité.** Pages légales relues par un juriste ; déclaration à l'APDP (Bénin) ; vérification de la loi béninoise sur la prospection électronique ; registre des désinscriptions commun à tous les clients ; procédure de suppression de données sous 30 jours.
2. **Sécurité.** Audit de la sécurité de chaque table ; toutes les routes `webhooks` vérifient une signature ; aucune clé dans le code ni l'historique git ; `npm audit` sans faille haute ; en-têtes de sécurité ; limites de fréquence partout ; protection contre les attaques par redirection du lecteur de sites.
3. **Les 15 tests de `PARCOURS.md` §15** : parcours complet (site puis formulaire), chaque compte, un envoi réel vers nos propres comptes, chaque type de réponse, chaque décision, le client qui répond depuis son téléphone, l'essai de bout en bout, le forfait de bout en bout, tout sur un petit Android lent.
4. **Les coûts.** Suivi par jour (IA, Unipile, paiement), alerte quand un client coûte plus de 70 % de ce qu'il paie.
5. **Production.** Projet Supabase de production séparé avec sauvegardes quotidiennes, variables d'environnement documentées, procédure de retour arrière, Vercel Pro.
6. **Leed prospecte pour leed.** La première vraie campagne : les PME de Cotonou et Dakar, comme premier test du produit et première source de clients.

**Comment bien s'y prendre.**
- **On ouvre petit** : 10 clients de confiance, pas le grand public, pour mesurer les vrais taux de réponse avant d'afficher quoi que ce soit.
- **Aucun chiffre de résultat affiché tant qu'il n'est pas mesuré** (`INTERDITS.md`).
- Une porte d'entrée de **déploiement** : on ne passe en production que si les 15 tests et l'audit passent.

**Il me faut de toi.** Un juriste béninois ; la société immatriculée (nécessaire pour le paiement en production et la vérification Meta éventuelle) ; la vérification Google validée.

**Terminé quand.** Les 15 tests passent, l'audit est sans point bloquant, et la première campagne de leed pour leed produit des réponses réelles.

---

## 4. Les outils à me connecter

**Déjà connectés** (vérifiés aujourd'hui) :

| Outil | État | Ce que ça me permet |
|---|---|---|
| **GitHub** | ✅ Connecté (compte `mahelmouzoun07-afk`, dépôt privé `djeli`) | Branches, envois, fusions |
| **Supabase** (connecteur) | ✅ Connecté : 5 projets visibles, dont 4 en pause. Aucun n'est dédié à leed | Créer le projet, appliquer les migrations, générer les types, lire les journaux, voir les alertes de sécurité |
| **Vercel** (connecteur) | ✅ Connecté, aucune équipe (compte personnel) | Créer le projet, déployer, voir les journaux d'erreurs |
| **Figma** | ✅ Connecté, accès « lecture » seulement | Lire un design, pas en dessiner |
| **Playwright** | 🟡 Fonctionne avec l'ancien Chromium (le récent ne se télécharge pas) | Regarder chaque page à l'écran avant de te la montrer |
| **Navigateur intégré** | ✅ | Voir les pages et mesurer des sites |

**À me donner, dans l'ordre où j'en ai besoin :**

| Quand | Outil | Ce qu'il faut me donner | Coût | Où |
|---|---|---|---|---|
| **Maintenant** | **Nom de domaine** | Le nom choisi, accès au DNS | ~10 à 15 $ / an | registrar au choix |
| **Maintenant** | **Google Cloud** | Projet avec écran de consentement OAuth ; puis lancer la **demande de vérification** | Gratuit | console.cloud.google.com |
| **Maintenant** | **Unipile** — question écrite | Leur réponse sur la prospection à froid | — | leur équipe commerciale |
| Chantier 1 | **Projet Supabase « leed »** | Ton accord (le coût s'affiche avant) | Gratuit puis ~25 $ / mois en production | via le connecteur |
| Chantier 4 | **Resend** | Clé API, domaine vérifié | Gratuit (3 000 emails / mois) | resend.com |
| Chantier 6 | **Anthropic (Claude)** | Clé API | ~5 $ pour les tests | console.anthropic.com |
| Chantier 6 et 8 | **Trigger.dev** | Clé secrète du projet | Gratuit pour démarrer | trigger.dev |
| Chantier 7 | **Unipile** | Clé API **et** adresse (DSN) | Essai 7 jours sans carte, puis 49 € / mois minimum | unipile.com |
| Chantier 9 | **Groq** | Clé API (transcription des notes vocales) | Gratuit pour démarrer | console.groq.com |
| Chantier 10 | **FedaPay** (ou SaaSPay) | Clés du bac à sable ; plus tard, le compte de production | Frais ≈ 3 % + 50 à 100 FCFA | fedapay.com |
| Chantier 11 | **Numéro d'alertes de leed** | Décision : API Meta officielle ou compte Unipile | Variable | à trancher |
| Lancement | **Vercel Pro** | Passer l'équipe en Pro | ~20 $ / mois | vercel.com |

**Règle pour toutes ces clés.** Tu les mets toi-même dans le fichier `.env.local` (ou dans les réglages Vercel). **Ne les colle jamais dans une conversation**, avec moi ou avec un autre outil. Si une clé fuit : tu la supprimes sur le site du service et tu en crées une nouvelle.

**Pas des outils, mais des personnes et des papiers** (je ne peux pas les faire pour toi) :
- la société immatriculée (paiement en production, éventuelle vérification Meta)
- un juriste béninois (pages légales, loi sur les données, déclaration à l'APDP)
- des clients de confiance pour les 10 premiers essais

**Points techniques à régler avant le chantier 1.**
- **Disque C: plein.** Libère plusieurs Go (le premier candidat : les images et conteneurs Docker inutilisés). Tant que c'est plein, on n'utilise ni Docker ni installation lourde.
- **Docker n'est pas nécessaire** si on développe sur Supabase en ligne : c'est ce que je recommande.

---

## 5. Les décisions encore ouvertes (reprises de `VISION.md` et de ce plan)

| # | Question | Pour quel chantier |
|---|---|---|
| 10 | Quelles informations collecte-t-on dans les comptes du client ? | 7 et 9 |
| 11 | Messenger : on attend qu'Unipile le propose ? | 7 |
| 12 | Le nom de domaine | 1 |
| 13 | Le numéro d'où leed écrit au client (alertes, pilotage) | 11 |
| 14 | Qui a accès à l'espace admin, avec quelles permissions ? | 12 |
| 15 | Le schéma de base mis à jour (forfait, admin) : validé ? | 3 |

---

## 6. Ce que je te propose comme premier pas

1. Libérer de la place sur C:.
2. Choisir le nom de domaine, et lancer la **vérification Google** (c'est elle qui attend le plus longtemps).
3. M'autoriser à créer le projet Supabase « leed » (je te montre le coût d'abord).
4. Fusionner `leed-site` dans `main`.
5. Chantier 3 (base de données) et chantier 2 (site) **en parallèle**, dans deux sessions.

---

## Annexe — Renommer le dossier en « leed »

Impossible pendant qu'une session de Claude Code est ouverte dedans (Windows verrouille le dossier). À faire une fois la session fermée :

1. Fermer Claude Code et tout terminal ouvert dans `C:\Users\HP\Desktop\djeli`.
2. Dans l'explorateur de fichiers, renommer `djeli` en `leed`.
3. Rouvrir Claude Code dans `C:\Users\HP\Desktop\leed`.
4. Le dépôt GitHub a toujours l'ancien nom : `gh repo rename leed` (depuis le dossier) change le nom en ligne, et le lien local se met à jour tout seul.
5. Ma mémoire de projet est rangée sous l'ancien chemin : elle ne suivra pas toute seule. Je la recopierai dans le nouveau projet.
