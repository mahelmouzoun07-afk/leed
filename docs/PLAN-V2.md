# Comment on construit Djeli

*Plan du 14 novembre 2026 (corrigé le même jour). **On est en phase de plan : rien ne se code tant que la vision, le parcours et le tableau de bord ne sont pas validés.***

---

## 1. La décision

**On repart de la base d'Explee.** Le code Djeli écrit jusqu'ici (modules 01 à 04 : fondations, schéma, crédits, authentification) est **mis de côté**. On ne le supprime pas — il reste dans git sur la branche `module-04` — mais on ne construit plus dessus.

Le point de départ est le clone : `C:\Users\HP\Desktop\explee\app` (projet « prospra-site », Next.js 16 + React 19 + Tailwind 4).

On garde d'Explee **le parcours et l'architecture des écrans**, et on les modifie pour ce que nous voulons faire :

| On garde d'Explee | On change |
|---|---|
| L'entrée par l'adresse du site | + le formulaire de description pour ceux qui n'ont pas de site |
| L'analyse en direct en 3 étapes | Le contenu, en français |
| Les profils de clients avec une note | — |
| L'aperçu avant inscription | + la répartition « par où les joindre » |
| Les 6 cartes du pipeline | Le texte des cartes |
| Le curseur de budget | En FCFA, en « entreprises contactées » |
| — | **+ la connexion des comptes du client** (Explee n'a pas ça) |
| Paiement par carte en dollars | Essai gratuit par email, puis forfait au montant libre en Mobile Money |
| Email seulement, depuis les boîtes d'Explee | WhatsApp, email, Instagram, Facebook, LinkedIn, **depuis les comptes du client** |
| 20 témoignages et des chiffres | Supprimés tant qu'ils ne sont pas vrais |

---

## 2. Ce que contient vraiment le clone

**Important à savoir : le clone est le site public d'Explee, pas son application.** Il contient la vitrine et le début du parcours. Il ne contient **ni tableau de bord, ni comptes utilisateurs, ni base de données, ni envoi de messages**. Ces parties-là, on les construit nous-mêmes, dans le même style visuel.

| Dans le clone | État | Ce qu'on en fait |
|---|---|---|
| Page d'accueil (`Hero`, `Pipeline`, `Features`) | ✅ Complet | Reprendre, traduire, rhabiller aux couleurs Djeli |
| Parcours de démarrage (`start/StartFlow.tsx`) | ⚠️ Une animation avec de fausses données | Reprendre l'écran, le brancher sur une vraie analyse |
| Explorateur de segments (`tools/explorer/`) | ⚠️ Faux chiffres générés au hasard | Devient notre aperçu réel |
| Tarifs (`pricing/`) et curseur de budget | ✅ Complet | Passer au forfait au montant libre en FCFA |
| Fenêtre de paiement (`Overlays.tsx`) | ⚠️ Décor, ne paie rien | Brancher sur Mobile Money |
| Pages catalogue (`b2b-database/`, `gm-dataset/`) | ✅ Mise en page | Pour l'annuaire, plus tard |
| Pages légales, support, à propos, affiliation | ✅ Mise en page | Réécrire le contenu |
| Système visuel (`globals.css`, `ui.tsx`) | ✅ Complet | La base de tout notre design, y compris du tableau de bord |
| Témoignages et statistiques (`data.ts`) | ❌ Inventés | Supprimer |
| Page `autogtm/` | ❌ Sans objet | Supprimer |
| **Tableau de bord** | ❌ **N'existe pas** | À construire (`TABLEAU-DE-BORD.md`) |
| **Inscription, connexion** | ❌ **N'existe pas** | À construire |
| **Connexion des comptes (Unipile)** | ❌ **N'existe pas** | À construire |
| **Base de données, API** | ❌ **N'existe pas** | À construire, plus tard |

---

## 3. Les étapes

### Étape A — Le plan *(on y est)*
Valider les documents : `VISION.md`, `PARCOURS.md`, `TABLEAU-DE-BORD.md`. Répondre aux questions ouvertes. **Aucun code.**

### Étape B — Vérifier Unipile *(une matinée, dès que tu donnes la clé)*
Brancher un vrai compte de chaque type, envoyer un message à nous-mêmes, recevoir la réponse. Ce test dit ce qui marche vraiment (Messenger ? Facebook ?) avant qu'on dessine quoi que ce soit de définitif. Détail dans `UNIPILE.md` §7.

### Étape B bis — Lancer la vérification Google *(à démarrer tôt, plusieurs semaines d'attente)*
Pour envoyer des emails depuis le Gmail de nos clients, Google doit vérifier notre application. C'est gratuit mais long, et il faut un site public en ligne avec sa politique de confidentialité. Tant que ce n'est pas fait : 100 utilisateurs au maximum. Détail dans `OFFRE-ET-PRIX.md` §7.

### Étape C — Le site et le parcours, en maquette cliquable
À partir du clone : la page d'accueil Djeli, puis tout le parcours des écrans 1 à 11, puis le tableau de bord — **avec des données d'exemple**, sans base de données. Tu peux cliquer partout, voir chaque écran sur ton téléphone, et corriger avant qu'on branche quoi que ce soit.

C'est l'intérêt de repartir du clone : on voit le produit entier très vite, et on ne construit la mécanique que sur des écrans déjà validés.

### Étape D — La base de données
Seulement une fois les écrans validés : on sait alors exactement ce qu'il faut stocker. Le schéma de référence est prêt dans `BASE-DE-DONNEES.md`, à ajuster à ce moment-là.

### Étape E — Brancher le vrai
Dans cet ordre : comptes et inscription → connexion des comptes via Unipile → analyse de l'activité par l'IA → recherche de prospects et de coordonnées → rédaction et envoi → réponses et décisions → rapports → essai gratuit, forfaits et Mobile Money.

### Étape F — Tests et ouverture
Les tests de `PARCOURS.md` §15, puis Djeli prospecte pour Djeli.

---

## 4. Ce qu'on a abandonné

- Le code Djeli actuel comme base (gardé en archive dans git)
- La méthode par modules de `docs/harness/`
- Les numéros WhatsApp et les boîtes email appartenant à Djeli : on écrit depuis les comptes du client
- Les appels par IA et les SMS
- La prospection vers les particuliers : B2B seulement pour l'instant
- L'entrée par page Facebook ou Instagram : site web ou formulaire seulement

---

## 5. Les trois risques à garder en tête

| Risque | Ce qu'on fait |
|---|---|
| **Le compte WhatsApp d'un client est limité ou suspendu** parce que l'agent a trop écrit | 40 nouveaux messages par jour au maximum, montée progressive, messages vraiment personnels, arrêt au premier signe d'alerte, avertissement clair au client |
| **On ne trouve pas assez de prospects, ou pas leurs coordonnées** | C'est le vrai travail de fond : notre base de données d'entreprises africaines. On ouvre d'abord sur quelques villes et secteurs où elle est bonne |
| **Le coût d'Unipile** : ~3 300 FCFA par mois et par compte connecté au-delà de 10 comptes | Le client paie avant de connecter ; l'essai gratuit passe par l'API Gmail gratuite ; les comptes sont débranchés à la fin du forfait ; le nombre de comptes par client reste à trancher (`OFFRE-ET-PRIX.md` §3) |

---

## 6. Ce que j'attends de toi

1. **Lire `TABLEAU-DE-BORD.md`** et me dire ce qui manque, ce qui est en trop, ce qu'il faut changer
2. **Lire `PARCOURS.md`** et valider l'ordre des écrans — surtout la connexion des comptes avant le paiement
3. **Me donner la clé Unipile** quand tu veux que je lance les tests de l'étape B
