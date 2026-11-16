# Chantier 5 : l'annuaire des entreprises (vague 1)

*17 novembre 2026. Ce document est le rapport de mesure demandé par `CHANTIERS.md` (étape 3 : « mesurer avant de continuer ») et le mode d'emploi du chargement.*

## 1. Ce qui a été collecté, et vérifié

Les 10 fichiers de `D:\leed-donnees` ont été revérifiés : taille et empreinte SHA-256 identiques au `MANIFESTE.csv`. Chaque source a son `LISEZ-MOI.txt` (licence copiée de la page, version, empreintes).

| Source | Licence | Contenu | Utilisation |
|---|---|---|---|
| Overture Maps (version 2026-10-21.0) | CDLA Permissive 2.0 (et Apache 2.0 / CC0 selon le contributeur) | 124 111 lieux uniques, **dont 75 311 hors de nos 4 pays** | **Chargé** |
| OpenStreetMap (Geofabrik, 15 nov. 2026) | ODbL 1.0, mention « © contributeurs OpenStreetMap » | 84 102 entreprises nommées | **Chargé** (4 401 nouvelles avec contact) |
| GLEIF Golden Copy (16 nov. 2026) | CC0 | 3 495 364 entités dans le monde, **116 dans nos 4 pays** | **Pas chargé** (voir §4) |
| Wikidata | CC0 | en attente de la panne du service (voir §5) | À faire |

**Point d'attention sur Overture.** Le fichier « Bénin » contient 77 715 lieux, mais **70 933 sont au Nigeria** : le rectangle de téléchargement déborde. Le pays est donc lu dans l'adresse de chaque lieu, jamais déduit du fichier. L'outil officiel `overturemaps` avait échoué en réseau ; la collecte a utilisé une requête DuckDB sur le même dépôt officiel (même version, même schéma), ce qui est écrit dans le `LISEZ-MOI.txt`.

## 2. Ce qu'on garde d'Overture

Règles (script `scripts/annuaire/preparer_overture.py`) :
- pays lu dans l'adresse (Bénin, Sénégal, Côte d'Ivoire, Togo) ;
- un lieu présent dans deux fichiers n'est gardé qu'une fois ;
- confiance d'au moins 0,4 ;
- **seulement des entreprises** : sont écartés les rivières, églises, sites historiques, administrations, parcs, stades, gares et aéroports (9 182 lieux), ainsi que les jeux d'argent et le contenu pour adultes (activités refusées, `INTERDITS.md`) ;
- au moins une voie de contact **valide** ; les numéros sont validés avec libphonenumber (3 669 numéros invalides retirés, par exemple un numéro étranger sur une fiche béninoise).

Résultat : **25 190 entreprises**.

| Pays | Entreprises |
|---|---|
| Côte d'Ivoire | 11 643 |
| Sénégal | 7 737 |
| Bénin | 3 180 |
| Togo | 2 630 |

| Contact | Part |
|---|---|
| Numéro de téléphone valide | 72 % (18 093) |
| dont mobile (WhatsApp probable) | 55 % (13 963) |
| Site web | 52 % (13 018) |
| Email | 62 % (15 580) |
| Page de réseau social | 97 % (24 456) |

Grands secteurs : Commerce 3 781, Restauration 3 588, Éducation et formation 2 983, Hôtellerie 2 247, Services aux entreprises 2 046, Santé 1 403, Finance et assurance 1 065. Au total 21 secteurs, liste fermée dans `src/lib/annuaire/secteurs.ts`.

## 3. Ce qu'on ajoute d'OpenStreetMap

OpenStreetMap contient beaucoup d'entreprises nommées (84 102, dont 24 290 commerces et 14 208 restaurants) mais **presque aucune n'a un contact : 4 756 seulement (5,7 %)**. Sans moyen de contact, une entreprise ne sert pas à l'agent ; elles ne sont donc pas chargées.

- 2 047 entreprises d'OpenStreetMap sont déjà dans Overture (à moins de 150 m, nom proche). Elles ne sont pas ajoutées deux fois.
- **4 401 nouvelles entreprises avec contact** : Togo 1 815, Sénégal 1 472, Côte d'Ivoire 903, Bénin 211.
- 1 391 points de la **Gambie** ont été écartés : la frontière a été retrouvée dans le fichier lui-même (le fichier du Sénégal contient aussi la Gambie).

**Total à charger : 29 591 entreprises** (Côte d'Ivoire 12 546, Sénégal 9 209, Togo 4 445, Bénin 3 391), dont 15 707 à Cotonou, Dakar ou Abidjan.

Réponse à la question « Restaurants à Cotonou » : environ 340 entreprises dans Overture, avec la part qui a un contact.

## 4. Pourquoi GLEIF n'est pas chargé

GLEIF ne compte que **116 entités** dans nos 4 pays (Côte d'Ivoire 52, Sénégal 34, Togo 22, Bénin 8), presque toutes des banques et des groupes, **sans téléphone, site ni email**. Charger ces lignes comme prospects gonflerait le nombre affiché sans qu'on puisse les contacter. GLEIF servira plutôt à **l'identité légale** (numéro de registre, forme juridique) quand on fera la vague 2 ; 89 des 116 ont déjà un numéro de registre. Les données préparées sont dans `D:\leed-donnees\_prepare\gleif_annuaire.jsonl`.

## 5. Wikidata

Le service était en panne le jour de la collecte. Il répond de nouveau : la récupération a été relancée (voir le journal de collecte). Wikidata est secondaire : il aide à recouper les sites et les réseaux sociaux des entreprises connues.

## 6. Comment charger (à lancer par vous)

Les scripts sont dans `scripts/annuaire/`. Les données restent sur D:, jamais dans le dépôt (public). Le chargement utilise la clé de service de `.env.local`, qui n'est jamais affichée.

```
python scripts/annuaire/charger_annuaire.py --source overture --essai
python scripts/annuaire/charger_annuaire.py --source overture
python scripts/annuaire/charger_annuaire.py --source osm
python scripts/annuaire/charger_annuaire.py --retirer-exemples
```

- `--essai` compte sans rien écrire.
- On peut relancer sans risque : une entreprise déjà chargée est mise à jour, jamais dupliquée.
- `--retirer-exemples` supprime les 60 fausses entreprises « Exemple » laissées par le chantier 3.
- Pour tout régénérer : `preparer_overture.py`, `preparer_osm.py` (et `preparer_gleif.py`) relisent les fichiers sources sans les modifier.

**Retirer une source** (changement de licence) : la fonction `retirer_source_annuaire('nom')` supprime tout ce qui en vient et interdit de la recharger.

## 7. Ce qui change sur le site

L'aperçu du parcours (`/demarrer`) affiche maintenant **le vrai nombre d'entreprises** de l'annuaire (`apercu_annuaire`), pour le pays deviné (extension du site, ville citée) ou les quatre pays à défaut. Pour que cela marche, l'IA choisit pour chaque profil de client des secteurs **dans la liste fermée** ; les noms inventés sont retirés. Aucun nom d'entreprise ni coordonnée n'est montré avant l'inscription. Tant que l'annuaire n'est pas chargé (moins de 200 entreprises), le site garde ses exemples et la bannière le dit.

## 8. Ce qui n'est pas fait, ou pas vérifié

- **La précision des regroupements n'est pas mesurée.** Le critère « 95 % sur 200 fiches vérifiées à la main » demande un humain. Pour l'instant, deux lieux ne sont regroupés que s'ils sont à moins de 150 m avec un nom proche, et on préfère rater un regroupement que fusionner deux entreprises.
- **1 817 doublons probables** (même nom, même ville) existent à l'intérieur d'Overture : comptés, pas fusionnés.
- **Les mobiles marqués « WhatsApp probable »** sont des numéros de mobile, pas une confirmation que le compte WhatsApp existe : la vérification se fera à l'envoi (chantier 7).
- **Emails** : 68 % des emails (10 556 sur 15 580) viennent de fournisseurs grand public (gmail, yahoo, hotmail…). Ce sont souvent les adresses de propriétaires de petits commerces, donc des données potentiellement personnelles. Décision à prendre avec l'examen juridique du chantier 13 avant d'écrire par email.
- **La taille des entreprises** n'existe dans aucune source : elle reste vide.
- **Le temps de réponse** de « Restaurants à Cotonou » (moins d'une demi-seconde) sera mesuré après le chargement.
- **Cotonou : 3 180 entreprises au Bénin seulement.** Le Bénin est le pays le moins bien couvert (Overture n'y connaît que 6 066 lieux, dont beaucoup sans contact). C'est un point à retenir pour le lancement.
- Les vagues suivantes (identité légale, listes officielles, empreinte web) attendent vos demandes écrites et ce rapport.
