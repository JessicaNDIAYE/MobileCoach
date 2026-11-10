import { DefaultTheme, Stack, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';

import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { ModulesProvider, useModules } from '@/providers/ModulesProvider';
import { OnboardingProvider, useOnboarding } from '@/providers/OnboardingProvider';
import { Backdrop } from '@/components/Backdrop';
import { ThemeProvider, useTheme } from '@/theme';

// La navigation pose par défaut un fond gris sur chaque écran : on la rend transparente
// pour laisser voir le fond (uni ou à motif) dessiné par <Backdrop />.
const TRANSPARENT_NAVIGATION = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: 'transparent' } };

function RootNavigator() {
  const { colors, mode } = useTheme();
  const { session, loading } = useAuth();
  const { onboarded } = useOnboarding();
  const { modules, loading: modulesLoading } = useModules();

  if (loading || onboarded === null || (session && modulesLoading)) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          backgroundColor: colors.bg,
        }}
      >
        <ActivityIndicator color={colors.ink} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Fond (uni ou à motif) dessiné une seule fois sous tous les écrans */}
      <Backdrop />
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <NavigationThemeProvider value={TRANSPARENT_NAVIGATION}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: 'transparent' },
          }}
        >
          <Stack.Protected guard={!!session && !!modules}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="appearance" />
          </Stack.Protected>
          {/* Après l'inscription : chacun choisit ses fonctionnalités */}
          <Stack.Protected guard={!!session && !modules}>
            <Stack.Screen name="setup" />
          </Stack.Protected>
          <Stack.Protected guard={!session && !onboarded}>
            <Stack.Screen name="onboarding" />
          </Stack.Protected>
          <Stack.Protected guard={!session && !!onboarded}>
            <Stack.Screen name="login" />
          </Stack.Protected>
          {/* Documents légaux : lisibles avant et après connexion */}
          <Stack.Screen name="legal/[doc]" />
        </Stack>
      </NavigationThemeProvider>
    </View>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ModulesProvider>
          <OnboardingProvider>
            <RootNavigator />
          </OnboardingProvider>
        </ModulesProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
