import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, Field, PillButton, s } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { colors } from '@/theme';

export default function Login() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!email || password.length < 6) {
      Alert.alert('Presque', 'Un email et un mot de passe de 6 caractères minimum.');
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
      style={{ flex: 1, backgroundColor: colors.bg, paddingHorizontal: 16, paddingTop: insets.top + 48, paddingBottom: insets.bottom + 16 }}
    >
      <View style={{ paddingHorizontal: 4, marginBottom: 28 }}>
        <Text style={s.display}>{signUp ? 'Crée ton' : 'Bon retour'}</Text>
        <Text style={[s.display, { color: colors.inkSoft }]}>{signUp ? 'espace coach' : 'parmi nous'}</Text>
        <Text style={[s.muted, { marginTop: 12, fontSize: 15 }]}>Poids, courses et défis entre amis, au même endroit.</Text>
      </View>

      <Card>
        {signUp && <Field placeholder="Pseudo visible par tes amis" value={username} onChangeText={setUsername} autoCapitalize="none" />}
        <Field placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
        <Field placeholder="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" />
        <PillButton label={signUp ? 'Créer mon compte' : 'Se connecter'} icon="arrow-right" onPress={submit} loading={loading} />
      </Card>

      <Pressable onPress={() => setMode(signUp ? 'signIn' : 'signUp')} style={{ alignItems: 'center', marginTop: 20 }} hitSlop={10}>
        <Text style={s.muted}>
          {signUp ? 'Déjà un compte ? ' : 'Pas encore de compte ? '}
          <Text style={{ color: colors.ink, fontWeight: '600' }}>{signUp ? 'Se connecter' : 'S’inscrire'}</Text>
        </Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}
