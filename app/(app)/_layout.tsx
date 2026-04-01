import { Tabs } from 'expo-router'
import { Platform } from 'react-native'

const isWeb = Platform.OS === 'web'

export default function AppLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: isWeb
        ? { display: 'none' } as any
        : {
            backgroundColor: '#111111',
            borderTopColor: '#1E1E1E',
            borderTopWidth: 1,
          },
      tabBarActiveTintColor: '#F0F0F0',
      tabBarInactiveTintColor: '#555555',
      tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
    }}>
      <Tabs.Screen name="home" options={{ title: 'Today' }} />
      <Tabs.Screen name="plans" options={{ title: 'Plans' }} />
      <Tabs.Screen name="session" options={{ title: 'Train' }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress' }} />
      <Tabs.Screen name="coach" options={{ title: 'Coach' }} />
      <Tabs.Screen name="checkin" options={{ href: null }} />
    </Tabs>
  )
}
