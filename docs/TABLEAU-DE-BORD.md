# Le tableau de bord de Djeli

*Plan du 14 novembre 2026. Rien n'est codé : ce document décrit ce que le client verra et pourra faire.*

Fil rouge : **Koffi Adjovi, Studio Koffi, graphiste à Cotonou.** Il vend à des entreprises (restaurants, boutiques, écoles). Il a branché son WhatsApp et son Gmail.

---

## 1. L'idée de départ

L'agent écrit **depuis les comptes de Koffi**. Donc Koffi a déjà un premier « tableau de bord » sans rien ouvrir : **son propre WhatsApp**, où il voit chaque message partir et chaque réponse arriver.

Le tableau de bord Djeli ne doit donc pas refaire WhatsApp. Il sert à trois choses que WhatsApp ne donne pas :

1. **Décider** — tout ce que seul le patron peut trancher, au même endroit
2. **Comprendre** — le rapport : ce qui a été fait, ce que ça a donné, ce que ça a coûté
3. **Régler** — qui on vise, ce qu'on dit, par quel canal, avec quel budget

Trois règles de conception :
- **Téléphone d'abord.** La plupart des clients l'ouvriront sur un Android. Chaque écran doit tenir dans un pouce.
- **Une seule chose importante par écran.** Sur l'accueil, c'est la liste des décisions.
- **Tout ce qui est important passe aussi par WhatsApp.** Koffi peut ne jamais ouvrir le site et quand même tout piloter.

---

## 2. Le menu

```
 ORDINATEUR                                   TÉLÉPHONE
┌──────────────┬─────────────────────────┐   ┌─────────────────────┐
│ djeli        │                         │   │ djeli    reste 34 ▾ │
│              │                         │   ├─────────────────────┤
│ ● Accueil    │                         │   │                     │
│ ● Décisions 3│        (la page)        │   │      (la page)      │
│ ● Prospects  │                         │   │                     │
│ ● Conversat. │                         │   │                     │
│ ● Campagnes  │                         │   ├─────────────────────┤
│ ● Rapports   │                         │   │ 🏠   ✅3   💬   📊   ☰ │
│ ──────────── │                         │   └─────────────────────┘
│ ● Comptes    │                         │    Accueil · Décisions ·
│ ● Forfait    │                         │    Conversations · Rapports
│ ● Réglages   │                         │    · Plus (le reste)
│              │                         │
│ Reste 34 ent.│                         │
│ [Recharger]  │                         │
└──────────────┴─────────────────────────┘
```

Neuf pages. Les quatre premières servent tous les jours, les autres de temps en temps.

---

## 3. Accueil

Ce que Koffi voit en ouvrant Djeli. La question à laquelle la page répond : **« Est-ce que ça marche, et est-ce qu'on a besoin de moi ? »**

```
┌──────────────────────────────────────────────────────────────────┐
│ Bonjour Koffi                    L'agent travaille ●  [ Pause ]  │
├──────────────────────────────────────────────────────────────────┤
│ 3 DÉCISIONS VOUS ATTENDENT                          [Tout voir]  │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ 🔥 Mme Houngbo (Maquis Chez Tanti) veut un devis             │ │
│ │    [ Je m'en occupe ]  [ Laisse l'agent répondre ]           │ │
│ ├──────────────────────────────────────────────────────────────┤ │
│ │ ❓ « Faites-vous aussi les enseignes ? »      [Oui] [Non]    │ │
│ ├──────────────────────────────────────────────────────────────┤ │
│ │ 📅 Rendez-vous jeudi 15 h avec Hôtel du Lac ? [Oui] [Autre]  │ │
│ └──────────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────┤
│ CETTE SEMAINE                                                    │
│ ┌────────────┬────────────┬────────────┬────────────┐            │
│ │    86      │    14      │     5      │     2      │            │
│ │ contactés  │ réponses   │ intéressés │ rendez-vous│            │
│ └────────────┴────────────┴────────────┴────────────┘            │
│ Forfait : 86 entreprises sur 120 · reste 19 jours                │
├───────────────────────────────┬──────────────────────────────────┤
│ PAR CANAL                     │ VOS COMPTES                      │
│ WhatsApp  ████████░  62 · 12  │ ● WhatsApp +229 97…   24/40 auj. │
│ Email     ███░░░░░░  24 ·  2  │ ● Gmail koffi@…       12/30 auj. │
│           envoyés · réponses  │ ○ Instagram       [ Connecter ]  │
├───────────────────────────────┴──────────────────────────────────┤
│ CE QUE L'AGENT A FAIT AUJOURD'HUI                                │
│ 10:42  A répondu à Boutique Awa (question sur les délais)        │
│ 09:15  A écrit à 12 restaurants de Cotonou                       │
│ 08:30  A trouvé 18 nouveaux prospects                            │
└──────────────────────────────────────────────────────────────────┘
```

| Koffi peut | Détail |
|---|---|
| **Mettre en pause / reprendre** | Un seul bouton, qui arrête tous les nouveaux envois. Les conversations en cours continuent |
| **Répondre aux décisions** | Directement depuis l'accueil, sans changer de page |
| **Voir l'essentiel** | Les 4 chiffres, où en est le forfait, le coût par rendez-vous, l'état des comptes |
| **Suivre l'agent** | Le journal du jour, en phrases simples |

---

## 4. Décisions

La page la plus importante. **Tout ce que l'agent ne décide pas seul arrive ici**, trié par urgence, avec un délai.

```
┌──────────────────────────────────────────────────────────────────┐
│ DÉCISIONS        [ En attente 3 ]  [ Déjà répondues ]            │
├──────────────────────────────────────────────────────────────────┤
│ 🔥 LEAD CHAUD                                  il y a 12 min     │
│ Mme Houngbo — Maquis Chez Tanti, Cotonou · WhatsApp              │
│ « Oui ça m'intéresse, c'est combien pour un logo ? »             │
│ L'agent propose : donner votre fourchette (40 à 60 000 FCFA)     │
│ et proposer un appel.                                            │
│ [ Je m'en occupe ] [ Laisse l'agent répondre ] [ Voir le fil ]   │
├──────────────────────────────────────────────────────────────────┤
│ ❓ QUESTION                                reste 3 h 40          │
│ Boutique Awa demande : « Faites-vous aussi les enseignes ? »     │
│ [ Oui ]  [ Non ]  [ Écrire ma réponse ]                          │
│ ☐ Retenir cette réponse pour les prochaines fois                 │
├──────────────────────────────────────────────────────────────────┤
│ 📅 RENDEZ-VOUS                                                   │
│ Hôtel du Lac propose jeudi 15 h (votre agenda est libre)         │
│ [ Oui, confirme ]  [ Proposer un autre horaire ]                 │
└──────────────────────────────────────────────────────────────────┘
```

**Les types de décisions**

| Type | Exemple | Réponses possibles |
|---|---|---|
| Lead chaud | Un prospect est intéressé | Je m'en occupe · Laisse l'agent |
| Question hors de portée | « Faites-vous les enseignes ? » | Oui · Non · Texte libre |
| Rendez-vous | « Jeudi 15 h ? » | Oui · Autre horaire |
| Information à valider | « Je peux annoncer 50 000 FCFA pour un logo ? » | Oui · Corriger |
| Conseil de l'agent | « WhatsApp répond 4 fois mieux que l'email. Je mets plus de budget dessus ? » | Oui · Non |
| Compte à rebrancher | « Votre WhatsApp s'est déconnecté » | Rebrancher |
| Forfait bientôt fini | « Il reste 8 entreprises et 5 jours » | Recharger |
| Note vocale non comprise | L'audio + le contexte | Texte de réponse |

**Ce qui rend la page utile**
- **« Retenir cette réponse »** : la réponse est ajoutée aux consignes, l'agent ne reposera plus la question. La file se vide avec le temps.
- **Le délai** : au bout de 4 heures sans réponse, l'agent envoie au prospect un message d'attente poli et relance Koffi.
- **La même décision arrive sur WhatsApp**, et Koffi peut y répondre par Oui / Non. Répondue à un endroit, elle disparaît de l'autre.

---

## 5. Prospects

Toutes les entreprises que l'agent a trouvées pour Koffi.

```
┌──────────────────────────────────────────────────────────────────┐
│ PROSPECTS   1 240 trouvés · 186 contactés     [+ Ajouter] [Export]│
│ [Recherche…]  Campagne ▾  Statut ▾  Canal ▾  Ville ▾             │
├──────────────────────────┬──────────┬──────────┬─────────────────┤
│ Entreprise               │ Ville    │ Canal    │ Statut          │
├──────────────────────────┼──────────┼──────────┼─────────────────┤
│ Maquis Chez Tanti        │ Cotonou  │ WhatsApp │ 🔥 Intéressé    │
│ Hôtel du Lac             │ Cotonou  │ Email    │ 📅 RDV jeudi    │
│ Boutique Awa             │ Porto-N. │ WhatsApp │ 💬 En discussion│
│ Restaurant Le Privé      │ Cotonou  │ WhatsApp │ ⏳ Relance J3   │
│ École Les Lauréats       │ Calavi   │ Email    │ ○ À contacter   │
└──────────────────────────┴──────────┴──────────┴─────────────────┘

 FICHE D'UN PROSPECT
┌──────────────────────────────────────────────────────────────────┐
│ ← Maquis Chez Tanti                 Restaurant · Cotonou · PME   │
│ Contact : Mme Houngbo, gérante                Note d'intérêt 92  │
├──────────────────────────────────────────────────────────────────┤
│ POURQUOI LUI ÉCRIRE                                              │
│ Logo difficile à lire sur sa page Facebook ; a ouvert un 2e      │
│ point de vente en octobre.                                       │
├──────────────────────────────────────────────────────────────────┤
│ COMMENT LE JOINDRE     ● WhatsApp +229 96…   ○ Email   ○ Insta   │
├──────────────────────────────────────────────────────────────────┤
│ HISTORIQUE                                                       │
│ Lun 09:12  → WhatsApp : premier message                          │
│ Lun 14:30  ← « Oui ça m'intéresse, c'est combien ? »             │
│ Lun 14:41  → Réponse de l'agent                                  │
├──────────────────────────────────────────────────────────────────┤
│ [ Voir la conversation ] [ Ne plus contacter ] [ Marquer signé ] │
│ Ma note : ………………………………………………………                                │
└──────────────────────────────────────────────────────────────────┘
```

| Koffi peut | Détail |
|---|---|
| **Chercher et filtrer** | Par campagne, statut, canal, ville, secteur |
| **Ouvrir une fiche** | Qui c'est, pourquoi lui écrire, comment le joindre, tout l'historique |
| **Ajouter un prospect** | À la main, ou en important sa propre liste (fichier Excel/CSV) |
| **Retirer un prospect** | « Ne plus contacter » : il sort de toutes les campagnes de Koffi |
| **Faire passer en premier** | « Contacter celui-ci en priorité » |
| **Corriger une fiche** | Un numéro faux, un nom de contact |
| **Écrire une note** | Visible seulement par lui |
| **Donner le résultat** | Signé (avec le montant) · En discussion · Perdu. **C'est ce qui permet de calculer ce que Djeli lui rapporte** |
| **Exporter** | La liste en fichier Excel/CSV |

---

## 6. Conversations

Tous les échanges, tous canaux confondus, dans une seule boîte.

```
┌───────────────────────────┬──────────────────────────────────────┐
│ [Toutes] [À moi] [Agent]  │ Maquis Chez Tanti · WhatsApp         │
│ Canal ▾                   │ Géré par : l'agent  [Reprendre la main]│
├───────────────────────────┼──────────────────────────────────────┤
│ 🟢 Maquis Chez Tanti  🔥  │        Bonjour Madame Houngbo, ici   │
│    Oui ça m'intéresse…    │        Koffi du Studio Koffi…    ✓✓  │
│ ✉️ Hôtel du Lac       📅  │                                      │
│    Jeudi 15 h me va       │ Oui ça m'intéresse,                  │
│ 🟢 Boutique Awa           │ c'est combien pour un logo ?         │
│    Faites-vous les ens…   │                                      │
│ 🟢 Restaurant Le Privé    │        Entre 40 000 et 60 000 FCFA   │
│    (pas de réponse)       │        selon le projet. Je vous…  ✓✓ │
│                           ├──────────────────────────────────────┤
│                           │ ✎ L'agent prépare : « Je peux vous   │
│                           │ appeler demain matin ? »             │
│                           │ [ Envoyer ] [ Modifier ] [ Annuler ] │
└───────────────────────────┴──────────────────────────────────────┘
```

| Koffi peut | Détail |
|---|---|
| **Tout lire** | Chaque message envoyé et reçu, quel que soit le canal |
| **Reprendre la main** | L'agent s'arrête sur cette conversation, Koffi écrit lui-même |
| **Rendre la main** | L'agent reprend là où Koffi s'est arrêté |
| **Voir ce que l'agent prépare** | Et l'envoyer, le modifier ou l'annuler |
| **Écrire directement** | Depuis Djeli, ou depuis son vrai WhatsApp — c'est la même conversation |

**Le cas particulier à bien gérer** : Koffi répond lui-même à un prospect **depuis son téléphone**, dans WhatsApp. Djeli le voit, comprend que le patron a pris la main, et **l'agent se tait automatiquement** sur cette conversation. Il prévient : « J'ai vu que vous avez répondu à Mme Houngbo. Je vous laisse continuer. Dites "reprends" si vous voulez que je reprenne. »

**Ce que Djeli lit dans les comptes de Koffi** : la liste exacte reste à fixer (`OFFRE-ET-PRIX.md` §8). Quelle qu'elle soit, elle est écrite à l'écran de connexion, et Koffi l'accepte avant de brancher un compte. Ses conversations privées n'en font pas partie.

---

## 7. Campagnes

Une campagne = **une cible + un message + un budget**. C'est ici que Koffi règle la prospection elle-même.

```
┌──────────────────────────────────────────────────────────────────┐
│ CAMPAGNES                                  [ + Nouvelle campagne ]│
├──────────────────────────────────────────────────────────────────┤
│ ● Restaurants de Cotonou              En cours        [ Pause ]  │
│   124 contactés · 19 réponses · 3 RDV · 4 100 FCFA par RDV       │
│   WhatsApp, Email · 10 entreprises par jour                      │
├──────────────────────────────────────────────────────────────────┤
│ ● Boutiques de mode                   En cours        [ Pause ]  │
│   62 contactés · 6 réponses · 1 RDV                              │
├──────────────────────────────────────────────────────────────────┤
│ ○ Écoles privées                      En pause       [ Reprendre]│
└──────────────────────────────────────────────────────────────────┘

 UNE CAMPAGNE — quatre onglets
┌──────────────────────────────────────────────────────────────────┐
│ ← Restaurants de Cotonou   [ Cible ] [ Messages ] [ Rythme ] [ Budget ]│
├──────────────────────────────────────────────────────────────────┤
│ CIBLE                                                            │
│ Secteurs   [Restaurants ×] [Maquis ×] [Traiteurs ×]  [+ ajouter] │
│ Villes     [Cotonou ×] [Abomey-Calavi ×]             [+ ajouter] │
│ Taille     ☑ 1-10   ☑ 11-50   ☐ 51-200   ☐ 200+                  │
│ Signaux    ☑ Pas de logo pro  ☑ Ouverture récente  ☐ Recrute     │
│                                                                  │
│ → 1 240 entreprises correspondent · 1 054 pas encore contactées  │
├──────────────────────────────────────────────────────────────────┤
│ MESSAGES                                                         │
│ Ton        ( ) Très poli   (•) Simple et direct   ( ) Chaleureux │
│ Exemple    « Bonjour Madame Houngbo, ici Koffi du Studio Koffi…» │
│            [ Voir 3 autres exemples ]  [ Modifier l'accroche ]   │
│ L'offre    « 3 idées de logo, sans engagement »      [ Changer ] │
├──────────────────────────────────────────────────────────────────┤
│ RYTHME                                                           │
│ Canaux     1. WhatsApp   2. Email   (glisser pour réordonner)    │
│ Relances   J1 message · J3 relance · J7 dernier message [Modifier]│
├──────────────────────────────────────────────────────────────────┤
│ BUDGET                                                           │
│ Par jour   ──●───────── 10 entreprises par jour                  │
│ Part du forfait   60 entreprises · déjà 42 contactées            │
└──────────────────────────────────────────────────────────────────┘
```

| Koffi peut | Détail |
|---|---|
| **Créer une campagne** | Il choisit une cible proposée par l'agent, ou en décrit une nouvelle. Le **simulateur** lui montre ce qu'il peut en attendre avant de lancer |
| **Modifier la cible** | Secteurs, villes, tailles d'entreprise, signaux. Le nombre d'entreprises concernées se met à jour en direct |
| **Régler les messages** | Le ton, l'accroche, l'offre mise en avant. Il voit toujours des exemples réels avant de valider |
| **Régler le rythme** | L'ordre des canaux, le nombre de relances, les jours entre deux messages |
| **Régler le budget** | Nombre d'entreprises par jour, et part du forfait réservée à cette campagne |
| **Mettre en pause, reprendre, arrêter** | Par campagne |
| **Copier une campagne** | Même réglages, autre ville |

**Le simulateur**, à la création d'une campagne :

```
┌──────────────────────────────────────────────────────────────────┐
│ Budget  ────●──────── 15 000 FCFA      Canal  WhatsApp ▾         │
│ ┌──────────────┬──────────────┬──────────────┬─────────────────┐ │
│ │    ~105      │   ~14 à 24   │    ~3 à 6    │  ~2 500 à 5 000 │ │
│ │  contactés   │   réponses   │ rendez-vous  │  FCFA par RDV   │ │
│ └──────────────┴──────────────┴──────────────┴─────────────────┘ │
│ Estimation · [ Comparer avec un autre budget ]  [ Lancer ]       │
└──────────────────────────────────────────────────────────────────┘
```

---

## 8. Rapports

« On lui fait un rapport sur tout ce qui est important. » Le rapport existe sous trois formes, avec le même contenu :

| Rapport | Quand | Où |
|---|---|---|
| **Le point du jour** | Le soir vers 19 h, seulement s'il y a du nouveau | WhatsApp |
| **Le bilan de la semaine** | Lundi matin | WhatsApp + email + tableau de bord |
| **Le bilan du mois** | Le 1er | Email + tableau de bord (PDF téléchargeable) |

```
┌──────────────────────────────────────────────────────────────────┐
│ RAPPORTS      [ Cette semaine ▾ ]   [ Toutes les campagnes ▾ ]   │
├──────────────────────────────────────────────────────────────────┤
│ LE CHEMIN DES PROSPECTS                                          │
│ Trouvés      ████████████████████████████████  1 240             │
│ Contactés    ████████████░░░░░░░░░░░░░░░░░░░░    186             │
│ Ont répondu  ███░░░░░░░░░░░░░░░░░░░░░░░░░░░░░     25   (13 %)    │
│ Intéressés   █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░      9             │
│ Rendez-vous  ▌                                     4             │
│ Signés       ▏                                     1 · 60 000 F  │
├──────────────────────────────────────────────────────────────────┤
│ L'ARGENT                                                         │
│ Dépensé 23 400 FCFA · 5 850 FCFA par RDV · Gagné 60 000 FCFA     │
├───────────────────────────────┬──────────────────────────────────┤
│ PAR CANAL                     │ PAR CAMPAGNE                     │
│ WhatsApp   16 % de réponses   │ Restaurants     15 % · 3 RDV     │
│ Email       5 % de réponses   │ Boutiques       10 % · 1 RDV     │
├───────────────────────────────┴──────────────────────────────────┤
│ CE QUE L'AGENT A APPRIS                                          │
│ • Les restaurants répondent surtout le mardi entre 9 h et 11 h   │
│ • L'accroche « logo illisible sur téléphone » marche 2× mieux    │
│ CE QU'IL PROPOSE                                                 │
│ • Mettre le budget des écoles sur les restaurants   [Oui] [Non]  │
└──────────────────────────────────────────────────────────────────┘
```

| Koffi peut | Détail |
|---|---|
| **Choisir la période** | Jour, semaine, mois, ou depuis le début |
| **Comparer** | Les canaux entre eux, les campagnes entre elles |
| **Voir ce que ça rapporte** | Dépensé contre gagné — à condition qu'il indique les contrats signés |
| **Accepter les propositions de l'agent** | Chaque proposition est une décision Oui / Non |
| **Télécharger** | Le bilan en PDF |
| **Régler les rapports** | Fréquence, heure, et où il les reçoit (WhatsApp, email, les deux) |

---

## 9. Comptes connectés

Les comptes de Koffi depuis lesquels l'agent écrit.

```
┌──────────────────────────────────────────────────────────────────┐
│ VOS COMPTES                                                      │
├──────────────────────────────────────────────────────────────────┤
│ 🟢 WhatsApp    +229 97 00 00 00        ● En bonne santé          │
│    Aujourd'hui 24 / 40     Limite par jour ───●── 40             │
│    820 de vos prospects sont joignables ici      [ Débrancher ]  │
├──────────────────────────────────────────────────────────────────┤
│ ✉️ Gmail       koffi@studiokoffi.com   ● En bonne santé          │
│    Aujourd'hui 12 / 30 · Agenda Google branché ✓ [ Débrancher ]  │
├──────────────────────────────────────────────────────────────────┤
│ 📷 Instagram   non branché                                       │
│    140 de vos prospects sont joignables ici      [ Connecter ]   │
├──────────────────────────────────────────────────────────────────┤
│ 📘 Facebook    non branché   95 prospects        [ Connecter ]   │
│ 💼 LinkedIn    non branché   60 prospects        [ Connecter ]   │
│ 💬 Messenger   bientôt disponible                                │
└──────────────────────────────────────────────────────────────────┘
```

| Koffi peut | Détail |
|---|---|
| **Brancher un compte** | QR code pour WhatsApp, connexion classique pour les autres. Moins d'une minute |
| **Débrancher** | À tout moment, en un clic. L'agent cesse immédiatement d'écrire depuis ce compte |
| **Baisser la limite par jour** | Il peut descendre sous 40, jamais monter au-dessus |
| **Voir la santé du compte** | Bonne · À surveiller · Envois suspendus, avec l'explication |
| **Voir à quoi sert chaque canal** | « 140 de vos prospects sont joignables sur Instagram » : il sait ce qu'il gagne à le brancher |

---

## 10. Forfait

Pas de crédits : le client achète des **entreprises contactées**, en FCFA, pour 30 jours (détail dans `OFFRE-ET-PRIX.md`). La page ressemble à l'écran d'un forfait internet.

```
┌──────────────────────────────────────────────────────────────────┐
│ VOTRE FORFAIT                                                    │
│ Entreprises   ██████████████████████░░░░░░░░   86 / 120          │
│ Durée         ████████████░░░░░░░░░░░░░░░░░░   reste 19 jours    │
│ Comptes       ● Gmail   ● WhatsApp   ○ Instagram   ○ LinkedIn   │
│                                              [ Recharger ]       │
│ Rechargez avant le 3 décembre : vos 34 entreprises restantes     │
│ sont reportées, avec 10 % d'entreprises en plus.                 │
├──────────────────────────────────────────────────────────────────┤
│ RECHARGER                                                        │
│ Montant  ─────●──────────── 12 000 FCFA      [ 12 000 ]          │
│ → 48 entreprises contactées · tous vos réseaux · 30 jours        │
│ Avec 25 000 FCFA : 225 F l'entreprise et 20 par jour             │
│ [ MTN MoMo ] [ Moov ] [ Wave ] [ Celtiis ] [ Orange ]            │
├──────────────────────────────────────────────────────────────────┤
│ Pas plus de   ──●─────── 10 entreprises par jour                 │
│ Me prévenir quand il reste   [ 20 % ▾ ]                          │
├──────────────────────────────────────────────────────────────────┤
│ HISTORIQUE                                                       │
│ 14 nov.  Maquis Chez Tanti — contactée (WhatsApp)        − 1     │
│ 14 nov.  Hôtel du Lac — contactée (Email)                − 1     │
│ 12 nov.  Forfait 10 000 FCFA — MTN MoMo                 + 40     │
│ 11 nov.  Restaurant Le Privé — non livré, rendue         + 1     │
└──────────────────────────────────────────────────────────────────┘
```

| Koffi peut | Détail |
|---|---|
| **Recharger le montant qu'il veut** | À partir de 5 000 FCFA, au curseur ou en tapant le montant. Il voit en direct ce qu'il obtient et ce que le palier suivant débloque |
| **Voir où il en est** | Entreprises restantes, jours restants, comptes connectés |
| **Fixer un rythme** | Nombre maximum d'entreprises contactées par jour |
| **Voir chaque entreprise décomptée** | Ligne par ligne, avec celles qui lui ont été rendues |
| **Télécharger ses reçus** | Pour sa comptabilité |

---

## 11. Réglages

```
┌──────────────────────────────────────────────────────────────────┐
│ RÉGLAGES                                                         │
│ [ Mon activité ] [ Ce que l'agent dit ] [ Autonomie ] [ Alertes ]│
│ [ Horaires et agenda ] [ À ne pas contacter ] [ Mon compte ]     │
└──────────────────────────────────────────────────────────────────┘
```

| Onglet | Ce que Koffi peut modifier |
|---|---|
| **Mon activité** | La fiche que l'agent a rédigée en lisant son site : ce qu'il vend, ses prix, ses points forts, ses réalisations, sa zone. Il corrige tout ce qui est faux, et peut relancer l'analyse si son site a changé |
| **Ce que l'agent dit** | Le nom affiché et la signature · ce que l'agent **peut** annoncer (prix, délais, offres) · ce qu'il ne doit **jamais** dire · les réponses aux questions fréquentes (alimentées par « Retenir cette réponse ») |
| **Autonomie** | Ce que l'agent fait seul et ce qu'il demande (voir ci-dessous) |
| **Alertes** | Quelles alertes, sur quel canal, à quelles heures. « Ne me dérange pas le dimanche » |
| **Horaires et agenda** | Ses heures de disponibilité pour les rendez-vous · la durée d'un rendez-vous · son agenda branché |
| **À ne pas contacter** | Ses clients actuels, ses concurrents, ses proches : par nom, numéro ou site web. Import d'une liste possible |
| **Mon compte** | Nom, email, mot de passe, numéro WhatsApp, langue · inviter un collègue · télécharger ou supprimer toutes ses données |

### Le réglage d'autonomie

C'est la réponse à « il décide de tout ce qui est important ». Koffi choisit un niveau, et peut affiner ligne par ligne :

```
┌──────────────────────────────────────────────────────────────────┐
│ ( ) PRUDENT    Je valide les premiers messages de chaque campagne│
│ (•) ÉQUILIBRÉ  L'agent écrit seul, il me demande pour l'important│
│ ( ) AUTONOME   L'agent fait tout, il me prévient après           │
├──────────────────────────────────────────┬───────────┬───────────┤
│                                          │ Agent seul│ Me demande│
│ Écrire le premier message                │    (•)    │    ( )    │
│ Relancer                                 │    (•)    │    ( )    │
│ Répondre à une question simple           │    (•)    │    ( )    │
│ Annoncer un prix                         │    ( )    │    (•)    │
│ Confirmer un rendez-vous                 │    ( )    │    (•)    │
│ Répondre à un lead chaud                 │    ( )    │    (•)    │
│ Changer la répartition du budget         │    ( )    │    (•)    │
└──────────────────────────────────────────┴───────────┴───────────┘
```

---

## 12. Ce que Koffi ne peut pas modifier

Pour protéger ses comptes, les prospects et Djeli. Ces limites sont affichées et expliquées, pas cachées.

| Limite fixe | Pourquoi |
|---|---|
| 40 nouveaux messages par jour et par compte, avec montée progressive | Au-delà, WhatsApp peut limiter ou suspendre son compte |
| « Répondez STOP » dans chaque premier message | Un prospect qui dit STOP n'est plus jamais contacté |
| Pas d'envoi avant 8 h, après 19 h, ni le dimanche | Respect des prospects |
| Le contrôle de chaque message avant envoi | Pas de fausse promesse, pas de pression (`INTERDITS.md`) |
| Pas plus de 3 messages sans réponse au même prospect | Au-delà, c'est du harcèlement |

---

## 13. Le résumé : voir, modifier, ajouter

| | Ce que le client peut faire |
|---|---|
| **VOIR** | Les décisions en attente · les chiffres de la semaine · chaque prospect et pourquoi il a été choisi · chaque message envoyé et reçu · ce que l'agent prépare · la santé de ses comptes · chaque entreprise décomptée de son forfait · ce que ça lui rapporte · ce que l'agent a appris |
| **MODIFIER** | La description de son activité · ses cibles (secteurs, villes, tailles, signaux) · le ton et l'accroche des messages · l'ordre des canaux · le rythme des relances · le budget par jour et par campagne · le niveau d'autonomie de l'agent · ce que l'agent peut dire ou non · ses horaires · ses alertes et ses rapports · une fiche prospect · un message que l'agent prépare |
| **AJOUTER** | Une campagne · une cible · un prospect ou une liste importée · un compte connecté · un forfait · une entreprise à ne pas contacter · une réponse à retenir · une note sur un prospect · le résultat d'un rendez-vous · un collègue |
| **ARRÊTER** | Tout (bouton Pause) · une campagne · une conversation (reprise en main) · un prospect · un compte (débrancher) |

---

## 14. Tout ça, aussi depuis WhatsApp

Djeli écrit à Koffi **depuis le numéro WhatsApp de Djeli** (pas depuis le sien) pour les alertes et les rapports. Koffi répond par Oui / Non ou en quelques mots :

| Koffi écrit | L'agent fait |
|---|---|
| « Pause » / « Reprends » | Arrête ou relance les envois |
| « Où en est-on ? » | Envoie les chiffres de la semaine |
| « Montre-moi les leads chauds » | Liste les prospects intéressés |
| « Ne contacte plus les écoles » | Met la campagne en pause, après confirmation |
| « Ajoute Porto-Novo » | Ajoute la ville à la cible, après confirmation |
| « Mon prix pour un logo c'est 50 000 » | L'ajoute aux consignes, après confirmation |

L'agent reformule toujours ce qu'il a compris et attend « Oui » avant de changer un réglage.

---

## 15. Mes propositions pour aller plus loin

Dix idées. Les quatre premières sont celles que je mettrais dès le lancement.

### 1. Le compteur « Djeli vous a rapporté »

Tout en haut de l'accueil, avant tout le reste :

```
┌──────────────────────────────────────────────────────────────────┐
│ Depuis le début     Payé 35 000 FCFA  →  Gagné 180 000 FCFA      │
│                     3 contrats signés · 7 rendez-vous            │
└──────────────────────────────────────────────────────────────────┘
```

C'est la seule ligne qui compte pour un patron, et c'est elle qui le fait recharger sans qu'on le relance. Elle dépend d'une chose : qu'il nous dise quand un contrat est signé (idée 4).

### 2. Les entreprises qui attendent, floutées dans le tableau de bord

Le floutage ne s'arrête pas à l'inscription. Dans la page Prospects, on montre en clair celles déjà contactées, et en dessous :

```
┌──────────────────────────────────────────────────────────────────┐
│ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒   Restaurant · Cotonou · « vient d'ouvrir »      │
│ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒   Hôtel · Ouidah · « pas de site web »           │
│ 1 054 entreprises attendent encore · 820 joignables sur WhatsApp │
│                         [ Les débloquer ]                        │
└──────────────────────────────────────────────────────────────────┘
```

Le client voit en permanence ce qu'il lui reste à gagner. C'est le meilleur argument pour passer de l'essai au forfait, puis d'un forfait au suivant.

### 3. L'essai gratuit montre le vrai produit, avec les portes fermées

Pendant l'essai, le tableau de bord est complet, mais les canaux payants sont visibles et verrouillés :

```
┌──────────────────────────────────────────────────────────────────┐
│ ESSAI GRATUIT   7 entreprises contactées sur 10 · reste 4 jours  │
│ 2 réponses déjà reçues                                           │
├──────────────────────────────────────────────────────────────────┤
│ ● Gmail        koffi@studiokoffi.com       7 / 10                │
│ 🔒 WhatsApp    820 entreprises joignables                        │
│ 🔒 Instagram   140 entreprises joignables                        │
│          [ Tout débloquer — dès 5 000 FCFA ]                     │
└──────────────────────────────────────────────────────────────────┘
```

À la fin de l'essai : le bilan (« 10 emails, 2 réponses, 1 rendez-vous ») et l'offre de +20 % d'entreprises pendant 48 heures.

### 4. Le résultat d'un rendez-vous en un seul geste

Le lendemain de chaque rendez-vous, sur WhatsApp et sur l'accueil : *« Votre rendez-vous avec l'Hôtel du Lac ? »* → `[Signé]` `[En discussion]` `[Perdu]` `[N'a pas eu lieu]`. Si « Signé » : *« Pour combien ? »*. C'est ce qui alimente le compteur de l'idée 1, et nos vrais taux de réussite.

### 5. « Pourquoi ? » sur chaque message

Un petit lien sous chaque message envoyé : *pourquoi cette entreprise, pourquoi ce canal, pourquoi cette phrase*. Le client comprend que l'agent ne tire pas au hasard, et il sait où le corriger.

### 6. Une seule « prochaine action conseillée »

Sous les décisions, une carte, jamais plus : *« Vos restaurants répondent 3 fois plus que vos écoles. Déplacer le budget ? »* ou *« 140 de vos prospects sont sur Instagram. Le connecter ? »*. Un conseil à la fois, avec un bouton.

### 7. Valider d'un geste, pour le mode Prudent

Les premiers messages d'une campagne défilent comme des cartes : à droite pour envoyer, à gauche pour corriger. Dix messages validés en trente secondes sur un téléphone.

### 8. Le rapport à partager

Le bilan de la semaine existe aussi en image carrée, prête à mettre en statut WhatsApp : *« Cette semaine, Djeli m'a trouvé 4 rendez-vous. »* avec le lien de parrainage du client dedans. C'est notre publicité gratuite.

### 9. Léger et installable

Le tableau de bord s'installe sur l'écran d'accueil du téléphone comme une application, s'ouvre même avec une mauvaise connexion et consomme peu de données.

### 10. La boîte à réponses

Chaque question tranchée avec « Retenir cette réponse » rejoint une liste que le client peut relire et corriger dans Réglages. Après un mois, l'agent ne lui demande presque plus rien.

---

## 16. Questions ouvertes sur le tableau de bord

1. **Plusieurs utilisateurs par entreprise** dès le lancement, ou un seul compte par client au départ ? *(Je propose : un seul au départ.)*
2. **Niveau d'autonomie par défaut** : Équilibré ? *(Je propose : oui.)*
3. **Le résultat des rendez-vous** (signé, montant) : on le demande systématiquement sur WhatsApp après chaque rendez-vous ? *(Je propose : oui, c'est la seule façon de prouver ce que Djeli rapporte.)*
