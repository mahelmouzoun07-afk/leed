# Collecter les données de l'annuaire, source par source

*Guide du 16 novembre 2026, tiré de `docs/sources/REGISTRE-DES-SOURCES.md`. Pour chaque source : ce que vous faites seul, puis ce que je ferai ensuite.*

## Les règles de la collecte (à lire une fois)

1. **Un dossier par source**, sur le disque **D:** (le disque C: est plein), **hors du projet** : `D:\leed-donnees\<code-de-la-source>\`. Les données ne vont **jamais** dans le dépôt GitHub (il est public).
2. **Ne modifiez jamais un fichier téléchargé**, ne le triez pas, ne l'ouvrez pas dans Excel pour l'enregistrer (Excel abîme les numéros de téléphone et les accents). Gardez l'original tel quel.
3. **Dans chaque dossier, un fichier `LISEZ-MOI.txt`** avec 4 lignes : l'adresse de la page d'où vient le fichier, la date de téléchargement, la version ou date de publication indiquée sur la page, la licence ou les conditions d'utilisation (copiez la phrase de la page). Sans cela, je ne pourrai pas prouver qu'on a le droit de s'en servir, ni retirer la source si sa licence change.
4. **Aucune source rouge** (🔴) : pas de robot, pas de copie en masse. Pour celles-là, seules des demandes écrites sont utiles (voir §6).
5. **En cas de doute sur les conditions d'une page, n'extrayez rien** : notez l'adresse dans un fichier `A-VERIFIER.txt` et dites-le-moi.
6. **Ordre conseillé** : faites d'abord le §1 (priorité A). Le rapport de mesure du chantier 5 dira ensuite quelles autres sources valent la peine.

---

## 1. Priorité A : les sources ouvertes et gratuites (vague 1)

### 1.1 Overture Maps (lieux du monde entier, filtrés sur nos pays)
- **Licence** : CDLA Permissive 2.0 (usage commercial permis). **Ce qu'on garde** : tout (nom, catégorie, adresse, position, téléphone, site, réseaux, score de confiance).
- **Ce que vous faites** (sur D:, dans une invite de commandes) :
  1. Installer l'outil, une fois : `pip install overturemaps`
  2. Créer le dossier : `mkdir D:\leed-donnees\overture`
  3. Télécharger un pays à la fois (le rectangle est : ouest, sud, est, nord) :
     - Bénin : `overturemaps download --bbox=0.77,6.23,3.85,12.42 -f geoparquet --type=place -o D:\leed-donnees\overture\benin.parquet`
     - Sénégal : `overturemaps download --bbox=-17.60,12.30,-11.30,16.70 -f geoparquet --type=place -o D:\leed-donnees\overture\senegal.parquet`
     - Côte d'Ivoire : `overturemaps download --bbox=-8.65,4.30,-2.45,10.80 -f geoparquet --type=place -o D:\leed-donnees\overture\cote-ivoire.parquet`
     - Togo : `overturemaps download --bbox=-0.20,6.05,1.85,11.20 -f geoparquet --type=place -o D:\leed-donnees\overture\togo.parquet`
  4. Noter dans `LISEZ-MOI.txt` la version : l'outil prend la dernière publication. La version courante se lit sur https://stac.overturemaps.org/catalog.json (champ `latest`).
- **Attention** : un rectangle déborde sur les pays voisins (par exemple le Togo et le Ghana). Ce n'est pas grave : je filtre par pays ensuite.
- **Taille attendue** : de quelques dizaines à quelques centaines de Mo par pays.
- **Ensuite, je fais** : lecture des fichiers, filtre par pays et par confiance (au moins 0,4), nettoyage des noms, des téléphones et des catégories, chargement dans l'annuaire avec la provenance.

### 1.2 OpenStreetMap (extraits Geofabrik, pays par pays)
- **Licence** : ODbL. Obligation : mentionner « © contributeurs OpenStreetMap », et pouvoir isoler les données OSM si on publie une base qui en dérive.
- **Ce que vous faites** : télécharger depuis https://download.geofabrik.de/africa.html, dans `D:\leed-donnees\osm\` :
  - `africa/benin-latest.osm.pbf` (environ 46 Mo)
  - `africa/senegal-and-gambia-latest.osm.pbf` (environ 100 Mo ; le Sénégal est regroupé avec la Gambie)
  - `africa/ivory-coast-latest.osm.pbf` (environ 81 Mo)
  - `africa/togo-latest.osm.pbf` (environ 59 Mo)
- **Ne rien convertir.** Notez la date du fichier dans `LISEZ-MOI.txt` (elle est affichée sur la page à côté du lien).
- **Ensuite, je fais** : extraction des commerces, bureaux, restaurants, pharmacies, écoles, hôtels, etc. ; rapprochement avec Overture.

### 1.3 GLEIF (identifiants LEI des entreprises)
- **Licence** : CC0 (libre). **Ce qu'on garde** : LEI, nom légal, forme juridique, statut, adresses, maison mère et filiales. Il y en a peu pour l'Afrique de l'Ouest (surtout des banques et grands groupes), mais ils sont fiables.
- **Ce que vous faites** :
  1. Ouvrir https://www.gleif.org/en/lei-data/gleif-golden-copy/download-the-golden-copy
  2. Cocher la case d'acceptation de la politique de confidentialité.
  3. Télécharger le **Golden Copy niveau 1 (« LEI-CDF »)** au format **CSV** (fichier zip). Si plusieurs versions du jour sont proposées, prenez la plus récente.
  4. Télécharger aussi le fichier des **relations (« RR-CDF », niveau 2)**, au format CSV.
  5. Les déposer dans `D:\leed-donnees\gleif\`, sans les décompresser.
- **Taille attendue** : plusieurs centaines de Mo compressés.
- **Ensuite, je fais** : filtre sur nos pays, chargement, liens entre sociétés mères et filiales.

### 1.4 Wikidata (entreprises connues, avec site et réseaux)
- **Licence** : CC0 (libre).
- **Ce que vous faites** : aucun programme à installer.
  1. Ouvrir https://query.wikidata.org
  2. Coller la requête ci-dessous (elle est pour le **Bénin** ; pour les autres pays, remplacez `wd:Q962` : Sénégal `wd:Q1041`, Côte d'Ivoire `wd:Q1008`, Togo `wd:Q945`).
  3. Cliquer sur le bouton de lancement, attendre le résultat.
  4. Cliquer sur **Download**, choisir **CSV**, et enregistrer dans `D:\leed-donnees\wikidata\benin.csv` (puis `senegal.csv`, etc.).

```sparql
SELECT ?item ?itemLabel ?site ?creation ?siegeLabel ?lei ?facebook ?instagram WHERE {
  ?item wdt:P31/wdt:P279* wd:Q4830453 .
  ?item wdt:P17 wd:Q962 .
  OPTIONAL { ?item wdt:P856 ?site }
  OPTIONAL { ?item wdt:P571 ?creation }
  OPTIONAL { ?item wdt:P159 ?siege }
  OPTIONAL { ?item wdt:P1278 ?lei }
  OPTIONAL { ?item wdt:P2013 ?facebook }
  OPTIONAL { ?item wdt:P2003 ?instagram }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "fr,en". }
}
```
- Si le site répond « délai dépassé » (timeout), relancez en ajoutant `LIMIT 5000` à la fin.
- **Ensuite, je fais** : rapprochement avec les autres sources par site et par LEI.

---

## 2. Priorité B : à faire seulement si vous avez une bonne connexion Wi-Fi

### 2.1 Foursquare OS Places
- **Licence** : Apache 2.0. **Particularité** : l'accès demande un compte gratuit sur Hugging Face et l'acceptation des conditions. Les fichiers du monde entier pèsent environ **263 Go** : il ne faut **pas** tout télécharger.
- **Ce que vous faites** : seulement la préparation. Je ferai le filtrage par pays avec vous ensuite.
  1. Créer un compte sur https://huggingface.co (gratuit, sans carte bancaire).
  2. Ouvrir https://huggingface.co/datasets/foursquare/fsq-os-places, se connecter, cocher la case d'acceptation des conditions.
  3. Dans les réglages du compte, créer un **jeton d'accès en lecture** (« Access Tokens »). Gardez-le pour vous : ne le collez pas dans le chat, mettez-le dans un fichier `D:\leed-donnees\foursquare\jeton.txt`.
- **Ensuite, je fais** : le filtrage à distance sur nos quatre pays, pour ne télécharger que quelques Go au lieu de 263 Go. Comme cette source recoupe en partie Overture, je vous propose de la traiter **après** la première mesure.

### 2.2 Overpass (OpenStreetMap, à la demande)
- Rien à faire de votre côté : je l'utiliserai plus tard pour combler une ville mal couverte, avec une requête toutes les 10 secondes au plus.

### 2.3 Google Places
- Rien à faire. On ne garde que l'identifiant du lieu (`place_id`). Il faudrait un compte Google Cloud avec carte bancaire : on le reporte.

---

## 3. Vague 2 : l'identité légale (registres, guichets uniques)

**Ce que vous faites : des demandes écrites.** Ces portails n'ont pas tous des conditions claires pour un usage automatisé. Il faut demander un accès ou une convention. **Je peux rédiger les lettres** (une par organisme) : dites-moi simplement « rédige les lettres ».

| Source | Quoi faire sans moi | Pourquoi |
|---|---|---|
| Portail RCCM de l'OHADA | Chercher « RCCM OHADA portail de recherche ». Lire ses conditions d'utilisation. Envoyer une demande de convention d'accès | Numéro RCCM, forme, statut, siège |
| APIEx (Bénin) | Chercher le guichet unique de l'entreprise du Bénin. Demander les publications de créations d'entreprises et une convention | Créations d'entreprises, RCCM, IFU |
| CEPICI (Côte d'Ivoire) | Même démarche | Créations d'entreprises |
| APIX (Sénégal) | Même démarche | Créations d'entreprises |
| Guichets des autres pays | Plus tard | |
| Journaux officiels | Si vous trouvez des numéros publics en PDF (annonces légales), les déposer dans `D:\leed-donnees\journaux-officiels\` avec le `LISEZ-MOI.txt` | Créations, modifications, dissolutions |
| Répertoires statistiques (IFU, NINEA, NCC) | Chercher s'il existe un fichier public. **S'il est nominatif et non public, ne rien prendre** | Souvent agrégé seulement |
| CAC (Nigeria), ORC (Ghana) | Plus tard | |
| OpenCorporates | Rien : l'usage commercial demande une licence payante | |

**Ensuite, je fais** : lire chaque fichier ou document reçu, le rapprocher des fiches de l'annuaire, enregistrer la provenance.

---

## 4. Vague 3 : les listes officielles par secteur (PDF, Excel ou pages web)

**Ce que vous faites** pour chaque ligne : chercher la liste sur le site de l'organisme, la **télécharger telle quelle** (PDF ou Excel), la déposer dans `D:\leed-donnees\<code>\` avec son `LISEZ-MOI.txt`. Si la liste n'existe qu'en page web, enregistrez la page en PDF (impression, « Enregistrer au format PDF »). Ne recopiez rien à la main.

| Code (dossier) | Quoi chercher | Secteur |
|---|---|---|
| `bceao_banques` | Liste des banques et établissements financiers agréés, sur le site de la BCEAO | Banque |
| `bceao_sfd` | Liste des systèmes financiers décentralisés (microfinance), BCEAO et ministères des Finances | Microfinance |
| `cima_assurances` | Liste des sociétés d'assurance agréées, CIMA et directions nationales des assurances | Assurance |
| `regulateurs_telecom` | Opérateurs et fournisseurs Internet agréés : ARCEP (Bénin), ARTCI (Côte d'Ivoire), ARTP (Sénégal) | Télécoms |
| `sante_etablissements` | Liste des cliniques, laboratoires et hôpitaux privés, ministères de la Santé | Santé |
| `ordres_pharmaciens` | Liste des officines, Ordres des pharmaciens | Pharmacie |
| `education_agrees` | Écoles, universités et centres de formation agréés, ministères de l'Éducation et de l'Enseignement supérieur | Éducation |
| `tourisme_agrees` | Agences de voyage et hôtels classés, ministères du Tourisme | Tourisme |
| `transport_logistique` | Transitaires agréés : ports autonomes, douanes, fédérations | Logistique |
| `immobilier_agrees` | Agences et promoteurs agréés | Immobilier |
| `cooperatives` | Registres des coopératives, ministères de l'Agriculture | Coopératives |
| `ordres_professionnels` | Experts-comptables, avocats, architectes, médecins. **Ce sont des personnes** : ne téléchargez que si la liste est publique, et je ne garderai que le cabinet | Professions libérales |
| `open_data_nationaux` | Portails de données ouvertes des États : chercher « données ouvertes » + nom du pays, et vérifier la licence de chaque jeu | Divers |

**Marchés, bourses et réseaux d'affaires**

| Code | Quoi faire sans moi |
|---|---|
| `bourses` | Télécharger la liste des sociétés cotées : BRVM (Afrique de l'Ouest), NGX (Nigeria), GSE (Ghana) |
| `chambres_patronats` | Chambres de commerce, patronats (CCI, CGECI, CNP, CNES…) : télécharger les **listes de membres publiées**, si elles le sont. Vérifier liste par liste |
| `salons` | Catalogues d'exposants publiés de salons et foires. Vérifier événement par événement |
| `marches_publics_nationaux` | Portails des marchés publics (ARMP Bénin, ARMP/DCMP Sénégal, ANRMP Côte d'Ivoire) : noter l'adresse et les conditions d'utilisation dans `A-VERIFIER.txt`, **ne pas aspirer** |
| `bad_marches`, `ungm_attributions` | Avis d'attribution publics seulement. Dites-moi lesquels vous trouvez, je verrai |
| `banque_mondiale_contrats` | **Rien à faire** : j'utilise leur interface publique |
| `douanes` | Seulement les statistiques officielles publiées. Aucune liste nominative |

**Ensuite, je fais** : l'outil d'import de documents. Il extrait chaque liste, vous la montre pour relecture (un humain valide), puis la rapproche de l'annuaire.

---

## 5. Vagues 4 et 5 : l'empreinte web et les réseaux sociaux

**Presque rien à faire de votre côté**, c'est du code que j'écrirai plus tard : Certificate Transparency (nouveaux sites en `.bj`, `.sn`, `.ci`, `.tg`), liste Tranco, Common Crawl, RDAP (date de création du domaine seulement), lecture polie des sites des entreprises (contacts génériques, lien WhatsApp), détection de technologies, App Store.

À prévoir plus tard (pas maintenant) :
- Une clé **Chrome UX Report** et une clé **YouTube Data API** : elles passent par Google Cloud, donc par la carte bancaire. On les reporte.
- **Instagram Business Discovery** et **Pages Facebook** : demandent la validation d'une application par Meta. Plus tard.
- Les 🔴 (LinkedIn, TikTok, Meta Ad Library, Google Ads Transparency, CZDS, Google Play) : aucun robot. Seul le lien trouvé sur le site de l'entreprise est gardé.

---

## 6. Annuaires, petites annonces, marketplaces, emploi, startups (🔴 / 🟡)

Leurs conditions interdisent presque toujours la copie en masse : **aucun robot, aucun téléchargement**. La seule chose utile est une **demande de partenariat ou de licence** par écrit. Les cibles :
- Annuaires : Kompass, Africa Business Pages, Go Africa Online, Pages Jaunes, Telecontact, Cylex, Brabys, BusinessList.
- Petites annonces : CoinAfrique, Expat-Dakar, Jiji.
- Marketplaces : Jumia, Glovo, Yango Deli, TripAdvisor, Booking (programmes partenaires officiels).
- Emploi : ReKrute, Emploi.sn, Educarriere, Novojob, Jobberman, BrighterMonday (flux officiels).
- Startups : Briter Bridges, Crunchbase, Africa: The Big Deal (licence payante, plus tard).
- Incubateurs : si un incubateur publie son portefeuille d'entreprises, déposez la page en PDF dans `D:\leed-donnees\incubateurs\`.

Je peux rédiger les lettres de demande si vous voulez.

---

## 7. Statistiques (pour mesurer les marchés, jamais pour contacter)

- **Banque mondiale (WDI)** : rien à faire, j'utilise l'API publique.
- **Instituts statistiques** (INStaD Bénin, ANSD Sénégal, INS Côte d'Ivoire) : télécharger les publications de **population et d'activité par région et par ville** (PDF ou Excel), dans `D:\leed-donnees\stats\`.
- **Statistiques des régulateurs télécoms** : télécharger les rapports d'abonnés mobile et Internet.
- **Rapports payants** (GSMA, DataReportal, Statista) : ne rien copier en bloc ; si vous voulez citer un chiffre, notez-le avec sa source.

---

## 8. Nos propres sources (vague 6)

Rien à collecter maintenant : l'inscription gratuite d'une entreprise, les imports de clients, les ambassadeurs, les partenaires, les formulaires de particuliers et le parrainage viendront avec le produit.

---

## 9. Ce qu'on ne fait jamais, quelle que soit la source

- Acheter ou récupérer des listes de numéros de particuliers.
- Copier en masse un site dont les conditions l'interdisent.
- Garder des données Google autres que le `place_id`.
- Garder les contacts personnels issus du WHOIS.
- Garder des données sensibles (pièce d'identité, santé, religion, position précise d'une personne).

## 10. Quand vous avez fini

Dites-moi **quels dossiers sont prêts** (par exemple : `overture`, `osm`, `gleif`, `wikidata`). Je commence par vérifier les fichiers et les `LISEZ-MOI.txt`, puis je construis le moteur de chargement et le premier rapport de mesure. Pour le chargement, il faudra le mot de passe de la base Supabase dans un fichier privé : je vous guiderai à ce moment-là.
