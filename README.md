# Nutrika

App iOS (Expo) pour suivre son **poids**, son **budget courses**, trouver des **recettes avec ce qu'il reste au frigo** et faire des **défis entre amis** (zéro sucre, low carb, fibres max).

## Stack

| Brique | Techno |
| --- | --- |
| App mobile | Expo SDK 58 (React Native) + Expo Router, testée via **Expo Go** |
| Backend | Supabase : Postgres + RLS, Auth, Storage |
| Graphiques | react-native-gifted-charts |
| Recettes | Gemini via la Supabase Edge Function `suggest-recipes` (la clé reste sur le serveur) |

```
[ App Expo ] ── auth / données / photos ──> [ Supabase ]
                                               └── Edge Function suggest-recipes ──> [ Gemini ]
```

## Démarrage

### 1. Supabase

1. Crée un projet sur [supabase.com](https://supabase.com).
2. Dans **SQL Editor**, colle et exécute `supabase/migrations/20261103000000_init.sql`.
   (ou avec la CLI : `supabase link` puis `supabase db push`)
3. Pour tester vite : **Authentication › Sign In / Providers › Email** et désactive « Confirm email ».

### 2. App

```bash
npm install
```

```bash
cp .env.example .env.local
```

Remplis `.env.local` avec l'URL et la clé publishable (Project Settings › API), puis :

```bash
npx expo start
```

Scanne le QR code avec l'appareil photo de l'iPhone (l'app **Expo Go** doit être installée). Tes amis peuvent faire pareil s'ils sont sur le même réseau, ou utilise `npx expo start --tunnel`.

### 3. Recettes (Gemini)

1. Crée une clé sur [Google AI Studio](https://aistudio.google.com/apikey).
2. Supabase › **Edge Functions › Secrets** : ajoute `GEMINI_API_KEY` avec cette clé.
3. Optionnel : `GEMINI_MODEL` pour changer de modèle (par défaut `gemini-2.5-flash`).

La fonction est dans `supabase/functions/suggest-recipes`. Pour la redéployer avec la CLI :

```bash
supabase functions deploy suggest-recipes
```

## Ce qui marche déjà

- **Introduction** : 3 écrans au premier lancement.
- **Modules au choix** : après l'inscription, chacun compose son app (Recettes, Budget courses, Défis entre amis, Suivi du poids). Le suivi du poids est **désactivé par défaut** (prévention des TCA) ; le désactiver propose de supprimer les pesées. Les onglets, les cartes et les données envoyées à Gemini suivent ces choix. Modifiable dans Profil › Mes modules.
- **Compte** : inscription / connexion par email (session gardée sur le téléphone), suppression du compte depuis l'app.
- **Profil & poids** : objectif perte, prise ou maintien, poids cible, pesée du jour (une par jour), courbe avec la ligne d'objectif.
- **Courses & budget** : budget mensuel, jauge avec alerte à 80 % et au dépassement, ajout d'achats (magasin, catégorie, date de péremption), répartition par catégorie, statut « encore au frigo » (servira aux recettes).
- **Recettes** : au choix, « Mon frigo » (uniquement ce qu'on a + les basiques du placard, rien à acheter) ou « Nouveaux ingrédients » (le frigo en priorité + quelques courses dans le budget). Gemini propose 4 recettes en tenant compte des produits qui périment, du budget restant du mois et des défis en cours. Chaque recette donne ce qu'il reste à acheter avec un prix estimé. « J'ai cuisiné » sort les produits du frigo et ajoute les fibres au défi du jour.
- **Défis entre amis** :
  - 🍬 Zéro sucre et 🥖 Low carb : on valide chaque jour « réussi » ou « craqué ».
  - 🥦 Fibres max : on additionne les grammes avec des raccourcis (pomme, avoine…), la journée est validée à 30 g.
  - Code d'invitation partageable, calendrier du défi, série 🔥 et classement entre participants.

## Publication App Store / TestFlight

Déjà dans l'app :

- Écrans d'introduction (premier lancement), politique de confidentialité et CGU lisibles dans l'app.
- Acceptation des CGU, de la politique et du traitement des données de poids à l'inscription (âge minimum dans `src/content/legal.json`).
- Consentement avant le premier envoi de données à Gemini (règle App Store 5.1.2).
- Suppression du compte dans Profil › Compte (règle 5.1.1(v)) : Edge Function `delete-account`, données et photos effacées.
- Avertissement santé dans les CGU (l'app n'est pas un dispositif médical).
- `ios.config.usesNonExemptEncryption: false` dans `app.json` : pas de question de chiffrement à chaque build TestFlight.

À faire avant la soumission :

1. Remplir `editor` et `contactEmail` dans `src/content/legal.json`, puis régénérer les pages web :
   ```bash
   npm run legal:build
   ```
2. Publier le dossier `docs/` (GitHub Pages : Settings › Pages › branche, dossier `/docs`) et renseigner dans App Store Connect :
   URL de confidentialité → `…/privacy.html`, URL de support → `…/index.html`.
3. Compte Apple Developer (99 €/an), puis build et envoi avec EAS :
   ```bash
   npx eas-cli@latest build --platform ios --profile production
   ```
   ```bash
   npx eas-cli@latest submit --platform ios
   ```
4. Fournir à Apple un compte de démonstration (email + mot de passe) avec quelques données.
5. Questionnaire « Confidentialité de l'app » dans App Store Connect (aucune donnée utilisée pour le suivi publicitaire) :

| Catégorie Apple | Donnée | Liée à l'utilisateur | Usage |
| --- | --- | --- | --- |
| Coordonnées › Adresse email | email du compte | oui | fonctionnalité de l'app |
| Santé et forme › Santé | poids, objectif | oui | fonctionnalité de l'app |
| Contenu utilisateur › Autre | pseudo, envie saisie pour les recettes | oui | fonctionnalité de l'app |
| Identifiants › Identifiant utilisateur | id du compte | oui | fonctionnalité de l'app |
| Autres données | courses, budget, défis | oui | fonctionnalité de l'app |

## Base de données

| Table | Rôle |
| --- | --- |
| `profiles` | pseudo, budget mensuel, objectif de poids, modules choisis (créé automatiquement à l'inscription) |
| `weight_entries` | pesées (1 par jour) |
| `receipts` / `purchases` | tickets de caisse (OCR) et articles achetés |
| `promos` | promos repérées |
| `meal_photos` | photos de plats (bucket privé `meals`) |
| `challenges` / `user_challenges` / `challenge_checkins` | défis, participants, validations quotidiennes |
| `challenge_leaderboard` (vue) | classement par défi |

Sécurité (RLS) : chacun ne voit que ses propres données. Les défis, check-ins et pseudos ne sont visibles qu'entre participants d'un même défi, et on rejoint un défi uniquement avec son code (`join_challenge`).

## Roadmap

1. ✅ Poids, budget, défis
2. ✅ Recettes à partir du frigo et du budget
3. 📷 Scan des tickets : photo → Storage → Edge Function Gemini → `purchases`
4. 📸 Photos de plats
5. 🏷️ Promos

## Scripts

```bash
npm run typecheck
```
