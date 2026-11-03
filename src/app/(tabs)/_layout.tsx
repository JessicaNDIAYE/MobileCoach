import Tabs from 'expo-router/js-tabs';
import { Text } from 'react-native';

import { colors } from '@/components/ui';

const icon = (emoji: string) => () => <Text style={{ fontSize: 20 }}>{emoji}</Text>;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.green,
        headerStyle: { backgroundColor: colors.green },
        headerTintColor: '#fff',
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Profil & poids', tabBarLabel: 'Profil', tabBarIcon: icon('⚖️') }} />
      <Tabs.Screen name="courses" options={{ title: 'Courses & budget', tabBarLabel: 'Courses', tabBarIcon: icon('🛒') }} />
      <Tabs.Screen name="defis" options={{ title: 'Défis entre amis', tabBarLabel: 'Défis', tabBarIcon: icon('🏆') }} />
    </Tabs>
  );
}
