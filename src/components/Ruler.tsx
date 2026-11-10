import { useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, View, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import { type, useTheme } from '@/theme';

const STEP = 10; // px entre deux graduations
const MIN = 30;
const MAX = 200;
const PRECISION = 0.1; // kg par graduation

type Props = {
  value: number;
  onChange: (v: number) => void;
  unit?: string;
};

/** Sélecteur de poids : grand chiffre + règle graduée qu'on fait défiler. */
export function Ruler({ value, onChange, unit = 'kg' }: Props) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const listRef = useRef<FlatList<number>>(null);
  const ticks = useMemo(() => Array.from({ length: Math.round((MAX - MIN) / PRECISION) + 1 }, (_, i) => i), []);
  const initialIndex = Math.round((clamp(value) - MIN) / PRECISION);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / STEP);
    const next = Math.round((MIN + index * PRECISION) * 10) / 10;
    if (next !== value && next >= MIN && next <= MAX) onChange(next);
  };

  return (
    <View style={{ gap: 14 }} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
      <Text style={[styles.value, { color: colors.ink }]}>
        {value.toFixed(1).replace('.', ',')}
        <Text style={[styles.unit, { color: colors.inkSoft }]}> {unit}</Text>
      </Text>

      {width > 0 && (
        <View>
          <FlatList
            ref={listRef}
            data={ticks}
            horizontal
            keyExtractor={(i) => String(i)}
            showsHorizontalScrollIndicator={false}
            snapToInterval={STEP}
            decelerationRate="fast"
            onScroll={onScroll}
            scrollEventThrottle={16}
            initialScrollIndex={initialIndex}
            getItemLayout={(_, index) => ({ length: STEP, offset: STEP * index, index })}
            contentContainerStyle={{ paddingHorizontal: width / 2 - STEP / 2 }}
            initialNumToRender={60}
            windowSize={7}
            renderItem={({ item }) => {
              const major = item % 10 === 0;
              const half = item % 5 === 0;
              return (
                <View style={styles.cell}>
                  <View style={[styles.tick, { backgroundColor: colors.muted, height: major ? 34 : half ? 24 : 16, opacity: major ? 1 : 0.55 }]} />
                </View>
              );
            }}
          />
          <View pointerEvents="none" style={[styles.cursor, { backgroundColor: colors.ink, left: width / 2 - 1.5 }]} />
        </View>
      )}
    </View>
  );
}

const clamp = (v: number) => Math.min(MAX, Math.max(MIN, v || 60));

const styles = StyleSheet.create({
  value: { ...type.number, fontSize: 72, lineHeight: 76, letterSpacing: -3, textAlign: 'center' },
  unit: { fontSize: 18, fontWeight: '500', letterSpacing: 0 },
  cell: { width: STEP, height: 64, alignItems: 'center', justifyContent: 'center' },
  tick: { width: 1.5, borderRadius: 1 },
  cursor: { position: 'absolute', top: 0, width: 3, height: 64, borderRadius: 2 },
});
