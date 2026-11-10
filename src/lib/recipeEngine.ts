/**
 * Moteur de recettes 100 % local : aucune donnée ne quitte le téléphone.
 *
 * 1. Chaque produit du frigo est reconnu (« blanc de poulet » → poulet, famille volailles).
 * 2. Pour chaque recette, chaque ingrédient est rempli par un produit du frigo compatible
 *    (ingrédient exact ou même famille), en priorité celui qui périme le plus tôt.
 * 3. Les recettes sont filtrées (mode, défis, envie) puis classées par score.
 */
import { CATEGORIES, INGREDIENTS, type Category, type Ingredient } from '../content/ingredients';
import { RECIPES, type Recipe } from '../content/recipes';
import type { ChallengeType, RecipeMode, SuggestedRecipe } from './types';

// ——— Normalisation du texte ———

/** minuscules, sans accents ni ponctuation, pluriels simples retirés : « Tomates cerises » → « tomate cerise ». */
export const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z ]/g, ' ')
    .replace(/(s|x)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/** Correspondance sur mots entiers. */
const hasWords = (text: string, words: string) => ` ${text} `.includes(` ${words} `);

// Mots reconnus, du plus long au plus court : « lait de coco » doit l'emporter sur « lait ».
const WORD_INDEX = INGREDIENTS.flatMap((ing) => ing.words.map((w) => ({ w: norm(w), ing }))).sort((a, b) => b.w.length - a.w.length);
const BY_ID = new Map(INGREDIENTS.map((ing) => [ing.id, ing]));

/** Reconnaît un produit saisi par l'utilisateur. null si inconnu. */
export function identify(name: string): Ingredient | null {
  const key = norm(name);
  for (const { w, ing } of WORD_INDEX) if (hasWords(key, w)) return ing;
  return null;
}

const isCategory = (t: string): t is Category => t in CATEGORIES;

const ANIMAL: Category[] = ['viandes', 'volailles', 'poissons_blancs', 'poissons_gras'];
const isAnimal = (ing: Ingredient) => ing.cats.some((c) => ANIMAL.includes(c));

function satisfies(ing: Ingredient, need: string): boolean {
  return need.split('|').some((t) => (isCategory(t) ? ing.cats.includes(t) : ing.id === t));
}

/** Prix estimé de l'option la moins chère pour un ingrédient manquant. */
function cheapestPrice(need: string): number {
  const prices = need.split('|').flatMap((t) =>
    isCategory(t) ? INGREDIENTS.filter((ing) => ing.cats.includes(t)).map((ing) => ing.price) : [BY_ID.get(t)?.price ?? 2],
  );
  return prices.length ? Math.min(...prices) : 2;
}

// ——— Envie saisie ———

type Wish = { quick: boolean; veggie: boolean; light: boolean; words: string[] };

function parseWish(text: string): Wish {
  const t = norm(text);
  const words = t.split(' ').filter((w) => w.length >= 4);
  return {
    quick: /\b(rapide|vite|expre|presse|minute)\b/.test(t),
    veggie: /\b(vege|vegetarien|vegetarienne|vegan|vegetal|sans viande)\b/.test(t),
    light: /\b(leger|legere|light)\b/.test(t),
    words: words.filter((w) => !['rapide', 'vite', 'vegetarien', 'vegetarienne', 'vegan', 'leger', 'legere', 'pour', 'avec', 'sans'].includes(w)),
  };
}

// ——— Suggestion ———

export type StockItem = { id: string; name: string; expires_on: string | null };

export type EngineOptions = {
  stock: StockItem[];
  mode: RecipeMode;
  wish?: string;
  challenges?: ChallengeType[];
  remainingBudget?: number | null;
  today: string;
};

const daysUntil = (from: string, to: string) =>
  Math.round((new Date(`${to}T12:00:00`).getTime() - new Date(`${from}T12:00:00`).getTime()) / 86400000);

type Scored = { recipe: SuggestedRecipe; score: number; source: Recipe };

export function suggestRecipes(opts: EngineOptions): SuggestedRecipe[] {
  const { stock, mode, today } = opts;
  const challenges = opts.challenges ?? [];
  const wish = parseWish(opts.wish ?? '');
  const remaining = opts.remainingBudget ?? null;

  // Frigo reconnu, trié du plus urgent au moins urgent (sans date en dernier).
  const fridge = stock
    .map((item) => ({ item, ing: identify(item.name), left: item.expires_on ? daysUntil(today, item.expires_on) : null }))
    .filter((f): f is { item: StockItem; ing: Ingredient; left: number | null } => f.ing !== null && (f.left === null || f.left >= 0))
    .sort((a, b) => (a.left ?? 999) - (b.left ?? 999));

  const results: Scored[] = [];

  for (const recipe of RECIPES) {
    // Filtres durs : défis, envie.
    if (challenges.includes('no_sugar') && recipe.sugar) continue;
    if (challenges.includes('no_carbs') && !recipe.lowCarb) continue;
    if (wish.veggie && !recipe.veggie) continue;
    if (wish.quick && recipe.time > 20) continue;

    const taken = new Set<string>();
    const uses: { id: string; name: string }[] = [];
    const toBuy: { item: string; estimated_price: number }[] = [];
    let urgency = 0;
    let filled = 0;
    const required = recipe.ingredients.filter((x) => !x.optional);

    for (const ri of recipe.ingredients) {
      // En mode végétarien, la viande et le poisson du frigo ne remplissent aucun ingrédient (même facultatif).
      const match = fridge.find((f) => !taken.has(f.item.id) && !(wish.veggie && isAnimal(f.ing)) && satisfies(f.ing, ri.need));
      if (match) {
        taken.add(match.item.id);
        uses.push({ id: match.item.id, name: match.item.name });
        if (!ri.optional) filled++;
        if (match.left !== null) urgency += match.left <= 2 ? 4 : match.left <= 5 ? 1.5 : 0;
      } else if (!ri.optional) {
        toBuy.push({ item: ri.label, estimated_price: cheapestPrice(ri.need) });
      }
    }

    // Mode « Mon frigo » : rien à acheter. Mode « Nouveaux ingrédients » : 3 achats max.
    if (mode === 'fridge' && toBuy.length > 0) continue;
    if (mode === 'shopping' && toBuy.length > 3) continue;
    // Avec un frigo rempli, on évite les recettes qui n'utilisent rien de ce qu'on a.
    if (fridge.length > 0 && uses.length === 0) continue;

    const extraCost = Math.round(toBuy.reduce((t, b) => t + b.estimated_price, 0) * 100) / 100;
    const fitsBudget = remaining === null || extraCost <= remaining;
    const haystack = norm(`${recipe.title} ${recipe.summary} ${recipe.ingredients.map((x) => x.label).join(' ')}`);
    const wishHits = wish.words.filter((w) => haystack.includes(w)).length;

    const score =
      (filled / Math.max(required.length, 1)) * 10 +
      urgency +
      (uses.length - filled) * 0.5 -
      toBuy.length * 2 -
      (fitsBudget ? 0 : 6) +
      (challenges.includes('fiber_max') ? recipe.fiber / 2 : 0) +
      (wish.light && recipe.lowCarb ? 2 : 0) +
      wishHits * 4;

    results.push({
      score,
      source: recipe,
      recipe: {
        title: recipe.title,
        summary: recipe.summary,
        time_minutes: recipe.time,
        servings: recipe.servings,
        fiber_g: recipe.fiber,
        uses,
        to_buy: toBuy,
        extra_cost: extraCost,
        fits_budget: fitsBudget,
        ingredients: recipe.ingredients.map((x) => (x.optional ? `${x.label} (facultatif)` : x.label)),
        steps: recipe.steps,
      },
    });
  }

  return results.sort((a, b) => b.score - a.score || a.source.time - b.source.time).map((r) => r.recipe);
}
