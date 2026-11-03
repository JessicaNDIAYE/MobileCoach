import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Text, View } from 'react-native';

import { Button, Card, Input, Muted, colors, styles } from '@/components/ui';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!email || password.length < 6) {
      Alert.alert('Oups', 'Email requis et mot de passe de 6 caractères minimum.');
      return;
    }
    setLoading(true);
    const { data, error } =
      mode === 'signIn'
        ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
        : await supabase.auth.signUp({ email: email.trim(), password, options: { data: { username: username.trim() || null } } });
    setLoading(false);
    if (error) Alert.alert('Erreur', error.message);
    else if (mode === 'signUp' && !data.session) Alert.alert('Presque fini', 'Confirme ton email puis connecte-toi.');
    // Si une session existe, le layout racine redirige automatiquement vers les onglets.
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, justifyContent: 'center', padding: 16, backgroundColor: colors.bg }}
    >
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <Text style={{ fontSize: 48 }}>🥗</Text>
        <Text style={styles.big}>MobileCoach</Text>
        <Muted>Poids, courses, recettes et défis entre amis</Muted>
      </View>
      <Card title={mode === 'signIn' ? 'Connexion' : 'Créer un compte'}>
        {mode === 'signUp' && <Input placeholder="Pseudo (visible par tes amis)" value={username} onChangeText={setUsername} autoCapitalize="none" />}
        <Input placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
        <Input placeholder="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" />
        <Button label={mode === 'signIn' ? 'Se connecter' : "S'inscrire"} onPress={submit} loading={loading} />
        <Button
          variant="ghost"
          label={mode === 'signIn' ? 'Pas de compte ? Inscris-toi' : 'Déjà un compte ? Connecte-toi'}
          onPress={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')}
        />
      </Card>
    </KeyboardAvoidingView>
  );
}
