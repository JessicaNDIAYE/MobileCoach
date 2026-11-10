import { Alert } from 'react-native';

import { ModulePicker, toggle } from '@/components/ModulePicker';
import { Card, CardHeader, Muted } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import type { Module } from '@/lib/types';
import { useModules } from '@/providers/ModulesProvider';

/** Profil › Mes modules : activer ou désactiver une fonctionnalité à tout moment. */
export function ModulesCard() {
  const { modules, save } = useModules();
  const current = modules ?? [];

  async function apply(next: Module[]) {
    const error = await save(next);
    if (error) Alert.alert('Erreur', error);
  }

  function onToggle(m: Module) {
    const next = toggle(current, m);
    if (next.length === 0) {
      Alert.alert('Presque', 'Garde au moins une fonctionnalité.');
      return;
    }
    // Désactiver le poids : proposer d'effacer les pesées (données de santé).
    if (m === 'weight' && current.includes('weight')) {
      Alert.alert('Masquer le suivi du poids', 'Veux-tu aussi supprimer définitivement tes pesées et ton objectif ?', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Garder mes données', onPress: () => apply(next) },
        {
          text: 'Tout supprimer',
          style: 'destructive',
          onPress: async () => {
            const { data } = await supabase.auth.getUser();
            if (data.user) {
              await supabase.from('weight_entries').delete().eq('user_id', data.user.id);
              await supabase.from('profiles').update({ weight_goal_kg: null }).eq('id', data.user.id);
            }
            apply(next);
          },
        },
      ]);
      return;
    }
    apply(next);
  }

  return (
    <Card>
      <CardHeader title="Mes modules" />
      <Muted>Choisis ce que tu veux voir dans l’app.</Muted>
      <ModulePicker value={current} onToggle={onToggle} />
    </Card>
  );
}
