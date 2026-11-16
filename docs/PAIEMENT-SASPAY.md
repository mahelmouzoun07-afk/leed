# Le paiement Mobile Money avec SasPay

*Chantier 10, 17 novembre 2026. La spécification de SasPay fait foi : `https://docs.saspay.me/api-reference/openapi.json` (et `/llms.txt`). On n'invente ni route, ni champ, ni statut.*

## Décisions

- **Prestataire** : SasPay (`PAIEMENT_PRESTATAIRE=saspay`).
- **Mode réel** : la clé est une clé `sk_live_…` : les paiements sont de vrais paiements. Le code choisit tout seul le bac à sable pour une clé `sk_test_…` et le service réel pour toute autre clé.
- **Frais à notre charge** (`fee_charge_mode: DEDUCTED`) : le client paie exactement le montant qu'il a choisi. Nos frais du mois sont inscrits dans les coûts du client (écran « Coûts et marges » de l'équipe).
- **Opérateurs** : tous ceux que SasPay propose dans le pays du client, lus à la volée (`GET /networks/`, gardés 10 minutes en mémoire). Un opérateur est rattaché à un pays par la fin de son code (`mtn_bj` → Bénin, `wave_sn` → Sénégal).
- **Pas de remboursement automatique** : il n'y en a pas dans l'API. Un remboursement se fait à la main depuis le tableau de bord SasPay.
- **Zone FCFA seulement** : XOF (Bénin, Côte d'Ivoire, Sénégal, Togo, Mali, Burkina Faso, Niger, Guinée-Bissau) et XAF (Cameroun, Gabon, Congo, Tchad, Centrafrique, Guinée équatoriale). Un autre pays reçoit un message clair.
- **Garde-fous** : de 5 000 à 500 000 FCFA par paiement ; 6 tentatives de paiement par heure et par entreprise.

## Le trajet d'un paiement

1. Le client choisit un montant (curseur), un opérateur et le numéro de son compte Mobile Money (`/app/forfait/recharger`).
2. Le serveur crée un paiement **« en attente »** dans notre base, puis appelle `POST /payments/softpay/` avec une clé d'idempotence égale à l'identifiant du paiement (un même paiement rejoué ne débite pas deux fois).
3. Si SasPay renvoie une adresse de paiement (Wave, Orange Money, carte), on y redirige le client. Sinon la demande part sur son téléphone et il est emmené sur la page de suivi (`/app/forfait/paiement/<id>`).
4. La **confirmation** vient de deux côtés, qui appellent la même fonction `confirmerPaiement` : le message automatique de SasPay (`/api/webhooks/saspay`) et la page de suivi du client (toutes les 4 secondes, 10 minutes). L'équipe peut aussi cliquer sur « Revérifier » (écran Paiements).
5. `confirmerPaiement` **interroge SasPay** (`GET /payments/<id>/verify/`) et ne livre que sur **`SUCCESS`**, avec le **montant encaissé égal au montant attendu**. Elle ouvre alors le forfait par `acheter_forfait` (report, bonus de fidélité, bonus après essai), une seule fois (contrôle d'unicité dans la base).
6. `PENDING` : rien n'est livré. `FAILED` ou `CANCELLED` : le paiement passe en « échoué ». Un montant différent : refus et alerte dans les journaux.

Le montant crédité vient **toujours de notre base**, jamais du client ni du contenu d'un message reçu.

## Le message automatique (webhook)

- Adresse à déclarer dans le tableau de bord SasPay (Développeur, Webhooks) : `https://leed-nine.vercel.app/api/webhooks/saspay` (remplacer par le nom de domaine définitif le moment venu).
- Événements utiles : `transaction.success`, `transaction.failed`, `transaction.cancelled`.
- Vérifications, dans l'ordre : horodatage à moins de 300 secondes, puis signature HMAC SHA-256 de `horodatage.corps` sur le **corps brut**, comparée en temps constant. Un message invalide reçoit 401. Le contenu du message sert seulement à retrouver le paiement : son état est ensuite vérifié auprès de SasPay.
- Le traitement est rejouable : un événement livré plusieurs fois ne crée pas plusieurs forfaits.

## Variables d'environnement

| Variable | Où | Rôle |
|---|---|---|
| `SASPAY_API_KEY` | `.env.local` et Vercel | Clé API (`sk_live_…`). Jamais dans le navigateur, un journal ou le dépôt |
| `SASPAY_WEBHOOK_SECRET` | `.env.local` et Vercel | Secret de signature des messages (affiché une seule fois à la création du webhook) |
| `PAIEMENT_PRESTATAIRE` | Vercel (déjà posée) et `.env.local` | `saspay` |
| `APP_URL` | `.env.local` et Vercel | Adresse publique du site |

Vérifier la configuration **sans dépenser un franc** (lecture seule) : `npm run paiement:verifier` (affiche si les clés sont là, leur type, et les opérateurs trouvés par pays, sans jamais montrer la clé).

## Premier essai en réel

La clé étant réelle, faites le premier essai vous-même avec le **montant minimum, 5 000 FCFA** : connectez-vous, ouvrez Forfait, Recharger, choisissez un opérateur, entrez votre numéro, validez sur votre téléphone. Vérifiez ensuite : la page de suivi passe à « Paiement reçu », le forfait apparaît (à 5 000 FCFA : 20 entreprises), et l'écran Paiements de l'équipe montre le paiement « Reçu » avec les frais dans « Coûts ». Dans le tableau de bord SasPay, l'événement `webhook.test` permet de contrôler la signature sans paiement.

## Ce qui n'est pas vérifié

- **Aucun appel réel à SasPay n'a été fait depuis ce code** : la clé est réelle et les secrets ne sont pas lisibles par l'assistant. Les tests automatiques (51) simulent SasPay : signature et âge des messages, montants en chaînes décimales, clé d'idempotence, SUCCESS, PENDING, FAILED, CANCELLED, montant différent, paiement rejoué, opérateur ou pays refusé.
- **Format exact de la réponse de `GET /networks/`** : la spécification donne `code`, `name`, `is_active` ; le code accepte une réponse paginée ou une liste simple. À confirmer avec `npm run paiement:verifier`.
- **Codes d'opérateurs et numéros** acceptés par SasPay par pays : lus à la volée ; si un opérateur est affiché mais refusé, le client reçoit « L'opérateur a refusé la demande ».
- **Orange Money Côte d'Ivoire et Burkina Faso** : SasPay exige un code à usage unique ; le champ existe, non testé.
- **Confirmation par code après la demande** (`/payments/<id>/confirm-otp/`) : non implémentée (aucun cas connu pour nos opérateurs).
- **Réessayer** un paiement échoué (`/payments/<id>/retry/`) : non implémenté ; le client en crée un nouveau.
