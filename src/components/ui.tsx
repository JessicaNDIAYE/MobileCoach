import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

export const colors = {
  green: '#16a34a',
  greenLight: '#dcfce7',
  orange: '#f59e0b',
  orangeLight: '#fef3c7',
  red: '#dc2626',
  redLight: '#fee2e2',
  bg: '#f4f6f5',
  card: '#ffffff',
  text: '#1f2937',
  muted: '#6b7280',
  border: '#e5e7eb',
};

export function Screen({ children }: { children: ReactNode }) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

export function Card({ title, children, right }: { title?: string; children: ReactNode; right?: ReactNode }) {
  return (
    <View style={styles.card}>
      {(title || right) && (
        <View style={styles.row}>
          {title && <Text style={styles.cardTitle}>{title}</Text>}
          {right}
        </View>
      )}
      {children}
    </View>
  );
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'danger' | 'ghost';
  loading?: boolean;
  style?: ViewStyle;
};

export function Button({ label, onPress, variant = 'primary', loading, style }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [styles.button, styles[variant], pressed && { opacity: 0.7 }, style]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? colors.green : '#fff'} />
      ) : (
        <Text style={[styles.buttonText, variant === 'ghost' && { color: colors.text }]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function Input(props: TextInputProps) {
  return <TextInput placeholderTextColor={colors.muted} {...props} style={[styles.input, props.style]} />;
}

export function Muted({ children }: { children: ReactNode }) {
  return <Text style={styles.muted}>{children}</Text>;
}

/** Jauge de progression. Par défaut (budget) : verte, orange dès 80 %, rouge au-delà de 100 %. */
export function Gauge({ ratio, color: forced }: { ratio: number; color?: string }) {
  const color = forced ?? (ratio >= 1 ? colors.red : ratio >= 0.8 ? colors.orange : colors.green);
  return (
    <View style={styles.gauge}>
      <View style={{ width: `${Math.min(ratio, 1) * 100}%`, height: '100%', backgroundColor: color }} />
    </View>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  screenContent: { padding: 16, gap: 12, paddingBottom: 40 },
  card: { backgroundColor: colors.card, borderRadius: 14, padding: 14, gap: 10, borderWidth: 1, borderColor: colors.border },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  button: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, alignItems: 'center' },
  primary: { backgroundColor: colors.green },
  danger: { backgroundColor: colors.red },
  ghost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
  buttonText: { color: '#fff', fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    backgroundColor: colors.bg,
    color: colors.text,
    flexGrow: 1,
  },
  muted: { color: colors.muted, fontSize: 13 },
  big: { fontSize: 26, fontWeight: '700', color: colors.text },
  text: { color: colors.text },
  bold: { fontWeight: '700', color: colors.text },
  gauge: { height: 12, backgroundColor: colors.border, borderRadius: 99, overflow: 'hidden' },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  chip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 99, backgroundColor: colors.greenLight },
  alert: { padding: 10, borderRadius: 10 },
});
