import Feather from '@expo/vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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
  s,
} from '@/components/ui';
import { CHALLENGES } from '@/lib/catalog';
import { daysBetween, eur, today } from '@/lib/dates';
import { supabase } from '@/lib/supabase';
import type { RecipeMode, RecipeSuggestions, SuggestedRecipe } from '@/lib/types';
import { useUserId } from '@/providers/AuthProvider';
import { colors } from '@/theme';

type StockItem = { id: string; name: string; expires_on: string | null };

const CACHE_KEY = 'mobilecoach.recipes.last';
const MODE_KEY = 'mobilecoach.recipes.mode';

const MODES: { value: RecipeMode; label: string; hint: string; icon: 'box' | 'shopping-cart' }[] = [
  { value: 'fridge', label: 'Mon frigo', hint: 'Seulement ce que j’ai, rien à acheter', icon: 'box' },
  { value: 'shopping', label: 'Nouveaux ingrédients', hint: 'Des idées avec quelques courses', icon: 'shopping-cart' },
];

export default function RecettesScreen() {
  const userId = useUserId();
  const [stock, setStock] = useState<StockItem[]>([]);
  const [wish, setWish] = useState('');
  const [mode, setMode] = useState<RecipeMode>('fridge');
  const [result, setResult] = useState<RecipeSuggestions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooked, setCooked] = useState<Set<string>>(new Set());

  const loadStock = useCallback(async () => {
    const { data } = await supabase
      .from('purchases')
      .select('id, name, expires_on')
      .eq('in_stock', true)
      .order('expires_on', { ascending: true, nullsFirst: false });
    setStock((data ?? []).filter((p) => !p.expires_on || p.expires_on >= today()));
  }, []);

  useFocusEffect(useCallback(() => { loadStock(); }, [loadStock]));

  // Les dernières suggestions restent affichées d'une ouverture à l'autre.
  useEffect(() => {
    AsyncStorage.multiGet([CACHE_KEY, MODE_KEY])
      .then(([[, raw], [, savedMode]]) => {
        if (raw) setResult(JSON.parse(raw));
        if (savedMode === 'fridge' || savedMode === 'shopping') setMode(savedMode);
      })
      .catch(() => {});
  }, []);

  function changeMode(m: RecipeMode) {
    setMode(m);
    setError('');
    AsyncStorage.setItem(MODE_KEY, m).catch(() => {});
  }

  async function suggest() {
    setLoading(true);
    setError('');
    const { data, error: fnError } = await supabase.functions.invoke<RecipeSuggestions>('suggest-recipes', {
      body: { wish: wish.trim(), mode },
    });
    setLoading(false);
    if (fnError || !data) {
      let message = 'Impossible de proposer des recettes pour le moment.';
      try {
        const body = await (fnError as { context?: Response })?.context?.json();
        if (body?.error) message = body.error;
      } catch {}
      setError(message);
      return;
    }
    setResult(data);
    setCooked(new Set());
    AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data)).catch(() => {});
  }

  async function markCooked(recipe: SuggestedRecipe) {
    // 1. Les produits utilisés sortent du frigo.
    const ids = recipe.uses.map((u) => u.id);
    if (ids.length) await supabase.from('purchases').update({ in_stock: false }).in('id', ids);

    // 2. Défi fibres en cours : on ajoute les fibres d'une portion à la journée.
    const { data: fiberChallenge } = await supabase
      .from('challenges')
      .select('id, fiber_goal_g')
      .eq('type', 'fiber_max')
      .lte('starts_on', today())
      .gte('ends_on', today())
      .limit(1)
      .maybeSingle();
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
    loadStock();
    Alert.alert('Bon appétit', fiberChallenge ? `${recipe.fiber_g} g de fibres ajoutés à ton défi du jour.` : 'Les produits utilisés sont sortis de ton frigo.');
  }

  const soon = stock.filter((p) => p.expires_on && daysBetween(today(), p.expires_on) <= 2);

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
        <Field placeholder="Rapide, végétarien, pour 4…" value={wish} onChangeText={setWish} maxLength={200} />
        <PillButton label="Proposer des recettes" icon="arrow-right" onPress={suggest} loading={loading} />
        <Muted>
          {mode === 'fridge'
            ? 'Uniquement tes produits et les basiques du placard, en respectant tes défis.'
            : 'Ton frigo en priorité, plus quelques achats qui tiennent dans ton budget.'}
        </Muted>
        {error !== '' && (
          <Row>
            <Feather name="alert-circle" size={14} color={colors.clay} />
            <Text style={[s.muted, { color: colors.clay, flex: 1 }]}>{error}</Text>
          </Row>
        )}
      </Card>

      {result && (
        <View style={{ paddingHorizontal: 4, gap: 2 }}>
          <Stats
            items={[
              ['Mode', result.mode === 'shopping' ? 'nouveaux ingrédients' : 'mon frigo'],
              ['Budget restant', result.remaining_budget === null ? 'non défini' : eur(result.remaining_budget)],
              ...(result.challenges.length ? ([['Défi', result.challenges.map((c) => CHALLENGES[c].label).join(', ')]] as [string, string][]) : []),
            ]}
          />
        </View>
      )}

      {result?.recipes.map((r) => (
        <RecipeCard key={r.title} recipe={r} cooked={cooked.has(r.title)} onCooked={() => markCooked(r)} />
      ))}
    </Screen>
  );
}

function RecipeCard({ recipe: r, cooked, onCooked }: { recipe: SuggestedRecipe; cooked: boolean; onCooked: () => void }) {
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
