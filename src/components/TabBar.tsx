import Feather from '@expo/vector-icons/Feather';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { IconName } from '@/components/ui';
import { useModules } from '@/providers/ModulesProvider';
import { useTheme } from '@/theme';

const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Profil', icon: 'user' },
  courses: { label: 'Courses', icon: 'shopping-bag' },
  recettes: { label: 'Recettes', icon: 'book-open' },
  defis: { label: 'Défis', icon: 'award' },
};

/** Barre d'onglets flottante : l'onglet actif s'ouvre en pilule avec son libellé. */
export function TabBar({ state, navigateToTab, insets }: BottomTabBarProps) {
  const { has } = useModules();
  const { colors } = useTheme();
  const visible: Record<string, boolean> = {
    index: true,
    courses: has('recipes') || has('budget'),
    recettes: has('recipes'),
    defis: has('challenges'),
  };

  return (
    <View style={[styles.wrap, { bottom: Math.max(insets.bottom, 12) }]}>
      <View style={[styles.bar, { backgroundColor: colors.card }]}>
        {state.routes.map((route, i) => {
          const tab = TABS[route.name];
          if (!tab || !visible[route.name]) return null;
          const active = state.index === i;
          return (
            <Pressable
              key={route.key}
              onPress={() => !active && navigateToTab(route.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={tab.label}
              style={[styles.item, active && [styles.active, { backgroundColor: colors.soft }]]}
            >
              <Feather name={tab.icon} size={20} color={active ? colors.ink : colors.muted} />
              {active && <Text style={[styles.label, { color: colors.ink }]}>{tab.label}</Text>}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 999,
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  item: { height: 48, minWidth: 56, borderRadius: 24, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  active: { flex: 1, paddingHorizontal: 18, justifyContent: 'flex-start' },
  label: { fontSize: 15, fontWeight: '600' },
});
