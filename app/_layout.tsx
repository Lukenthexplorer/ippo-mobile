import { useEffect, useState } from 'react'
import { Stack, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { supabase } from '../src/lib/supabase'
import { colors } from '../src/constants/colors'

export default function RootLayout() {
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/(app)/home')
      } else {
        router.replace('/(auth)/login')
      }
      setInitialized(true)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        router.replace('/(app)/home')
      } else {
        router.replace('/(auth)/login')
      }
    })
  }, [])

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </>
  )
}