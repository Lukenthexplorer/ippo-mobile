import { useEffect } from 'react'
import { Stack, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { supabase } from '../src/lib/supabase'
import { colors } from '../src/constants/colors'

export default function RootLayout() {
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('AUTH EVENT:', event, !!session)
      if (event === 'INITIAL_SESSION') {
        if (session) {
          router.replace('/(app)/home')
        } else {
          router.replace('/(auth)/login')
        }
      }
      if (event === 'SIGNED_IN') router.replace('/(app)/home')
      if (event === 'SIGNED_OUT') router.replace('/(auth)/login')
    })

    return () => subscription.unsubscribe()
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
