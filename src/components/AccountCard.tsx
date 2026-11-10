import Feather from '@expo/vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, Text, View } from 'react-native';

import { Card, CardHeader, Divider, s, type IconName } from '@/components/ui';
import { LEGAL_META } from '@/lib/legal';
import { supabase } from '@/lib/supabase';
import { colors } from '@/theme';

type Item = { label: string; icon: IconName; onPress: () => void; danger?: boolean; busy?: boolean };

/** Liens légaux, contact, déconnexion et suppression de compte (exigences App Store). */
export function AccountCard() {
  const [deleting, setDeleting] = useState(false);

  function confirmDelete() {
    Alert.alert(
      'Supprimer ton compte ?',
      'Ton profil, tes pesées, tes courses et tes défis seront effacés définitivement. Les défis que tu as créés disparaîtront aussi pour tes amis. Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: deleteAccount },
      ],
    );
  }

  async function deleteAccount() {
    setDeleting(true);
    const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
    setDeleting(false);
    if (error) {
      Alert.alert('Erreur', 'La suppression n’a pas abouti. Réessaie dans un instant.');
      return;
    }
    // Nettoie les données gardées sur le téléphone, puis déconnecte (retour à l'écran de connexion).
    const keys = await AsyncStorage.getAllKeys().catch(() => [] as readonly string[]);
    await AsyncStorage.multiRemove(keys.filter((k) => k.startsWith('nutrika.recipes'))).catch(() => {});
    await supabase.auth.signOut({ scope: 'local' });
    Alert.alert('Compte supprimé', 'Toutes tes données ont été effacées.');
  }

  const items: Item[] = [
    { label: 'Politique de confidentialité', icon: 'shield', onPress: () => router.push('/legal/privacy') },
    { label: 'Conditions d’utilisation', icon: 'file-text', onPress: () => router.push('/legal/terms') },
    { label: 'Nous contacter', icon: 'mail', onPress: () => Linking.openURL(`mailto:${LEGAL_META.contactEmail}`) },
    { label: 'Se déconnecter', icon: 'log-out', onPress: () => supabase.auth.signOut() },
    { label: 'Supprimer mon compte', icon: 'trash-2', onPress: confirmDelete, danger: true, busy: deleting },
  ];

  return (
    <Card style={{ gap: 12 }}>
      <CardHeader title="Compte" />
      {items.map((item, i) => (
        <View key={item.label} style={{ gap: 12 }}>
          {i > 0 && <Divider />}
          <Pressable onPress={item.onPress} disabled={item.busy} style={({ pressed }) => [s.listRow, pressed && s.pressed]}>
            <Feather name={item.icon} size={18} color={item.danger ? colors.rust : colors.ink} />
            <Text style={[s.body, { flex: 1 }, item.danger && { color: colors.rust }]}>{item.label}</Text>
            {item.busy ? <ActivityIndicator color={colors.rust} /> : <Feather name="chevron-right" size={18} color={colors.muted} />}
          </Pressable>
        </View>
      ))}
    </Card>
  );
}
