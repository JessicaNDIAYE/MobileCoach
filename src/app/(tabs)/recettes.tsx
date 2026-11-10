import Feather from '@expo/vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import {
  Card,
  Choice,
  CardHeader,
  Divider,
  Field,
  Muted,
  PillButton,
  Row,
  Screen,
  Stats,
  Tag,
} from '@/components/ui';
import { CHALLENGES } from '@/lib/catalog';
import { daysBetween, eur, monthStart, today } from '@/lib/dates';
import { suggestRecipes, type StockItem } from '@/lib/recipeEngine';
import { supabase } from '@/lib/supabase';
import type { ChallengeType, RecipeMode, RecipeSuggestions, SuggestedRecipe } from '@/lib/types';
import { useUserId } from '@/providers/AuthProvider';
import { useModules } from '@/providers/ModulesProvider';
import { useTheme } from '@/theme';

const GEMINI_CACHE_KEY = 'nutrika.recipes.last';
const MODE_KEY = 'nutrika.recipes.mode';
const CONSENT_KEY = 'nutrika.recipes.consent';
const PAGE_SIZE = 4;

const MODES: { value: RecipeMode; label: string; hint: string; icon: 'box' | 'shopping-cart' }[] = [
  { value: 'fridge', label: 'Mon frigo', hint: 'Seulement ce que j’ai, rien à acheter', icon: 'box' },
  { value: 'shopping', label: 'Nouveaux ingrédients', hint: 'Des idées avec quelques courses', icon: 'shopping-cart' },
];

export default function RecettesScreen() {
  const { colors, s } = useTheme();
  const userId = useUserId();
  const { has } = useModules();
  const withBudget = has('budget');
  const withChallenges = has('challenges');

  const [stock, setStock] = useState<StockItem[]>([]);
  const [challenges, setChallenges] = useState<ChallengeType[]>([]);
  const [remainingBudget, setRemainingBudget] = useState<number | null>(null);
  const [wish, setWish] = useState('');
  const [mode, setMode] = useState<RecipeMode>('fridge');
  const [page, setPage] = useState(0);
  const [cooked, setCooked] = useState<Set<string>>(new Set());

  // Idées Gemini (facultatives)
  const [gemini, setGemini] = useState<RecipeSuggestions | null>(null);
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiError, setGeminiError] = useState('');

  /** Frigo + contexte (budget restant, défis en cours) selon les modules activés. */
  const loadContext = useCallback(async () => {
    const [stockRes, profileRes, monthRes, challengesRes] = await Promise.all([
      supabase.from('purchases').select('id, name, expires_on').eq('in_stock', true).order('expires_on', { ascending: true, nullsFirst: false }),
      withBudget ? supabase.from('profiles').select('monthly_budget').eq('id', userId).single() : Promise.resolve({ data: null }),
      withBudget ? supabase.from('purchases').select('price').gte('purchased_on', monthStart()) : Promise.resolve({ data: [] as { price: number }[] }),
      withChallenges
        ? supabase.from('challenges').select('type').lte('starts_on', today()).gte('ends_on', today())
        : Promise.resolve({ data: [] as { type: ChallengeType }[] }),
    ]);
    setStock((stockRes.data ?? []).filter((p) => !p.expires_on || p.expires_on >= today()));
    const budget = Number(profileRes.data?.monthly_budget ?? 0);
    const spent = (monthRes.data ?? []).reduce((t, p) => t + Number(p.price), 0);
    setRemainingBudget(budget > 0 ? Math.max(budget - spent, 0) : null);
    setChallenges([...new Set((challengesRes.data ?? []).map((c) => c.type as ChallengeType))]);
  }, [userId, withBudget, withChallenges]);

  useFocusEffect(useCallback(() => { loadContext(); }, [loadContext]));

  useEffect(() => {
    AsyncStorage.multiGet([GEMINI_CACHE_KEY, MODE_KEY])
      .then(([[, raw], [, savedMode]]) => {
        if (raw) setGemini(JSON.parse(raw));
        if (savedMode === 'fridge' || savedMode === 'shopping') setMode(savedMode);
      })
      .catch(() => {});
  }, []);

  // Moteur local : instantané, hors ligne, rien n'est envoyé. Recalculé à chaque changement.
  const local = useMemo(
    () => suggestRecipes({ stock, mode, wish, challenges, remainingBudget, today: today() }),
    [stock, mode, wish, challenges, remainingBudget],
  );
  const pages = Math.max(1, Math.ceil(local.length / PAGE_SIZE));
  const visible = local.slice((page % pages) * PAGE_SIZE, (page % pages) * PAGE_SIZE + PAGE_SIZE);

  function changeMode(m: RecipeMode) {
    setMode(m);
    setPage(0);
    AsyncStorage.setItem(MODE_KEY, m).catch(() => {});
  }

  /** Exigence App Store (5.1.2) : consentement explicite avant d'envoyer des données à un service d'IA tiers. */
  async function askGemini() {
    const consent = await AsyncStorage.getItem(CONSENT_KEY).catch(() => null);
    if (consent === '1') return runGemini();
    Alert.alert(
      'Avant de continuer',
      'Pour d’autres idées, Nutrika envoie à Google (service Gemini) les noms et dates de péremption des produits de ton frigo, ton envie et, si ces modules sont activés, ton budget restant du mois et le type de tes défis en cours. Ton email, ton pseudo et ton poids ne sont jamais envoyés.',
      [
        { text: 'Refuser', style: 'cancel' },
        { text: 'En savoir plus', onPress: () => router.push('/legal/privacy') },
        {
          text: 'Accepter',
          onPress: () => {
            AsyncStorage.setItem(CONSENT_KEY, '1').catch(() => {});
            runGemini();
          },
        },
      ],
    );
  }

  async function runGemini() {
    setGeminiLoading(true);
    setGeminiError('');
    const { data, error: fnError } = await supabase.functions.invoke<RecipeSuggestions>('suggest-recipes', {
      body: { wish: wish.trim(), mode },
    });
    setGeminiLoading(false);
    if (fnError || !data) {
      let message = 'Impossible d’obtenir d’autres idées pour le moment.';
      try {
        const body = await (fnError as { context?: Response })?.context?.json();
        if (body?.error) message = body.error;
      } catch {}
      setGeminiError(message);
      return;
    }
    setGemini(data);
    AsyncStorage.setItem(GEMINI_CACHE_KEY, JSON.stringify(data)).catch(() => {});
  }

  async function markCooked(recipe: SuggestedRecipe) {
    // 1. Les produits utilisés sortent du frigo.
    const ids = recipe.uses.map((u) => u.id);
    if (ids.length) await supabase.from('purchases').update({ in_stock: false }).in('id', ids);

    // 2. Défi fibres en cours : on ajoute les fibres d'une portion à la journée.
    const { data: fiberChallenge } = withChallenges
      ? await supabase
          .from('challenges')
          .select('id, fiber_goal_g')
          .eq('type', 'fiber_max')
          .lte('starts_on', today())
          .gte('ends_on', today())
          .limit(1)
          .maybeSingle()
      : { data: null };
    if (fiberChallenge && recipe.fiber_g > 0) {
      const { data: current } = await supabase
        .from('challenge_checkins')
        .select('fiber_g')
        .eq('challenge_id', fiberChallenge.id)
        .eq('user_id', userId)
        .eq('day', today())
        .maybeSingle();
      const fiber = Number(current?.fiber_g ?? 0) + recipe.fiber_g;
      await supabase.from('challenge_checkins').upsert(
        { challenge_id: fiberChallenge.id, user_id: userId, day: today(), fiber_g: fiber, success: fiber >= Number(fiberChallenge.fiber_goal_g) },
        { onConflict: 'challenge_id,user_id,day' },
      );
    }

    setCooked((prev) => new Set(prev).add(recipe.title));
    loadContext();
    Alert.alert('Bon appétit', fiberChallenge ? `${recipe.fiber_g} g de fibres ajoutés à ton défi du jour.` : 'Les produits utilisés sont sortis de ton frigo.');
  }

  const soon = stock.filter((p) => p.expires_on && daysBetween(today(), p.expires_on) <= 2);
  const context: [string, string][] = [
    ...(remainingBudget !== null ? ([['Budget restant', eur(remainingBudget)]] as [string, string][]) : []),
    ...(challenges.length ? ([['Défi', challenges.map((c) => CHALLENGES[c].label).join(', ')]] as [string, string][]) : []),
  ];

  return (
    <Screen title="Recettes" subtitle="avec ton frigo">
      <Card>
        <CardHeader title="Ton frigo" right={<Muted>{stock.length} produits</Muted>} />
        {stock.length === 0 ? (
          <Muted>Rien en stock. Ajoute tes achats dans l’onglet Courses.</Muted>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {stock.map((p) => {
              const left = p.expires_on ? daysBetween(today(), p.expires_on) : null;
              return <Tag key={p.id} label={left !== null && left <= 2 ? `${p.name} · ${left === 0 ? 'aujourd’hui' : `${left} j`}` : p.name} />;
            })}
          </View>
        )}
        {soon.length > 0 && (
          <Row>
            <Feather name="clock" size={14} color={colors.clay} />
            <Text style={[s.muted, { color: colors.clay }]}>
              {soon.length} produit{soon.length > 1 ? 's' : ''} à utiliser en priorité
            </Text>
          </Row>
        )}
      </Card>

      <Card>
        <CardHeader title="Je cuisine avec" />
        <Choice options={MODES} value={mode} onChange={changeMode} />
        <Field
          placeholder="Une envie ? Rapide, végétarien, soupe…"
          value={wish}
          onChangeText={(t) => {
            setWish(t);
            setPage(0);
          }}
          maxLength={200}
        />
        {context.length > 0 && <Stats items={context} />}
      </Card>

      <View style={[s.rowBetween, s.plate]}>
        <Text style={s.cardTitle}>
          {local.length} recette{local.length > 1 ? 's' : ''} pour toi
        </Text>
        {pages > 1 && (
          <Pressable onPress={() => setPage((p) => p + 1)} hitSlop={10} style={s.row}>
            <Text style={s.bold}>Autres idées</Text>
            <Feather name="refresh-cw" size={15} color={colors.ink} />
          </Pressable>
        )}
      </View>

      {local.length === 0 && (
        <Card>
          <Muted>
            {mode === 'fridge'
              ? 'Aucune recette faisable avec ton frigo seul pour le moment. Essaie « Nouveaux ingrédients » ou ajoute des produits.'
              : 'Aucune recette ne correspond. Essaie une autre envie ou ajoute des produits.'}
          </Muted>
        </Card>
      )}

      {visible.map((r) => (
        <RecipeCard key={r.title} recipe={r} cooked={cooked.has(r.title)} onCooked={() => markCooked(r)} />
      ))}

      <Card>
        <CardHeader title="Envie d’autre chose ?" />
        <Muted>Des idées supplémentaires, rédigées par le service Gemini de Google à partir de ton frigo.</Muted>
        <PillButton label="Plus d’idées" variant="light" onPress={askGemini} loading={geminiLoading} />
        {geminiError !== '' && (
          <Row>
            <Feather name="alert-circle" size={14} color={colors.clay} />
            <Text style={[s.muted, { color: colors.clay, flex: 1 }]}>{geminiError}</Text>
          </Row>
        )}
      </Card>

      {gemini?.recipes.map((r) => (
        <RecipeCard key={`g-${r.title}`} recipe={r} cooked={cooked.has(r.title)} onCooked={() => markCooked(r)} />
      ))}
    </Screen>
  );
}

function RecipeCard({ recipe: r, cooked, onCooked }: { recipe: SuggestedRecipe; cooked: boolean; onCooked: () => void }) {
  const { colors, s } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <View style={{ gap: 4 }}>
        <Text style={s.title}>{r.title}</Text>
        {r.summary !== '' && <Muted>{r.summary}</Muted>}
      </View>
      <Stats
        items={[
          ['Temps', `${r.time_minutes} min`],
          ['Portions', String(r.servings)],
          ['Fibres', `${String(r.fiber_g).replace('.', ',')} g`],
        ]}
      />

      {r.uses.length > 0 && (
        <View style={{ gap: 10 }}>
          <Muted>Avec ton frigo</Muted>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {r.uses.map((u) => (
              <Tag key={u.id} label={u.name} />
            ))}
          </View>
        </View>
      )}

      <View style={{ gap: 10 }}>
        <Muted>À acheter</Muted>
        {r.to_buy.length === 0 ? (
          <Text style={s.body}>Rien, tu as tout.</Text>
        ) : (
          r.to_buy.map((b) => (
            <View key={b.item} style={s.rowBetween}>
              <Text style={[s.body, { flex: 1 }]}>{b.item}</Text>
              <Text style={s.body}>{eur(b.estimated_price)}</Text>
            </View>
          ))
        )}
        {r.to_buy.length > 0 && (
          <>
            <Divider />
            <View style={s.rowBetween}>
              <Text style={s.bold}>Total estimé</Text>
              <Text style={s.bold}>{eur(r.extra_cost)}</Text>
            </View>
          </>
        )}
        {!r.fits_budget && (
          <Row>
            <Feather name="alert-circle" size={14} color={colors.clay} />
            <Text style={[s.muted, { color: colors.clay }]}>Dépasse ton budget restant</Text>
          </Row>
        )}
      </View>

      <Pressable onPress={() => setOpen((v) => !v)} style={s.rowBetween} hitSlop={6}>
        <Text style={s.bold}>{open ? 'Masquer la recette' : 'Voir la recette'}</Text>
        <Feather name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.ink} />
      </Pressable>

      {open && (
        <View style={{ gap: 14 }}>
          <View style={{ gap: 6 }}>
            {r.ingredients.map((i) => (
              <Text key={i} style={s.body}>
                <Text style={{ color: colors.inkSoft }}>—  </Text>
                {i}
              </Text>
            ))}
          </View>
          <Divider />
          {r.steps.map((step, i) => (
            <Row key={i} style={{ alignItems: 'flex-start', gap: 12 }}>
              <View style={[s.avatar, { width: 28, height: 28, borderRadius: 14 }]}>
                <Text style={[s.muted, { color: colors.ink, fontWeight: '600' }]}>{i + 1}</Text>
              </View>
              <Text style={[s.body, { flex: 1, paddingTop: 4 }]}>{step}</Text>
            </Row>
          ))}
        </View>
      )}

      <PillButton
        label={cooked ? 'Cuisiné' : 'J’ai cuisiné ce plat'}
        variant={cooked ? 'light' : 'butter'}
        icon={cooked ? 'check' : undefined}
        onPress={() => !cooked && onCooked()}
      />
    </Card>
  );
}
