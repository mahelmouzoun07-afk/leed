# Chantier 6 : l'intelligence de l'agent, avec une IA gratuite

*17 novembre 2026. Décision : pas de clé Anthropic pour l'instant (pas de budget). L'agent tourne sur un modèle ouvert et gratuit, derrière une « coquille » qui permet de changer de moteur sans réécrire le produit.*

## Le principe

Tout leed parle à un petit contrat, `ClientIA` (`src/lib/ia/client.ts`), jamais à un fournisseur précis. Le moteur se change avec trois variables d'environnement :

| Variable | Rôle | Valeur par défaut |
|---|---|---|
| `GROQ_API_KEY` (ou `IA_CLE_API`) | La clé du service | aucune : sans clé, le site garde ses exemples factices |
| `IA_URL_BASE` | L'adresse d'un service compatible « OpenAI » | `https://api.groq.com/openai/v1` |
| `IA_MODELE_FORT` | Le modèle qui rédige et synthétise | `llama-3.3-70b-versatile` |
| `IA_MODELE_RAPIDE` | Le modèle qui lit vite | `llama-3.1-8b-instant` |

Passer plus tard à Claude, à OpenRouter, à Gemini ou à Mistral revient à changer ces valeurs (pour Claude, via son adresse compatible), sans toucher au code.

## Un modèle gratuit « qui agit comme Claude »

On ne forme pas le modèle (ce serait long et coûteux). On l'encadre, et c'est ce qui le rend fiable dans notre domaine :
- **Des prompts précis**, un par tâche, versionnés (`src/lib/ia/prompts.ts`) : le modèle ne sait que ce qu'on lui donne, laisse vide ce qu'il ne trouve pas, et traite le texte d'un site comme une donnée, jamais comme un ordre.
- **Une sortie en JSON vérifiée** (`json.ts`, `schemas.ts`) : si le petit modèle se trompe de forme, on lui montre son erreur et on réessaie une fois ; sinon l'étape échoue proprement.
- **Le code décide, l'IA propose** (`controles.ts`) : longueur, pas de lien dans le premier message, pas de faux « RE: », pas de faux souvenir, pas de pression ni de promesse, aucun chiffre qui ne vient pas de la fiche du client, aucun prénom inconnu.
- **Une seconde passe** relit le message avec la liste de `INTERDITS.md`. Un message refusé est bloqué, jamais corrigé en silence.
- **Une accroche précise ou pas de message** : sans fait précis sur le prospect, on n'écrit pas.
- **Le canal est choisi en code** (`canal.ts`), selon `VISION.md` §5, puis corrigé par les taux de réponse mesurés quand l'échantillon est solide.

## Ce qui est branché maintenant

Le parcours « décrire son activité » (`/demarrer`) utilise la vraie IA : lecture du site puis fiche, questions, profils de clients idéaux (`src/lib/parcours/actions.ts`). L'écran « Concurrents » ne s'affiche que s'ils sont cités sur le site : l'IA n'en devine jamais.
Le choix de l'offre et la recherche d'entreprises restent des exemples jusqu'au chantier 5 (annuaire).

## Le lecteur de sites (`lecteur.ts`)

Le visiteur choisit l'adresse : c'est un point d'attaque classique. Protections : seulement http et https, ports 80 et 443, aucune adresse interne ou privée (vérifiée au moment même de la connexion, donc un nom qui change de cible ne passe pas), redirections revérifiées une à une, délai de 8 secondes, 600 Ko au plus, seulement du texte, `robots.txt` respecté. 38 cas d'adresses sont testés.

## Les limites du gratuit, et ce qu'on fait

- **Quota de Groq** : environ 1 000 demandes et 200 000 jetons par jour pour un gros modèle (à confirmer dans votre compte). leed limite chaque visiteur à 8 analyses par heure et l'ensemble du site à 400 par jour ; au-delà, un message honnête.
- **Confidentialité** : Groq ne conserve pas les données par défaut (journalisation de sécurité possible jusqu'à 30 jours, désactivable dans Data Controls). C'est le point à vérifier avant de prendre un autre service gratuit : certains (dont l'offre gratuite de Google Gemini) peuvent utiliser les échanges pour s'entraîner, ce qui n'est pas acceptable pour les données de nos clients.
- **Qualité** : un modèle gratuit écrit moins bien qu'un gros modèle payant. Le critère de fin du chantier reste : sur 20 vrais sites, l'analyse est juste ; sur 20 prospects de test, chaque message est soit validé et personnel, soit bloqué avec une raison claire. Cela se juge avec la vraie clé.
- **Coût** : 0 FCFA par appel aujourd'hui. Les jetons consommés sont écrits dans le journal pour mesurer le coût réel le jour où l'on passe à un modèle payant.

## Vérifier sans rien dépenser

```
npm run ia:verifier
```

Lit `.env.local`, vérifie que la clé est acceptée et que les deux modèles existent. N'affiche jamais la clé.

## Pas encore fait dans ce chantier

- **Cache de 30 jours de l'analyse d'un prospect** (table `analyses_prospects`) et **style validé par le client** : prêts côté prompts (`exemplesStyle`), à brancher avec l'annuaire (chantier 5) et l'envoi (chantier 8).
- **Écran admin « messages bloqués »** : les raisons sont déjà produites (`raisons`), l'écran vient avec le chantier 8.
- **Tâches de fond (Trigger.dev)** : inutiles tant qu'une analyse tient dans une requête ; à ajouter avec les campagnes.
- **Qualité sur de vrais sites** : à mesurer avec la clé Groq.
