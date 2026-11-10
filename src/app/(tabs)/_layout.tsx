import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '@/components/TabBar';
import { useModules } from '@/providers/ModulesProvider';

export default function TabsLayout() {
  const { has } = useModules();
  // href: null rend l'onglet inaccessible (y compris par lien) quand le module est désactivé.
  const hide = (visible: boolean) => (visible ? {} : { href: null });

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' } }}
    >
      <Tabs.Screen name="index" options={{ title: 'Profil' }} />
      <Tabs.Screen name="courses" options={{ title: 'Courses', ...hide(has('recipes') || has('budget')) }} />
      <Tabs.Screen name="recettes" options={{ title: 'Recettes', ...hide(has('recipes')) }} />
      <Tabs.Screen name="defis" options={{ title: 'Défis', ...hide(has('challenges')) }} />
    </Tabs>
  );
}
