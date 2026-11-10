// Vérifie la base de recettes et le moteur local.  Usage : npm run recipes:check
import assert from 'node:assert/strict';

import { CATEGORIES, INGREDIENTS } from '../src/content/ingredients';
import { RECIPES } from '../src/content/recipes';
import { identify, suggestRecipes } from '../src/lib/recipeEngine';

const ids = new Set(INGREDIENTS.map((i) => i.id));
assert.equal(ids.size, INGREDIENTS.length, 'identifiants d’ingrédients en double');
const recipeIds = new Set(RECIPES.map((r) => r.id));
assert.equal(recipeIds.size, RECIPES.length, 'identifiants de recettes en double');

for (const r of RECIPES) {
  assert.ok(r.ingredients.some((x) => !x.optional), `${r.id} : aucun ingrédient obligatoire`);
  assert.ok(r.steps.length >= 1, `${r.id} : pas d’étapes`);
  for (const x of r.ingredients)
    for (const t of x.need.split('|')) assert.ok(ids.has(t) || t in CATEGORIES, `${r.id} : alternative inconnue « ${t} »`);
}
console.log(`✓ ${RECIPES.length} recettes, ${INGREDIENTS.length} ingrédients, ${Object.keys(CATEGORIES).length} familles`);

// Reconnaissance des produits tels qu'on les tape
const cases: [string, string | null][] = [
  ['Blanc de poulet', 'poulet'], ['Tomates cerises', 'tomate'], ['Steak haché 5%', 'boeuf_hache'], ['Lait de coco', 'lait_coco'],
  ['Pommes de terre', 'pomme_de_terre'], ['Pommes Golden', 'pomme'], ['Pâte brisée', 'pate_tarte'], ['Pâtes complètes', 'pates'],
  ['Œufs bio x6', 'oeuf'], ['Yaourt grec', 'yaourt'], ['Fromage blanc 0%', 'fromage_blanc'], ['Chou-fleur', 'brocoli'],
  ['Flocons d’avoine', 'avoine'], ['Noix de cajou', 'noix'], ['Eau pétillante', null], ['Maïs', 'mais'], ['Pois chiches', 'pois_chiches'],
];
for (const [input, expected] of cases) assert.equal(identify(input)?.id ?? null, expected, `identify(« ${input} »)`);
console.log(`✓ ${cases.length} produits reconnus correctement`);

const today = '2026-11-10';
const item = (id: string, name: string, expires_on: string | null = null) => ({ id, name, expires_on });
const fridge = [
  item('1', 'Blanc de poulet', '2026-11-11'), item('2', 'Courgettes'), item('3', 'Œufs'), item('4', 'Tomates'),
  item('5', 'Pâtes'), item('6', 'Lentilles vertes'), item('7', 'Yaourt grec', '2026-11-20'), item('8', 'Feta', '2026-11-05'),
];

const show = (label: string, list: ReturnType<typeof suggestRecipes>) =>
  console.log(`\n${label} (${list.length})\n` + list.slice(0, 5).map((r) => `  - ${r.title}  [frigo : ${r.uses.map((u) => u.name).join(', ')}]${r.to_buy.length ? `  à acheter : ${r.extra_cost} €` : ''}`).join('\n'));

const fridgeOnly = suggestRecipes({ stock: fridge, mode: 'fridge', today });
show('Mon frigo', fridgeOnly);
assert.ok(fridgeOnly.length > 0);
assert.ok(fridgeOnly.every((r) => r.to_buy.length === 0), 'mode frigo : rien à acheter');
assert.ok(fridgeOnly.every((r) => !r.uses.some((u) => u.name === 'Feta')), 'produit périmé exclu');
assert.ok(fridgeOnly[0].uses.some((u) => u.name === 'Blanc de poulet'), 'le poulet qui périme demain doit être en tête');

const shopping = suggestRecipes({ stock: fridge, mode: 'shopping', today, remainingBudget: 5 });
show('Nouveaux ingrédients, budget 5 €', shopping);
assert.ok(shopping.length > fridgeOnly.length);
assert.ok(shopping.every((r) => r.to_buy.length <= 3));

const lowCarb = suggestRecipes({ stock: fridge, mode: 'shopping', today, challenges: ['no_carbs'] });
assert.ok(lowCarb.every((r) => !r.title.match(/pâtes|riz|risotto/i)), 'low carb : pas de féculents');
const noSugar = suggestRecipes({ stock: [item('a', 'Chocolat noir'), item('b', 'Œufs')], mode: 'fridge', today, challenges: ['no_sugar'] });
assert.ok(noSugar.every((r) => r.title !== 'Gâteau au chocolat'), 'zéro sucre : pas de gâteau');
const quickVeggie = suggestRecipes({ stock: fridge, mode: 'shopping', today, wish: 'rapide et végétarien' });
show('Envie « rapide et végétarien »', quickVeggie);
assert.ok(quickVeggie.every((r) => r.time_minutes <= 20 && !r.uses.some((u) => u.name === 'Blanc de poulet')));
const empty = suggestRecipes({ stock: [], mode: 'shopping', today, remainingBudget: 50 });
assert.ok(empty.length > 0, 'frigo vide + nouveaux ingrédients : des idées quand même');
// Les deux fruits d'une salade de fruits doivent venir de deux produits différents
const fruits = suggestRecipes({ stock: [item('p', 'Pommes'), item('k', 'Kiwis')], mode: 'fridge', today });
const sf = fruits.find((r) => r.title === 'Salade de fruits frais');
assert.ok(sf && new Set(sf.uses.map((u) => u.id)).size === sf.uses.length, 'un produit ne sert qu’une fois par recette');

console.log('\n✓ Tous les scénarios passent');
