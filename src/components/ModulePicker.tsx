import Feather from '@expo/vector-icons/Feather';
import { Pressable, Text, View } from 'react-native';

import { Divider, Muted, s } from '@/components/ui';
import { MODULES, WEIGHT_CONSENT } from '@/lib/modules';
import type { Module } from '@/lib/types';
import { colors } from '@/theme';

/** Liste de modules à cocher. Contrôlée : le parent décide quoi faire de la sélection. */
export function ModulePicker({ value, onToggle }: { value: Module[]; onToggle: (m: Module) => void }) {
  return (
    <View style={{ gap: 4 }}>
      {MODULES.map((m, i) => {
        const on = value.includes(m.id);
        return (
          <View key={m.id}>
            {i > 0 && <Divider />}
            <Pressable
              onPress={() => onToggle(m.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={m.label}
              style={({ pressed }) => [s.listRow, { paddingVertical: 12 }, pressed && s.pressed]}
            >
              <View style={[s.avatar, on && { backgroundColor: colors.ink }]}>
                <Feather name={m.icon} size={18} color={on ? '#fff' : colors.ink} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={s.bold}>{m.label}</Text>
                <Muted>{m.hint}</Muted>
              </View>
              <Feather name={on ? 'check-circle' : 'circle'} size={20} color={on ? colors.ink : colors.muted} />
            </Pressable>
            {m.id === 'weight' && on && <Muted style={{ paddingBottom: 8 }}>{WEIGHT_CONSENT}</Muted>}
          </View>
        );
      })}
    </View>
  );
}

export const toggle = (list: Module[], m: Module) => (list.includes(m) ? list.filter((x) => x !== m) : [...list, m]);
