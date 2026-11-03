import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

import { Button, Card, Input, Muted, Screen, colors, styles } from '@/components/ui';
import { fmtDate, today } from '@/lib/dates';
import { supabase } from '@/lib/supabase';
import type { Profile, WeightEntry, WeightMode } from '@/lib/types';
import { useUserId } from '@/providers/AuthProvider';

const MODES: { value: WeightMode; label: string }[] = [
  { value: 'lose', label: 'Perte' },
  { value: 'gain', label: 'Prise' },
  { value: 'keep', label: 'Maintien' },
];

export default function ProfileScreen() {
  const userId = useUserId();
  const { width } = useWindowDimensions();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [p, w] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('weight_entries').select('id, measured_on, weight_kg').order('measured_on').limit(60),
    ]);
    if (p.data) {
      setProfile(p.data);
      setGoal(p.data.weight_goal_kg?.toString() ?? '');
    }
    setEntries(w.data ?? []);
  }, [userId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function updateProfile(patch: Partial<Profile>) {
    const { error } = await supabase.from('profiles').update(patch).eq('id', userId);
    if (error) Alert.alert('Erreur', error.message);
    else setProfile((p) => (p ? { ...p, ...patch } : p));
  }

  async function addWeight() {
    const kg = Number(weight.replace(',', '.'));
    if (!kg) return;
    setSaving(true);
    // Une seule pesée par jour : on remplace celle du jour si elle existe.
    const { error } = await supabase
      .from('weight_entries')
      .upsert({ user_id: userId, measured_on: today(), weight_kg: kg }, { onConflict: 'user_id,measured_on' });
    setSaving(false);
    if (error) return Alert.alert('Erreur', error.message);
    setWeight('');
    load();
  }

  const last = entries.at(-1)?.weight_kg;
  const first = entries[0]?.weight_kg;
  const target = profile?.weight_goal_kg ?? null;
  const values = entries.map((e) => Number(e.weight_kg));
  const min = Math.floor(Math.min(...values, target ?? Infinity) - 1);

  let goalText = '';
  if (last != null && target != null) {
    const rest = target - last;
    const reached =
      (profile?.weight_mode === 'lose' && rest >= 0) ||
      (profile?.weight_mode === 'gain' && rest <= 0) ||
      (profile?.weight_mode === 'keep' && Math.abs(rest) <= 1);
    goalText = reached ? '🎉 Objectif atteint !' : `Encore ${Math.abs(rest).toFixed(1)} kg ${rest < 0 ? 'à perdre' : 'à prendre'}`;
  }

  return (
    <Screen>
      <Card title={`Salut ${profile?.username ?? ''} 👋`} right={<Pressable onPress={() => supabase.auth.signOut()}><Text style={styles.muted}>Déconnexion</Text></Pressable>}>
        <Muted>Ton objectif</Muted>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {MODES.map((m) => (
            <Button
              key={m.value}
              label={m.label}
              variant={profile?.weight_mode === m.value ? 'primary' : 'ghost'}
              onPress={() => updateProfile({ weight_mode: m.value })}
              style={{ flex: 1 }}
            />
          ))}
        </View>
        <View style={styles.row}>
          <Input placeholder="Poids cible (kg)" keyboardType="decimal-pad" value={goal} onChangeText={setGoal} />
          <Button label="OK" onPress={() => updateProfile({ weight_goal_kg: Number(goal.replace(',', '.')) || null })} />
        </View>
      </Card>

      <Card title="Pesée du jour">
        <View style={styles.row}>
          <Input placeholder="kg" keyboardType="decimal-pad" value={weight} onChangeText={setWeight} />
          <Button label="Ajouter" onPress={addWeight} loading={saving} />
        </View>
        {last != null ? (
          <View>
            <Text style={styles.big}>{Number(last).toFixed(1)} kg</Text>
            <Muted>
              {first != null && `${last - first >= 0 ? '+' : ''}${(last - first).toFixed(1)} kg depuis le début`}
              {goalText && ` · ${goalText}`}
            </Muted>
          </View>
        ) : (
          <Muted>Aucune pesée pour l'instant.</Muted>
        )}
      </Card>

      {entries.length >= 2 && (
        <Card title="Évolution">
          <LineChart
            data={entries.map((e) => ({ value: Number(e.weight_kg) - min, label: fmtDate(e.measured_on) }))}
            yAxisOffset={0}
            formatYLabel={(v) => (Number(v) + min).toFixed(0)}
            width={width - 100}
            height={180}
            adjustToWidth
            curved
            color={colors.green}
            dataPointsColor={colors.green}
            thickness={3}
            hideRules
            xAxisLabelTextStyle={{ fontSize: 9, color: colors.muted }}
            showReferenceLine1={target != null}
            referenceLine1Position={target != null ? target - min : 0}
            referenceLine1Config={{ color: colors.orange, dashWidth: 4, dashGap: 4 }}
          />
          {target != null && <Muted>— — objectif {target} kg</Muted>}
        </Card>
      )}

      {entries.length > 0 && (
        <Card title="Dernières pesées">
          {[...entries].reverse().slice(0, 7).map((e) => (
            <View key={e.id} style={styles.listItem}>
              <Text style={[styles.bold, { flex: 1 }]}>{Number(e.weight_kg).toFixed(1)} kg</Text>
              <Muted>{fmtDate(e.measured_on)}</Muted>
            </View>
          ))}
        </Card>
      )}
    </Screen>
  );
}
