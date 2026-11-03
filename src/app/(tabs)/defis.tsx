import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, Share, Text, View } from 'react-native';

import { Button, Card, Gauge, Input, Muted, Screen, colors, styles } from '@/components/ui';
import { CHALLENGES, FIBER_SHORTCUTS } from '@/lib/catalog';
import { addDays, daysBetween, fmtDate, today } from '@/lib/dates';
import { supabase } from '@/lib/supabase';
import type { Challenge, ChallengeType, Checkin, LeaderboardRow } from '@/lib/types';
import { useUserId } from '@/providers/AuthProvider';

const DURATIONS = [7, 14, 21, 30];

/** Nombre de jours réussis d'affilée jusqu'à aujourd'hui (aujourd'hui non validé ne casse pas la série). */
function computeStreak(checkins: Checkin[], start: string): number {
  const ok = new Set(checkins.filter((c) => c.success).map((c) => c.day));
  let streak = 0;
  for (let d = today(); d >= start; d = addDays(d, -1)) {
    if (ok.has(d)) streak++;
    else if (d !== today()) break;
  }
  return streak;
}

export default function DefisScreen() {
  const userId = useUserId();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mine, setMine] = useState<Checkin[]>([]);
  const [board, setBoard] = useState<LeaderboardRow[]>([]);

  const [newType, setNewType] = useState<ChallengeType>('no_sugar');
  const [newDays, setNewDays] = useState(21);
  const [code, setCode] = useState('');
  const [fiberInput, setFiberInput] = useState('');
  const [busy, setBusy] = useState(false);

  const selected = challenges.find((c) => c.id === selectedId) ?? null;

  const loadChallenges = useCallback(async () => {
    const { data } = await supabase.from('challenges').select('*').order('ends_on', { ascending: false });
    const list = data ?? [];
    setChallenges(list);
    setSelectedId((id) => (id && list.some((c) => c.id === id) ? id : list.find((c) => c.ends_on >= today())?.id ?? list[0]?.id ?? null));
  }, []);

  const loadDetails = useCallback(async (cid: string) => {
    const [c, b] = await Promise.all([
      supabase.from('challenge_checkins').select('challenge_id, user_id, day, success, fiber_g').eq('challenge_id', cid).eq('user_id', userId),
      supabase.from('challenge_leaderboard').select('*').eq('challenge_id', cid).order('days_success', { ascending: false }),
    ]);
    setMine(c.data ?? []);
    setBoard(b.data ?? []);
  }, [userId]);

  useFocusEffect(useCallback(() => { loadChallenges(); }, [loadChallenges]));
  useFocusEffect(useCallback(() => { if (selectedId) loadDetails(selectedId); }, [selectedId, loadDetails]));

  async function create() {
    setBusy(true);
    const def = CHALLENGES[newType];
    const { data, error } = await supabase
      .from('challenges')
      .insert({ type: newType, title: `${def.emoji} ${def.label} – ${newDays} jours`, starts_on: today(), ends_on: addDays(today(), newDays - 1) })
      .select()
      .single();
    setBusy(false);
    if (error) return Alert.alert('Erreur', error.message);
    setSelectedId(data.id);
    loadChallenges();
    invite(data);
  }

  async function join() {
    if (!code.trim()) return;
    setBusy(true);
    const { data, error } = await supabase.rpc('join_challenge', { code: code.trim() });
    setBusy(false);
    if (error) return Alert.alert('Erreur', error.message);
    setCode('');
    setSelectedId(data as string);
    loadChallenges();
  }

  function invite(c: Challenge) {
    Share.share({ message: `Rejoins mon défi « ${c.title} » sur MobileCoach avec le code ${c.invite_code} 💪` });
  }

  async function checkin(patch: { success?: boolean; addFiber?: number }) {
    if (!selected) return;
    const current = mine.find((c) => c.day === today());
    const fiber = Number(current?.fiber_g ?? 0) + (patch.addFiber ?? 0);
    const success = CHALLENGES[selected.type].tracksFiber ? fiber >= Number(selected.fiber_goal_g) : !!patch.success;
    const { error } = await supabase
      .from('challenge_checkins')
      .upsert(
        { challenge_id: selected.id, user_id: userId, day: today(), success, fiber_g: fiber },
        { onConflict: 'challenge_id,user_id,day' },
      );
    if (error) return Alert.alert('Erreur', error.message);
    if (CHALLENGES[selected.type].tracksFiber && success && !current?.success) Alert.alert('🎉', 'Objectif fibres du jour atteint !');
    setFiberInput('');
    loadDetails(selected.id);
  }

  function leave() {
    if (!selected) return;
    Alert.alert('Quitter le défi', 'Tes check-ins seront conservés mais tu ne verras plus ce défi.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Quitter',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('user_challenges').delete().eq('challenge_id', selected.id).eq('user_id', userId);
          setSelectedId(null);
          loadChallenges();
        },
      },
    ]);
  }

  return (
    <Screen>
      {challenges.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {challenges.map((c) => (
            <Pressable key={c.id} onPress={() => setSelectedId(c.id)} style={[styles.chip, c.id !== selectedId && { backgroundColor: colors.border }]}>
              <Text style={styles.text}>{c.title}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {selected && <ChallengeCard challenge={selected} mine={mine} board={board} userId={userId} fiberInput={fiberInput} setFiberInput={setFiberInput} onCheckin={checkin} onInvite={() => invite(selected)} onLeave={leave} />}

      <Card title="Lancer un défi">
        <View style={{ gap: 6 }}>
          {(Object.keys(CHALLENGES) as ChallengeType[]).map((t) => (
            <Button key={t} label={`${CHALLENGES[t].emoji} ${CHALLENGES[t].label}`} variant={t === newType ? 'primary' : 'ghost'} onPress={() => setNewType(t)} />
          ))}
        </View>
        <Muted>{CHALLENGES[newType].rule}</Muted>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {DURATIONS.map((d) => (
            <Button key={d} label={`${d} j`} variant={d === newDays ? 'primary' : 'ghost'} onPress={() => setNewDays(d)} style={{ flex: 1 }} />
          ))}
        </View>
        <Button label="C'est parti 💪" onPress={create} loading={busy} />
      </Card>

      <Card title="Rejoindre un ami">
        <View style={styles.row}>
          <Input placeholder="Code (ex : A1B2C3)" autoCapitalize="characters" value={code} onChangeText={setCode} />
          <Button label="Rejoindre" onPress={join} loading={busy} />
        </View>
      </Card>
    </Screen>
  );
}

type CardProps = {
  challenge: Challenge;
  mine: Checkin[];
  board: LeaderboardRow[];
  userId: string;
  fiberInput: string;
  setFiberInput: (v: string) => void;
  onCheckin: (patch: { success?: boolean; addFiber?: number }) => void;
  onInvite: () => void;
  onLeave: () => void;
};

function ChallengeCard({ challenge: c, mine, board, userId, fiberInput, setFiberInput, onCheckin, onInvite, onLeave }: CardProps) {
  const def = CHALLENGES[c.type];
  const total = daysBetween(c.starts_on, c.ends_on) + 1;
  const dayIndex = Math.min(daysBetween(c.starts_on, today()) + 1, total);
  const finished = today() > c.ends_on;
  const todayCheckin = mine.find((x) => x.day === today());
  const byDay = new Map(mine.map((x) => [x.day, x]));
  const successCount = mine.filter((x) => x.success).length;

  return (
    <Card title={c.title} right={<Muted>{finished ? 'Terminé' : `Jour ${dayIndex}/${total}`}</Muted>}>
      <Muted>{def.rule}</Muted>
      <View style={styles.row}>
        <Text style={styles.text}>🔥 Série : <Text style={styles.bold}>{computeStreak(mine, c.starts_on)} j</Text></Text>
        <Text style={styles.text}>✅ {successCount}/{total} jours</Text>
      </View>

      {/* Calendrier du défi */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
        {Array.from({ length: total }, (_, i) => {
          const d = addDays(c.starts_on, i);
          const ck = byDay.get(d);
          const bg = ck?.success ? colors.green : ck || d < today() ? colors.redLight : colors.border;
          return (
            <View key={d} style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', borderWidth: d === today() ? 2 : 0, borderColor: colors.green }}>
              <Text style={{ fontSize: 11, color: ck?.success ? '#fff' : colors.text }}>{i + 1}</Text>
            </View>
          );
        })}
      </View>

      {!finished && (def.tracksFiber ? (
        <View style={{ gap: 8 }}>
          <Text style={styles.text}>
            <Text style={styles.bold}>{Number(todayCheckin?.fiber_g ?? 0)} g</Text> / {Number(c.fiber_goal_g)} g de fibres aujourd'hui
          </Text>
          <Gauge ratio={Number(todayCheckin?.fiber_g ?? 0) / Number(c.fiber_goal_g)} color={colors.green} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {FIBER_SHORTCUTS.map((s) => (
              <Pressable key={s.label} onPress={() => onCheckin({ addFiber: s.grams })} style={styles.chip}>
                <Text style={{ fontSize: 12, color: colors.text }}>{s.label} +{s.grams} g</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.row}>
            <Input placeholder="Autre (g)" keyboardType="decimal-pad" value={fiberInput} onChangeText={setFiberInput} />
            <Button label="+" onPress={() => onCheckin({ addFiber: Number(fiberInput.replace(',', '.')) || 0 })} />
          </View>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          <Muted>
            Aujourd'hui : {todayCheckin ? (todayCheckin.success ? '✅ réussi' : '❌ raté') : 'pas encore validé'}
          </Muted>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button label="✅ Réussi" onPress={() => onCheckin({ success: true })} style={{ flex: 1 }} />
            <Button label="❌ Craqué" variant="danger" onPress={() => onCheckin({ success: false })} style={{ flex: 1 }} />
          </View>
        </View>
      ))}

      <Text style={[styles.bold, { marginTop: 6 }]}>🏆 Classement</Text>
      {board.map((r, i) => (
        <View key={r.user_id} style={styles.listItem}>
          <Text style={{ width: 24 }}>{['🥇', '🥈', '🥉'][i] ?? `${i + 1}.`}</Text>
          <Text style={[styles.text, { flex: 1 }, r.user_id === userId && styles.bold]}>
            {r.username ?? 'Anonyme'}{r.user_id === userId ? ' (toi)' : ''}
          </Text>
          <Text style={styles.bold}>{r.days_success} j</Text>
          {def.tracksFiber && <Muted>{Number(r.total_fiber_g)} g</Muted>}
        </View>
      ))}

      <Muted>Code d'invitation : {c.invite_code} · du {fmtDate(c.starts_on)} au {fmtDate(c.ends_on)}</Muted>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button label="📨 Inviter" variant="ghost" onPress={onInvite} style={{ flex: 1 }} />
        <Button label="Quitter" variant="ghost" onPress={onLeave} style={{ flex: 1 }} />
      </View>
    </Card>
  );
}
