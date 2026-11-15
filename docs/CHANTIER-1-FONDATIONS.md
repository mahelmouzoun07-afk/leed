# Chantier 1 — Fondations : où on en est

*Mis à jour le 16 novembre 2026.*

## Fait

| Étape | État |
|---|---|
| Le site (page d'accueil leed, format d'Explee) | ✅ sur la branche `leed-site` |
| La maquette des 42 écrans | ✅ publiée et dans `docs/maquette/leed.html` |
| Base technique reprise du module 04 : lecture des variables d'environnement, clients Supabase (serveur, navigateur, admin), proxy de session | ✅ écrite dans `src/lib/` et `src/proxy.ts`, adaptée à la v2 |
| Le site se lance **sans** Supabase configuré | ✅ (le proxy laisse passer, et bloque seulement `/app` et `/admin`) |
| Coût d'un projet Supabase | ✅ vérifié : **0 FCFA par mois** (offre gratuite) |

## Décisions prises dans ce chantier

1. **Deux espaces, deux préfixes** : `/app/...` pour le client, `/admin/...` pour l'équipe. Une règle par espace dans le proxy. Le proxy ne vérifie que « connecté ou non » : le rôle administrateur est revérifié côté serveur, page par page (chantier 4).
2. **On retire `cacheComponents` et `partialPrefetching`** de `next.config.ts`. Ces options, ajoutées à la création du projet, obligent chaque page qui lit l'adresse ou la session à être enveloppée dans un bloc d'attente. Les pages reprises d'Explee n'ont pas été écrites ainsi.
3. **On développe sur Supabase en ligne, pas en local.** Le disque C: est plein et Docker ne s'est jamais terminé de télécharger.
4. **Les types de la base** ne sont pas ajoutés maintenant : ils viennent avec le schéma, au chantier 3.

## Reste à faire

| # | Étape | Qui | Bloqué par |
|---|---|---|---|
| 1 | Vérifier que `npm run build` passe | moi | en cours |
| 2 | Créer le projet Supabase `leed-dev` (région Paris, 0 FCFA) | moi | un blocage temporaire du vérificateur de sécurité de Claude Code, à relancer |
| 3 | Fusionner `leed-site` dans `main` | moi, avec ton accord | l'étape 1 |
| 4 | Relier le dépôt GitHub à Vercel | moi | le compte Vercel n'a aucune équipe : à créer ou à confirmer (compte personnel) |
| 5 | Choisir et acheter le nom de domaine | **toi** | — |
| 6 | Libérer de la place sur C: | **toi** | — |
| 7 | Renommer le dossier en `leed` | **toi**, session fermée | voir `CHANTIERS.md`, annexe |
| 8 | Créer le fichier `.env.local` avec les clés Supabase | **toi** | l'étape 2 |

## Comment remplir `.env.local` (étape 8)

Le fichier se crée à la racine du projet (même endroit que `package.json`). **Il ne part jamais sur GitHub** (il est ignoré par git) et **tu ne colles jamais son contenu dans une conversation**.

Une fois le projet Supabase créé, je te donne l'adresse du projet et la clé publique (« anon », conçue pour être publique). **La clé « service_role » est secrète : tu la prends toi-même** sur supabase.com → ton projet → Settings → API Keys.

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=la_clé_publique
SUPABASE_SERVICE_ROLE_KEY=la_clé_secrète
APP_URL=http://localhost:3000
```

Les autres variables arrivent chantier par chantier : Resend (4), Anthropic (6), Trigger.dev (6 et 8), Unipile (7), Groq (9), FedaPay (10). Elles sont déjà prévues dans `src/lib/env.ts`, toutes facultatives tant que le chantier qui s'en sert n'est pas commencé.

## Terminé quand

Un envoi sur `main` met le site à jour en ligne, et le site se connecte à la base.
