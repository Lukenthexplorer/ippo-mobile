import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../../src/lib/supabase'
import { colors } from '../../src/constants/colors'

export default function Home() {
  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Good morning.</Text>
        <TouchableOpacity onPress={handleSignOut}>
          <Text style={styles.signout}>Sign out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>READINESS</Text>
        <Text style={styles.cardValue}>—</Text>
        <Text style={styles.cardSub}>Complete your check-in</Text>
        <TouchableOpacity style={styles.cardButton} onPress={() => router.push('/(app)/checkin')}>
          <Text style={styles.cardButtonText}>Check in now</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>TODAY'S WORKOUT</Text>
        <Text style={styles.cardValue}>No plan active</Text>
        <Text style={styles.cardSub}>Create a plan to get started</Text>
        <TouchableOpacity style={[styles.cardButton, styles.cardButtonPrimary]} onPress={() => router.push('/(app)/session')}>
          <Text style={[styles.cardButtonText, styles.cardButtonTextPrimary]}>Start session</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingTop: 64 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  greeting: { fontSize: 28, fontWeight: '600', color: colors.text },
  signout: { fontSize: 14, color: colors.textTertiary },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardLabel: { fontSize: 11, fontWeight: '600', color: colors.textTertiary, letterSpacing: 1, marginBottom: 8 },
  cardValue: { fontSize: 32, fontWeight: '700', color: colors.text, marginBottom: 4 },
  cardSub: { fontSize: 14, color: colors.textSecondary, marginBottom: 16 },
  cardButton: {
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardButtonPrimary: { backgroundColor: colors.text, borderColor: colors.text },
  cardButtonText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  cardButtonTextPrimary: { color: colors.background },
})