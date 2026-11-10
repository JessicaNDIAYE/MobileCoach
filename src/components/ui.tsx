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

import { useTheme } from '@/theme';
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
  const { colors, s } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={[s.screenContent, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 120 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={[s.header, s.plate, { marginBottom: 12 }]}>
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

/** Surface unie pour le texte posé hors carte (transparente sur un fond uni). */
export function Plate({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { s } = useTheme();
  return <View style={[s.plate, style]}>{children}</View>;
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { s } = useTheme();
  return <View style={[s.card, style]}>{children}</View>;
}

export function CardHeader({ title, right }: { title: string; right?: ReactNode }) {
  const { s } = useTheme();
  return (
    <View style={s.rowBetween}>
      <Text style={s.cardTitle}>{title}</Text>
      {right}
    </View>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { s } = useTheme();
  return <View style={[s.row, style]}>{children}</View>;
}

/* ---------- Texte ---------- */

export function Muted({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { s } = useTheme();
  return <Text style={[s.muted, style as object]}>{children}</Text>;
}

/** Grand chiffre + unité discrète, ex. « 64,2 kg ». */
export function BigNumber({ value, unit }: { value: string; unit?: string }) {
  const { s } = useTheme();
  return (
    <Text style={s.number}>
      {value}
      {unit && <Text style={s.unit}> {unit}</Text>}
    </Text>
  );
}

/** Ligne de statistiques : « Protein 154   Fats 154   Carbs 154 ». */
export function Stats({ items }: { items: [string, string][] }) {
  const { s } = useTheme();
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
  const { colors, s } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [s.iconButton, dark && { backgroundColor: colors.ink }, pressed && s.pressed]}
    >
      <Feather name={name} size={19} color={dark ? colors.onInk : colors.ink} />
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
  const { colors, s } = useTheme();
  const bg = variant === 'dark' ? colors.ink : variant === 'butter' ? colors.butter : colors.soft;
  const fg = variant === 'dark' ? colors.onInk : variant === 'butter' ? colors.onButter : colors.ink;
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
            <View style={[s.pillIcon, { backgroundColor: fg }]}>
              <Feather name={icon} size={14} color={bg} />
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
  const { colors, s } = useTheme();
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
  const { colors, s } = useTheme();
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
            <Feather name={o.icon} size={18} color={active ? colors.onInk : colors.ink} />
            <Text style={[s.bold, active && { color: colors.onInk }]}>{o.label}</Text>
            <Text style={[s.muted, active && { color: colors.onInk, opacity: 0.8 }]}>{o.hint}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Petite pilule contour (étiquette), cliquable si onPress. */
export function Tag({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  const { colors, s } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [s.tag, active && { backgroundColor: colors.ink, borderColor: colors.ink }, pressed && s.pressed]}
    >
      <Text style={[s.tagText, active && { color: colors.onInk }]}>{label}</Text>
    </Pressable>
  );
}

/* ---------- Champs ---------- */

export function Field(props: TextInputProps) {
  const { colors, s } = useTheme();
  return <TextInput placeholderTextColor={colors.inkSoft} {...props} style={[s.field, props.style]} />;
}

/* ---------- Visualisations ---------- */

/** Jauge en barres verticales (style « calories »). */
export function TickGauge({ ratio, color, count = 34 }: { ratio: number; color?: string; count?: number }) {
  const { colors, s } = useTheme();
  const filled = Math.round(Math.max(0, Math.min(ratio, 1)) * count);
  return (
    <View style={s.ticks}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={[s.tick, { backgroundColor: i < filled ? (color ?? colors.forest) : colors.track }]} />
      ))}
    </View>
  );
}

/** Barre segmentée + légende à points (répartition). */
export function SegmentBar({ items }: { items: { label: string; value: number; color: string; display: string }[] }) {
  const { s } = useTheme();
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
  const { colors } = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.line }} />;
}
