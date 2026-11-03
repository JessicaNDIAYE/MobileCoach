import Feather from '@expo/vector-icons/Feather';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, Share, Text, View } from 'react-native';

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
  Stats,
  Tag,
  TextTabs,
  TickGauge,
  s,
} from '@/components/ui';
import { CHALLENGES, FIBER_SHORTCUTS } from '@/lib/catalog';
import { addDays, daysBetween, fmtDate, today } from '@/lib/dates';
import { supabase } from '@/lib/supabase';
import type { Challenge, ChallengeType, Checkin, LeaderboardRow } from '@/lib/types';
import { useUserId } from '@/providers/AuthProvider';
import { colors } from '@/theme';

const DURATIONS = [7, 14, 21, 30];

/** Jours réussis d'affilée jusqu'à aujourd'hui (aujourd'hui non validé ne casse pas la série). */
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
    const list: Challenge[] = data ?? [];
    setChallenges(list);
    setSelectedId((id) => (id && list.some((c) => c.id === id) ? id : list.find((c) => c.ends_on >= today())?.id ?? list[0]?.id ?? null));
  }, []);

  const loadDetails = useCallback(
    async (cid: string) => {
      const [c, b] = await Promise.all([
        supabase.from('challenge_checkins').select('challenge_id, user_id, day, success, fiber_g').eq('challenge_id', cid).eq('user_id', userId),
        supabase.from('challenge_leaderboard').select('*').eq('challenge_id', cid).order('days_success', { ascending: false }),
      ]);
      setMine((c.data ?? []).map((x) => ({ ...x, fiber_g: Number(x.fiber_g) })));
      setBoard(b.data ?? []);
    },
    [userId],
  );

  useFocusEffect(useCallback(() => { loadChallenges(); }, [loadChallenges]));
  useFocusEffect(useCallback(() => { if (selectedId) loadDetails(selectedId); }, [selectedId, loadDetails]));

  async function create() {
    setBusy(true);
    const { data, error } = await supabase
      .from('challenges')
      .insert({ type: newType, title: CHALLENGES[newType].label, starts_on: today(), ends_on: addDays(today(), newDays - 1) })
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
    Share.share({ message: `Rejoins mon défi « ${c.title} » sur MobileCoach avec le code ${c.invite_code}` });
  }

  async function checkin(patch: { success?: boolean; addFiber?: number }) {
    if (!selected) return;
    const current = mine.find((c) => c.day === today());
    const fiber = (current?.fiber_g ?? 0) + (patch.addFiber ?? 0);
    const tracksFiber = CHALLENGES[selected.type].tracksFiber;
    const success = tracksFiber ? fiber >= Number(selected.fiber_goal_g) : !!patch.success;
    const { error } = await supabase
      .from('challenge_checkins')
      .upsert({ challenge_id: selected.id, user_id: userId, day: today(), success, fiber_g: fiber }, { onConflict: 'challenge_id,user_id,day' });
    if (error) return Alert.alert('Erreur', error.message);
    if (tracksFiber && success && !current?.success) Alert.alert('Objectif atteint', 'Ta dose de fibres du jour est validée.');
    setFiberInput('');
    loadDetails(selected.id);
  }

  function leave() {
    if (!selected) return;
    Alert.alert('Quitter le défi', 'Tes validations sont conservées, mais tu ne verras plus ce défi.', [
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
    <Screen title="Défis" subtitle="entre amis">
      {challenges.length > 1 && (
        <View style={{ paddingHorizontal: 4, marginBottom: 4 }}>
          <TextTabs
            options={challenges.map((c) => ({ value: c.id, label: c.title }))}
            value={selectedId ?? ''}
            onChange={setSelectedId}
          />
        </View>
      )}

      {selected && (
        <ChallengeCard
          challenge={selected}
          mine={mine}
          board={board}
          userId={userId}
          fiberInput={fiberInput}
          setFiberInput={setFiberInput}
          onCheckin={checkin}
          onInvite={() => invite(selected)}
          onLeave={leave}
        />
      )}

      <Card>
        <CardHeader title="Nouveau défi" />
        <View style={{ gap: 4 }}>
          {(Object.keys(CHALLENGES) as ChallengeType[]).map((t, i) => {
            const def = CHALLENGES[t];
            const active = t === newType;
            return (
              <View key={t}>
                {i > 0 && <Divider />}
                <Pressable onPress={() => setNewType(t)} style={[s.listRow, { paddingVertical: 12 }]}>
                  <View style={[s.avatar, active && { backgroundColor: colors.ink }]}>
                    <Feather name={def.icon} size={18} color={active ? '#fff' : colors.ink} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={s.bold}>{def.label}</Text>
                    <Muted>{def.rule}</Muted>
                  </View>
                  <Feather name={active ? 'check-circle' : 'circle'} size={20} color={active ? colors.ink : colors.muted} />
                </Pressable>
              </View>
            );
          })}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {DURATIONS.map((d) => (
            <Tag key={d} label={`${d} jours`} active={d === newDays} onPress={() => setNewDays(d)} />
          ))}
        </View>
        <PillButton label="Lancer le défi" icon="arrow-right" onPress={create} loading={busy} />
      </Card>

      <Card>
        <CardHeader title="Rejoindre un ami" />
        <Row>
          <Field placeholder="Code, ex. A1B2C3" autoCapitalize="characters" value={code} onChangeText={setCode} />
          <IconButton name="arrow-right" dark onPress={join} />
        </Row>
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
  const fiberToday = todayCheckin?.fiber_g ?? 0;
  const goal = Number(c.fiber_goal_g);

  return (
    <>
      <Card>
        <View style={s.rowBetween}>
          <View style={[s.avatar, { backgroundColor: colors.ink }]}>
            <Feather name={def.icon} size={18} color="#fff" />
          </View>
          <Row>
            <IconButton name="share" onPress={onInvite} />
            <IconButton name="log-out" onPress={onLeave} />
          </Row>
        </View>
        <View style={{ gap: 4 }}>
          <Text style={s.title}>{c.title}</Text>
          <Muted>{def.rule}</Muted>
        </View>
        <Stats
          items={[
            ['Jour', finished ? 'terminé' : `${dayIndex}/${total}`],
            ['Série', `${computeStreak(mine, c.starts_on)} j`],
            ['Réussis', String(successCount)],
          ]}
        />

        {/* Calendrier du défi */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {Array.from({ length: total }, (_, i) => {
            const d = addDays(c.starts_on, i);
            const ck = byDay.get(d);
            // Aujourd'hui n'est « raté » que si on a explicitement craqué (défis oui/non).
            const missed = !ck?.success && (d < today() || (d === today() && !!ck && !def.tracksFiber));
            const bg = ck?.success ? colors.forest : missed ? colors.clayLight : colors.soft;
            return (
              <View
                key={d}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: bg,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: d === today() ? 1.5 : 0,
                  borderColor: colors.ink,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '500', color: ck?.success ? '#fff' : missed ? colors.clay : colors.inkSoft }}>{i + 1}</Text>
              </View>
            );
          })}
        </View>
      </Card>

      {!finished && (
        <Card>
          <CardHeader title="Aujourd’hui" right={<Muted>{fmtDate(today())}</Muted>} />
          {def.tracksFiber ? (
            <>
              <Row style={{ alignItems: 'baseline' }}>
                <BigNumber value={String(fiberToday).replace('.', ',')} unit="g" />
                <Muted>/ {goal} g de fibres</Muted>
              </Row>
              <TickGauge ratio={fiberToday / goal} />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {FIBER_SHORTCUTS.map((f) => (
                  <Tag key={f.label} label={`${f.label}  +${f.grams} g`} onPress={() => onCheckin({ addFiber: f.grams })} />
                ))}
              </View>
              <Row>
                <Field placeholder="Autre, en grammes" keyboardType="decimal-pad" value={fiberInput} onChangeText={setFiberInput} />
                <IconButton name="plus" dark onPress={() => onCheckin({ addFiber: Number(fiberInput.replace(',', '.')) || 0 })} />
              </Row>
            </>
          ) : (
            <>
              <Muted>
                {todayCheckin ? (todayCheckin.success ? 'Journée validée. Continue comme ça.' : 'Journée ratée, on repart demain.') : 'As-tu tenu le défi aujourd’hui ?'}
              </Muted>
              <Row>
                <PillButton
                  label="Réussi"
                  variant={todayCheckin?.success ? 'dark' : 'light'}
                  onPress={() => onCheckin({ success: true })}
                  style={{ flex: 1 }}
                />
                <PillButton
                  label="Craqué"
                  variant={todayCheckin && !todayCheckin.success ? 'dark' : 'light'}
                  onPress={() => onCheckin({ success: false })}
                  style={{ flex: 1 }}
                />
              </Row>
            </>
          )}
        </Card>
      )}

      <Card style={{ gap: 12 }}>
        <CardHeader title="Classement" right={<Tag label={c.invite_code} onPress={onInvite} />} />
        {board.map((r, i) => (
          <View key={r.user_id} style={{ gap: 12 }}>
            {i > 0 && <Divider />}
            <View style={s.listRow}>
              <View style={[s.avatar, i === 0 && { backgroundColor: colors.butter }]}>
                <Text style={s.bold}>{i + 1}</Text>
              </View>
              <Text style={[s.body, { flex: 1 }, r.user_id === userId && { fontWeight: '600' }]}>
                {r.username ?? 'Anonyme'}
                {r.user_id === userId ? ' (toi)' : ''}
              </Text>
              {def.tracksFiber && <Muted>{Number(r.total_fiber_g)} g</Muted>}
              <Text style={s.bold}>{r.days_success} j</Text>
            </View>
          </View>
        ))}
        <Muted>Du {fmtDate(c.starts_on)} au {fmtDate(c.ends_on)} · partage le code pour inviter</Muted>
      </Card>
    </>
  );
}
