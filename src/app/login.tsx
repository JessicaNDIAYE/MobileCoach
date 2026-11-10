import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Card,
  Field,
  PillButton,
  Row,
} from '@/components/ui';
import { LEGAL_META } from '@/lib/legal';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/theme';

export default function Login() {
  const { colors, s } = useTheme();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);

  async function submit() {
    if (!email || password.length < 6) {
      Alert.alert('Presque', 'Un email et un mot de passe de 6 caractères minimum.');
      return;
    }
    if (mode === 'signUp' && !accepted) {
      Alert.alert('Presque', 'Coche la case pour accepter les conditions et créer ton compte.');
      return;
    }
    setLoading(true);
    const { data, error } =
      mode === 'signIn'
        ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
        : await supabase.auth.signUp({ email: email.trim(), password, options: { data: { username: username.trim() || null } } });
    setLoading(false);
    if (error) Alert.alert('Erreur', error.message);
    else if (mode === 'signUp' && !data.session) Alert.alert('Vérifie tes emails', 'Confirme ton adresse puis connecte-toi.');
    // Avec une session, le layout racine bascule automatiquement sur les onglets.
  }

  const signUp = mode === 'signUp';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, paddingHorizontal: 16, paddingTop: insets.top + 48, paddingBottom: insets.bottom + 16 }}
    >
      <View style={[s.plate, { marginBottom: 28 }]}>
        <Text style={s.display}>{signUp ? 'Crée ton' : 'Bon retour'}</Text>
        <Text style={[s.display, { color: colors.inkSoft }]}>{signUp ? 'espace coach' : 'parmi nous'}</Text>
        <Text style={[s.muted, { marginTop: 12, fontSize: 15 }]}>Recettes, courses et défis entre amis, à ta façon.</Text>
      </View>

      <Card>
        {signUp && <Field placeholder="Pseudo visible par tes amis" value={username} onChangeText={setUsername} autoCapitalize="none" />}
        <Field placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
        <Field placeholder="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" />
        {signUp && (
          <Pressable
            onPress={() => setAccepted((v) => !v)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: accepted }}
            style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 7,
                marginTop: 1,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1.5,
                borderColor: accepted ? colors.ink : colors.muted,
                backgroundColor: accepted ? colors.ink : 'transparent',
              }}
            >
              {accepted && <Feather name="check" size={14} color={colors.onInk} />}
            </View>
            <Text style={[s.muted, { flex: 1, lineHeight: 19 }]}>
              J’ai {LEGAL_META.minAge} ans ou plus et j’accepte les{' '}
              <Text style={{ color: colors.ink, fontWeight: '600' }} onPress={() => router.push('/legal/terms')}>
                conditions d’utilisation
              </Text>{' '}
              et la{' '}
              <Text style={{ color: colors.ink, fontWeight: '600' }} onPress={() => router.push('/legal/privacy')}>
                politique de confidentialité
              </Text>
              .
            </Text>
          </Pressable>
        )}
        <PillButton label={signUp ? 'Créer mon compte' : 'Se connecter'} icon="arrow-right" onPress={submit} loading={loading} />
      </Card>

      <Pressable onPress={() => setMode(signUp ? 'signIn' : 'signUp')} style={[s.plate, { alignItems: 'center', marginTop: 20 }]} hitSlop={10}>
        <Text style={s.muted}>
          {signUp ? 'Déjà un compte ? ' : 'Pas encore de compte ? '}
          <Text style={{ color: colors.ink, fontWeight: '600' }}>{signUp ? 'Se connecter' : 'S’inscrire'}</Text>
        </Text>
      </Pressable>

      <View style={{ flex: 1 }} />
      <Row style={[s.plate, { justifyContent: 'center', gap: 16 }]}>
        <Pressable onPress={() => router.push('/legal/terms')} hitSlop={8}>
          <Text style={s.muted}>Conditions</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/legal/privacy')} hitSlop={8}>
          <Text style={s.muted}>Confidentialité</Text>
        </Pressable>
      </Row>
    </KeyboardAvoidingView>
  );
}
