import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

import { Card, IconButton, Muted, Screen, s } from '@/components/ui';
import { LEGAL_META, getLegalDoc, type LegalDocId } from '@/lib/legal';
import { colors } from '@/theme';

/** Affiche la politique de confidentialité ou les CGU (accessible connecté ou non). */
export default function LegalScreen() {
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const id: LegalDocId = doc === 'terms' ? 'terms' : 'privacy';
  const content = getLegalDoc(id);
  const words = content.title.split(' ');
  const last = words.pop() ?? '';

  return (
    <Screen
      title={words.join(' ')}
      subtitle={last}
      right={<IconButton name="x" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />}
    >
      <View style={{ paddingHorizontal: 4, gap: 8, marginBottom: 4 }}>
        <Text style={[s.body, { color: colors.inkSoft }]}>{content.intro}</Text>
        <Muted>Mise à jour : {LEGAL_META.updatedAt}</Muted>
      </View>
      {content.sections.map((section) => (
        <Card key={section.title} style={{ gap: 10 }}>
          <Text style={s.cardTitle}>{section.title}</Text>
          {section.bullets?.map((b) => (
            <View key={b} style={{ flexDirection: 'row', gap: 10 }}>
              <Text style={[s.body, { color: colors.inkSoft }]}>—</Text>
              <Text style={[s.body, { flex: 1 }]}>{b}</Text>
            </View>
          ))}
          {section.paragraphs?.map((p) => (
            <Text key={p} style={s.body}>
              {p}
            </Text>
          ))}
        </Card>
      ))}
    </Screen>
  );
}
