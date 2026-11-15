# Unipile : ce que ça nous donne, ce que ça coûte, ce que ça risque

*Analyse du 14 novembre 2026. Chiffres relevés sur la page de tarifs officielle et la documentation développeur — à reconfirmer avant de fixer nos prix.*

---

## 1. Ce qu'est Unipile, en une phrase

Unipile est **une seule API qui parle à plusieurs messageries à la place de nous**. On branche le compte WhatsApp (ou Instagram, ou LinkedIn) d'un client une fois, et on peut ensuite lire ses conversations et envoyer des messages par de simples appels HTTP, sans écrire un connecteur différent pour chaque réseau.

C'est ce qui rend Djeli possible en quelques semaines au lieu de six mois.

---

## 2. Les canaux disponibles

| Canal | Disponible ? | Ce qu'on peut faire |
|---|---|---|
| **WhatsApp** | ✅ Oui | Lire et envoyer des messages, recevoir en temps réel |
| **LinkedIn** | ✅ Oui | Messages, invitations, lire un profil ou une page d'entreprise |
| **Instagram** | ✅ Oui | Messages privés |
| **Facebook** | ✅ Oui (marqué « nouveau ») | Messages |
| **Messenger** | ⏳ **Annoncé « bientôt »** | — |
| **Telegram** | ✅ Oui | Messages |
| **Email** (Gmail, Outlook, IMAP) | ✅ Oui | Lire et envoyer |
| **Agendas** (Google, Outlook) | ✅ Oui | Lire les créneaux libres, créer un rendez-vous |
| X (Twitter) | ⏳ Bientôt | — |

**Trois conséquences pour nous :**

1. **Messenger n'est pas prêt.** La page de tarifs le marque « bientôt », alors que « Facebook » est marqué disponible. Il faut tester avec notre clé laquelle des deux fonctionne réellement : c'est le **premier test technique à faire** (voir §7).
2. **L'agenda est inclus.** Une boîte Gmail connectée donne la boîte **et** l'agenda Google pour le prix d'un seul compte. Toute l'intégration Google Calendar prévue séparément dans l'ancien plan devient inutile : elle passe par Unipile.
3. **L'email ne coûte rien de plus.** Raison de plus pour le garder comme canal secondaire (décision n° 1 de `VISION.md`).

---

## 3. Le prix

Unipile ne facture **ni par message, ni par appel d'API**. Il facture **par compte branché et par mois**.

| Comptes branchés | Prix par compte / mois |
|---|---|
| Jusqu'à 10 | **49 € au total** (minimum, hors taxes) |
| 11 à 50 | 5,00 € |
| 51 à 200 | 4,50 € |
| 201 à 1 000 | 4,00 € |
| 1 001 à 5 000 | 3,50 € |
| Plus de 5 000 | 3,00 € |

- **Un compte** = une identité branchée : un numéro WhatsApp, *ou* un profil LinkedIn, *ou* un compte Instagram, *ou* une boîte email (l'agenda est compris avec).
- Facturation **à terme échu**, sur le **nombre maximum de comptes actifs en même temps** pendant chaque période de 30 jours.
- **Usage illimité** : aucun frais par message. Seules les limites des réseaux eux-mêmes s'appliquent.
- **Essai gratuit de 7 jours**, sans carte bancaire.

### Ce que ça veut dire en FCFA, pour nous

À 5 € le compte, soit **~3 280 FCFA par mois et par compte** (1 € = 655,957 FCFA) :

| Nombre de clients | Comptes (1 par client) | Coût Unipile / mois | En FCFA |
|---|---|---|---|
| 10 | 10 | 49 € | ~32 000 |
| 50 | 50 | 250 € | ~164 000 |
| 200 | 200 | 900 € | ~590 000 |
| 1 000 | 1 000 | 4 000 € | ~2 620 000 |

**C'est notre principale charge variable, et elle est liée au nombre de clients, pas au volume de messages.** D'où les deux règles de `VISION.md` : pack minimum à 10 000 FCFA, et débranchement automatique des comptes d'un client inactif depuis 30 jours.

### Le piège de la facturation au pic

On est facturé sur le **maximum** de comptes actifs simultanément sur 30 jours. Un client qui branche son compte, essaie trois jours et s'en va nous coûte un mois plein. **Décision du 14 novembre : le client paie avant de connecter un compte par Unipile.** L'essai gratuit, lui, passe par l'API Gmail en direct, qui ne nous coûte rien (voir `OFFRE-ET-PRIX.md` §7). Unipile n'est donc activé que pour un client qui a payé.

---

### Les 49 € sont un minimum, pas un tarif

De 1 à 10 comptes, on paie 49 € au total, qu'il y ait 1 compte ou 10. Connecter des comptes de proches pour « remplir » ne fait rien économiser : on paierait 49 € de toute façon, et chaque compte au-delà du dixième ajoute 5 €. Ce qui réduit vraiment la facture est listé dans `OFFRE-ET-PRIX.md` §2.

### Un compte, c'est une identité connectée — pas un client

Vérifié deux fois sur la page de tarifs et la documentation de facturation : Unipile facture **chaque compte connecté**. Un client qui connecte Gmail, WhatsApp et LinkedIn compte pour **3 comptes**. Leur propre exemple : 20 utilisateurs × 3 réseaux = 60 comptes. La facture retient le plus grand nombre de comptes connectés en même temps dans le mois, et les comptes de nos tests comptent aussi.

Conséquence sur l'offre : voir `OFFRE-ET-PRIX.md` §3.

### L'email : direct en essai, Unipile pour les clients payants

Décision du 14 novembre : pendant l'essai gratuit, l'email passe par l'API Gmail de Google en direct (envoi seul, adresse de réponse relais), ce qui ne nous coûte rien. Dès que le client paie, sa boîte est reconnectée par Unipile comme ses autres comptes : l'agent peut alors lire les réponses sur place et accéder à l'agenda. Une boîte email compte pour un compte Unipile.

---

## 4. Comment la connexion marche

Unipile relie **un compte qui existe déjà** et agit en son nom :

- **WhatsApp** : le client scanne un QR code ou saisit un code d'appariement, exactement comme quand il ouvre WhatsApp Web sur un ordinateur. Pas de vérification Meta Business, pas de modèle de message à faire valider, pas de délai.
- **LinkedIn, Instagram, Facebook** : le client se connecte avec ses identifiants, ou par un jeton de session.
- **Gmail / Outlook** : connexion Google ou Microsoft classique (OAuth).

Unipile garde la session ouverte et nous donne un `account_id` à utiliser dans tous nos appels. Côté Djeli, on stocke uniquement cet identifiant (table `comptes_connectes`) — **jamais un mot de passe, jamais un jeton de session**.

**Ce que le client doit comprendre au moment de brancher son compte**, écrit noir sur blanc dans l'écran de connexion :
> « Djeli écrira depuis votre compte WhatsApp, à votre nom. Vous voyez tous les messages dans votre application comme d'habitude. Vous pouvez débrancher Djeli à tout moment. »

---

## 5. Les risques, et ce qu'on fait pour les réduire

C'est la partie à lire deux fois.

### Risque n° 1 — Le compte du client peut être suspendu

La connexion WhatsApp d'Unipile passe par la même porte que WhatsApp Web. **Ce n'est pas la voie officielle de Meta** (l'API Cloud). Meta tolère l'usage normal, mais détecte et sanctionne l'envoi en masse à des inconnus. Les témoignages trouvés en ligne parlent de numéros bannis sans avertissement et sans recours, parfois en 48 heures, quand on envoie des messages froids en masse.

**Ces témoignages viennent surtout de concurrents d'Unipile, qui ont intérêt à exagérer. Je n'ai trouvé aucun chiffre mesuré, ni document officiel de Meta sur ce point précis.** Le risque est donc réel mais mal quantifié.

**Ce qu'on met en place — et ce n'est pas négociable :**

| Protection | Détail |
|---|---|
| **Montée progressive** | Un compte neuf : 10 messages le premier jour, +5 par jour, plafond à 40 par jour. Jamais plus. |
| **Plafond absolu** | 40 nouvelles conversations par jour et par compte, même si le client a 10 000 crédits |
| **Vraie personnalisation** | Chaque message cite un signal propre au prospect. Un message générique envoyé 200 fois est ce qui fait bannir. Le second passage de l'IA (`INTERDITS.md`) refuse tout message qui pourrait être envoyé tel quel à un autre prospect |
| **Sortie claire** | « Répondez STOP » dans chaque premier message, et STOP respecté à vie, pour tous les clients |
| **Horaires** | 8 h à 19 h heure du prospect, lundi au samedi, pas pendant la prière du vendredi, pas les jours fériés |
| **Surveillance** | État de chaque compte vérifié plusieurs fois par jour. Au premier signe (déconnexion, message refusé, chute de livraison) : envois suspendus sur ce compte et client prévenu |
| **Transparence totale** | Le client accepte un avertissement explicite avant de brancher son compte. On ne lui cache pas le risque |

### Risque n° 2 — LinkedIn est le plus sévère

LinkedIn limite fortement les invitations et les messages, et restreint les comptes qui automatisent. Plafonds à respecter : **20 invitations par semaine** et **30 messages par jour** maximum sur un compte neuf. LinkedIn sert donc aux grandes entreprises et aux prospects européens, en petit volume, jamais en masse.

### Risque n° 3 — On dépend d'un seul fournisseur

Si Unipile tombe, change ses prix ou perd un canal, Djeli s'arrête. **Mitigation** : toute la couche d'envoi passe par une seule interface interne (`src/lib/canaux/`) avec Unipile comme implémentation. Changer de fournisseur, ou ajouter l'API Cloud officielle de Meta plus tard pour les gros clients, ne doit toucher qu'un dossier.

### Risque n° 4 — Les conditions d'utilisation d'Unipile

Je n'ai pas pu lire leurs conditions sur ce point précis : **est-ce qu'Unipile autorise explicitement la prospection à froid ?** À vérifier avant de lancer, par écrit, auprès de leur équipe commerciale. C'est une question à leur poser directement, en même temps que la négociation du tarif au volume (au-delà de 50 comptes, les prix se négocient).

---

## 6. Ce que le passage à Unipile supprime du plan de novembre

Tout ceci devient inutile, et c'est une très bonne nouvelle pour le délai :

- ❌ 10 boîtes email à acheter et préchauffer pendant 2 à 3 semaines
- ❌ Compte Meta Business à faire vérifier
- ❌ Un numéro WhatsApp Djeli par pays
- ❌ Bibliothèque de modèles de messages WhatsApp à soumettre à Meta et faire valider
- ❌ Obtention de l'accord préalable du prospect avant tout message WhatsApp
- ❌ Numéros et noms d'expéditeur SMS à déclarer pays par pays
- ❌ Agrégateur SMS
- ❌ Compte ElevenLabs, Twilio, lignes SIP, appels par IA
- ❌ Intégration Google Calendar séparée (incluse dans Unipile)
- ❌ Tables `boites_envoi` et `numeros_djeli` dans la base

**Le chemin critique n'est plus Meta. C'est nous.**

Ce qui reste à faire en parallèle du développement : le prestataire Mobile Money, les pages légales, la déclaration APDP au Bénin, et le chargement de l'annuaire.

---

## 7. Les premiers tests à faire avec la clé API

À faire **avant d'écrire une ligne de code produit** — une matinée suffit, et le résultat détermine le reste :

1. **Brancher un compte WhatsApp personnel** par QR code et vérifier qu'on reçoit bien l'`account_id`
2. **Envoyer un message** à un de nos propres numéros, et vérifier qu'il arrive
3. **Recevoir** une réponse par webhook, en temps réel
4. **Tester Facebook et Messenger** : lequel des deux fonctionne vraiment avec notre clé ?
5. **Brancher un compte Instagram** et envoyer un message privé à un compte test
6. **Brancher une boîte Gmail** et vérifier qu'on voit bien l'agenda avec
7. **Lire un profil LinkedIn** et une page d'entreprise : quels champs on récupère exactement (c'est utile pour l'enrichissement de l'annuaire)
8. **Déconnecter** un compte et vérifier qu'on détecte proprement l'état « à rebrancher »
9. Vérifier **ce qui est facturé** sur le tableau de bord Unipile après ces tests

Résultat attendu : une note courte dans ce document, section 8, avec ce qui marche et ce qui ne marche pas.

---

## 8. Résultats des tests

*À remplir après les tests du §7.*

| Test | Résultat | Date | Note |
|---|---|---|---|
| WhatsApp — connexion QR | — | — | |
| WhatsApp — envoi | — | — | |
| WhatsApp — webhook de réception | — | — | |
| Facebook — envoi | — | — | |
| Messenger — disponible ? | — | — | |
| Instagram — envoi | — | — | |
| Gmail + agenda | — | — | |
| LinkedIn — lecture de profil | — | — | |
| Détection de déconnexion | — | — | |

---

## 9. Où la clé API est rangée

La clé ne va **jamais** dans le code, jamais dans un fichier suivi par git, jamais dans une variable visible par le navigateur.

```
UNIPILE_DSN=            # l'adresse de ton instance, ex. api8.unipile.com:13843
UNIPILE_API_KEY=        # la clé — serveur uniquement, jamais NEXT_PUBLIC_
UNIPILE_WEBHOOK_SECRET= # pour vérifier que les webhooks viennent bien d'Unipile
```

Ces trois lignes sont à ajouter dans `.env.example` (sans valeurs) et dans `.env.local` (avec les vraies valeurs, fichier jamais commité). En production : variables d'environnement Vercel.

**Prochaine action pour toi** : donne-moi la clé et le DSN, je les mets dans `.env.local` et je lance les tests du §7.

---

## Sources

- [Tarifs Unipile](https://www.unipile.com/pricing/)
- [Documentation développeur Unipile](https://developer.unipile.com/docs/getting-started)
- [Documentation de l'API WhatsApp d'Unipile](https://www.unipile.com/whatsapp-api-documentation/)
- [Fournisseurs d'API WhatsApp : Cloud API, BSP ou compte connecté](https://www.unipile.com/whatsapp-api-providers/)
- [API officielle contre non officielle : laquelle utiliser et quand](https://nicochat.com/en/blog/official-vs-unofficial-whatsapp-api)
- [QR ou Cloud API pour l'automatisation WhatsApp](https://quick.bot/blog/whatsapp-qr-vs-cloud-api)
- [Unipile : tarifs réels à l'échelle (analyse tierce)](https://bereach.ai/tool-comparison/unipile-linkedin-api-pricing)
- [Revue Unipile 2026 : fonctions, limites et points bloquants (analyse tierce)](https://www.swarmhit.com/blog/unipile-review)
