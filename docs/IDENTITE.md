# L'identité visuelle : Koko

*Proposition du 14 novembre 2026. Remplace l'identité « Djeli » (indigo, safran, bulle à trois ondes). À valider par Mahel.*

## Le nom : Koko

En Afrique de l'Ouest, on ne frappe pas à une porte : on dit **« ko ko ko »**. C'est exactement ce que fait le produit : il s'annonce poliment à la porte des futurs clients, à la place de son utilisateur.

- Deux syllabes identiques : on le retient sans effort, on l'écrit sans faute
- Se prononce pareil en français, en anglais et dans les langues locales
- Donne tout de suite la phrase de marque : **« On frappe aux portes à votre place. »**

**Non vérifié** : la disponibilité du nom (marque à l'OAPI, nom de domaine, comptes sur les réseaux). Des sociétés portent déjà ce nom dans d'autres secteurs (par exemple KOKO Networks, énergie, au Kenya). À vérifier avant toute décision définitive.

Noms écartés : *Kola* (déjà pris par Kola Market, un outil de vente par WhatsApp pour petits commerces au Ghana, trop proche), *Cauri* et *Kora* (fintechs connues), *Hibou* (mauvais présage dans plusieurs cultures de la région).

## Le logo

Une **porte en arche** avec **deux points** à hauteur de main.

- Les deux points sont les deux coups frappés : « ko, ko »
- Ils font aussi deux yeux : la porte devient un petit personnage, reconnaissable même en très petit
- Le mot « koko » s'écrit en minuscules, en Unbounded, dont les « o » très ronds répondent aux deux points
- Animation : les deux points battent l'un après l'autre, comme deux coups

## Les couleurs

L'idée : **la nuit, et la lumière derrière la porte.** Le client dort, Koko travaille, et au matin il y a de la lumière.

| Nom | Valeur | Usage |
|---|---|---|
| Nuit | `#1A0E26` | Fonds sombres (haut de la page d'accueil, pied de page), texte |
| Prune | `#5B2A86` | Couleur de marque : liens, accents, étapes actives |
| Mangue | `#FFB627` | L'action : boutons principaux, la porte sur fond sombre |
| Lilas | `#F1E9F9` | Fonds teintés, pastilles |
| Craie | `#FBFAFC` | Fond général |
| Baobab | `#1E8E5A` | Réussite : rendez-vous, compte en bonne santé |

## Les polices

| Rôle | Police |
|---|---|
| Marque et grands chiffres | Unbounded |
| Titres | Sora |
| Texte | Figtree |

## Le mouvement

Le site bouge, mais chaque mouvement raconte quelque chose :

- La porte qui frappe, avec les « ko ko ko » qui s'envolent
- Une vraie conversation WhatsApp qui se déroule seule dans un téléphone, jusqu'au rendez-vous
- Le mot qui tourne dans le titre : WhatsApp, email, Instagram, LinkedIn, Facebook
- Un ciel de nuit qui scintille derrière le titre
- Un ruban de secteurs qui défile
- Les six étapes qui s'enchaînent toutes seules, avec leur barre de progression
- Les chiffres qui comptent, les blocs qui montent à l'écran en défilant, les barres qui se remplissent
- Un reflet qui passe sur le bouton principal
- Chaque page du tableau de bord entre en cascade

Tout s'arrête pour les personnes qui ont demandé moins d'animations dans les réglages de leur téléphone.

## Les images

La maquette n'utilise **aucune photo** : toutes les images sont dessinées dans la page (porte, téléphone, aperçus du produit). Pour de vraies photos — des commerçants, des lieux — il faudra les fournir ou les faire produire.

## Les outils de design : ce qui est réellement disponible

| Dépôt | Verdict après vérification |
|---|---|
| **anthropics/skills** | **Déjà installé** sur cette machine (`~/.claude/plugins/marketplaces/anthropic-agent-skills`) : `frontend-design`, `canvas-design`, `theme-factory`, `brand-guidelines`, `algorithmic-art`, `web-artifacts-builder`. Rien à ajouter. `frontend-design` a été utilisé pour cette refonte |
| **lucide** | **Déjà disponible** : `lucide-react` 1.70.0 est dans `node_modules` du projet. Utilisable dès qu'on code le vrai site |
| **penpot** | Application de design complète, **non installée**. Elle ne s'ajoute pas comme une compétence : il faudrait un compte Penpot, son extension ouverte dans le navigateur et un serveur de liaison. Utile seulement si Mahel veut retoucher les maquettes à la main |
| **logocreator** | Application web, **non installée**. Elle exige une clé payante Together AI pour générer les images. Sans clé, rien ne fonctionne |
| **remotion** | Création de vidéos en code, **non installé**. Utile plus tard pour une vidéo de présentation ; licence payante pour les sociétés de plus de 3 personnes |

Compétences par spécialité, parmi celles déjà présentes : direction artistique → `frontend-design`, `canvas-design` · identité et thèmes → `theme-factory`, `design-system-creation` · mouvement → `motion`, `interaction-design`, `auto-animate` · icônes → Lucide.
