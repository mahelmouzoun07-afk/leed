# Les documents de Djeli

## Ce qui fait foi (14 novembre 2026)

| Document | Ce qu'il contient |
|---|---|
| **[VISION.md](VISION.md)** | Pourquoi Djeli, pour qui, les canaux, les décisions |
| **[UNIPILE.md](UNIPILE.md)** | L'API qui donne accès à WhatsApp, Instagram, Facebook et LinkedIn : capacités, prix, risques, tests à faire |
| **[BASE-DE-DONNEES.md](BASE-DE-DONNEES.md)** | Schéma de référence — **à construire plus tard**, après validation des écrans |
| **[OFFRE-ET-PRIX.md](OFFRE-ET-PRIX.md)** | L'essai gratuit, les forfaits, les prix, ce qu'on gagne, et la question de l'API Gmail |
| **[PARCOURS.md](PARCOURS.md)** | Le parcours du visiteur et du client, écran par écran |
| **[TABLEAU-DE-BORD.md](TABLEAU-DE-BORD.md)** | Le tableau de bord : croquis de chaque page, tout ce que le client peut voir, modifier, ajouter |
| **[PLAN-V2.md](PLAN-V2.md)** | L'ordre de construction, et ce qu'on reprend du clone d'Explee |
| **[IDENTITE.md](IDENTITE.md)** | Le nouveau nom proposé (Koko), le logo, les couleurs, les animations, et les outils de design vérifiés |
| **[INTERDITS.md](INTERDITS.md)** | Ce que l'agent ne dit jamais et ne fait jamais |
| **[sources/REGISTRE-DES-SOURCES.md](sources/REGISTRE-DES-SOURCES.md)** | Les sources de données de l'annuaire et leurs licences |

Commence par `VISION.md`, puis `PARCOURS.md` et `TABLEAU-DE-BORD.md`.

**État du projet : phase de plan.** On ne code rien tant que ces documents ne sont pas validés. Le code actuel du dossier (`src/`, `supabase/`, `tests/`) est mis de côté : on repart du clone d'Explee.

## Historique — à ne plus suivre

Ces documents racontent l'état du projet avant le passage à Unipile et aux forfaits. Ils restent pour mémoire.

| Document | Pourquoi il est dépassé |
|---|---|
| `PLAN.md` | Écrit autour de l'API Meta officielle, des numéros Djeli mutualisés et des appels par IA |
| `SQUELETTE.md` | Les étapes 0, 12, 13, 14 et 20 sont périmées par Unipile |
| `MODELE-ECONOMIQUE.md` | Contient les calculs détaillés, utiles, mais son barème est remplacé par celui de `VISION.md` §7 |
| `harness/` | La méthode par modules numérotés. Les modules 01 à 04 sont faits ; la suite est abandonnée au profit des 8 chantiers de `PLAN-V2.md` |
| `SQUELETTE.md` étape 14, `PLAN.md` « Appels de prospection par IA » | Les appels sont retirés du produit |

## Le clone d'Explee

Il est dans `C:\Users\HP\Desktop\explee\app` (projet « prospra-site »). Ce qu'on en reprend fichier par fichier est détaillé dans **[PLAN-V2.md](PLAN-V2.md) §1.B**. Les captures d'écran de référence sont dans `explee\checks\full\`.
