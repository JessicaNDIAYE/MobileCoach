import Feather from '@expo/vector-icons/Feather';
import { useRef, useState, type ReactNode } from 'react';
import { FlatList, Pressable, Text, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, Muted, PillButton, Row, Stats, Tag, s } from '@/components/ui';
import { useOnboarding } from '@/providers/OnboardingProvider';
import { colors } from '@/theme';

type Slide = { key: string; title: string; subtitle: string; text: string; preview: ReactNode };

const PREVIEW_MODULES: { label: string; icon: 'book-open' | 'shopping-bag' | 'award' | 'activity'; on: boolean }[] = [
  { label: 'Recettes', icon: 'book-open', on: true },
  { label: 'Budget courses', icon: 'shopping-bag', on: true },
  { label: 'Défis entre amis', icon: 'award', on: true },
  { label: 'Suivi du poids', icon: 'activity', on: false },
];

const SLIDES: Slide[] = [
  {
    key: 'food',
    title: 'Cuisine avec',
    subtitle: 'ce que tu as',
    text: 'Note tes courses, garde un œil sur ce qui périme et trouve quoi cuisiner avec ton frigo.',
    preview: (
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={s.cardTitle}>Ton frigo</Text>
          <Muted>4 produits</Muted>
        </Row>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {['Saumon', 'Courgettes', 'Yaourt grec', 'Lentilles'].map((t) => (
            <Tag key={t} label={t} />
          ))}
        </View>
        <Stats items={[['Temps', '25 min'], ['Portions', '2']]} />
      </Card>
    ),
  },
  {
    key: 'friends',
    title: 'Des défis',
    subtitle: 'entre amis',
    text: 'Zéro sucre, low carb ou fibres max : lance un défi, invite tes amis avec un code et tenez bon ensemble.',
    preview: (
      <Card>
        <Text style={s.cardTitle}>Fibres max</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {Array.from({ length: 14 }, (_, i) => (
            <View
              key={i}
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: i < 6 ? colors.forest : colors.soft,
              }}
            >
              <Text style={{ fontSize: 11, color: i < 6 ? '#fff' : colors.inkSoft }}>{i + 1}</Text>
            </View>
          ))}
        </View>
        <Stats items={[['Série', '6 j'], ['Amis', '3']]} />
      </Card>
    ),
  },
  {
    key: 'modules',
    title: 'Ton app,',
    subtitle: 'à ta façon',
    text: 'Tu choisis ce que tu veux voir. Rien n’est imposé, et tout se change à tout moment dans ton profil.',
    preview: (
      <Card style={{ gap: 14 }}>
        {PREVIEW_MODULES.map((m) => (
          <Row key={m.label} style={{ gap: 12 }}>
            <View style={[s.avatar, m.on && { backgroundColor: colors.ink }]}>
              <Feather name={m.icon} size={18} color={m.on ? '#fff' : colors.ink} />
            </View>
            <Text style={[s.bold, { flex: 1 }]}>{m.label}</Text>
            <Feather name={m.on ? 'check-circle' : 'circle'} size={20} color={m.on ? colors.ink : colors.muted} />
          </Row>
        ))}
      </Card>
    ),
  },
];

export default function Onboarding() {
  const { complete } = useOnboarding();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);
  const [height, setHeight] = useState(0);
  const last = index === SLIDES.length - 1;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  const next = () => {
    if (last) complete();
    else listRef.current?.scrollToIndex({ index: index + 1 });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, height: 32 }}>
        {!last && (
          <Pressable onPress={complete} hitSlop={10}>
            <Text style={[s.muted, { fontSize: 15 }]}>Passer</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        ref={listRef}
        style={{ flex: 1 }}
        onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(i) => i.key}
        onMomentumScrollEnd={onScroll}
        onScroll={onScroll}
        scrollEventThrottle={32}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item }) => (
          <View style={{ width, height, paddingHorizontal: 20, justifyContent: 'center', gap: 32 }}>
            <View pointerEvents="none">{item.preview}</View>
            <View style={{ gap: 12, paddingHorizontal: 4 }}>
              <View>
                <Text style={s.display}>{item.title}</Text>
                <Text style={[s.display, { color: colors.inkSoft }]}>{item.subtitle}</Text>
              </View>
              <Text style={[s.body, { color: colors.inkSoft, fontSize: 16, lineHeight: 22 }]}>{item.text}</Text>
            </View>
          </View>
        )}
      />

      <View style={{ paddingHorizontal: 20, gap: 20 }}>
        <Row style={{ justifyContent: 'center', gap: 6 }}>
          {SLIDES.map((sl, i) => (
            <View
              key={sl.key}
              style={{ height: 6, width: i === index ? 22 : 6, borderRadius: 3, backgroundColor: i === index ? colors.ink : colors.muted }}
            />
          ))}
        </Row>
        <PillButton label={last ? 'Commencer' : 'Suivant'} icon="arrow-right" onPress={next} />
        <Row style={{ justifyContent: 'center', gap: 6 }}>
          <Feather name="lock" size={12} color={colors.inkSoft} />
          <Muted>Pas de publicité, aucune donnée revendue.</Muted>
        </Row>
      </View>
    </View>
  );
}
