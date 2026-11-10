import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';

import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { OnboardingProvider, useOnboarding } from '@/providers/OnboardingProvider';
import { colors } from '@/theme';

function RootNavigator() {
  const { session, loading } = useAuth();
  const { onboarded } = useOnboarding();

  if (loading || onboarded === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.ink} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Protected guard={!session && !onboarded}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={!session && !!onboarded}>
        <Stack.Screen name="login" />
      </Stack.Protected>
      {/* Documents légaux : lisibles avant et après connexion */}
      <Stack.Screen name="legal/[doc]" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <OnboardingProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </OnboardingProvider>
    </AuthProvider>
  );
}
