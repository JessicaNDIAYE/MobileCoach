import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';

import { PatternView } from '@/components/Backdrop';
import { Card, CardHeader, Choice, IconButton, Muted, Plate, Screen } from '@/components/ui';
import { STYLES, buildPalette, useTheme, type ModeSetting, type Palette, type StyleDef } from '@/theme';

const MODES: { value: ModeSetting; label: string; hint: string; icon: 'sun' | 'moon' | 'smartphone' }[] = [
  { value: 'light', label: 'Clair', hint: 'Toujours', icon: 'sun' },
  { value: 'dark', label: 'Sombre', hint: 'Toujours', icon: 'moon' },
  { value: 'system', label: 'Auto', hint: 'Comme le téléphone', icon: 'smartphone' },
];

/** Mini écran de démonstration : le motif, une carte, un bouton et la barre d'onglets. */
function MiniScreen({ style, palette, width, height }: { style: StyleDef; palette: Palette; width: number; height: number }) {
  const r = width * 0.09;
  return (
    <View style={{ width, height, borderRadius: 16, overflow: 'hidden', backgroundColor: palette.bg }}>
      {palette.patterned && <PatternView styleId={style.id} palette={palette} width={width} height={height} />}
      <View style={{ position: 'absolute', left: width * 0.1, right: width * 0.1, top: height * 0.12, gap: height * 0.04 }}>
        <View style={{ backgroundColor: palette.patterned ? palette.card : 'transparent', borderRadius: r, padding: palette.patterned ? 6 : 0, gap: 4 }}>
          <View style={{ height: 7, width: '70%', borderRadius: 4, backgroundColor: palette.ink }} />
          <View style={{ height: 7, width: '45%', borderRadius: 4, backgroundColor: palette.inkSoft }} />
        </View>
        <View style={{ backgroundColor: palette.card, borderRadius: r, padding: 8, gap: 6 }}>
          <View style={{ flexDirection: 'row', gap: 2, height: 16 }}>
            {Array.from({ length: 12 }, (_, i) => (
              <View key={i} style={{ flex: 1, borderRadius: 1, backgroundColor: i < 7 ? palette.forest : palette.track }} />
            ))}
          </View>
          <View style={{ height: 12, borderRadius: 6, backgroundColor: palette.ink }} />
        </View>
      </View>
      <View
        style={{
          position: 'absolute',
          left: width * 0.1,
          right: width * 0.1,
          bottom: height * 0.06,
          height: height * 0.11,
          borderRadius: 99,
          backgroundColor: palette.card,
        }}
      />
    </View>
  );
}

export default function Appearance() {
  const { colors, s, mode, appearance, setAppearance } = useTheme();
  const { width } = useWindowDimensions();
  const inner = width - 32 - 40;
  const tileW = (inner - 12) / 2;
  const current = STYLES.find((st) => st.id === appearance.style) ?? STYLES[0];

  return (
    <Screen title="Apparence" subtitle="à ton goût" right={<IconButton name="x" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />}>
      <Card>
        <CardHeader title="Mode" />
        <Choice options={MODES} value={appearance.mode} onChange={(m) => setAppearance({ mode: m })} />
      </Card>

      <Card>
        <CardHeader title="Style" right={<Muted>aperçu en mode {mode === 'dark' ? 'sombre' : 'clair'}</Muted>} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {STYLES.map((st) => {
            const selected = st.id === appearance.style;
            const variant = selected ? appearance.variant : st.variants[0].id;
            return (
              <Pressable
                key={st.id}
                onPress={() => !selected && setAppearance({ style: st.id, variant: st.variants[0].id })}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`Style ${st.name}`}
                style={({ pressed }) => [{ width: tileW, gap: 8 }, pressed && s.pressed]}
              >
                <View style={{ borderRadius: 19, borderWidth: 3, borderColor: selected ? colors.ink : 'transparent' }}>
                  <MiniScreen style={st} palette={buildPalette(st.id, variant, mode)} width={tileW - 6} height={tileW * 1.45} />
                </View>
                <View style={{ gap: 2 }}>
                  <View style={s.row}>
                    <Text style={s.bold}>{st.name}</Text>
                    {selected && <Feather name="check-circle" size={16} color={colors.ink} />}
                  </View>
                  <Muted>{st.description}</Muted>
                </View>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <CardHeader title="Coloris" right={<Muted>{current.name}</Muted>} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
          {current.variants.map((v) => {
            const selected = v.id === appearance.variant;
            const p = buildPalette(current.id, v.id, mode);
            return (
              <Pressable
                key={v.id}
                onPress={() => setAppearance({ variant: v.id })}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`Coloris ${v.name}`}
                style={({ pressed }) => [{ width: 72, alignItems: 'center', gap: 6 }, pressed && s.pressed]}
              >
                <View style={{ padding: 3, borderRadius: 40, borderWidth: 2, borderColor: selected ? colors.ink : 'transparent' }}>
                  <View style={{ width: 56, height: 56, borderRadius: 28, overflow: 'hidden', backgroundColor: p.bg }}>
                    {p.patterned ? (
                      <PatternView styleId={current.id} palette={p} width={56} height={56} />
                    ) : (
                      <View style={{ position: 'absolute', right: 0, bottom: 0, width: 28, height: 28, backgroundColor: p.forest }} />
                    )}
                  </View>
                </View>
                <Text style={[s.muted, { textAlign: 'center' }, selected && { color: colors.ink, fontWeight: '600' }]}>{v.name}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Plate>
        <Muted>Quel que soit le style, le texte et les icônes restent posés sur des surfaces unies et respectent les contrastes d’accessibilité.</Muted>
      </Plate>
    </Screen>
  );
}
