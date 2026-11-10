import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { ModulePicker, toggle } from '@/components/ModulePicker';
import { Card, PillButton, Screen } from '@/components/ui';
import { DEFAULT_MODULES } from '@/lib/modules';
import type { Module } from '@/lib/types';
import { useModules } from '@/providers/ModulesProvider';
import { useTheme } from '@/theme';

/** Premier écran après l'inscription : chacun compose son app. */
export default function Setup() {
  const { colors, s } = useTheme();
  const { save } = useModules();
  const [selected, setSelected] = useState<Module[]>(DEFAULT_MODULES);
  const [saving, setSaving] = useState(false);

  async function confirm() {
    if (selected.length === 0) {
      Alert.alert('Presque', 'Choisis au moins une fonctionnalité.');
      return;
    }
    setSaving(true);
    const error = await save(selected);
    setSaving(false);
    if (error) Alert.alert('Erreur', error);
    // Une fois enregistré, le layout racine affiche automatiquement les onglets.
  }

  return (
    <Screen title="Compose" subtitle="ton app">
      <View style={[s.plate, { marginBottom: 4 }]}>
        <Text style={[s.body, { color: colors.inkSoft }]}>
          Garde seulement ce qui t’est utile. Rien n’est imposé, et tu pourras tout changer plus tard dans ton profil.
        </Text>
      </View>
      <Card>
        <ModulePicker value={selected} onToggle={(m) => setSelected((v) => toggle(v, m))} />
      </Card>
      <PillButton label="C’est parti" icon="arrow-right" onPress={confirm} loading={saving} />
    </Screen>
  );
}
