import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { Button, Card, Gauge, Input, Muted, Screen, colors, styles } from '@/components/ui';
import { CATEGORIES } from '@/lib/catalog';
import { addDays, eur, fmtDate, monthStart, today } from '@/lib/dates';
import { supabase } from '@/lib/supabase';
import type { Purchase } from '@/lib/types';
import { useUserId } from '@/providers/AuthProvider';

export default function CoursesScreen() {
  const userId = useUserId();
  const [budget, setBudget] = useState(0);
  const [budgetInput, setBudgetInput] = useState('');
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  // Formulaire
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [store, setStore] = useState('');
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [expiresIn, setExpiresIn] = useState('');
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
    setPurchases(list.data ?? []);
  }, [userId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const spent = purchases.reduce((s, p) => s + Number(p.price), 0);
  const ratio = budget ? spent / budget : 0;

  async function saveBudget() {
    const value = Number(budgetInput.replace(',', '.')) || 0;
    const { error } = await supabase.from('profiles').update({ monthly_budget: value }).eq('id', userId);
    if (error) Alert.alert('Erreur', error.message);
    else setBudget(value);
  }

  async function addPurchase() {
    const value = Number(price.replace(',', '.'));
    if (!name.trim() || !(value >= 0) || price === '') {
      Alert.alert('Oups', 'Indique au moins le nom et le prix.');
      return;
    }
    setSaving(true);
    const days = parseInt(expiresIn, 10);
    const { error } = await supabase.from('purchases').insert({
      name: name.trim(),
      price: value,
      store: store.trim() || null,
      category,
      purchased_on: today(),
      expires_on: days >= 0 ? addDays(today(), days) : null,
    });
    setSaving(false);
    if (error) return Alert.alert('Erreur', error.message);

    if (budget && spent / budget < 0.8 && (spent + value) / budget >= 0.8) {
      Alert.alert('⚠️ Budget', 'Tu as atteint 80 % de ton budget courses du mois.');
    }
    setName('');
    setPrice('');
    setExpiresIn('');
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
    purchases.reduce<Record<string, number>>((acc, p) => ({ ...acc, [p.category]: (acc[p.category] ?? 0) + Number(p.price) }), {}),
  ).sort((a, b) => b[1] - a[1]);

  return (
    <Screen>
      <Card title="Budget du mois">
        <View style={styles.row}>
          <Text style={styles.big}>{eur(spent)}</Text>
          {budget > 0 && <Muted>sur {eur(budget)}</Muted>}
        </View>
        {budget > 0 && (
          <>
            <Gauge ratio={ratio} />
            <Muted>Reste : {eur(Math.max(budget - spent, 0))}</Muted>
            {ratio >= 1 ? (
              <View style={[styles.alert, { backgroundColor: colors.redLight }]}>
                <Text style={{ color: colors.red }}>Budget dépassé de {eur(spent - budget)} !</Text>
              </View>
            ) : ratio >= 0.8 ? (
              <View style={[styles.alert, { backgroundColor: colors.orangeLight }]}>
                <Text style={{ color: '#92400e' }}>Attention : {Math.round(ratio * 100)} % du budget utilisé.</Text>
              </View>
            ) : null}
          </>
        )}
        <View style={styles.row}>
          <Input placeholder="Budget mensuel (€)" keyboardType="decimal-pad" value={budgetInput} onChangeText={setBudgetInput} />
          <Button label="OK" onPress={saveBudget} />
        </View>
      </Card>

      <Card title="Ajouter un achat">
        <Input placeholder="Article (ex : tomates)" value={name} onChangeText={setName} />
        <View style={styles.row}>
          <Input placeholder="Prix €" keyboardType="decimal-pad" value={price} onChangeText={setPrice} />
          <Input placeholder="Magasin" value={store} onChangeText={setStore} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {CATEGORIES.map((c) => (
            <Pressable key={c} onPress={() => setCategory(c)} style={[styles.chip, c !== category && { backgroundColor: colors.border }]}>
              <Text style={styles.text}>{c}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Input placeholder="Périme dans … jours (optionnel)" keyboardType="number-pad" value={expiresIn} onChangeText={setExpiresIn} />
        <Button label="Ajouter" onPress={addPurchase} loading={saving} />
        <Muted>📷 Scan de ticket avec Gemini : prochaine étape.</Muted>
      </Card>

      <Card title="Achats du mois">
        {byCategory.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {byCategory.map(([c, v]) => (
              <View key={c} style={styles.chip}>
                <Text style={{ fontSize: 12, color: colors.text }}>{c} : {eur(v)}</Text>
              </View>
            ))}
          </View>
        )}
        {purchases.length === 0 && <Muted>Aucun achat ce mois-ci.</Muted>}
        {purchases.map((p) => (
          <Pressable key={p.id} onLongPress={() => remove(p)} style={styles.listItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.bold}>{p.name}</Text>
              <Muted>
                {fmtDate(p.purchased_on)}
                {p.store ? ` · ${p.store}` : ''}
                {p.expires_on ? ` · périme le ${fmtDate(p.expires_on)}` : ''}
              </Muted>
            </View>
            <Text style={styles.bold}>{eur(p.price)}</Text>
            <Pressable onPress={() => toggleStock(p)} hitSlop={8}>
              <Text style={{ fontSize: 18 }}>{p.in_stock ? '🧊' : '✔️'}</Text>
            </Pressable>
          </Pressable>
        ))}
        {purchases.length > 0 && <Muted>🧊 = encore au frigo (servira aux recettes) · appui long pour supprimer</Muted>}
      </Card>
    </Screen>
  );
}
