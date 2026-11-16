# Chantier 4 : ce qu'il reste à régler à la main

Le code des comptes est en place et testé (inscription, connexion, lien magique, mot de passe oublié, espace équipe). Pour qu'il marche pour de vrai, quelques réglages se font dans les tableaux de bord de Supabase et de Vercel, que le code ne peut pas faire à votre place. **Aucun secret ne se colle dans une conversation ni dans le dépôt** (il est public).

## 1. Variables d'environnement

| Variable | Où | État |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.local` et Vercel | Faite dans `.env.local`. **À ajouter dans Vercel** (Project leed → Settings → Environment Variables), sans la cocher « exposée au navigateur » |
| `RESEND_API_KEY` | `.env.local` et Vercel | Faite dans `.env.local`. **À ajouter dans Vercel** |
| `APP_URL` | `.env.local` et Vercel | Faite (`http://localhost:3000` en local, `https://leed-nine.vercel.app` en production) |
| `NEXT_PUBLIC_GOOGLE_ACTIF` | `.env.local` et Vercel | **Ne pas la définir** tant que Google n'est pas branché : le bouton Google reste grisé (« bientôt »). Mettre `true` pour l'activer |

## 2. Réglages dans Supabase (projet `leed-dev`)

1. **Authentication → URL Configuration**
   - Site URL : `https://leed-nine.vercel.app`
   - Redirect URLs : `http://localhost:3000/**` et `https://leed-nine.vercel.app/**`
2. **Authentication → Sign In / Providers → Email**
   - « Confirm email » : activé.
   - Longueur minimale du mot de passe : 8. Exigences : minuscules, majuscules, chiffres et symboles.
3. **Authentication → Multi-Factor** : activer TOTP (application d'authentification).
4. **Authentication → Emails → Templates** : coller le contenu de `supabase/templates/` dans trois modèles :

   | Modèle Supabase | Fichier | Objet suggéré |
   |---|---|---|
   | Confirm sign up | `confirmation.html` | Confirmez votre adresse email |
   | Magic Link | `magic-link.html` | Votre lien de connexion à leed |
   | Reset Password | `recovery.html` | Changez votre mot de passe leed |

   Les liens passent par `/auth/confirmer` : ils marchent même s'ils sont ouverts sur un autre appareil que celui de l'inscription.
5. **Authentication → Emails → SMTP Settings** : activer le SMTP personnalisé avec Resend.
   - Host `smtp.resend.com`, port `465`, utilisateur `resend`, mot de passe = votre clé d'API Resend.
   - Expéditeur : `onboarding@resend.dev`, nom « leed » (adresse de test de Resend).
   - **Limite** : tant qu'aucun domaine n'est vérifié chez Resend, les emails ne partent qu'**à l'adresse de votre propre compte Resend**. C'est suffisant pour tester seul. Pour écrire à de vrais clients, il faudra acheter et vérifier un domaine.
   - Sans SMTP personnalisé, Supabase n'envoie qu'aux membres de votre équipe Supabase et très peu d'emails par heure.

## 3. Créer votre compte administrateur

1. Sur le site, créez un compte normalement (page d'inscription) avec **votre** adresse, et confirmez-la par le lien reçu.
2. Dites-moi cette adresse : j'ajoute la ligne dans la table `administrateurs`, rôle « admin ». (Ou, dans l'éditeur SQL de Supabase : `insert into administrateurs (profil_id, role) select id, 'admin' from auth.users where email = 'votre@adresse';`)
3. Allez sur `/admin/connexion`, connectez-vous : la page de vérification affiche un QR code. Scannez-le avec Google Authenticator (ou équivalent), entrez le code à 6 chiffres. Aux connexions suivantes, seul le code est demandé.
4. Un client qui ouvre une page `/admin` reçoit une page 404 : il ne sait pas que l'espace existe.

## 4. La connexion Google sans carte bancaire

Google Cloud demande souvent une carte pour « activer l'essai », mais **la connexion Google d'un site n'utilise aucun service payant**. Deux voies :
- **Essayer sans activer l'essai gratuit** : dans la console, créer le projet puis aller directement dans « API et services → Identifiants » et « Écran de consentement OAuth ». Si Google bloque, passer à la voie suivante.
- **Reporter Google** : le site fonctionne très bien avec l'adresse email + mot de passe et le lien magique. Le code Google est prêt ; il suffira plus tard de renseigner l'identifiant et le secret dans Supabase (Authentication → Providers → Google) et de définir `NEXT_PUBLIC_GOOGLE_ACTIF=true`.

Adresse de redirection à déclarer chez Google : `https://diokrocywkstuyzkwjac.supabase.co/auth/v1/callback`.

## 5. Ce qui a été vérifié, et ce qui ne l'a pas été

Vérifié : 20 tests automatiques (aucun message ne révèle si une adresse existe, règles du mot de passe, adresses de retour sûres) ; test SQL de la création de l'entreprise ; protection des pages (`/app`, `/admin`, `/choisir`… renvoient vers la connexion) ; le formulaire de connexion et celui du mot de passe oublié répondent avec la vraie base et la clé de service.

**Pas vérifié de bout en bout** : l'inscription réelle avec l'email de confirmation, le lien magique, la double authentification et l'espace admin avec un vrai compte. Cela demande les réglages ci-dessus (SMTP, modèles, confirmation) et un vrai compte. L'environnement automatique a refusé la création de comptes de test avec mot de passe directement en base, ce qui est raisonnable.
