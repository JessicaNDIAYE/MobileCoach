import Feather from '@expo/vector-icons/Feather';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import {
  BigNumber,
  Card,
  CardHeader,
  Divider,
  Field,
  IconButton,
  Muted,
  PillButton,
  Row,
  Screen,
  SegmentBar,
  Stats,
  Tag,
  TextTabs,
  TickGauge,
  s,
} from '@/components/ui';
import { CATEGORIES } from '@/lib/catalog';
import { addDays, eur, fmtDate, monthStart, today } from '@/lib/dates';
import { supabase } from '@/lib/supabase';
import type { Purchase } from '@/lib/types';
import { useUserId } from '@/providers/AuthProvider';
import { colors, palette } from '@/theme';

const EXPIRY = [
  { value: '', label: 'Pas de date' },
  { value: '3', label: '3 jours' },
  { value: '7', label: '1 semaine' },
  { value: '14', label: '2 semaines' },
  { value: '30', label: '1 mois' },
];

const monthName = () => new Date().toLocaleDateString('fr-FR', { month: 'long' });

export default function CoursesScreen() {
  const userId = useUserId();
  const [budget, setBudget] = useState(0);
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [store, setStore] = useState('');
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [expiry, setExpiry] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [p, list] = await Promise.all([
      supabase.from('profiles').select('monthly_budget').eq('id', userId).single(),
      supabase
        .from('purchases')
        .select('id, name, price, category, store, purchased_on, expires_on, in_stock')
        .gte('purchased_on', monthStart())
        .order('purchased_on', { ascending: false })
        .order('created_at', { ascending: false }),
    ]);
    const b = Number(p.data?.monthly_budget ?? 0);
    setBudget(b);
    setBudgetInput(b ? String(b) : '');
    setPurchases((list.data ?? []).map((x) => ({ ...x, price: Number(x.price) })));
  }, [userId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const spent = purchases.reduce((t, p) => t + p.price, 0);
  const ratio = budget ? spent / budget : 0;
  const gaugeColor = ratio >= 1 ? colors.rust : ratio >= 0.8 ? colors.clay : colors.forest;

  async function saveBudget() {
    const value = Number(budgetInput.replace(',', '.')) || 0;
    const { error } = await supabase.from('profiles').update({ monthly_budget: value }).eq('id', userId);
    if (error) return Alert.alert('Erreur', error.message);
    setBudget(value);
    setEditingBudget(false);
  }

  async function addPurchase() {
    const value = Number(price.replace(',', '.'));
    if (!name.trim() || price === '' || !(value >= 0)) {
      Alert.alert('Presque', 'Indique au moins l’article et son prix.');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('purchases').insert({
      name: name.trim(),
      price: value,
      store: store.trim() || null,
      category,
      purchased_on: today(),
      expires_on: expiry ? addDays(today(), Number(expiry)) : null,
    });
    setSaving(false);
    if (error) return Alert.alert('Erreur', error.message);
    if (budget && spent / budget < 0.8 && (spent + value) / budget >= 0.8) {
      Alert.alert('Budget', 'Tu as atteint 80 % de ton budget courses du mois.');
    }
    setName('');
    setPrice('');
    setExpiry('');
    load();
  }

  async function toggleStock(p: Purchase) {
    setPurchases((list) => list.map((x) => (x.id === p.id ? { ...x, in_stock: !x.in_stock } : x)));
    await supabase.from('purchases').update({ in_stock: !p.in_stock }).eq('id', p.id);
  }

  function remove(p: Purchase) {
    Alert.alert('Supprimer', `Supprimer « ${p.name} » ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('purchases').delete().eq('id', p.id);
          load();
        },
      },
    ]);
  }

  const byCategory = Object.entries(
    purchases.reduce<Record<string, number>>((acc, p) => ({ ...acc, [p.category]: (acc[p.category] ?? 0) + p.price }), {}),
  )
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value, display: eur(value), color: palette[CATEGORIES.indexOf(label as never)] ?? palette[6] }));

  return (
    <Screen title="Courses" subtitle={`en ${monthName()}`}>
      <Card>
        <CardHeader
          title="Budget"
          right={<IconButton name={editingBudget ? 'x' : 'edit-2'} onPress={() => setEditingBudget((v) => !v)} />}
        />
        <Row style={{ alignItems: 'baseline' }}>
          <BigNumber value={eur(spent)} />
          {budget > 0 && <Muted>/ {eur(budget)}</Muted>}
        </Row>
        {budget > 0 ? (
          <>
            <TickGauge ratio={ratio} color={gaugeColor} />
            <Stats
              items={[
                ['Reste', eur(Math.max(budget - spent, 0))],
                ['Utilisé', `${Math.round(ratio * 100)} %`],
                ['Achats', String(purchases.length)],
              ]}
            />
            {ratio >= 0.8 && (
              <Row>
                <Feather name="alert-circle" size={15} color={ratio >= 1 ? colors.rust : colors.clay} />
                <Text style={[s.muted, { color: ratio >= 1 ? colors.rust : colors.clay }]}>
                  {ratio >= 1 ? `Budget dépassé de ${eur(spent - budget)}` : 'Plus que 20 % du budget disponible'}
                </Text>
              </Row>
            )}
          </>
        ) : (
          !editingBudget && <Muted>Fixe un budget mensuel pour suivre tes dépenses.</Muted>
        )}
        {(editingBudget || budget === 0) && (
          <Row>
            <Field placeholder="Budget mensuel en €" keyboardType="decimal-pad" value={budgetInput} onChangeText={setBudgetInput} />
            <IconButton name="check" dark onPress={saveBudget} />
          </Row>
        )}
      </Card>

      {byCategory.length > 0 && (
        <Card>
          <CardHeader title="Répartition" right={<Muted>{byCategory.length} catégories</Muted>} />
          <SegmentBar items={byCategory} />
        </Card>
      )}

      <Card>
        <CardHeader title="Nouvel achat" />
        <Field placeholder="Article, ex. tomates" value={name} onChangeText={setName} />
        <Row>
          <Field placeholder="Prix €" keyboardType="decimal-pad" value={price} onChangeText={setPrice} style={{ flex: 1 }} />
          <Field placeholder="Magasin" value={store} onChangeText={setStore} style={{ flex: 1.4 }} />
        </Row>
        <TextTabs options={CATEGORIES.map((c) => ({ value: c, label: c }))} value={category} onChange={setCategory} />
        <View style={{ gap: 10 }}>
          <Muted>Se conserve</Muted>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {EXPIRY.map((e) => (
              <Tag key={e.value} label={e.label} active={expiry === e.value} onPress={() => setExpiry(e.value)} />
            ))}
          </View>
        </View>
        <PillButton label="Ajouter" icon="plus" onPress={addPurchase} loading={saving} />
      </Card>

      <Card style={{ gap: 12 }}>
        <CardHeader title="Achats du mois" />
        {purchases.length === 0 && <Muted>Aucun achat pour l’instant.</Muted>}
        {purchases.map((p, i) => (
          <View key={p.id} style={{ gap: 12 }}>
            {i > 0 && <Divider />}
            <Pressable onLongPress={() => remove(p)} style={s.listRow}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[s.bold, !p.in_stock && { color: colors.inkSoft }]}>{p.name}</Text>
                <Muted>
                  {[p.store ?? fmtDate(p.purchased_on), p.expires_on && `jusqu’au ${fmtDate(p.expires_on)}`].filter(Boolean).join(' · ')}
                </Muted>
              </View>
              <Text style={s.bold}>{eur(p.price)}</Text>
              <Pressable onPress={() => toggleStock(p)} hitSlop={10} accessibilityLabel={p.in_stock ? 'Marquer comme utilisé' : 'Remettre au frigo'}>
                <Feather name={p.in_stock ? 'circle' : 'check-circle'} size={20} color={p.in_stock ? colors.muted : colors.forest} />
              </Pressable>
            </Pressable>
          </View>
        ))}
        {purchases.length > 0 && <Muted>Coche un article une fois utilisé · appui long pour le supprimer.</Muted>}
      </Card>
    </Screen>
  );
}
