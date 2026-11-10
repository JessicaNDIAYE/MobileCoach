// Edge Function : propose des recettes à partir du frigo, du budget restant et du défi en cours.
// La clé Gemini est un secret Supabase (GEMINI_API_KEY) : elle ne quitte jamais le serveur.
import { createClient } from 'npm:@supabase/supabase-js@2';

const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash';
const MAX_RECIPES = 4;

const CHALLENGE_RULES: Record<string, string> = {
  no_sugar: 'zéro sucre ajouté (pas de sucre, miel, sirop, soda, pâtisserie)',
  no_carbs: 'low carb (pas de pain, pâtes, riz, pommes de terre, semoule, farine ni sucre)',
  fiber_max: 'riche en fibres (au moins 8 g de fibres par portion si possible)',
};

// Schéma de sortie imposé à Gemini (sous-ensemble OpenAPI).
const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    recipes: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          title: { type: 'STRING' },
          summary: { type: 'STRING', description: 'Une phrase qui donne envie, sans emoji.' },
          time_minutes: { type: 'INTEGER' },
          servings: { type: 'INTEGER' },
          fiber_g: { type: 'NUMBER', description: 'Fibres estimées par portion, en grammes.' },
          uses: { type: 'ARRAY', items: { type: 'INTEGER' }, description: 'Numéros des articles du frigo utilisés.' },
          to_buy: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                item: { type: 'STRING' },
                estimated_price: { type: 'NUMBER', description: 'Prix estimé en euros dans un supermarché français.' },
              },
              required: ['item', 'estimated_price'],
            },
          },
          ingredients: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Liste complète avec quantités.' },
          steps: { type: 'ARRAY', items: { type: 'STRING' } },
        },
        required: ['title', 'summary', 'time_minutes', 'servings', 'fiber_g', 'uses', 'to_buy', 'ingredients', 'steps'],
      },
    },
  },
  required: ['recipes'],
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function daysUntil(iso: string) {
  return Math.round((new Date(`${iso}T12:00:00Z`).getTime() - new Date(`${todayISO()}T12:00:00Z`).getTime()) / 86400000);
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) return json({ error: 'La clé Gemini n’est pas encore configurée sur le serveur.' }, 500);

  // Client « au nom de l'utilisateur » : la RLS limite les lectures à ses propres données.
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return json({ error: 'Non connecté' }, 401);

  const body = await req.json().catch(() => ({}));
  const wish = typeof body.wish === 'string' ? body.wish.trim().slice(0, 200) : '';
  // « fridge » : uniquement le frigo + placard. « shopping » : nouveaux ingrédients autorisés.
  const mode: 'fridge' | 'shopping' = body.mode === 'shopping' ? 'shopping' : 'fridge';

  const today = todayISO();
  const monthStart = `${today.slice(0, 7)}-01`;
  const [profileRes, stockRes, monthRes, challengesRes] = await Promise.all([
    supabase.from('profiles').select('monthly_budget').eq('id', auth.user.id).single(),
    supabase.from('purchases').select('id, name, expires_on').eq('in_stock', true).order('expires_on', { ascending: true, nullsFirst: false }).limit(60),
    supabase.from('purchases').select('price').gte('purchased_on', monthStart),
    supabase.from('challenges').select('type').lte('starts_on', today).gte('ends_on', today),
  ]);

  // Les produits périmés ne sont pas proposés.
  const stock = (stockRes.data ?? []).filter((p) => !p.expires_on || daysUntil(p.expires_on) >= 0);
  if (stock.length === 0 && mode === 'fridge') {
    return json({ error: 'Ton frigo est vide : ajoute des achats dans Courses ou choisis « Nouveaux ingrédients ».' }, 400);
  }

  const budget = Number(profileRes.data?.monthly_budget ?? 0);
  const spent = (monthRes.data ?? []).reduce((t, p) => t + Number(p.price), 0);
  const remaining = budget > 0 ? Math.round(Math.max(budget - spent, 0) * 100) / 100 : null;
  const challengeTypes = [...new Set((challengesRes.data ?? []).map((c) => c.type as string))].filter((t) => t in CHALLENGE_RULES);

  const stockLines = stock
    .map((p, i) => {
      const left = p.expires_on ? daysUntil(p.expires_on) : null;
      return `${i + 1}. ${p.name}${left === null ? '' : left <= 2 ? ` (à consommer d’ici ${left} j, PRIORITAIRE)` : ` (encore ${left} j)`}`;
    })
    .join('\n');

  const budgetLine =
    remaining === null
      ? 'Pas de budget fixé : reste sur des ingrédients abordables.'
      : `Budget courses restant ce mois-ci : ${remaining.toFixed(2)} €. Le coût des achats de CHAQUE recette doit tenir dedans largement.`;

  const modeLines =
    mode === 'fridge'
      ? [
          `Propose ${MAX_RECIPES} recettes du quotidien réalisables UNIQUEMENT avec les articles du frigo ci-dessous, en priorité ceux qui périment bientôt.`,
          'Tu peux seulement ajouter les basiques du placard : sel, poivre, huile, vinaigre, épices, herbes séchées, ail, oignon.',
          'Rien d’autre : "to_buy" doit être une liste vide.',
        ]
      : [
          `Propose ${MAX_RECIPES} recettes du quotidien variées et appétissantes, qui peuvent demander de nouveaux ingrédients à acheter.`,
          stock.length
            ? 'Utilise quand c’est pertinent les articles du frigo ci-dessous, surtout ceux qui périment bientôt, mais tu n’es pas limité au frigo.'
            : 'Le frigo est vide : propose des recettes complètes avec leur liste de courses.',
          'Les basiques du placard (sel, poivre, huile, vinaigre, épices) sont déjà là.',
          budgetLine,
          'Dans "to_buy", liste tous les ingrédients à acheter avec un prix estimé réaliste.',
        ];

  const prompt = [
    'Tu es un coach culinaire français, simple et concret.',
    ...modeLines,
    challengeTypes.length
      ? `Contraintes obligatoires (défis en cours) : ${challengeTypes.map((t) => CHALLENGE_RULES[t]).join(' ; ')}.`
      : '',
    wish ? `Envie de l’utilisateur : « ${wish} ».` : '',
    'Dans "uses", renvoie les numéros des articles du frigo utilisés.',
    'Étapes courtes, 3 à 6 maximum. Aucun emoji.',
    '',
    'Frigo :',
    stockLines || '(vide)',
  ]
    .filter(Boolean)
    .join('\n');

  const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', responseSchema: RESPONSE_SCHEMA, temperature: 0.8 },
    }),
  });

  if (!geminiRes.ok) {
    console.error('Gemini', geminiRes.status, await geminiRes.text());
    return json({ error: 'Le service de recettes ne répond pas, réessaie dans un instant.' }, 502);
  }

  let parsed: { recipes?: unknown[] };
  try {
    const data = await geminiRes.json();
    parsed = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}');
  } catch (e) {
    console.error('Réponse Gemini illisible', e);
    return json({ error: 'Réponse inattendue, réessaie.' }, 502);
  }

  // Nettoyage : on ne fait pas confiance aveuglément à la sortie du modèle.
  const recipes = (parsed.recipes ?? []).slice(0, MAX_RECIPES).map((raw) => {
    const r = raw as Record<string, unknown>;
    const num = (v: unknown, d = 0) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : d);
    const strs = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, 20) : []);
    const usedIdx = Array.isArray(r.uses) ? [...new Set(r.uses as number[])].filter((i) => Number.isInteger(i) && i >= 1 && i <= stock.length) : [];
    const toBuy = (Array.isArray(r.to_buy) ? r.to_buy : [])
      .map((b) => b as Record<string, unknown>)
      .filter((b) => typeof b.item === 'string')
      .slice(0, 10)
      .map((b) => ({ item: b.item as string, estimated_price: Math.round(num(b.estimated_price) * 100) / 100 }));
    const extraCost = Math.round(toBuy.reduce((t, b) => t + b.estimated_price, 0) * 100) / 100;
    return {
      title: String(r.title ?? 'Recette'),
      summary: String(r.summary ?? ''),
      time_minutes: Math.round(num(r.time_minutes, 20)),
      servings: Math.max(1, Math.round(num(r.servings, 2))),
      fiber_g: Math.round(num(r.fiber_g) * 10) / 10,
      uses: usedIdx.map((i) => ({ id: stock[i - 1].id, name: stock[i - 1].name })),
      to_buy: toBuy,
      extra_cost: extraCost,
      fits_budget: remaining === null || extraCost <= remaining,
      ingredients: strs(r.ingredients),
      steps: strs(r.steps),
    };
  });

  return json({ mode, recipes, remaining_budget: remaining, challenges: challengeTypes });
});
