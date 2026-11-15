# Le parcours Djeli, écran par écran

*Version du 14 novembre 2026 (corrigée le même jour). Rien n'est codé : c'est le plan.*

**Djeli est B2B pour l'instant** : nos clients vendent à des entreprises.

Fil rouge : **Koffi Adjovi, Studio Koffi, graphiste à Cotonou**, qui cherche des restaurants, des boutiques et des écoles comme clients.

Le parcours est celui d'Explee — *je décris mon activité, l'agent trouve mes clients, je vois le résultat, puis je m'engage* — avec trois ajouts : **l'essai gratuit par email**, **la connexion des comptes du client** et **le forfait en Mobile Money**.

---

## Vue d'ensemble

| # | Écran | Qui | Durée |
|---|---|---|---|
| 1 | Page d'accueil | Visiteur | — |
| 2 | Il décrit son activité : **site web ou formulaire** | Visiteur | 30 s |
| 3 | L'agent analyse, en direct | Agent | 90 s |
| 4 | 1 à 3 questions, seulement si nécessaire | Agent | 20 s |
| 5 | Les profils de clients idéaux | Visiteur | 40 s |
| 6 | L'agent cherche les prospects **et leurs coordonnées** | Agent | 60 s |
| 7 | L'aperçu : combien, et par où les joindre | Visiteur | 20 s |
| 8 | Inscription | Visiteur | 60 s |
| 9 | **Il choisit : essai gratuit ou forfait** | Client | 90 s |
| 10 | **Il connecte ses comptes** (Gmail en essai ; tous les réseaux dès 5 000 FCFA) | Client | 1 à 3 min |
| 11 | Mise en route | Client | 3 min |
| 12 | L'agent prospecte depuis les comptes du client | Agent | Chaque jour |
| 13 | Le client suit, décide et reçoit ses rapports | Client | 2 min / jour |

---

## 1 — La page d'accueil

> # Trouvez vos clients pendant que vous dormez.
> Djeli étudie votre marché, écrit à vos futurs clients depuis vos propres comptes et vous amène des rendez-vous.
>
> [ L'adresse de votre site web… ]  **[ Trouver mes clients ]**
> *Pas de site ? [Décrivez votre activité]*
>
> *Analyse et essai gratuits · Paiement en Mobile Money dès 5 000 FCFA*

Puis : les 6 étapes du pipeline en cartes qui défilent (composant du clone) · « Vous restez aux commandes » · les différences de Djeli · le simulateur de budget · la FAQ.

**Aucun témoignage ni chiffre inventé** : ceux du clone sont à supprimer (`INTERDITS.md`).

---

## 2 — Il décrit son activité

Deux portes d'entrée, comme prévu depuis le début :

| Porte | Ce que fait le visiteur |
|---|---|
| **Site web** | Il colle l'adresse de son site (ou de la page qui décrit son application, son produit) |
| **Formulaire** | Il décrit son activité et coche des cases |

**Le formulaire** : ce que vous vendez · votre client idéal · secteurs visés · taille des entreprises visées · pays et villes · votre prix moyen · votre objectif (rendez-vous, devis, démonstration, commande).

---

## 3 — L'agent analyse, en direct

90 secondes, avec l'animation du clone (`StartFlow.tsx`) : « Je lis votre site… », « J'identifie ce que vous vendez… », « J'étudie vos concurrents… », « Je cherche qui achète ça… ».

**Résultat** : la fiche d'activité — offres, prix, points forts, preuves, zone, concurrents.

## 4 — Les questions, seulement si nécessaire

Avec un bon site : aucune question. Sinon 1 à 3 questions maximum, en boutons ou cases à cocher.

## 5 — Les profils de clients idéaux

L'agent propose 3 à 5 types d'entreprises à viser, avec une note et une raison. Le visiteur décoche, modifie, ajoute.

| Profil | Pourquoi | Note |
|---|---|---|
| Restaurants et maquis de Cotonou sans logo professionnel | Forte demande, budgets compatibles | 92 |
| Boutiques de mode | Besoin de visuels chaque semaine | 85 |
| Écoles privées | Affiches et flyers chaque rentrée | 78 |

---

## 6 — L'agent cherche les prospects et leurs coordonnées

Pour chaque profil validé, l'agent trouve les entreprises, puis **cherche par où on peut les joindre** : numéro WhatsApp, email, compte Instagram, page Facebook, profil LinkedIn.

C'est cette étape qui prépare la suivante : on sait maintenant **quels canaux servent vraiment** pour ce client-là.

## 7 — L'aperçu

Le vrai nombre, la vraie liste, **sans les noms ni les coordonnées**. Et, nouveau : **la répartition par canal**.

```
┌──────────────────────────────────────────────────────────────────┐
│ Djeli a trouvé 1 240 entreprises pour vous.                      │
│                                                                  │
│ Restaurant · Cotonou · 1-10 pers. · « pas de logo professionnel »│
│ Boutique · Porto-Novo · 1-10 pers. · « vient d'ouvrir »          │
│ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  │
│                                                                  │
│ PAR OÙ LES JOINDRE                                               │
│ WhatsApp  ████████████████  820      Instagram  ███  140         │
│ Email     ██████  310                Facebook   ██    95         │
│                                      LinkedIn   █     60         │
│                                                                  │
│            [ Créer mon compte pour commencer ]                   │
└──────────────────────────────────────────────────────────────────┘
```

## 8 — L'inscription

Prénom et nom, nom de l'entreprise (ils apparaissent dans les messages), email et mot de passe ou connexion Google, numéro WhatsApp vérifié, pays. Tout ce qui a été fait avant est conservé.

Après l'inscription, **les entreprises restent floutées** : noms, logos et coordonnées ne sont jamais visibles tant qu'elles n'ont pas été contactées.

---

## 9 — Il choisit : essai gratuit ou forfait

```
┌────────────────────────────────┬─────────────────────────────────┐
│ ESSAI GRATUIT                  │ FORFAIT                         │
│ 0 FCFA                         │ Le montant que vous voulez,     │
│                                │ à partir de 5 000 FCFA          │
│ 10 entreprises contactées      │                                 │
│ par email, depuis votre Gmail  │ ────●──────── 12 000 FCFA       │
│ 7 jours                        │ → 48 entreprises contactées     │
│                                │ → Tous vos réseaux · 30 jours   │
│ 🔒 WhatsApp, Instagram,        │                                 │
│    Facebook, LinkedIn          │ [ MTN MoMo ] [ Moov ] [ Wave ]  │
│                                │                                 │
│ [ Essayer gratuitement ]       │ [ Payer et commencer ]          │
└────────────────────────────────┴─────────────────────────────────┘
```

**Le forfait** : le client choisit son montant. Plus il met, moins l'entreprise coûte cher, et plus l'agent va vite. **Tous les réseaux sont ouverts dès 5 000 FCFA.** Les prix et les paliers sont dans `OFFRE-ET-PRIX.md`.

**On paie avant de connecter par Unipile.** Pour un client payant, tous les comptes passent par Unipile, email compris, qui nous facture chaque compte connecté : on ne l'active que pour un client qui a payé.

---

## 10 — Il connecte ses comptes

**C'est l'étape qui fait la différence avec Explee.** Explee envoie depuis ses propres boîtes email. Djeli envoie **depuis les comptes du client** : son numéro, son adresse, son nom.

| | Ce qu'il peut connecter | Par quel moyen |
|---|---|---|
| **En essai gratuit** | Son Gmail, et rien d'autre | L'API Gmail de Google, en direct : gratuite pour nous |
| **Avec un forfait, dès 5 000 FCFA** | Tous les réseaux : email, WhatsApp, Instagram, Facebook, LinkedIn | Tout par Unipile, email compris |

```
┌──────────────────────────────────────────────────────────────────┐
│ Connectez vos comptes                                            │
│ Djeli écrira à vos prospects depuis vos comptes, en votre nom.   │
│                                                                  │
│ ✉️ Gmail        310 entreprises joignables     [ Connecter ]     │
│ 🟢 WhatsApp     820 entreprises joignables     [ Connecter ]     │
│ 📷 Instagram    140 entreprises joignables     [ Connecter ]     │
│ 📘 Facebook      95 entreprises joignables     [ Connecter ]     │
│ 💼 LinkedIn      60 entreprises joignables     [ Connecter ]     │
│                                        [ Continuer ]             │
└──────────────────────────────────────────────────────────────────┘
```

- **Email** : en essai gratuit, le client autorise seulement l'envoi depuis son Gmail, et les réponses passent par une adresse relais qui les lui transfère. Avec un forfait, il reconnecte sa boîte par Unipile et tout se passe directement dedans (voir `OFFRE-ET-PRIX.md` §7)
- **WhatsApp** : un QR code à scanner, comme pour WhatsApp Web
- **Instagram, Facebook, LinkedIn** : connexion dans une fenêtre sécurisée — Djeli ne voit jamais le mot de passe
- **Messenger** : annoncé « bientôt » chez Unipile ; affiché comme tel

**Ce qu'on dit clairement au client sur cet écran** :
- Djeli n'envoie jamais plus de 40 nouveaux messages par jour et par compte, pour protéger le compte
- Ce que Djeli lit dans ses comptes, et pourquoi — la liste exacte est affichée et il l'accepte avant de connecter (voir `OFFRE-ET-PRIX.md` §8)
- Il peut débrancher à tout moment

> ⚠️ **À trancher** : le nombre de comptes qu'un client peut connecter en même temps. Unipile nous facture chaque compte (≈ 3 280 FCFA par mois), pas chaque client. Voir `OFFRE-ET-PRIX.md` §3.

## 11 — La mise en route

Trois minutes, tout est prérempli : nom affiché dans les messages · ce que l'agent peut dire (prix, délais) et ne doit jamais dire · entreprises à ne pas contacter · nombre d'entreprises par jour · horaires et agenda · niveau d'autonomie de l'agent.

**Validation du style, une fois** : l'agent montre 3 exemples de messages, le client choisit le ton.

---

## 12 — L'agent prospecte depuis les comptes du client

Chaque jour :

1. **Il choisit** les meilleurs prospects du jour, selon les cibles, le budget et les limites de chaque compte
2. **Il étudie** chaque prospect : ce qu'il fait, **la raison précise de lui écrire maintenant**, qui décide, par où le joindre
3. **Il choisit le canal** : celui où le prospect est joignable, parmi ceux que le client a connectés
4. **Il écrit** un message personnel, adapté au canal
5. **Il contrôle** le message (`INTERDITS.md`) : un message refusé ne part pas
6. **Il envoie depuis le compte du client** — le prospect voit le numéro et le nom de Koffi, pas ceux de Djeli
7. **Il relance** s'il n'y a pas de réponse (J3, J7), puis s'arrête
8. **Il répond** aux réponses, propose un rendez-vous, et demande au client quand c'est important

Exemple, envoyé depuis le WhatsApp de Koffi :

> Bonjour Madame Houngbo, ici Koffi du Studio Koffi, graphiste à Cotonou.
> J'ai vu la carte du Maquis Chez Tanti sur Facebook : le logo est difficile à lire sur téléphone.
> Je vous prépare 3 idées de logo, sans engagement ?
> *(Répondez STOP pour ne plus recevoir de message)*

**Le client voit tout dans son propre WhatsApp**, en direct. S'il répond lui-même à un prospect depuis son téléphone, l'agent le remarque et lui laisse la main sur cette conversation.

---

## 13 — Le client suit, décide et reçoit ses rapports

Trois façons de suivre, au choix :

| Où | Ce qu'il y trouve |
|---|---|
| **Son propre WhatsApp / sa boîte email** | Les conversations elles-mêmes, en direct |
| **Les messages de Djeli sur WhatsApp** | Les décisions à prendre (Oui / Non), le point du jour, le bilan de la semaine |
| **Le tableau de bord** | Tout : décisions, prospects, conversations, campagnes, rapports, comptes, forfait, réglages |

**Ce que le client décide** : répondre lui-même à un lead chaud ou laisser l'agent · les questions auxquelles l'agent ne sait pas répondre · confirmer un rendez-vous · valider un prix · accepter une proposition de l'agent (« je mets plus de budget sur WhatsApp ? »).

Le tableau de bord complet, avec ses croquis et tout ce que le client peut y modifier, est décrit dans **`TABLEAU-DE-BORD.md`**.

---

## 14 — Quand l'essai ou le forfait se termine

| Moment | Ce qui se passe |
|---|---|
| **Fin de l'essai gratuit** | Le bilan (« 10 emails, 2 réponses ») et l'offre : +20 % d'entreprises sur le premier forfait pris dans les 48 h |
| Il reste 20 % du forfait | Alerte avec le bilan et le lien de recharge |
| Recharge avant la fin des 30 jours | Les entreprises restantes sont reportées, avec 10 % en plus |
| Forfait terminé | 7 jours de grâce : plus de nouveaux envois, l'agent continue de répondre aux conversations en cours |
| Après la grâce | WhatsApp et les réseaux sont débranchés. Les entreprises restantes sont gelées et reviennent à la prochaine recharge |

---

## 15 — Ce qu'on teste avant d'ouvrir

1. Le parcours complet, par le site web et par le formulaire
2. La connexion et la déconnexion de chaque type de compte
3. Un envoi réel vers nos propres comptes, sur chaque canal
4. Chaque type de réponse d'un prospect, jouée à la main
5. Chaque type de décision, sur le tableau de bord et sur WhatsApp
6. Le client qui répond lui-même depuis son téléphone : l'agent doit se taire
7. L'essai gratuit de bout en bout, puis le forfait : paiement, décompte, report, fin de forfait, comptes débranchés
8. Tout le parcours sur un petit Android avec une connexion lente
9. Djeli prospecte pour Djeli : la première vraie campagne
