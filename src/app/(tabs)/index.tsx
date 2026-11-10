import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Text, View, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

import { AccountCard } from '@/components/AccountCard';
import { ModulesCard } from '@/components/ModulesCard';
import { Ruler } from '@/components/Ruler';
import {
  BigNumber,
  Card,
  CardHeader,
  Divider,
  IconButton,
  Muted,
  PillButton,
  Row,
  Screen,
  Stats,
  TextTabs,
  TickGauge,
} from '@/components/ui';
import { fmtDate, today } from '@/lib/dates';
import { supabase } from '@/lib/supabase';
import type { Profile, WeightEntry, WeightMode } from '@/lib/types';
import { useUserId } from '@/providers/AuthProvider';
import { useModules } from '@/providers/ModulesProvider';
import { useTheme } from '@/theme';

const MODES: { value: WeightMode; label: string }[] = [
  { value: 'lose', label: 'Perte de poids' },
  { value: 'gain', label: 'Prise de poids' },
  { value: 'keep', label: 'Maintien' },
];

const kg = (n: number) => n.toFixed(1).replace('.', ',');
const longDate = () => new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });

export default function ProfileScreen() {
  const { colors, s } = useTheme();
  const userId = useUserId();
  const { width } = useWindowDimensions();
  const { has } = useModules();
  const showWeight = has('weight');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [picked, setPicked] = useState(60);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [p, w] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      // Les pesées ne sont lues que si le suivi du poids est activé.
      showWeight
        ? supabase.from('weight_entries').select('id, measured_on, weight_kg').order('measured_on').limit(60)
        : Promise.resolve({ data: [] as WeightEntry[] }),
    ]);
    const list: WeightEntry[] = (w.data ?? []).map((e) => ({ ...e, weight_kg: Number(e.weight_kg) }));
    if (p.data) setProfile({ ...p.data, weight_goal_kg: p.data.weight_goal_kg != null ? Number(p.data.weight_goal_kg) : null });
    setEntries(list);
    if (!loaded) setPicked(list.at(-1)?.weight_kg ?? 60);
    setLoaded(true);
  }, [userId, loaded, showWeight]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function updateProfile(patch: Partial<Profile>) {
    setProfile((p) => (p ? { ...p, ...patch } : p));
    const { error } = await supabase.from('profiles').update(patch).eq('id', userId);
    if (error) Alert.alert('Erreur', error.message);
  }

  async function saveWeight() {
    setSaving(true);
    // Une pesée par jour : celle du jour est remplacée si elle existe déjà.
    const { error } = await supabase
      .from('weight_entries')
      .upsert({ user_id: userId, measured_on: today(), weight_kg: picked }, { onConflict: 'user_id,measured_on' });
    setSaving(false);
    if (error) return Alert.alert('Erreur', error.message);
    load();
  }

  const last = entries.at(-1)?.weight_kg ?? null;
  const first = entries[0]?.weight_kg ?? null;
  const target = profile?.weight_goal_kg ?? null;

  // Progression vers l'objectif, du premier poids enregistré jusqu'à la cible.
  let progress = 0;
  if (last != null && first != null && target != null && first !== target) {
    progress = (first - last) / (first - target);
  }
  const remaining = last != null && target != null ? Math.abs(target - last) : null;

  const values = entries.map((e) => e.weight_kg);
  const floor = Math.floor(Math.min(...values, target ?? Infinity) - 1);

  return (
    <Screen
      eyebrow="Aujourd’hui"
      title={longDate()}
      subtitle={profile?.username ? `Salut ${profile.username}` : 'Ton profil'}
      right={<IconButton name="log-out" onPress={() => supabase.auth.signOut()} />}
    >
      {showWeight && (
        <>
          <Card>
            <CardHeader title="Poids" right={<Muted>{entries.length ? fmtDate(entries.at(-1)!.measured_on) : '—'}</Muted>} />
            {last != null ? (
              <>
                <Row style={{ alignItems: 'baseline' }}>
                  <BigNumber value={kg(last)} />
                  {target != null && <Muted>{kg(target)} kg visés</Muted>}
                </Row>
                <TickGauge ratio={progress} />
                <Stats
                  items={[
                    ['Départ', first != null ? kg(first) : '—'],
                    ['Écart', first != null ? `${last - first > 0 ? '+' : ''}${kg(last - first)}` : '—'],
                    ['Reste', remaining != null ? kg(remaining) : '—'],
                  ]}
                />
              </>
            ) : (
              <Muted>Aucune pesée pour l’instant. Fais glisser la règle ci-dessous pour enregistrer la première.</Muted>
            )}
          </Card>

          <Card>
            <CardHeader title="Nouvelle pesée" right={<Muted>{fmtDate(today())}</Muted>} />
            {loaded && <Ruler key={String(loaded)} value={picked} onChange={setPicked} />}
            <PillButton label="Enregistrer la pesée" icon="arrow-right" onPress={saveWeight} loading={saving} />
            <PillButton label="Définir comme objectif" variant="light" onPress={() => updateProfile({ weight_goal_kg: picked })} />
          </Card>

          <Card>
            <CardHeader title="Objectif" />
            <TextTabs options={MODES} value={profile?.weight_mode ?? 'lose'} onChange={(m) => updateProfile({ weight_mode: m })} />
          </Card>

          {entries.length >= 2 && (
            <Card>
              <CardHeader title="Évolution" right={<Muted>{entries.length} pesées</Muted>} />
              <LineChart
                data={entries.map((e) => ({ value: e.weight_kg - floor }))}
                formatYLabel={(v) => String(Math.round(Number(v) + floor))}
                width={width - 112}
                height={160}
                adjustToWidth
                curved
                hideDataPoints
                color={colors.forest}
                thickness={2}
                hideRules
                yAxisColor="transparent"
                xAxisColor={colors.line}
                yAxisTextStyle={{ color: colors.inkSoft, fontSize: 11 }}
                noOfSections={4}
                showReferenceLine1={target != null}
                referenceLine1Position={target != null ? target - floor : 0}
                referenceLine1Config={{ color: colors.clay, dashWidth: 3, dashGap: 5, thickness: 1 }}
              />
            </Card>
          )}

          {entries.length > 0 && (
            <Card style={{ gap: 12 }}>
              <CardHeader title="Historique" />
              {[...entries].reverse().slice(0, 6).map((e, i) => (
                <View key={e.id} style={{ gap: 12 }}>
                  {i > 0 && <Divider />}
                  <View style={s.rowBetween}>
                    <Text style={s.body}>{fmtDate(e.measured_on)}</Text>
                    <Text style={s.bold}>{kg(e.weight_kg)} kg</Text>
                  </View>
                </View>
              ))}
            </Card>
          )}
        </>
      )}

      <ModulesCard />
      <AccountCard />
    </Screen>
  );
}
