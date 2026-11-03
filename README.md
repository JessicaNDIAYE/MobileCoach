# MobileCoach 🥗

App iOS (Expo) pour suivre son **poids**, son **budget courses**, et faire des **défis entre amis** (zéro sucre, low carb, fibres max).
Prochaines étapes : scan de tickets et recettes avec Gemini, photos de plats, promos.

## Stack

| Brique | Techno |
| --- | --- |
| App mobile | Expo SDK 58 (React Native) + Expo Router, testée via **Expo Go** |
| Backend | Supabase : Postgres + RLS, Auth, Storage |
| Graphiques | react-native-gifted-charts |
| IA (à venir) | Gemini via une Supabase Edge Function (la clé ne doit jamais être dans l'app) |

```
[ App Expo ] ── auth / données / photos ──> [ Supabase ]
                                               └── Edge Function ──> [ Gemini ]  (étape suivante)
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

## Ce qui marche déjà

- **Compte** : inscription / connexion par email (session gardée sur le téléphone).
- **Profil & poids** : objectif perte, prise ou maintien, poids cible, pesée du jour (une par jour), courbe avec la ligne d'objectif.
- **Courses & budget** : budget mensuel, jauge avec alerte à 80 % et au dépassement, ajout d'achats (magasin, catégorie, date de péremption), répartition par catégorie, statut « encore au frigo » (servira aux recettes).
- **Défis entre amis** :
  - 🍬 Zéro sucre et 🥖 Low carb : on valide chaque jour « réussi » ou « craqué ».
  - 🥦 Fibres max : on additionne les grammes avec des raccourcis (pomme, avoine…), la journée est validée à 30 g.
  - Code d'invitation partageable, calendrier du défi, série 🔥 et classement entre participants.

## Base de données

| Table | Rôle |
| --- | --- |
| `profiles` | pseudo, budget mensuel, objectif de poids (créé automatiquement à l'inscription) |
| `weight_entries` | pesées (1 par jour) |
| `receipts` / `purchases` | tickets de caisse (OCR) et articles achetés |
| `promos` | promos repérées |
| `meal_photos` | photos de plats (bucket privé `meals`) |
| `challenges` / `user_challenges` / `challenge_checkins` | défis, participants, validations quotidiennes |
| `challenge_leaderboard` (vue) | classement par défi |

Sécurité (RLS) : chacun ne voit que ses propres données. Les défis, check-ins et pseudos ne sont visibles qu'entre participants d'un même défi, et on rejoint un défi uniquement avec son code (`join_challenge`).

## Roadmap

1. ✅ Poids, budget, défis
2. 📷 Scan des tickets : photo → Storage → Edge Function Gemini → `purchases`
3. 🍳 Recettes à partir du stock (priorité aux produits qui périment bientôt, filtrées selon le défi en cours)
4. 📸 Photos de plats, avec vérification IA du respect du défi
5. 🏷️ Promos

## Scripts

```bash
npm run typecheck
```
