import Feather from '@expo/vector-icons/Feather';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, type } from '@/theme';

export { colors };
export type IconName = ComponentProps<typeof Feather>['name'];

/* ---------- Mise en page ---------- */

/** Écran avec grand titre éditorial sur deux lignes (encre puis gris). */
export function Screen({
  eyebrow,
  title,
  subtitle,
  right,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={[s.screenContent, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 120 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          {eyebrow && <Text style={s.display}>{eyebrow}</Text>}
          <Text style={s.display}>{title}</Text>
          {subtitle && <Text style={[s.display, { color: colors.inkSoft }]}>{subtitle}</Text>}
        </View>
        {right}
      </View>
      {children}
    </ScrollView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function CardHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View style={s.rowBetween}>
      <Text style={s.cardTitle}>{title}</Text>
      {right}
    </View>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.row, style]}>{children}</View>;
}

/* ---------- Texte ---------- */

export function Muted({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <Text style={[s.muted, style as object]}>{children}</Text>;
}

/** Grand chiffre + unité discrète, ex. « 64,2 kg ». */
export function BigNumber({ value, unit }: { value: string; unit?: string }) {
  return (
    <Text style={s.number}>
      {value}
      {unit && <Text style={s.unit}> {unit}</Text>}
    </Text>
  );
}

/** Ligne de statistiques : « Protein 154   Fats 154   Carbs 154 ». */
export function Stats({ items }: { items: [string, string][] }) {
  return (
    <View style={s.stats}>
      {items.map(([label, value]) => (
        <Text key={label} style={s.statLabel}>
          {label} <Text style={s.statValue}>{value}</Text>
        </Text>
      ))}
    </View>
  );
}

/* ---------- Boutons ---------- */

export function IconButton({ name, onPress, dark }: { name: IconName; onPress?: () => void; dark?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [s.iconButton, dark && { backgroundColor: colors.ink }, pressed && s.pressed]}
    >
      <Feather name={name} size={19} color={dark ? '#fff' : colors.ink} />
    </Pressable>
  );
}

type PillProps = {
  label: string;
  onPress: () => void;
  variant?: 'dark' | 'light' | 'butter';
  icon?: IconName;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function PillButton({ label, onPress, variant = 'dark', icon, loading, style }: PillProps) {
  const bg = variant === 'dark' ? colors.ink : variant === 'butter' ? colors.butter : colors.soft;
  const fg = variant === 'dark' ? '#fff' : colors.ink;
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [s.pill, { backgroundColor: bg }, pressed && s.pressed, style]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          <Text style={[s.pillText, { color: fg }]}>{label}</Text>
          {icon && (
            <View style={[s.pillIcon, { backgroundColor: variant === 'dark' ? '#fff' : colors.ink }]}>
              <Feather name={icon} size={14} color={variant === 'dark' ? colors.ink : '#fff'} />
            </View>
          )}
        </>
      )}
    </Pressable>
  );
}

/** Onglets texte façon « All  Breakfast  Lunch » : actif en encre, inactifs en gris. */
export function TextTabs<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 20 }}>
      {options.map((o) => (
        <Pressable key={o.value} onPress={() => onChange(o.value)} hitSlop={8}>
          <Text style={[s.tab, o.value === value && { color: colors.ink }]}>{o.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

/** Choix exclusif en cartes : titre + description, l'option active passe en encre. */
export function Choice<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; hint: string; icon: IconName }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            style={({ pressed }) => [s.choice, active && { backgroundColor: colors.ink }, pressed && s.pressed]}
          >
            <Feather name={o.icon} size={18} color={active ? '#fff' : colors.ink} />
            <Text style={[s.bold, active && { color: '#fff' }]}>{o.label}</Text>
            <Text style={[s.muted, active && { color: '#C9D1CC' }]}>{o.hint}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Petite pilule contour (étiquette), cliquable si onPress. */
export function Tag({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [s.tag, active && { backgroundColor: colors.ink, borderColor: colors.ink }, pressed && s.pressed]}
    >
      <Text style={[s.tagText, active && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

/* ---------- Champs ---------- */

export function Field(props: TextInputProps) {
  return <TextInput placeholderTextColor={colors.muted} {...props} style={[s.field, props.style]} />;
}

/* ---------- Visualisations ---------- */

/** Jauge en barres verticales (style « calories »). */
export function TickGauge({ ratio, color = colors.forest, count = 34 }: { ratio: number; color?: string; count?: number }) {
  const filled = Math.round(Math.max(0, Math.min(ratio, 1)) * count);
  return (
    <View style={s.ticks}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={[s.tick, { backgroundColor: i < filled ? color : colors.track }]} />
      ))}
    </View>
  );
}

/** Barre segmentée + légende à points (répartition). */
export function SegmentBar({ items }: { items: { label: string; value: number; color: string; display: string }[] }) {
  const total = items.reduce((t, i) => t + i.value, 0) || 1;
  return (
    <View style={{ gap: 12 }}>
      <View style={s.segment}>
        {items.map((i) => (
          <View key={i.label} style={{ flex: i.value / total, backgroundColor: i.color }} />
        ))}
      </View>
      {items.map((i) => (
        <View key={i.label} style={s.rowBetween}>
          <Row style={{ gap: 10 }}>
            <View style={[s.dot, { backgroundColor: i.color }]} />
            <Text style={s.body}>{i.label}</Text>
          </Row>
          <Text style={s.body}>{i.display}</Text>
        </View>
      ))}
    </View>
  );
}

export function Divider() {
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.line }} />;
}

/* ---------- Styles partagés ---------- */

export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  screenContent: { paddingHorizontal: 16, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 4, marginBottom: 12, gap: 12 },
  display: { ...type.display, color: colors.ink },
  card: { backgroundColor: colors.card, borderRadius: radius.card, padding: 20, gap: 16 },
  cardTitle: { ...type.label, fontSize: 17, color: colors.ink },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  muted: { ...type.small, color: colors.inkSoft },
  body: { ...type.body, color: colors.ink },
  bold: { ...type.label, color: colors.ink },
  title: { ...type.title, color: colors.ink },
  number: { ...type.number, color: colors.ink },
  unit: { fontSize: 15, fontWeight: '400', letterSpacing: 0, color: colors.inkSoft },
  stats: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 22, rowGap: 6 },
  statLabel: { ...type.body, color: colors.inkSoft },
  statValue: { color: colors.ink, fontWeight: '600' },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    height: 54,
    borderRadius: radius.pill,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  pillText: { ...type.label },
  pillIcon: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.6 },
  tab: { fontSize: 15, fontWeight: '500', color: colors.inkSoft },
  choice: { flex: 1, borderRadius: 20, padding: 14, gap: 6, backgroundColor: colors.soft },
  tag: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  tagText: { fontSize: 13, color: colors.ink },
  field: {
    height: 52,
    borderRadius: radius.field,
    paddingHorizontal: 16,
    backgroundColor: colors.soft,
    color: colors.ink,
    fontSize: 15,
    // Grandit dans une rangée, peut rétrécir sans déborder, garde sa hauteur seul sur sa ligne.
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  ticks: { flexDirection: 'row', justifyContent: 'space-between', height: 46 },
  tick: { width: 4, borderRadius: 2 },
  segment: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', gap: 2 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
