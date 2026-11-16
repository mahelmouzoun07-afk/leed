# Chantiers 11 et 12 : ce qui est construit, ce qui reste branché plus tard

*16 novembre 2026. Tous les écrans de la maquette pour le client (tableau de bord) et pour l'équipe leed (espace admin) existent en vraies pages. Ils lisent la vraie base ; ce qui dépend d'un chantier à venir est affiché honnêtement (désactivé ou « bientôt »), jamais avec des chiffres inventés.*

## Comment les voir

- **Espace client** : connectez-vous, puis ouvrez `/app`. Pour voir l'espace rempli avec les données fictives de Koffi (rien n'est enregistré), ouvrez **`/app/demo`** (ou « Plus », puis « Ouvrir la démonstration »). Un bandeau le rappelle, et « Voir mes vraies données » en sort.
- **Espace équipe** : `/admin/connexion`, puis la double authentification.
- **Développement seulement** : `/dev/app/<écran>` et `/dev/admin/<écran>` affichent chaque écran avec le jeu d'exemple, sans connexion. Ces adresses renvoient une 404 en production. `node scripts/apercus.cjs http://localhost:3100 app 390,1440` capture tous les écrans (téléphone et bureau) et signale toute erreur ou tout débordement horizontal.

## Espace client (chantier 11), 15 écrans de la maquette

| Écran | Adresse | Branché sur la base ? |
|---|---|---|
| Accueil | `/app` | Oui (décisions, semaine, forfait, canaux, pause de l'agent) |
| Décisions | `/app/decisions` | Oui, réponse par bouton (vérifiée côté serveur) |
| Prospects et fiche | `/app/prospects`, `/app/prospects/<id>` | Oui, filtres, note, « Ne plus contacter » ; noms masqués avant le premier message |
| Conversations | `/app/conversations`, `/app/conversations/<id>` | Oui, « Reprendre la main » |
| Campagnes, réglages d'une campagne | `/app/campagnes`, `/app/campagnes/<id>` | Oui, pause et reprise ; la modification de la cible attend l'annuaire |
| Simulateur | `/app/campagnes/nouvelle` | Calcul exact du nombre d'entreprises ; **aucune estimation de réponses tant que moins de 300 envois ont été mesurés** |
| Rapports | `/app/rapports` | Oui (chemin des prospects, argent) ; « ce que l'agent a appris » attend les envois |
| Comptes connectés | `/app/comptes` | Lecture oui ; « Connecter / Débrancher » attend le chantier 7 |
| Forfait, recharger | `/app/forfait`, `/app/forfait/recharger` | Lecture et historique oui ; **le paiement attend le chantier 10** (bouton désactivé) |
| Réglages (7 sous-pages) | `/app/reglages/...` | Signature, autonomie (3 niveaux et ligne par ligne), alertes, exclusions : enregistrés. Horaires et agenda : informatif |
| Plus, WhatsApp | `/app/plus`, `/app/whatsapp` | Page « bientôt » pour le pilotage par WhatsApp |

## Espace équipe (chantier 12), 9 écrans de la maquette + journal

Accueil « à traiter aujourd'hui », clients, fiche client, santé des comptes (avec estimation de la facture Unipile), annuaire et sources, messages bloqués, paiements, support (tickets avec réponse et résolution), coûts et marges, journal d'audit.

- L'équipe lit par des **fonctions SQL qui revérifient le rôle à chaque appel** (`admin_accueil`, `admin_clients`, `admin_client`, `admin_comptes`, `admin_annuaire`, `admin_messages_bloques`, `admin_paiements`, `admin_couts`, `admin_journal`). Elle ne lit **jamais le contenu des conversations d'un client**.
- Actions réelles, toutes inscrites dans le journal d'audit (immuable) : suspendre ou reprendre l'envoi d'un client, offrir des entreprises (administrateur seulement, pas le support), répondre à un ticket, le résoudre.
- Désactivés « bientôt » : revérifier ou annuler un paiement (chantier 10), relancer un client, confirmer ou infirmer un blocage de message (il manque l'état de relecture dans la base).

## Limites connues à reprendre plus tard

1. **Noms des entreprises non contactées** : l'application ne les envoie jamais à l'écran (testé). Mais un client techniquement habile pourrait les lire en appelant directement l'API de la base avec sa session. Pour les protéger au niveau de la base, il faudra une vue « mes prospects » qui masque le nom tant que l'entreprise n'est pas contactée, et retirer la lecture directe de la table `prospects`. À faire au chantier 13 (sécurité), avant l'ouverture.
2. **Alertes WhatsApp et pilotage par WhatsApp** : l'écran existe, la fonction attend la décision sur le numéro d'envoi des alertes et la connexion Unipile.
3. **Temps réel** (une décision répondue à un endroit disparaît de l'autre) : non fait ; la page se met à jour à chaque action.
4. **Rapports** : point du jour, bilan hebdomadaire et PDF mensuel non faits.
5. **Facture Unipile** : estimation sur le nombre de comptes du moment ; la vraie facture suit le pic du mois.
6. **Coûts par client** (Unipile, IA, frais de paiement) : l'écran lit `couts_par_client`, que les chantiers 6, 7 et 10 rempliront.
