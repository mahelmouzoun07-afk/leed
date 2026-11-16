# Chantier 7 : la connexion des comptes (Unipile)

*17 novembre 2026. L'essai gratuit d'Unipile a commencé le 17 novembre : il dure 7 jours, donc jusqu'au **24 novembre 2026**. Les tests de `UNIPILE.md` §7 doivent tenir dans cette fenêtre. Chaque compte connecté compte dans la facture (nos comptes de test aussi).*

## Ce qui est construit

| Élément | Où | Rôle |
|---|---|---|
| Interface unique des canaux | `src/lib/canaux/types.ts` | Le reste de leed ne parle jamais à Unipile, seulement à `FournisseurCanaux` |
| Client Unipile | `src/lib/canaux/unipile.ts` | Seul fichier qui connaît les routes d'Unipile. La clé reste sur le serveur |
| Règles pures | `src/lib/canaux/regles.ts` | États, signature du lien de retour, lecture des messages automatiques |
| Opérations | `src/lib/canaux/service.ts` | Brancher, retour de connexion, états, débrancher, fin de forfait, synchronisation |
| Webhooks | `src/app/api/webhooks/unipile/route.ts` et `.../compte/route.ts` | État des comptes et réponses reçues ; retour après la connexion |
| Base | `supabase/migrations/20261117180000_comptes_unipile.sql` | Liens de connexion, limites, états, messages reçus |
| Espace client | `/app/comptes`, `/app/comptes/connecter/<canal>` | Connecter, rebrancher, débrancher, avertissement avant la connexion |
| Espace équipe | `/admin/unipile` | État de la connexion, comptes facturés, webhooks, test d'envoi à soi-même |

## Les règles de sécurité

1. **Le client paie avant de brancher** : sans forfait payant en cours (l'essai gratuit n'en est pas un), la base refuse. C'est la base qui décide, pas l'écran.
2. **La limite de comptes du forfait** s'applique (1, 2, 3, puis tous). Un compte « à rebrancher » ou « suspendu » compte encore : il coûte chez Unipile.
3. **Le retour d'Unipile est contrôlé trois fois** : une adresse signée (HMAC), un lien connu, récent et jamais utilisé, et un compte relu chez Unipile avec notre clé. Un faux appel ne crée rien.
4. **Un compte refusé au retour est supprimé chez Unipile** : sinon il serait facturé pour rien.
5. **Les messages automatiques** portent un en-tête secret (`Unipile-Auth`), comparé en temps constant. Unipile réessaie 5 fois : tout est rejouable sans effet double.
6. **Le contenu des messages n'est jamais gardé** à ce stade. Seul un événement « réponse reçue » est noté (les conversations viennent au chantier 9).
7. **Débrancher** supprime d'abord chez Unipile, puis marque débranché. Si Unipile ne répond pas, rien ne change et on peut réessayer.
8. **L'identifiant de compte Unipile ne sort jamais vers le navigateur** : un test automatique parcourt le code pour le vérifier.
9. **Avertissement avant la connexion** : texte écrit (WhatsApp : voie non officielle de Meta, risque de limitation), case à cocher obligatoire, acceptation inscrite au journal.

## Les tests à faire pendant l'essai (dans l'ordre)

Tout se fait depuis le site, sans toucher à une clé.

1. **Vérifier la connexion.** Connectez-vous à l'espace équipe, ouvrez **Unipile** (menu, ou « Plus » sur téléphone). Les 4 variables doivent être « posées » et la carte « Comptes connectés chez Unipile » doit s'afficher sans erreur. Sinon, le message dit quoi corriger.
2. **Déclarer les webhooks.** Bouton « Déclarer les webhooks chez Unipile ». Deux webhooks doivent être créés (`messaging` et `account_status`). **Si l'un est refusé, le message d'Unipile s'affiche : copiez-le-moi.**
3. **Avoir un forfait payant.** Pour brancher, votre entreprise de test doit avoir un forfait payant. Le plus simple : dans « Codes promo », créez un code à **100 %** avec un plafond de 25 000 FCFA, puis appliquez-le dans **Forfait, Recharger**. Vous obtenez un forfait payant avec **tous les comptes** et rien à payer.
4. **Connecter WhatsApp.** Espace client, **Comptes**, WhatsApp, « Connecter », lisez l'avertissement, cochez, continuez : vous arrivez chez Unipile. Scannez le QR code avec votre téléphone (WhatsApp, Appareils connectés). Au retour, le compte apparaît dans la liste.
5. **Envoyer un message à vous-même.** Page Unipile de l'équipe, « Test d'envoi », depuis ce compte, vers **votre propre numéro** (un second numéro, ou un proche de confiance à qui vous avez demandé). Vérifiez qu'il arrive.
6. **Recevoir la réponse.** Répondez-y depuis l'autre téléphone. Dans « Événements récents », une ligne « réponse reçue » doit apparaître : c'est la preuve que les webhooks arrivent.
7. **Gmail.** Connectez une boîte Gmail (Comptes, Email). Test d'envoi par email vers votre autre adresse. Notez si l'agenda est lisible (non testé ici : à vérifier dans le tableau de bord Unipile).
8. **Instagram et Facebook.** Essayez de connecter. **Facebook peut échouer** (voir plus bas) : notez ce qui se passe.
9. **Détection d'une déconnexion.** Sur votre téléphone, WhatsApp, Appareils connectés, déconnectez l'appareil. Dans quelques minutes, le compte doit passer à « À rebrancher » (événement « statut »), et l'espace client doit le dire.
10. **Débrancher.** Dans l'espace client, « Débrancher ce compte ». Vérifiez dans la page Unipile qu'il a disparu de la liste.
11. **La facture.** Dans le tableau de bord Unipile, notez ce qui est facturé après ces tests. Pensez à **débrancher tous vos comptes de test avant la fin de l'essai** si vous ne voulez pas payer.

Notez les résultats dans `docs/UNIPILE.md`, section 8.

## Ce qui n'est pas vérifié (à confirmer par ces tests)

La documentation d'Unipile ne précise pas tout. Ces points ont été écrits d'après elle et **n'ont pas été essayés** :

- **Facebook** : le type de compte que nous demandons est `MESSENGER`. La page de tarifs d'Unipile annonce Messenger « bientôt » : la connexion peut être refusée.
- **Nom de la source des webhooks d'état** : nous envoyons `account_status`. Si Unipile le refuse, le message de l'étape 2 donnera le bon nom.
- **Envoi par email** : nous appelons `POST /api/v1/emails`. À confirmer au test de l'étape 7.
- **Identifiant WhatsApp** : `22997000000@s.whatsapp.net`. Pour le Bénin, essayez aussi la forme avec « 01 » (`2290197000000@...`) : le plan de numérotation a changé fin 2024.
- **Le retour de la connexion** (notify_url) : Unipile l'envoie en POST, d'après nos lectures. Si le compte n'apparaît pas chez nous après la connexion, le message d'erreur de la page Unipile ou le journal du site le dira.
- **Instagram, Facebook, LinkedIn** : l'envoi d'un premier message demande l'identifiant du destinataire chez le fournisseur (pas son numéro). Ce n'est pas encore construit : c'est le sujet du chantier 8.
- **Les limites d'envoi** (10 messages le premier jour, +5 par jour, 40 au maximum) sont décrites dans `UNIPILE.md` mais **pas encore appliquées** : elles viennent au chantier 8, avant tout envoi réel à des prospects.
- **Débrancher automatiquement à la fin du forfait** : la fonction existe (bouton « Débrancher les comptes sans forfait »). Elle n'est pas encore lancée toute seule chaque jour : à brancher sur une tâche planifiée au chantier 8.
- **À écrire à Unipile, par écrit** : leur position sur la prospection à froid (risque n° 4 de `UNIPILE.md`). C'est un point à régler avant le lancement.
