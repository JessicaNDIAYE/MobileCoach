import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

const KEY = 'mobilecoach.onboarded';

type OnboardingState = { onboarded: boolean | null; complete: () => void };

const OnboardingContext = createContext<OnboardingState>({ onboarded: null, complete: () => {} });

/** Mémorise sur l'appareil que les écrans d'introduction ont été vus. */
export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => setOnboarded(v === '1'))
      .catch(() => setOnboarded(false));
  }, []);

  const complete = useCallback(() => {
    setOnboarded(true);
    AsyncStorage.setItem(KEY, '1').catch(() => {});
  }, []);

  return <OnboardingContext.Provider value={{ onboarded, complete }}>{children}</OnboardingContext.Provider>;
}

export const useOnboarding = () => useContext(OnboardingContext);
